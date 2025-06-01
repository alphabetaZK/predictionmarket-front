"use client";

import { useEffect, useRef, useState } from "react";
import { WalletMultiButton } from "@demox-labs/aleo-wallet-adapter-reactui";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { InteractiveGridPattern } from "@/components/magicui/interactive-grid-pattern";
import { ScratchToReveal } from "@/components/magicui/scratch-to-reveal";
import { MarketQuestionCard } from "@/components/market-question-card";

const categories = [
  "All markets", "Featured", "US Politics", "Sports", "World Politics", "Russia/Ukraine", "Current Events", "Economics", "Science"
];

const list_open_markets_id = ['73418128980065620field', '73418128980065620field', '73418128980065620field', '73418128980065620field', '73418128980065620field', '73418128980065620field'];

interface MarketData {
  id: string;
  creator: string;
  question: string;
  yes_token_id: string;
  no_token_id: string;
  closing_block: string;
  status: string;
  winning_option: string;
  yes_reserve: string;
  no_reserve: string;
  total_liquidity: string;
  last_yes_price: string;
  last_no_price: string;
  trade_count: string;
}

export default function Home() {
  const { publicKey, connected } = useWallet();
  const workerRef = useRef<Worker | null>(null);
  const [aleoMarkets, setAleoMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = async (marketId: string): Promise<MarketData | null> => {
    try {
      const response = await fetch(`https://api.explorer.provable.com/v1/testnet/program/prediction_market_paris_v5.aleo/mapping/markets/${marketId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch market ${marketId}`);
      }
      const data = await response.text();
      
      // Parse the response data (it's in Aleo format, not JSON)
      try {
        console.log('Raw data:', data);
        
        // First, try to parse the outer JSON structure that the API returns
        let innerData = data;
        try {
          const outerJson = JSON.parse(data);
          console.log('Outer JSON parsed:', outerJson);
          
          // Extract the inner data (it might be in a weird format)
          if (typeof outerJson === 'object') {
            // Find the first string value that contains our data
            const values = Object.values(outerJson);
            for (const value of values) {
              if (typeof value === 'string' && value.includes('id:')) {
                innerData = value;
                break;
              }
            }
          }
        } catch (outerError) {
          console.log('Not wrapped in outer JSON, proceeding with raw data');
        }
        
        // Convert escaped newlines to real newlines
        innerData = innerData.replace(/\\n/g, '\n');
        
        console.log('Cleaned inner data:', innerData);
        
        // Now parse the Aleo format
        let jsonString = innerData.trim();
        
        // Clean up the format first
        // Remove any trailing commas before closing braces
        jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');
        
        // Add quotes around property names (more precise regex)
        jsonString = jsonString.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '"$1":');
        
        // Add quotes around values (handle different value types)
        jsonString = jsonString.replace(/:\s*([^",\n\r\}]+)(?=[,\n\r\}])/g, (match, value) => {
          const trimmedValue = value.trim();
          // Skip if already quoted or if it's a number/boolean
          if (trimmedValue.startsWith('"') || trimmedValue === 'true' || trimmedValue === 'false' || /^\d+$/.test(trimmedValue)) {
            return `: ${trimmedValue}`;
          }
          // Add quotes around the value
          return `: "${trimmedValue}"`;
        });
        
        console.log('Converted JSON string:', jsonString);
        
        let parsed;
        try {
          parsed = JSON.parse(jsonString);
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError);
          console.log('Problematic JSON string:', jsonString);
          
          // Fallback: manual parsing
          console.log('Falling back to manual parsing...');
          const lines = innerData.split('\n');
          parsed = {} as Record<string, string>;
          
          for (const line of lines) {
            const trimmed = line.trim().replace(/[,{}]/g, '');
            if (trimmed.includes(':')) {
              const [key, ...valueParts] = trimmed.split(':');
              const value = valueParts.join(':').trim();
              if (key && value) {
                parsed[key.trim()] = value;
              }
            }
          }
        }

        console.log('moi');
        console.log(parsed.id);
        console.log(parsed);
        
        // Ensure all required fields exist with fallback values
        return {
          id: parsed.id || marketId,
          creator: parsed.creator || '',
          question: parsed.question || '',
          yes_token_id: parsed.yes_token_id || '',
          no_token_id: parsed.no_token_id || '',
          closing_block: parsed.closing_block || '0u32',
          status: parsed.status || '0u8',
          winning_option: parsed.winning_option || '0u8',
          yes_reserve: parsed.yes_reserve || '0u64',
          no_reserve: parsed.no_reserve || '0u64',
          total_liquidity: parsed.total_liquidity || '0u64',
          last_yes_price: parsed.last_yes_price || '0u64',
          last_no_price: parsed.last_no_price || '0u64',
          trade_count: parsed.trade_count || '0u32'
        };
      } catch (parseError) {
        console.error(`Error parsing market data for ${marketId}:`, parseError);
        console.log('Raw response:', data);
        return null;
      }
    } catch (err) {
      console.error(`Error fetching market ${marketId}:`, err);
      return null;
    }
  };

  const fetchAllMarkets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const marketPromises = list_open_markets_id.map(marketId => fetchMarketData(marketId));
      const results = await Promise.all(marketPromises);
      console.log(results)
      
      const validMarkets = results.filter((market): market is MarketData => market !== null);
      setAleoMarkets(validMarkets);
    } catch (err) {
      setError('Failed to fetch market data');
      console.error('Error fetching markets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    workerRef.current = new Worker(new URL("worker.ts", import.meta.url));
    workerRef.current.onmessage = (event) => {
      // ...
    };
    
    // Fetch market data
    fetchAllMarkets();
    
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const formatPrice = (price: string) => {
    if (!price) return "0.00%";
    const numPrice = parseInt(price.replace(/u64$/, ''));
    return `${(numPrice).toFixed(2)}%`;
  };

  const formatLiquidity = (liquidity: string) => {
    if (!liquidity) return "$0.00";
    const numLiquidity = parseInt(liquidity.replace(/u64$/, ''));
    return `$${(numLiquidity / 1000000).toFixed(2)}`;
  };

  const safeReplace = (value: string | undefined, pattern: RegExp, replacement: string) => {
    return value ? value.replace(pattern, replacement) : '0';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main Navbar */}
      <Navbar />

      {/* Live Aleo Markets */}
      <section className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading market data...</p>
          </div>
        ) : aleoMarkets.length > 0 ? (
          <div className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-lg bg-background grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            <InteractiveGridPattern
        className={cn(
          "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-[200%]",
        )}
      ></InteractiveGridPattern>
            {aleoMarkets.map((market, i) => (
              <MarketQuestionCard
                key={i}
                question={market.question}
                yesPercent={parseFloat(market.last_yes_price.replace(/u64$/, ''))}
                noPercent={parseFloat(market.last_no_price.replace(/u64$/, ''))}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No market data available
          </div>
        )}
      </section>
      <section className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center">
          <div className="py-20">
            <h2 className="text-5xl font-bold text-gray-900"></h2>
          </div>
          <div className="flex items-center justify-center gap-10">
            <p className="text-3xl font-bold text-gray-900">Imagine a future where...<br/>privacy is the norm.</p>
            <ScratchToReveal
              width={250}
              height={250}
              minScratchPercentage={70}
              className="flex items-center justify-center overflow-hidden rounded-2xl border-2 bg-gray-100"
              gradientColors={["#111827", "#1f2937", "#111827"]}
            >
              <p className="text-9xl">🕵️</p>
            </ScratchToReveal>
          </div>
        </div>    
      </section>

      <section className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-start justify-start">
            <h2 className="text-5xl font-bold text-white">How it works</h2>
            <div className="flex flex-col items-start justify-start gap-12 pt-12">
              <div className="flex flex-col items-start justify-start">
                <h3 className="text-2xl font-bold text-white">Create Markets</h3>
                <p className="text-white">Create a market by asking a question and setting the closing block.</p>
              </div>
              <div className="flex flex-col items-start justify-start">
                <h3 className="text-2xl font-bold text-white">Trade Positions</h3>
                <p className="text-white">Buy and sell YES/NO positions. Prices move based on market sentiment and trading activity.</p>
              </div>
              
              <div className="flex flex-col items-start justify-start">
                <h3 className="text-2xl font-bold text-white">Earn Rewards</h3>
                <p className="text-white">When markets resolve, correct predictions are rewarded. Liquidity providers earn fees.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
