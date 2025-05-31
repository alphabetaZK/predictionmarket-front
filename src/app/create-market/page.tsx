"use client";

import { useState } from "react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { Transaction, WalletAdapterNetwork, WalletNotConnectedError } from "@demox-labs/aleo-wallet-adapter-base";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Users, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";

const categories = [
  "US Politics", "Sports", "World Politics", "Russia/Ukraine", "Current Events", "Economics", "Science", "Technology", "Entertainment"
];

interface CreateMarketData {
  question: string;
  resolutionDate: string;
  initialLiquidity: string;
}

const PREDICTION_MARKET_PROGRAM = "prediction_market_paris_v5.aleo";

export default function CreateMarket() {
  const { publicKey, connected, requestTransaction, transactionStatus, transitionViewKeys, requestRecords } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: "" });
  
  const [formData, setFormData] = useState<CreateMarketData>({
    question: "",
    resolutionDate: "",
    initialLiquidity: "",
  });

  const handleInputChange = (field: keyof CreateMarketData, value: string) => {
    setFormData((prev: CreateMarketData) => ({ ...prev, [field]: value }));
    // Clear status when user starts typing again
    if (submitStatus.type) {
      setSubmitStatus({ type: null, message: "" });
    }
  };

  const validateFormData = (data: CreateMarketData): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.question.trim()) {
      errors.push("Market question is required");
    } else if (data.question.length < 10) {
      errors.push("Market question must be at least 10 characters long");
    }

    if (!data.resolutionDate) {
      errors.push("Resolution date is required");
    } else {
      const resolutionDate = new Date(data.resolutionDate);
      const now = new Date();
      if (resolutionDate <= now) {
        errors.push("Resolution date must be in the future");
      }
    }

    const liquidity = parseFloat(data.initialLiquidity);
    if (data.initialLiquidity) {
      if (isNaN(liquidity) || liquidity < 0) {
        errors.push("Initial liquidity must be a positive number");
      } else if (liquidity > 0 && liquidity < 0.001) {
        errors.push("Initial liquidity must be at least 0.001 ALEO");
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!connected || !publicKey) {
      setSubmitStatus({
        type: 'error',
        message: "Please connect your wallet to create a market"
      });
      return;
    }

    // Validate form data
    const validation = validateFormData(formData);
    if (!validation.valid) {
      setSubmitStatus({
        type: 'error',
        message: validation.errors[0]
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      if (!publicKey) throw new WalletNotConnectedError();

      console.log("🔧 Starting transaction creation...");
      console.log("🔧 Public key:", publicKey);
      console.log("🔧 Connected:", connected);

      // First, get records for credits as shown in Leo docs
      if (!requestRecords) {
        throw new Error("requestRecords function not available");
      }

      console.log("🗂️ Requesting records for credits...");
      const records = await requestRecords("credits.aleo");
      console.log("✅ Records received:", records);

      if (!records || records.length === 0) {
        console.log("⚠️ No records found, but trying anyway...");
        setSubmitStatus({
          type: 'error',
          message: "Warning: No credit records found, but attempting transaction anyway. If this fails, please get credits from faucet.aleo.org."
        });
      }

      // Create a hash of the question for the field input
      const hashString = (str: string): number => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return hash;
      };

      // Convert all string inputs to field type
      const questionHash = `${Math.abs(hashString(formData.question))}field`;
      const questionTitleHash = `${Math.abs(hashString(formData.question + "_title"))}field`;
      const question = `${Math.abs(hashString(formData.question + "_question"))}field`;
      
      // Log the market ID (using questionHash as it's unique for each market)
      console.log("📊 Market ID:", questionHash);
      console.log("🔍 You can view this market on Aleoscan at:", 
        `https://testnet.aleoscan.io/program/prediction_market_paris_v5.aleo/mapping/markets/${questionHash}`);

      // Convert liquidity to microcredits (1 ALEO = 1,000,000 microcredits)
      const initialYesPrice = Math.floor(parseFloat(formData.initialLiquidity) * 1_000_000);
      const minLiquidity = 10_000_000; // 10 ALEO minimum liquidity
      const closingBlock = 30; // 30 days in blocks
      const creationFee = 3_000_000; // 3 ALEO creation fee

      // Prepare inputs for the smart contract with exact types
      const inputs = [
        question,                // r0: question (field.private)
        questionTitleHash,       // r1: question_title (field.private)
        questionHash,            // r2: question_hash (field.private)
        `${initialYesPrice}u64`, // r3: initial_yes_price (u64.private)
        `${minLiquidity}u64`,    // r4: min_liquidity (u64.private)
        `${closingBlock}u32`,    // r5: closing_block (u32.private)
        `${creationFee}u64`      // r6: creation_fee (u64.public)
      ];

      console.log("🔧 Transaction inputs:", {
        question,
        questionTitleHash,
        questionHash,
        initialYesPrice,
        minLiquidity,
        closingBlock,
        creationFee
      });

      console.log("🔧 Creating transaction...");
      const aleoTransaction = Transaction.createTransaction(
        publicKey,
        WalletAdapterNetwork.TestnetBeta,
        PREDICTION_MARKET_PROGRAM,
        'create_market_with_auto_tokens',
        inputs,
        creationFee,
        false
      );

      console.log("🔧 Transaction created:", aleoTransaction);

      if (!requestTransaction) {
        throw new Error("Request transaction function not available");
      }

      console.log("🚀 Calling requestTransaction...");
      const transactionId = await requestTransaction(aleoTransaction);
      console.log("✅ Transaction ID received:", transactionId);

      setSubmitStatus({
        type: 'success',
        message: `Market "${formData.question}" creation submitted successfully! Transaction ID: ${transactionId.slice(0, 16)}...`
      });

      // Optional: Check transaction status
      if (transactionStatus) {
        try {
          const status = await transactionStatus(transactionId);
          console.log("Transaction status:", status);
        } catch (error) {
          console.log("Could not fetch transaction status:", error);
        }
      }

      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          question: "",
          resolutionDate: "",
          initialLiquidity: "",
        });
        setSubmitStatus({ type: null, message: "" });
      }, 5000);

    } catch (error) {
      console.error("Error creating market:", error);
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main Navbar */}
      <Navbar />
      
      {/* Secondary Navbar */}
      <nav className="bg-white border-b">
        <div className="container mx-auto flex items-center gap-4 h-12 px-4">
          <a href="/" className="text-sm text-gray-700 hover:text-blue-600">← Back to Markets</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Create a New Market</h1>
            <p className="text-lg text-gray-600">Ask a question about the future and let the market decide the outcome.</p>
          </div>

          {/* Status Messages */}
          {submitStatus.type && (
            <div className={`mb-6 p-4 rounded-md border ${
              submitStatus.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {submitStatus.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">{submitStatus.message}</span>
              </div>
            </div>
          )}

          {/* Create Market Form */}
          <Card className="bg-white border rounded-none">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">Market Details</CardTitle>
              <CardDescription>Fill in the information below to create your prediction market.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Market Question */}
                <div className="space-y-2">
                  <Label htmlFor="question" className="text-sm font-medium text-gray-700">
                    Market Question *
                  </Label>
                  <Input
                    id="question"
                    placeholder="e.g., Will Bitcoin reach $100,000 by end of 2024?"
                    value={formData.question}
                    onChange={(e) => handleInputChange("question", e.target.value)}
                    className="w-full"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500">Ask a clear, unambiguous question with a definitive outcome.</p>
                </div>


                {/* Resolution Date */}
                <div className="space-y-2">
                  <Label htmlFor="resolutionDate" className="text-sm font-medium text-gray-700">
                    Resolution Date *
                  </Label>
                  <Input
                    id="resolutionDate"
                    type="date"
                    value={formData.resolutionDate}
                    onChange={(e) => handleInputChange("resolutionDate", e.target.value)}
                    className="w-full"
                    disabled={isSubmitting}
                    min={new Date().toISOString().split('T')[0]} // Prevent past dates
                  />
                </div>

                {/* Initial Liquidity */}
                <div className="space-y-2">
                  <Label htmlFor="initialLiquidity" className="text-sm font-medium text-gray-700">
                    Initial Liquidity (ALEO) *
                  </Label>
                  <Input
                    id="initialLiquidity"
                    type="number"
                    placeholder="0.1"
                    value={formData.initialLiquidity}
                    onChange={(e) => handleInputChange("initialLiquidity", e.target.value)}
                    className="w-full"
                    disabled={isSubmitting}
                    min="0.001"
                    step="0.001"
                  />
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>• Minimum: 0.001 ALEO</p>
                    <p>• This provides initial market liquidity</p>
                  </div>
                </div>

                {/* Market Preview */}
                <div className="bg-gray-50 border rounded p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Market Preview</h3>
                  <Card className="bg-white border rounded-none">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-blue-700 line-clamp-2">
                          {formData.question || "Your market question will appear here..."}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        Resolution Date: {formData.resolutionDate || "Not set"}
                      </div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-gray-500">Volume</span>
                        <span className="font-semibold text-gray-700">$0</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-700 border-none px-2 py-1">Yes 50%</Badge>
                        <Badge className="bg-red-100 text-red-700 border-none px-2 py-1">No 50%</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Submit Button */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  {!connected ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-center">
                      <p className="text-sm text-yellow-800 mb-2">Connect your wallet to create a market</p>
                    </div>
                  ) : (
                    <>
                      <Button
                        type="submit"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
                        disabled={!formData.question || !formData.resolutionDate || !formData.initialLiquidity || isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating Market on Blockchain...
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-4 h-4 mr-2" />
                            Create Market on Aleo
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 py-3"
                        onClick={() => window.history.back()}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Guidelines */}
          <Card className="bg-white border rounded-none mt-8">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Market Creation Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Good Market Questions</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Clear and unambiguous</li>
                    <li>• Have a definitive resolution date</li>
                    <li>• Objectively verifiable outcome</li>
                    <li>• Interesting to the community</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Resolution Criteria</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Specify reliable sources</li>
                    <li>• Define edge cases</li>
                    <li>• Set clear deadlines</li>
                    <li>• Avoid subjective interpretations</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Smart Contract Info</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Program: prediction_market_paris_v5.aleo</li>
                    <li>• Function: create_market_with_auto_tokens</li>
                    <li>• Creates Yes/No tokens automatically</li>
                    <li>• Requires 3 ALEO creation fee</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">How It Works</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Validates caller address</li>
                    <li>• Creates market record with your info</li>
                    <li>• Stores on Aleo blockchain</li>
                    <li>• Returns Market.record to you</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
} 