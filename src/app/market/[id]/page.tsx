"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
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
            yesPrice,
            noPrice,
            yesReserve: yesReserve / 1_000_000,
            noReserve: noReserve / 1_000_000,
            totalLiquidity: totalLiquidity / 1_000_000
          });

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
    // Utiliser la même logique que la page d'accueil
    return `${numPrice.toFixed(2)}%`;
  };

  const formatLiquidity = (liquidity: string) => {
    if (!liquidity) return "$0.00";
    const numLiquidity = parseInt(liquidity.replace(/u64$/, ''));
    // Utiliser la même logique que la page d'accueil
    return `$${(numLiquidity / 1000000).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
          <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-blue-100 text-blue-700 border-none px-2 py-1">Prediction Market</Badge>
                <Badge className="bg-green-100 text-green-700 border-none px-2 py-1">ALEO Market</Badge>
                <Badge className="bg-gray-100 text-gray-700 border-none px-2 py-1">
                  {market.status === '0u8' ? 'Active' : 'Resolved'}
                </Badge>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 leading-snug break-words">
                {decodeQuestion(market.question)}
              </h1>

              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-green-600 font-semibold">Yes {formatPrice(market.last_yes_price)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span className="text-red-600 font-semibold">No {formatPrice(market.last_no_price)}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Trade Count: {market.trade_count.replace('u32', '')}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Market Stats */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="text-sm text-gray-500 mb-1">Total Volume</div>
                    <div className="font-semibold text-lg truncate" title={formatLiquidity(market.total_liquidity)}>
                      {formatLiquidity(market.total_liquidity)}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="text-sm text-gray-500 mb-1">Yes Reserve</div>
                    <div className="font-semibold text-lg truncate" title={formatLiquidity(market.yes_reserve)}>
                      {formatLiquidity(market.yes_reserve)}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="text-sm text-gray-500 mb-1">No Reserve</div>
                    <div className="font-semibold text-lg truncate" title={formatLiquidity(market.no_reserve)}>
                      {formatLiquidity(market.no_reserve)}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="text-sm text-gray-500 mb-1">Closing Block</div>
                    <div className="font-semibold text-lg">
                      {market.closing_block.replace('u32', '')}
                    </div>
                  </div>
                </div>

                {/* Market Info */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-4">Market Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 mb-1">Creator</div>
                      <div className="truncate font-medium" title={market.creator}>{market.creator}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Yes Token ID</div>
                      <div className="truncate font-medium" title={market.yes_token_id}>{market.yes_token_id}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">No Token ID</div>
                      <div className="truncate font-medium" title={market.no_token_id}>{market.no_token_id}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Market ID</div>
                      <div className="truncate font-medium" title={market.id}>{market.id}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Trading Panel */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                  <div className="flex gap-2 mb-6">
                    <button onClick={() => setTab("buy")}
                      className={`flex-1 py-2.5 rounded-lg font-semibold transition-colors ${
                        tab === "buy" 
                          ? "bg-blue-600 text-white" 
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}>
                      Buy
                    </button>
                    <button onClick={() => setTab("sell")}
                      className={`flex-1 py-2.5 rounded-lg font-semibold transition-colors ${
                        tab === "sell" 
                          ? "bg-blue-600 text-white" 
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}>
                      Sell
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-6 text-sm">
                    <span className="text-green-700">Yes <span className="font-semibold">{formatPrice(market.last_yes_price)}</span></span>
                    <span className="text-red-700">No <span className="font-semibold">{formatPrice(market.last_no_price)}</span></span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Amount</span>
                        <span className="text-gray-500">Balance: 0.00 ALEO</span>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          min={0} 
                          value={amount} 
                          onChange={e => setAmount(Number(e.target.value))}
                          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                          placeholder="0.00" 
                        />
                        <button className="bg-gray-100 px-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                          Max
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex justify-between">
                        <span>Average Price</span>
                        <span className="font-medium">{formatPrice(market.last_yes_price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimated Shares</span>
                        <span className="font-medium">{amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimated Fees</span>
                        <span className="font-medium">0.001 ALEO</span>
                      </div>
                    </div>

                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold transition-colors">
                      {tab === "buy" ? "Buy" : "Sell"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 