"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
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
import { MarketQuestionCard, decodeQuestion } from "@/components/market-question-card";

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
  const rawId = params.id as string;
  const id = rawId;
  const [market, setMarket] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("buy");
  const [amount, setAmount] = useState(0);

  const fetchMarketData = async (marketId: string): Promise<MarketData | null> => {
    try {
      console.log('Fetching market with ID:', marketId);
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

        // Vérifier que l'ID correspond
        if (parsed.id && parsed.id !== marketId) {
          console.warn(`Market ID mismatch: expected ${marketId}, got ${parsed.id}`);
          // Ne pas retourner null ici, continuer avec les données reçues
        }

        // Ensure all required fields exist with fallback values
        return {
          id: parsed.id || marketId,
          creator: parsed.creator || '',
          question: parsed.question || 'Unknown Market',
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

  useEffect(() => {
    const loadMarket = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading market with ID:', id);
        const marketData = await fetchMarketData(id);
        if (marketData) {
          console.log('Raw market data:', {
            id: marketData.id,
            question: marketData.question,
            rawYesPrice: marketData.last_yes_price,
            rawNoPrice: marketData.last_no_price,
            rawYesReserve: marketData.yes_reserve,
            rawNoReserve: marketData.no_reserve,
            rawTotalLiquidity: marketData.total_liquidity,
            tradeCount: marketData.trade_count
          });

          // Vérifier la cohérence des données
          const yesPrice = parseInt(marketData.last_yes_price.replace(/u64$/, ''));
          const noPrice = parseInt(marketData.last_no_price.replace(/u64$/, ''));
          const yesReserve = parseInt(marketData.yes_reserve.replace(/u64$/, ''));
          const noReserve = parseInt(marketData.no_reserve.replace(/u64$/, ''));
          const totalLiquidity = parseInt(marketData.total_liquidity.replace(/u64$/, ''));

          console.log('Parsed values:', {
            yesPrice: yesPrice / 1_000_000, // Convert to ALEO
            noPrice: noPrice / 1_000_000,   // Convert to ALEO
            yesReserve: yesReserve / 1_000_000, // Convert to ALEO
            noReserve: noReserve / 1_000_000,   // Convert to ALEO
            totalLiquidity: totalLiquidity / 1_000_000 // Convert to ALEO
          });

          // Vérifier que les prix sont cohérents (ils devraient représenter des pourcentages)
          const totalPrice = (yesPrice + noPrice) / 1_000_000;
          if (Math.abs(totalPrice - 100) > 0.01) { // Allow for small floating point differences
            console.warn('Prices do not sum to 100%:', { 
              yesPrice: yesPrice / 1_000_000, 
              noPrice: noPrice / 1_000_000,
              total: totalPrice
            });
          }

          // Vérifier que les réserves sont cohérentes
          const totalReserves = (yesReserve + noReserve) / 1_000_000;
          const totalLiquidityAleo = totalLiquidity / 1_000_000;
          if (Math.abs(totalReserves - totalLiquidityAleo) > 0.01) { // Allow for small floating point differences
            console.warn('Reserves do not match total liquidity:', { 
              yesReserve: yesReserve / 1_000_000, 
              noReserve: noReserve / 1_000_000,
              totalReserves,
              totalLiquidity: totalLiquidityAleo
            });
          }

          setMarket(marketData);
        } else {
          setError('Market not found');
        }
      } catch (err) {
        setError('Failed to fetch market data');
        console.error('Error fetching market:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMarket();
  }, [id]);

  const formatPrice = (price: string) => {
    if (!price) return "0.00%";
    const numPrice = parseInt(price.replace(/u64$/, ''));
    console.log('Raw price value:', price, 'Parsed:', numPrice);
    
    // Les prix sont stockés en microcredits (1 ALEO = 1_000_000 microcredits)
    // Nous devons les convertir en pourcentage
    const normalizedPrice = (numPrice / 1_000_000).toFixed(2);
    console.log('Normalized price:', normalizedPrice + '%');
    return `${normalizedPrice}%`;
  };

  const formatLiquidity = (liquidity: string) => {
    if (!liquidity) return "0.00 ALEO";
    const numLiquidity = parseInt(liquidity.replace(/u64$/, ''));
    console.log('Raw liquidity value:', liquidity, 'Parsed:', numLiquidity);
    
    // Vérifier que la liquidité est valide
    if (isNaN(numLiquidity) || numLiquidity < 0) {
      console.warn('Invalid liquidity value:', liquidity);
      return "0.00 ALEO";
    }
    
    // Les réserves sont déjà en microcredits, donc on divise par 1_000_000 pour avoir des ALEO
    const aleoAmount = (numLiquidity / 1_000_000).toFixed(2);
    console.log('Converted to ALEO:', aleoAmount);
    return `${aleoAmount} ALEO`;
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading market data...</p>
          </div>
        ) : error || !market ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || 'Market not found'}
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Market Info & Chart */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-blue-100 text-blue-700 border-none px-2 py-1">Prediction Market</Badge>
                <Badge className="bg-green-100 text-green-700 border-none px-2 py-1">ALEO Market</Badge>
              </div>
              
              {/* Titre du marché avec la question décodée */}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-snug">
                {decodeQuestion(market.question)}
              </h1>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                <div className="bg-white rounded border p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">Total Volume</div>
                  <div className="font-semibold text-lg">{formatLiquidity(market.total_liquidity)}</div>
                </div>
                <div className="bg-white rounded border p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">Yes Reserve</div>
                  <div className="font-semibold text-lg">{formatLiquidity(market.yes_reserve)}</div>
                </div>
                <div className="bg-white rounded border p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">No Reserve</div>
                  <div className="font-semibold text-lg">{formatLiquidity(market.no_reserve)}</div>
                </div>
                <div className="bg-white rounded border p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1">Trade Count</div>
                  <div className="font-semibold text-lg">{market.trade_count.replace('u32', '')}</div>
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
                    <LineChart data={[
                      { date: "Now", yes: parseInt(market.last_yes_price.replace('u64', '')), no: parseInt(market.last_no_price.replace('u64', '')) }
                    ]} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
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
                    <span className="flex items-center gap-1 text-green-600">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                      Yes {formatPrice(market.last_yes_price)}
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                      No {formatPrice(market.last_no_price)}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span>Trade Count {market.trade_count.replace('u32', '')}</span>
                    <span>Market ID {market.id}</span>
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
                  <span className="text-green-700">Yes <span className="font-semibold">{formatPrice(market.last_yes_price)}</span></span>
                  <span className="text-red-700">No <span className="font-semibold">{formatPrice(market.last_no_price)}</span></span>
                </div>
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>Amount</span>
                    <span className="text-gray-500">Balance: 0.00 ALEO</span>
                  </div>
                  <div className="flex gap-2">
                    <input type="number" min={0} value={amount} onChange={e => setAmount(Number(e.target.value))}
                      className="flex-1 border rounded px-2 py-1 text-sm" placeholder="0.00" />
                    <button className="bg-gray-100 px-2 rounded text-xs font-semibold">Max</button>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                    <span>ALEO</span>
                    <span>Rate: 1 ALEO = 1 Share</span>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-gray-500 mb-2">
                  <div className="flex justify-between"><span>Average Price</span><span>{formatPrice(market.last_yes_price)}</span></div>
                  <div className="flex justify-between"><span>Estimated Shares</span><span>{amount.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Estimated Fees</span><span>0.001 ALEO</span></div>
                </div>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold">{tab === "buy" ? "Buy" : "Sell"}</button>
              </div>
              <div className="bg-white border rounded-lg p-4 mb-4">
                <div className="font-semibold mb-2 text-sm">Market Info</div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Creator: {market.creator}</p>
                  <p>Status: {market.status === '0u8' ? 'Active' : 'Resolved'}</p>
                  <p>Closing Block: {market.closing_block.replace('u32', '')}</p>
                  <p>Yes Token ID: {market.yes_token_id}</p>
                  <p>No Token ID: {market.no_token_id}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 