'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, forwardRef, useImperativeHandle } from 'react';
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { Transaction, WalletAdapterNetwork, WalletNotConnectedError } from "@demox-labs/aleo-wallet-adapter-base";

export const Conversation = forwardRef((props, ref) => {
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: (message) => console.log('Message:', message),
    onError: (error) => console.error('Error:', error),
  });

  const { publicKey, connected, requestTransaction, transactionStatus, requestRecords } = useWallet();

  const startConversation = useCallback(async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start the conversation with your agent
      await conversation.startSession({
        agentId: 'agent_01jwmr6t32ewptvzjab5eckcnk', // Replace with your agent ID
        clientTools: {
            logMessage: async ({message}) => {
              console.log(message);
            },
            createMarket: async ({question, resolutionDate}) => {
                try {
                  if (!connected || !publicKey) {
                    throw new Error("Wallet not connected");
                  }
                  if (!requestRecords) {
                    throw new Error("requestRecords function not available");
                  }
                  const records = await requestRecords("credits.aleo");
                  if (!records || records.length === 0) {
                    console.warn("No credit records found, but attempting transaction anyway.");
                  }
                  // Encoder
                  const ALPHABET = " abcdefghijklmnopqrstuvwxyzàâäéèêëîïôöùûüÿçñ-?";
                  const BASE = ALPHABET.length;
                  function encode(text: string) {
                    const cleaned = text.toLowerCase().replace(/[^a-zàâäéèêëîïôöùûüÿçñ \-\?]/g, '').slice(0, 35);
                    let number = 0n;
                    for (const char of cleaned) {
                      const index = BigInt(ALPHABET.indexOf(char));
                      if (index === -1n) throw new Error(`Invalid character: ${char}`);
                      number = number * BigInt(BASE) + index;
                    }
                    return number.toString();
                  }
                  // Prépare les inputs
                  const PREDICTION_MARKET_PROGRAM = "prediction_market_paris_v5.aleo";
                  const liquidity = 0.01; // 0.01 ALEO
                  const initialYesPrice = Math.floor(liquidity * 1_000_000);
                  const minLiquidity = 10_000_000; // 10 ALEO
                  const closingBlock = 30; // 30 days in blocks
                  const creationFee = 10_000_000; // 3 ALEO
                  const encoded = encode(question);
                  const questionHash = `${encoded}field`;
                  const questionTitleHash = `${encoded}field`;
                  const questionField = `${encoded}field`;
                  const inputs = [
                    questionField,
                    questionTitleHash,
                    questionHash,
                    `${initialYesPrice}u64`,
                    `${minLiquidity}u64`,
                    `${closingBlock}u32`,
                    `${creationFee}u64`
                  ];
                  const aleoTransaction = Transaction.createTransaction(
                    publicKey,
                    WalletAdapterNetwork.TestnetBeta,
                    PREDICTION_MARKET_PROGRAM,
                    'create_market_with_auto_tokens',
                    inputs,
                    creationFee,
                    false
                  );
                  if (!requestTransaction) {
                    throw new Error("Request transaction function not available");
                  }
                  const transactionId = await requestTransaction(aleoTransaction);
                  console.log("Market creation submitted! Transaction ID:", transactionId);
                  if (transactionStatus) {
                    try {
                      const status = await transactionStatus(transactionId);
                      console.log("Transaction status:", status);
                    } catch (error) {
                      console.log("Could not fetch transaction status:", error);
                    }
                  }
                } catch (error) {
                  console.error("Error creating market:", error);
                }
            }
          },
      });

    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }, [conversation, publicKey, connected, requestTransaction, transactionStatus, requestRecords]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  useImperativeHandle(ref, () => ({
    startConversation,
    stopConversation,
  }));

  return (
    <div className="flex flex-col items-center gap-4">
    </div>
  );
});
