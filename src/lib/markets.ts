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
}

/**
 * Creates a new prediction market
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

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // TODO: Replace with actual blockchain transaction
    // Here you would integrate with Aleo's smart contract to create the market
    console.log("Creating market on blockchain:", market);
    
    // For now, we'll just store in localStorage as a demo
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
  if (data.initialLiquidity && (isNaN(liquidity) || liquidity < 0)) {
    errors.push("Initial liquidity must be a positive number");
  }

  return {
    valid: errors.length === 0,
    errors
  };
} 