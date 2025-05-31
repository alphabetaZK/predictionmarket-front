"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { useState } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const fakeMarkets = [
  {
    category: "Cryptocurrency",
    question: "Will a new privacy-focused cryptocurrency gain significant popularity and adoption by the end of 2023?",
    resolution: "25 JUN 2023",
    stats: {
      "24hr Volume": "$15,500",
      "Total Volume": "$270,110",
      "Liquidity": "$53,612",
      "Expires": "25 JUN 2023",
    },
    yesPrice: "$2.00",
    noPrice: "$3.80",
    balance: "$1800.00",
    communityPrediction: "78%",
    totalPredictions: "4.3k",
    description: "Will a new privacy-focused cryptocurrency gain significant popularity and adoption by the end of 2023?",
    chartData: [
      { date: "01 May 23", yes: 2.1, no: 3.7 },
      { date: "07 Jun 23", yes: 2.2, no: 3.6 },
      { date: "13 Jun 23", yes: 2.3, no: 3.5 },
      { date: "26 Jun 23", yes: 2.5, no: 3.4 },
      { date: "05 Jul 23", yes: 2.7, no: 3.2 },
    ],
  },
  // ...add more markets as needed
];

const chartConfig = {
  yes: {
    label: "Yes",
    color: "#22c55e", // green-500
  },
  no: {
    label: "No",
    color: "#ef4444", // red-500
  },
};

export default function MarketDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const market = fakeMarkets[0]; // Always use the first for demo
  const [tab, setTab] = useState("buy");
  const [amount, setAmount] = useState(0);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Market Info & Chart */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-blue-100 text-blue-700 border-none px-2 py-1">{market.category}</Badge>
              <Badge className="bg-green-100 text-green-700 border-none px-2 py-1">USDT Market</Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-snug">{market.question}</h1>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <div className="bg-white rounded border p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">24hr Volume</div>
                <div className="font-semibold text-lg">{market.stats["24hr Volume"]}</div>
              </div>
              <div className="bg-white rounded border p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">Total Volume</div>
                <div className="font-semibold text-lg">{market.stats["Total Volume"]}</div>
              </div>
              <div className="bg-white rounded border p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">Liquidity</div>
                <div className="font-semibold text-lg">{market.stats["Liquidity"]}</div>
              </div>
              <div className="bg-white rounded border p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">Expires</div>
                <div className="font-semibold text-lg">{market.stats["Expires"]}</div>
              </div>
            </div>
            {/* Chart */}
            <div className="bg-white border rounded p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-2 text-xs text-gray-500">
                  <button className="px-2 py-1 rounded bg-gray-100 text-blue-600 font-semibold">24hrs</button>
                  <button className="px-2 py-1 rounded hover:bg-gray-100">7d</button>
                  <button className="px-2 py-1 rounded hover:bg-gray-100">30d</button>
                  <button className="px-2 py-1 rounded hover:bg-gray-100">All Time</button>
                </div>
                <div className="text-xs text-gray-500">Time Range</div>
              </div>
              <ChartContainer config={chartConfig} className="min-h-[180px] w-full">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={market.chartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                    <Line type="monotone" dataKey="yes" stroke="#22c55e" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="no" stroke="#ef4444" strokeWidth={2} dot={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="flex items-center justify-between mt-2 text-xs">
                <div className="flex gap-2 items-center">
                  <span className="flex items-center gap-1 text-green-600"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>Yes {market.yesPrice}</span>
                  <span className="flex items-center gap-1 text-red-600"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>No {market.noPrice}</span>
                </div>
                <div className="flex gap-4">
                  <span>Total Predictions {market.totalPredictions}</span>
                  <span>Community Prediction {market.communityPrediction}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Right: Buy/Sell Panel */}
          <div className="w-full lg:w-[350px] flex-shrink-0">
            <div className="bg-white border rounded-lg p-4 mb-4">
              <div className="flex gap-2 mb-4">
                <button onClick={() => setTab("buy")}
                  className={`flex-1 py-2 rounded font-semibold ${tab === "buy" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}>Buy</button>
                <button onClick={() => setTab("sell")}
                  className={`flex-1 py-2 rounded font-semibold ${tab === "sell" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}>Sell</button>
              </div>
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-green-700">Yes <span className="font-semibold">{market.yesPrice}</span></span>
                <span className="text-red-700">No <span className="font-semibold">{market.noPrice}</span></span>
              </div>
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Amount</span>
                  <span className="text-gray-500">Balance: {market.balance}</span>
                </div>
                <div className="flex gap-2">
                  <input type="number" min={0} value={amount} onChange={e => setAmount(Number(e.target.value))}
                    className="flex-1 border rounded px-2 py-1 text-sm" placeholder="$0.00" />
                  <button className="bg-gray-100 px-2 rounded text-xs font-semibold">Max</button>
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                  <span>USDT</span>
                  <span>Rate: 1.25 USDT = 1 Share</span>
                </div>
              </div>
              <div className="space-y-1 text-xs text-gray-500 mb-2">
                <div className="flex justify-between"><span>Average Price</span><span>$10.00</span></div>
                <div className="flex justify-between"><span>Estimated Shares</span><span>100.00</span></div>
                <div className="flex justify-between"><span>Estimated Profit</span><span>$10.00</span></div>
                <div className="flex justify-between"><span>Estimated Fees</span><span>$10.00</span></div>
                <div className="flex justify-between"><span>Max Return on Investment</span><span>$10.00</span></div>
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold">{tab === "buy" ? "Buy" : "Sell"}</button>
            </div>
            <div className="bg-white border rounded-lg p-4 mb-4">
              <div className="font-semibold mb-2 text-sm">My Signals</div>
              <div className="text-xs text-gray-500 mb-2">You have no available forecast.</div>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">Join Community</span>
                <button className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-semibold">Join</button>
              </div>
              <div className="text-xs text-gray-500">Be part of a great community</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 