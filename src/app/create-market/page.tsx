"use client";

import { useState } from "react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DollarSign, Users } from "lucide-react";
import Navbar from "@/components/Navbar";

const categories = [
  "US Politics", "Sports", "World Politics", "Russia/Ukraine", "Current Events", "Economics", "Science", "Technology", "Entertainment"
];

export default function CreateMarket() {
  const { publicKey, connected } = useWallet();
  const [formData, setFormData] = useState({
    question: "",
    category: "",
    resolutionDate: "",
    initialLiquidity: "",
    tags: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Implement market creation logic
    console.log("Creating market with data:", formData);
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
                  />
                  <p className="text-xs text-gray-500">Ask a clear, unambiguous question with a definitive outcome.</p>
                </div>

                {/* Category and Resolution Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category *</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat.toLowerCase().replace(/\s+/g, '-')}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

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
                    />
                  </div>
                </div>

                {/* Initial Liquidity and Tags */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="initialLiquidity" className="text-sm font-medium text-gray-700">
                      Initial Liquidity (ALEO)
                    </Label>
                    <Input
                      id="initialLiquidity"
                      type="number"
                      placeholder="100"
                      value={formData.initialLiquidity}
                      onChange={(e) => handleInputChange("initialLiquidity", e.target.value)}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">Minimum liquidity to bootstrap your market.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-sm font-medium text-gray-700">
                      Tags
                    </Label>
                    <Input
                      id="tags"
                      placeholder="bitcoin, crypto, 2024"
                      value={formData.tags}
                      onChange={(e) => handleInputChange("tags", e.target.value)}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">Comma-separated tags to help users find your market.</p>
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
                      {formData.category && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {categories.find(cat => cat.toLowerCase().replace(/\s+/g, '-') === formData.category)}
                          </Badge>
                        </div>
                      )}
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
                        disabled={!formData.question || !formData.category || !formData.resolutionDate}
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Create Market
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 py-3"
                        onClick={() => window.history.back()}
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
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
} 