import "./App.css";
import { useEffect, useState } from "react";
import { useLCDClient } from "@terra-money/wallet-provider";
import { Coin } from "@terra-money/terra.js";
import React from "react";
import { BarChart, Bar, Cell, YAxis, ReferenceLine, LabelList } from "recharts";
import { computeSwap, coinAfterSpread } from "./lib/market";
import abbreviate from "./abbreviate";

const colors = ["#0088FE", "#FFBB28"];

function App() {
  const lcd = useLCDClient();
  const [swapRate, setSwapRate] = useState([]);
  const [ust_swap_size, setSwapSize] = useState(100000);
  const [delta, setDelta] = useState();
  const [height, setHeight] = useState();
  const [isAnimation, setIsAnimation] = useState(true);
  const [config, setConfig] = useState([
    50000000,
    [],
    [49000000, 51000000],
    0,
    0,
  ]);

  const [basePool, data, scale, slippage, recovery] = config;

  useEffect(() => {
    const fetchPools = async () => {
      const delta = await lcd.market.poolDelta();
      const latest_block = await lcd.tendermint.blockInfo();
      const luna_rates = await lcd.oracle.exchangeRates();
      const { base_pool, min_stability_spread, pool_recovery_period } =
        await lcd.market.parameters();
      const microTerraSide = base_pool.plus(delta);
      const microLunaSide = base_pool.pow(2).div(microTerraSide);

      const terraSide = microTerraSide.times(0.000001).toNumber();
      const lunaSide = microLunaSide.times(0.000001).toNumber();

      setDelta(delta);
      setHeight(latest_block.block.header.height);
      const ustSwapRate = computeSwap(
        new Coin("uusd", ust_swap_size * 1e6),
        "uluna",
        luna_rates,
        base_pool,
        min_stability_spread,
        delta
      );

      setSwapRate(ustSwapRate);

      let min_scale = Math.min(terraSide, lunaSide) - 1000000;
      let max_scale = Math.max(terraSide, lunaSide) + 1000000;
      let scale = [min_scale, max_scale];

      const terraSwapRate = await lcd.market.swapRate(
        new Coin("uusd", 1000000000),
        "uluna"
      );
      const exchangeRate = await lcd.oracle.exchangeRate("uusd");
      // Expect Luna returned if there was no fee, based on oracle price.
      const perfectSwapRate = 1000 / exchangeRate.amount.toNumber();

      setConfig([
        base_pool.div(1e6).toNumber(),
        [
          {
            name: "Stablecoins",
            amt: terraSide,
          },
          {
            name: "LUNA",
            amt: lunaSide,
          },
        ],
        scale,
        100 -
          (terraSwapRate.amount.times(0.000001).toNumber() / perfectSwapRate) *
            100,
        pool_recovery_period,
      ]);
    };

    fetchPools();
    const t = setInterval(fetchPools, 7000);
    return () => {
      clearTimeout(t);
    };
  }, [lcd.market, lcd.oracle]);

  const Chart = React.memo(
    () => (
      <BarChart width={800} height={500} data={data}>
        <Bar
          isAnimationActive={isAnimation}
          onAnimationEnd={() => setIsAnimation(false)}
          label={false}
          dataKey="amt"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % 20]} />
          ))}
          <LabelList dataKey="name" position="top" fill="#000" />
          <LabelList
            formatter={(item) => abbreviate(item, 3, 3, "M")}
            dataKey="amt"
            position="inside"
            fill="#000000"
          />
        </Bar>
        <ReferenceLine
          isFront={false}
          label={{ position: "top", value: `BasePool (in SDR)` }}
          y={basePool}
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
    ),
    [data]
  );

  if (!swapRate) {
    return "Loading...";
  }

  const beforeSpreadFee = swapRate[0]?.amount.div(1e6);
  const afterSpreadFee = coinAfterSpread(swapRate[0], swapRate[1])?.amount.div(
    1e6
  );

  return (
    <div
      className="App"
      style={{
        textAlign: "left",
        marginLeft: "auto",
        marginRight: "auto",
        maxWidth: 800,
      }}
    >
      <h2 style={{ lineHeight: "1.2rem" }}>
        Relationship between Luna / Terra Stable assets in the Market module
        <br />
        <span style={{ fontWeight: "normal", fontSize: "16px" }}>
          (live view, updated every block):{" "}
        </span>
      </h2>
      <Chart />
      <hr />
      <div>
        <div>At height: {height}</div>
        <strong>Market parameters</strong>
        <div>Base Pool: {basePool} SDR</div>
        <div>Current delta: {delta?.div(1e6).toFixed(6)} SDR</div>
        <div>Recovery period: {recovery} Blocks </div>
        <span>
          (delta / recovery = {(delta / recovery / 1e6).toFixed(2)} SDR per
          block)
        </span>
      </div>
      <hr />
      {beforeSpreadFee && (
        <div>
          Oracle Rate: ${(ust_swap_size / beforeSpreadFee).toFixed(4)} per luna
          ({ust_swap_size} UST = {beforeSpreadFee.toFixed(2)} luna)
        </div>
      )}

      {afterSpreadFee && (
        <div>
          With {swapRate[1]?.times(100).toFixed(2)} % spread fee:{" "}
          {ust_swap_size} UST = {afterSpreadFee.toFixed(2)} luna ($
          {(ust_swap_size / afterSpreadFee).toFixed(4)} per luna)
        </div>
      )}
      <p>
        Estimated fee for a 1000 UST to Luna swap based on current pool weights:{" "}
        {slippage.toFixed(2)}% <br />
        <sub>
          Pool values above are displayed in{" "}
          <a
            rel="noreferrer"
            target="_blank"
            href="https://docs.terra.money/docs/learn/glossary.html#sdr"
          >
            TerraSDR
          </a>
          .
        </sub>
      </p>
      <p>
        Learn more:{" "}
        <a href="https://docs.terra.money/docs/develop/module-specifications/spec-market.html">
          Terra docs on the Market module.
        </a>
      </p>
    </div>
  );
}

export default App;
