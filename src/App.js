import "./App.css";
import { useEffect, useState } from "react";
import { useLCDClient } from "@terra-money/wallet-provider";
import { Coin } from "@terra-money/terra.js";
import React from "react";
import { BarChart, Bar, Cell, YAxis, ReferenceLine, LabelList } from "recharts";
import { computeSwap, coinAfterSpread } from "./lib/market";
import abbreviate from "./abbreviate";

const colors = ["#0088FE", "#FFBB28"];
const ust_swap_size = 100000;

function App() {
  const lcd = useLCDClient();
  const [swapRate, setSwapRate] = useState([]);
  const [delta, setDelta] = useState();
  const [isAnimation, setIsAnimation] = useState(true);
  const [config, setConfig] = useState([[], [49000000, 51000000], 0]);

  const [data, scale, slippage] = config;

  useEffect(() => {
    const fetchPools = async () => {
      const delta = await lcd.market.poolDelta();
      const luna_rates = await lcd.oracle.exchangeRates();
      const { base_pool, min_stability_spread } = await lcd.market.parameters();
      const microTerraSide = base_pool.plus(delta);
      const microLunaSide = base_pool.pow(2).div(microTerraSide);

      const terraSide = microTerraSide.times(0.000001).toNumber();
      const lunaSide = microLunaSide.times(0.000001).toNumber();

      setDelta(delta);
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
          label={{ position: "top", value: "BasePool (in SDR)" }}
          y={50000000}
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
      <div>Current delta: {delta?.div(1e6).toFixed(4)} SDR</div>
      {beforeSpreadFee && (
        <div>
          Oracle Rate: {ust_swap_size} ust = {beforeSpreadFee.toFixed(2)} luna
          ($
          {(ust_swap_size / beforeSpreadFee).toFixed(4)} per luna)
        </div>
      )}

      {afterSpreadFee && (
        <div>
          With {swapRate[1]?.times(100).toFixed(2)} % spread fee:{" "}
          {ust_swap_size} ust = {afterSpreadFee.toFixed(2)} luna ($
          {(ust_swap_size / afterSpreadFee).toFixed(4)} per luna)
        </div>
      )}

      <hr />

      {/* <ul>
        <li>
          The Market module enables atomic swaps between different Terra
          stablecoin denominations and Luna. This module ensures an available,
          liquid market, stable prices, and fair exchange rates between the
          protocol’s assets.
        </li>

        <li>Terra uses a Constant Product market-making algorithm to ensure
        liquidity for Terra&lt;&gt;Luna swaps.</li>
        <li>
          The market starts out with two liquidity pools of equal sizes (BasePool above), one
          representing all denominations of Terra and another representing Luna.
        </li>
        <li>
          At the end of each block the market module attempts to replenish the
          pools by decreasing the magnitude of the delta between the Terra and
          Luna pools.
        </li>
        <li>
          This mechanism ensures liquidity and acts as a low-pass filter,
          allowing for the spread fee to drop back down when there is a change
          in demand, causing a necessary change in supply which needs to be
          absorbed.
        </li>
      </ul>
    
      <p>
        <b>
          This is a very high level overview. Visit the{" "}
          <a
            rel="noreferrer"
            target="_blank"
            href="https://docs.terra.money/docs/develop/module-specifications/spec-market.html"
          >
            
          </a>{" "}
          on the market module for more information.
        </b>
      </p> */}
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
