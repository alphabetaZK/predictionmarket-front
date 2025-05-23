"use client";

import { useEffect, useRef, useState } from "react";
import { WalletMultiButton } from "@demox-labs/aleo-wallet-adapter-reactui";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/Navbar";

const categories = [
  "All markets", "Featured", "US Politics", "Sports", "World Politics", "Russia/Ukraine", "Current Events", "Economics", "Science"
];

const featuredMarkets = [
  {
    avatar: "/elon.jpg",
    question: "Will Elon Musk Father Another Child Before August 2023?",
    resolution: "Aug 2, 2023",
    volume: "$6,332",
    yes: "36%",
    no: "75%",
  },
  {
    avatar: "/ayatollah.jpg",
    question: "Will Ayatollah Khamenei Remain Supreme Leader of Iran?",
    resolution: "Jan 1, 2023",
    volume: "$3,420",
    yes: "99.9%",
    no: "4%",
  },
  {
    avatar: "/sbf.jpg",
    question: "Will Sam Bankman-Fried Go on the Run Before 2023?",
    resolution: "Jan 1, 2023",
    volume: "$3,203",
    yes: "14%",
    no: "99.9%",
  },
  {
    avatar: "/biden.jpg",
    question: "Will Joe Biden Remain President Through 2022?",
    resolution: "Jan 2, 2023",
    volume: "$4,721",
    yes: "No",
    no: "2%",
  },
  {
    avatar: "/predictit.png",
    question: "Will PredictIt Survive?",
    resolution: "Feb 16, 2023",
    volume: "$6,799",
    yes: "11%",
    no: "90%",
  },
  {
    avatar: "/democrat.png",
    question: "Who Will Win the 2024 Democratic Presidential Nomination?",
    resolution: "Oct 1, 2024",
    volume: "$8,438",
    yes: "70%",
    no: "-",
  },
];

const popularMarkets = [
  {
    avatar: "/predictit.png",
    question: "Will PredictIt Survive?",
    resolution: "Feb 16, 2023",
    volume: "$6,799",
    yes: "11%",
    no: "90%",
  },
  {
    avatar: "/fauci.jpg",
    question: "Will Anthony Fauci Remain NIAID Director Through the End of the Year?",
    resolution: "Jan 2, 2023",
    volume: "$3,203",
    yes: "14%",
    no: "99.9%",
  },
  {
    avatar: "/trump.jpg",
    question: "Will Donald Trump Become President by the End of 2022?",
    resolution: "Jan 2, 2023",
    volume: "$4,721",
    yes: "No",
    no: "2%",
  },
  {
    avatar: "/gop.png",
    question: "Who Will Win the 2024 Republican Presidential Nomination?",
    resolution: "Oct 1, 2024",
    volume: "$8,438",
    yes: "70%",
    no: "-",
  },
];

export default function Home() {
  const { publicKey, connected } = useWallet();
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL("worker.ts", import.meta.url));
    workerRef.current.onmessage = (event) => {
      // ...
    };
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* Main Navbar */}
      <Navbar />
      {/* Secondary Navbar */}
      <nav className="bg-white border-b">
        <div className="container mx-auto flex items-center gap-4 h-12 px-4 overflow-x-auto">
          {categories.map((cat) => (
            <a key={cat} href="#" className="text-sm text-gray-700 hover:text-blue-600 whitespace-nowrap px-2 py-1">
              {cat}
            </a>
          ))}
        </div>
      </nav>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-10 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Predict the Future</h1>
          <p className="text-lg text-gray-600">Place your bets on real-world questions and see the market consensus.</p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-lg rounded">Start trading</Button>
        </div>
      </section>
      {/* Featured Markets */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Featured Markets</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Last price</span>
            <input type="checkbox" className="accent-blue-600" />
            <span className="text-xs text-gray-500">Best price</span>
            <select className="ml-4 border rounded px-2 py-1 text-sm text-gray-700">
              <option>All categories</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featuredMarkets.map((m, i) => (
            <Card key={i} className="bg-white border shadow-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <a href={`/market/${i}`} className="text-sm font-medium text-blue-700 hover:underline line-clamp-2">{m.question}</a>
                </div>
                <div className="text-xs text-gray-500 mb-2">Resolution Date: {m.resolution}</div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-gray-500">Volume</span>
                  <span className="font-semibold text-gray-700">{m.volume}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700 border-none px-2 py-1">Yes {m.yes}</Badge>
                  <Badge className="bg-red-100 text-red-700 border-none px-2 py-1">No {m.no}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      {/* Popular Markets */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Popular Markets</h2>
          <div>
            <select className="border rounded px-2 py-1 text-sm text-gray-700">
              <option>Liquidity</option>
            </select>
            <select className="ml-2 border rounded px-2 py-1 text-sm text-gray-700">
              <option>All categories</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {popularMarkets.map((m, i) => (
            <Card key={i} className="bg-white border shadow-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <a href={`/market/${i}`} className="text-sm font-medium text-blue-700 hover:underline line-clamp-2">{m.question}</a>
                </div>
                <div className="text-xs text-gray-500 mb-2">Resolution Date: {m.resolution}</div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-gray-500">Volume</span>
                  <span className="font-semibold text-gray-700">{m.volume}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700 border-none px-2 py-1">Yes {m.yes}</Badge>
                  <Badge className="bg-red-100 text-red-700 border-none px-2 py-1">No {m.no}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
