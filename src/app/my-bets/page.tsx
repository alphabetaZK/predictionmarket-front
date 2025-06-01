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

interface UserBet {
  id: string;
  marketId: string;
  question: string;
  position: 'YES' | 'NO';
  amount: string;
  price: string;
  date: string;
  status: 'ACTIVE' | 'WON' | 'LOST' | 'PENDING';
  marketStatus: 'OPEN' | 'CLOSED' | 'RESOLVED';
  potentialReturn: string;
  currentValue: string;
}

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

// Données d'exemple - à remplacer par les vraies données utilisateur
const list_open_markets_id = ['123field', '2206field'];

export default function MyBets() {
  const { publicKey, connected } = useWallet();
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'WON' | 'LOST'>('ALL');
  const workerRef = useRef<Worker | null>(null);

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

  // Fonction pour calculer BHP256 hash via le worker
  const calculateBHP256Hash = async (buyerAddress: string, tokenId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error("Worker not initialized"));
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === "calculateBHP256") {
          workerRef.current?.removeEventListener("message", handleMessage);
          if (event.data.result.success) {
            resolve(event.data.result.hash);
          } else {
            reject(new Error(event.data.result.error));
          }
        }
      };

      workerRef.current.addEventListener("message", handleMessage);
      workerRef.current.postMessage({
        type: "calculateBHP256",
        data: { buyerAddress, tokenId }
      });
    });
  };

  const fetchAllMarketsForTokens = async () => {
    try {
      console.log('Fetching market data for token verification...');
      
      const marketPromises = list_open_markets_id.map(marketId => fetchMarketData(marketId));
      const results = await Promise.all(marketPromises);
      
      const validMarkets = results.filter((market): market is MarketData => market !== null);
      
      // Console.log les yes_token_id et no_token_id pour chaque market
      for (const market of validMarkets) {
        console.log(`Market ${market.id}:`);
        console.log(`  yes_token_id: ${market.yes_token_id}`);
        console.log(`  no_token_id: ${market.no_token_id}`);
        
        // Calculate BHP256::hash_to_field(buyer as field + token_id) for each token
        if (publicKey) {
          const buyer = publicKey.toString();
          
          // Pour le yes_token_id
          if (market.yes_token_id) {
            try {
              const yesTokenHash = await calculateBHP256Hash(buyer, market.yes_token_id);
              console.log(`  BHP256::hash_to_field(${buyer} + ${market.yes_token_id}): ${yesTokenHash}`);
            } catch (error) {
              console.error(`Error calculating hash for yes_token_id:`, error);
            }
          }
          
          // Pour le no_token_id  
          if (market.no_token_id) {
            try {
              const noTokenHash = await calculateBHP256Hash(buyer, market.no_token_id);
              console.log(`  BHP256::hash_to_field(${buyer} + ${market.no_token_id}): ${noTokenHash}`);
            } catch (error) {
              console.error(`Error calculating hash for no_token_id:`, error);
            }
          }
        }
        
        console.log('---');
      }
      
    } catch (err) {
      console.error('Error fetching markets for token verification:', err);
    }
  };

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker(new URL("../worker.ts", import.meta.url));
    workerRef.current.onmessage = (event) => {
      if (event.data.type === "ready") {
        console.log("Worker ready:", event.data.message);
      }
    };

    // Simuler le chargement des paris utilisateur
    setTimeout(() => {
      if (connected) {
        // Fetch market data to get token IDs
        fetchAllMarketsForTokens();
      }
      setLoading(false);
    }, 1000);

    return () => {
      workerRef.current?.terminate();
    };
  }, [connected]);

  const filteredBets = userBets.filter(bet => {
    if (filter === 'ALL') return true;
    return bet.status === filter;
  });

  const totalInvested = userBets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0);
  const totalCurrentValue = userBets.reduce((sum, bet) => sum + parseFloat(bet.currentValue), 0);
  const totalPnL = totalCurrentValue - totalInvested;
  const pnlPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-blue-100 text-blue-700';
      case 'WON': return 'bg-green-100 text-green-700';
      case 'LOST': return 'bg-red-100 text-red-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPositionColor = (position: string) => {
    return position === 'YES' ? 'text-green-600' : 'text-red-600';
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">My Bets</h1>
            <p className="text-gray-600 mb-8">Connect your wallet to view your betting positions</p>
            <WalletMultiButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main Navbar */}
      <Navbar />

      {/* Page Header */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-2">My Bets</h1>
            <p className="text-gray-600">Track your prediction market positions</p>
          </div>
        </div>
      </section>

      {/* Portfolio Summary */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          <MarketQuestionCard question="73418128980065620field" yesPercent={81} noPercent={19} />
          <MarketQuestionCard question="73418128980065620field" yesPercent={60} noPercent={40} />
        </div>
      </section>

      {/* How Trading Works Section */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700  mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-start justify-start">
            <h2 className="text-5xl font-bold text-white">Managing Your Bets</h2>
            <div className="flex flex-col items-start justify-start gap-12 pt-12">
              <div className="flex flex-col items-start justify-start">
                <h3 className="text-2xl font-bold text-white">Track Performance</h3>
                <p className="text-white">Monitor your portfolio's performance in real-time with detailed P&L tracking.</p>
              </div>
              <div className="flex flex-col items-start justify-start">
                <h3 className="text-2xl font-bold text-white">Manage Positions</h3>
                <p className="text-white">Buy more shares, sell existing positions, or hold until market resolution.</p>
              </div>
              <div className="flex flex-col items-start justify-start">
                <h3 className="text-2xl font-bold text-white">Learn & Improve</h3>
                <p className="text-white">Analyze your betting history to improve your prediction accuracy over time.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 