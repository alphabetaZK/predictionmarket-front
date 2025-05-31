export interface CreateMarketData {
  question: string;
  resolutionDate: string;
  initialLiquidity: string;
}

export interface Market {
  id: string;
  question: string;
  resolutionDate: string;
  initialLiquidity: number;
  volume: string;
  yesPrice: string;
  noPrice: string;
  createdAt: string;
  creator: string;
  status: 'active' | 'resolved' | 'cancelled';
  blockchainReceipt?: any; // Store the blockchain receipt
}

/**
 * Creates a new prediction market using the Aleo smart contract
 * @param marketData - The market data from the form
 * @param walletAddress - The connected wallet address
 * @returns Promise with the created market data
 */
export async function createMarket(
  marketData: CreateMarketData,
  walletAddress: string
): Promise<{ success: boolean; market?: Market; error?: string }> {
  try {
    // Validation
    if (!marketData.question.trim()) {
      throw new Error("Market question is required");
    }
    
    if (!marketData.resolutionDate) {
      throw new Error("Resolution date is required");
    }

    // Check if resolution date is in the future
    const resolutionDate = new Date(marketData.resolutionDate);
    const now = new Date();
    if (resolutionDate <= now) {
      throw new Error("Resolution date must be in the future");
    }

    // Parse initial liquidity
    const liquidity = parseFloat(marketData.initialLiquidity) || 0;
    if (liquidity < 0) {
      throw new Error("Initial liquidity must be positive");
    }

    // Simple validation for the simplified smart contract
    if (liquidity > 0 && liquidity < 0.001) {
      throw new Error("Initial liquidity must be at least 0.001 ALEO");
    }

    // Generate unique market ID
    const marketId = generateMarketId();

    // Create market object
    const market: Market = {
      id: marketId,
      question: marketData.question.trim(),
      resolutionDate: marketData.resolutionDate,
      initialLiquidity: liquidity,
      volume: "$0",
      yesPrice: "50%",
      noPrice: "50%",
      createdAt: new Date().toISOString(),
      creator: walletAddress,
      status: 'active'
    };

    console.log("Creating market on blockchain:", market);

    // Call smart contract via worker
    const blockchainResult = await callSmartContract({
      marketId: marketId,
      question: marketData.question,
      resolutionDate: marketData.resolutionDate,
      initialLiquidity: liquidity
    });

    if (!blockchainResult.success) {
      throw new Error(blockchainResult.error || "Failed to create market on blockchain");
    }

    // Store the blockchain transaction ID and inputs
    market.blockchainReceipt = {
      transactionId: blockchainResult.transactionId,
      inputs: blockchainResult.inputs,
      timestamp: new Date().toISOString()
    };
    
    // Store locally as well for demo purposes
    storeMarketLocally(market);

    return {
      success: true,
      market
    };

  } catch (error) {
    console.error("Error creating market:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create market"
    };
  }
}

/**
 * Calls the smart contract via the worker
 */
async function callSmartContract(marketData: {
  marketId: string;
  question: string;
  resolutionDate: string;
  initialLiquidity: number;
}): Promise<{ success: boolean; transactionId?: string; inputs?: any; error?: string }> {
  console.log("🔧 callSmartContract called with:", marketData);
  
  return new Promise((resolve) => {
    console.log("🏗️ Creating worker...");
    const worker = new Worker(new URL("../app/worker.ts", import.meta.url));
    
    let workerReady = false;
    
    console.log("⏰ Setting timeout...");
    const timeout = setTimeout(() => {
      console.log("⏱️ Worker timeout reached!");
      worker.terminate();
      resolve({
        success: false,
        error: "Smart contract call timed out after 3 minutes. The contract may not be deployed or network issues."
      });
    }, 180000); // 3 minutes timeout

    worker.onmessage = (event) => {
      console.log("📩 Received message from worker:", event.data);
      
      if (event.data.type === "ready") {
        console.log("✅ Worker is ready, sending createMarket message...");
        workerReady = true;
        
        // Now send the actual message
        console.log("📤 Sending createMarket message to worker...");
        worker.postMessage({
          type: "createMarket",
          marketData: marketData
        });
        console.log("📫 CreateMarket message sent to worker!");
        
      } else if (event.data.type === "createMarket") {
        console.log("✅ Resolving with createMarket result");
        clearTimeout(timeout);
        worker.terminate();
        resolve(event.data.result);
      } else {
        console.log("❌ Unexpected response type:", event.data.type);
        clearTimeout(timeout);
        worker.terminate();
        resolve({
          success: false,
          error: "Unexpected response from worker"
        });
      }
    };

    worker.onerror = (error) => {
      console.error("💥 Worker error:", error);
      clearTimeout(timeout);
      worker.terminate();
      resolve({
        success: false,
        error: "Worker error: " + (error.message || "Unknown worker error")
      });
    };

    console.log("⏳ Waiting for worker to be ready...");
  });
}

/**
 * Generates a unique market ID
 */
function generateMarketId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `market_${timestamp}_${randomStr}`;
}

/**
 * Temporarily stores market in localStorage for demo purposes
 * In production, this would be handled by blockchain transactions
 */
function storeMarketLocally(market: Market): void {
  try {
    const existingMarkets = getStoredMarkets();
    existingMarkets.push(market);
    localStorage.setItem('prediction_markets', JSON.stringify(existingMarkets));
  } catch (error) {
    console.warn("Could not store market locally:", error);
  }
}

/**
 * Retrieves stored markets from localStorage
 */
export function getStoredMarkets(): Market[] {
  try {
    const stored = localStorage.getItem('prediction_markets');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn("Could not retrieve stored markets:", error);
    return [];
  }
}

/**
 * Validates market data before submission
 */
export function validateMarketData(data: CreateMarketData): { valid: boolean; errors: string[] } {
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
} 