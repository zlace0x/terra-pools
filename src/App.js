import "./App.css";
import { useEffect, useState } from "react";
import { useLCDClient } from "@terra-money/wallet-provider";
import React from "react";
import { BarChart, Bar, Cell, YAxis, ReferenceLine, LabelList } from "recharts";
import { computeSwap, coinAfterSpread } from "./lib/market";
import { Coin } from "@terra-money/terra.js";

const colors = ["#0088FE", "#FFBB28"];
const ust_swap_size = 10000;

function App() {
  const [data, setData] = useState([]);

  const [swapRate, setSwapRate] = useState([]);
  const [basePool, setBasePool] = useState([]);
  const [scale, setScale] = useState([49000000, 51000000]);
  const lcd = useLCDClient();

  useEffect(() => {
    const fetchPools = async () => {
      const delta = await lcd.market.poolDelta();
      const luna_rates = await lcd.oracle.exchangeRates();
      const { base_pool, min_stability_spread } = await lcd.market.parameters();
      const microTerraSide = base_pool.plus(delta);
      const microLunaSide = base_pool.pow(2).div(microTerraSide);

      const terraSide = microTerraSide.times(0.000001).toNumber();
      const lunaSide = microLunaSide.times(0.000001).toNumber();

      setBasePool(base_pool);
      const ustSwapRate = computeSwap(
        new Coin("uusd", ust_swap_size * 1e6),
        "uluna",
        luna_rates,
        base_pool,
        min_stability_spread,
        delta
      );

      setSwapRate(ustSwapRate);

      setData([
        {
          name: "Stablecoins (in sdr)",
          amt: terraSide,
        },
        {
          name: "LUNA (in sdr)",
          amt: lunaSide,
        },
      ]);

      if (terraSide < 49000000 || lunaSide < 49000000) {
        setScale([40000000, 60000000]);
      } else {
        setScale([49000000, 51000000]);
      }
    };

    fetchPools();
    const t = setInterval(fetchPools, 7000);
    return () => {
      clearTimeout(t);
    };
  }, [lcd.market]);

  if (!swapRate) {
    return "Loading...";
  }

  const beforeSpreadFee = swapRate[0]?.amount.div(1e6);
  const afterSpreadFee = coinAfterSpread(swapRate[0], swapRate[1])?.amount.div(
    1e6
  );
  return (
    <div className="App">
      <center>
        <h1>Terra Virtual Liquidity Pools</h1>
        <BarChart width={800} height={400} data={data}>
          <Bar isAnimationActive={false} label={false} dataKey="amt">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % 20]} />
            ))}
            <LabelList dataKey="name" position="top" />
            <LabelList dataKey="amt" position="inside" fill="#000000" />
          </Bar>
          <ReferenceLine
            isFront={false}
            label={{ position: "top", value: "BasePool" }}
            y={basePool.toNumber()}
            stroke="#000"
          />
          <YAxis
            hide
            type="number"
            ticks={10}
            stroke="#000000"
            interval={0}
            domain={scale}
          />
        </BarChart>

        <div>
          Oracle Rate: {ust_swap_size} ust = {beforeSpreadFee.toFixed(2)} luna
          (${(ust_swap_size / beforeSpreadFee).toFixed(4)} per luna)
        </div>
        <div>
          With {swapRate[1]?.times(100).toFixed(2)} % spread fee:{" "}
          {ust_swap_size} ust = {afterSpreadFee.toFixed(2)} luna ($
          {(ust_swap_size / afterSpreadFee).toFixed(4)} per luna)
        </div>
      </center>
    </div>
  );
}

export default App;
