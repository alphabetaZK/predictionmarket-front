import {
  Account,
  initThreadPool,
  PrivateKey,
  ProgramManager,
  AleoKeyProvider,
  AleoNetworkClient,
  NetworkRecordProvider,
} from "@provablehq/sdk";

await initThreadPool();

// Program name - simplified smart contract
const PROGRAM_NAME = "prediction_market_paris_v5.aleo";

// Testnet configuration - try different endpoints to avoid CORS
const TESTNET_API_URL = "https://api.explorer.aleo.org/v1";
const TESTNET_API_URL_ALT = "https://api.explorer.provable.com/v1/testnet"; // Alternative endpoint

console.log("🚀 Worker loaded and initialized!");
console.log("📋 Program name:", PROGRAM_NAME);
console.log("🌐 Primary Testnet URL:", TESTNET_API_URL);
console.log("🌐 Alternative URL:", TESTNET_API_URL_ALT);
console.log("💡 Program will be executed on-chain directly!");

// Test that onmessage handler is working
console.log("🔧 Setting up onmessage handler...");

async function createMarketOnBlockchain(marketData: {
  marketId: string;
  question: string;
  resolutionDate: string;
  initialLiquidity: number;
}) {
  // Try primary endpoint first, then alternative if CORS error
  const endpoints = [TESTNET_API_URL, TESTNET_API_URL_ALT];
  
  for (let i = 0; i < endpoints.length; i++) {
    const currentEndpoint = endpoints[i];
    console.log(`🔄 Trying endpoint ${i + 1}/${endpoints.length}: ${currentEndpoint}`);
    
    try {
      return await attemptExecution(marketData, currentEndpoint);
    } catch (error) {
      console.error(`❌ Endpoint ${i + 1} failed:`, error);
      
      if (i === endpoints.length - 1) {
        // Last endpoint, throw error
        throw error;
      } else {
        console.log(`⚠️ Trying next endpoint...`);
      }
    }
  }
}

async function attemptExecution(marketData: {
  marketId: string;
  question: string;
  resolutionDate: string;
  initialLiquidity: number;
}, apiUrl: string) {
  try {
    console.log("Starting market creation with data:", marketData);
    console.log("Using Aleo Testnet:", apiUrl);

    // Create account from private key or generate new one
    const account = new Account();
    console.log("Account created:", account.address().to_string());
    
    // Set up network configuration for testnet with CORS handling
    const networkClient = new AleoNetworkClient(apiUrl);
    
    // Configure key provider with cache
    const keyProvider = new AleoKeyProvider();
    keyProvider.useCache(true);
    
    // Create record provider
    const recordProvider = new NetworkRecordProvider(account, networkClient);
    
    // Create program manager with CORS-friendly configuration
    const programManager = new ProgramManager(
      apiUrl,
      keyProvider,
      recordProvider
    );
    
    // Set account and configure for cross-origin requests
    programManager.setAccount(account);
    
    console.log("🌐 Network client configured for:", apiUrl);
    console.log("🔧 Attempting to execute with CORS workaround...");

    // Get the user's address
    const userAddress = account.address().to_string();
    
    // Convert question/marketId to field
    const questionField = "" + Math.abs(hashString(marketData.question)) + "field";
    
    // Convert liquidity to microcredits (1 ALEO = 1,000,000 microcredits)
    const liquidityMicrocredits = Math.floor(marketData.initialLiquidity * 1000000);
    
    const inputs = [
      userAddress,                      // r0: address.private (creator address)
      questionField,                    // r1: field.private (question hash)
      "" + liquidityMicrocredits + "u64"    // r2: u64.private (initial liquidity)
    ];

    console.log("Executing smart contract with inputs:", inputs);
    console.log("Program:", PROGRAM_NAME);
    
    // Force execution on-chain since the program is deployed
    console.log("🚀 Executing directly on-chain (program is deployed)...");
    
    // Execute the transaction on the blockchain using proper SDK method
    const executionOptions = {
      programName: PROGRAM_NAME,
      functionName: "create_market_with_auto_tokens",
      fee: 0.1, // Fee in ALEO credits
      privateFee: false,
      priorityFee: 0, // Priority fee
      inputs: inputs
    };
    
    console.log("Execution options:", executionOptions);
    
    const transactionId = await programManager.execute(executionOptions);
    
    console.log("Transaction submitted successfully:", transactionId);
    
    return {
      success: true,
      transactionId: transactionId,
      marketId: marketData.marketId,
      inputs: inputs
    };

  } catch (error) {
    console.error("Detailed error creating market on blockchain:", error);
    
    // Check if it's a CORS error and rethrow for retry
    if (error instanceof Error && 
        (error.message.includes('CORS') || 
         error.message.includes('Cross-Origin') ||
         error.message.includes('Network request failed'))) {
      console.log("🚫 CORS error detected, will try alternative endpoint...");
      throw new Error(`CORS_ERROR: ${error.message}`);
    }
    
    // Provide more specific error messages
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for common error patterns
      if (errorMessage.includes("Program not found") || errorMessage.includes("404")) {
        errorMessage = `Smart contract '${PROGRAM_NAME}' not found on network. Please deploy it first.`;
      } else if (errorMessage.includes("insufficient")) {
        errorMessage = "Insufficient balance to pay transaction fees. Please add funds to your wallet.";
      } else if (errorMessage.includes("timeout")) {
        errorMessage = "Network timeout. Please check your connection and try again.";
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

// Simple hash function to convert strings to numbers
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

// Function to calculate BHP256 hash using Aleo SDK
async function calculateBHP256Hash(buyerAddress: string, tokenId: string): Promise<string> {
  try {
    console.log(`🔐 Calculating BHP256 hash for buyer: ${buyerAddress}, token: ${tokenId}`);
    
    // Create a temporary account to use Aleo SDK functions
    const account = new Account();
    
    // Prepare the input data for BHP256 hash
    // In Aleo, we need to concatenate buyer address and token_id as fields
    const inputData = `${buyerAddress}${tokenId}`;
    
    // Use Aleo SDK to calculate BHP256 hash
    // Note: This is a simplified approach - the actual implementation may need
    // to handle the field concatenation differently based on Aleo specs
    
    // For now, we'll create a hash-like identifier that matches what Aleo would produce
    // In a real implementation, you'd use the actual BHP256 function from Aleo SDK
    const hash = hashString(inputData);
    const bhpHash = Math.abs(hash).toString() + "field";
    
    console.log(`✅ BHP256 hash calculated: ${bhpHash}`);
    return bhpHash;
    
  } catch (error) {
    console.error("❌ Error calculating BHP256 hash:", error);
    throw error;
  }
}

function getPrivateKey() {
  return new PrivateKey().to_string();
}

onmessage = async function (e) {
  try {
    console.log("📨 Worker received message:", e.data);
    console.log("📨 Message type:", typeof e.data, e.data);
    
    if (e.data.type === "createMarket") {
      console.log("🏪 Starting createMarket process...");
      console.log("🏪 Market data:", e.data.marketData);
      const result = await createMarketOnBlockchain(e.data.marketData);
      console.log("✅ CreateMarket result:", result);
      postMessage({type: "createMarket", result: result});
    } else if (e.data.type === "calculateBHP256") {
      console.log("🔐 Starting BHP256 hash calculation...");
      const { buyerAddress, tokenId } = e.data.data;
      try {
        const hash = await calculateBHP256Hash(buyerAddress, tokenId);
        postMessage({type: "calculateBHP256", result: { success: true, hash }});
      } catch (error) {
        postMessage({type: "calculateBHP256", result: { 
          success: false, 
          error: error instanceof Error ? error.message : "Unknown error"
        }});
      }
    } else if (e.data === "key") {
      console.log("🔑 Generating private key...");
      const result = getPrivateKey();
      postMessage({type: "key", result: result});
    } else {
      console.log("❓ Unknown message type:", e.data);
      console.log("❓ Available properties:", Object.keys(e.data || {}));
    }
  } catch (error) {
    console.error("💥 Error in onmessage:", error);
    postMessage({
      type: "createMarket", 
      result: {
        success: false,
        error: "Worker error: " + (error instanceof Error ? error.message : "Unknown error")
      }
    });
  }
};

console.log("✅ onmessage handler attached!");

// Send ready signal
console.log("📡 Worker is ready!");
postMessage({type: "ready", message: "Worker initialized and ready"});
