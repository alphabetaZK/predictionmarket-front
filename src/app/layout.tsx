'use client';

import './globals.css'
import { Inter } from 'next/font/google'
import { WalletProvider } from "@demox-labs/aleo-wallet-adapter-react";
import { WalletModalProvider } from "@demox-labs/aleo-wallet-adapter-reactui";
import { LeoWalletAdapter, PuzzleWalletAdapter, FoxWalletAdapter, SoterWalletAdapter } from 'aleo-adapters';
import { DecryptPermission, WalletAdapterNetwork } from "@demox-labs/aleo-wallet-adapter-base";
import { useMemo } from "react";
import "@demox-labs/aleo-wallet-adapter-reactui/dist/styles.css";

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const wallets = useMemo(
    () => [
      new LeoWalletAdapter({
        appName: 'Prediction Market',
      }),
      new PuzzleWalletAdapter({
        programIdPermissions: {
          [WalletAdapterNetwork.TestnetBeta]: ['hello_hello.aleo']
        },
        appName: 'Prediction Market',
        appDescription: 'Plateforme de prédictions décentralisée',
        appIconUrl: ''
      }),
      new FoxWalletAdapter({
        appName: 'Prediction Market',
      }),
      new SoterWalletAdapter({
        appName: 'Prediction Market',
      })
    ],
    []
  );

  return (
    <html lang="en">
      <WalletProvider
        wallets={wallets}
        network={WalletAdapterNetwork.TestnetBeta}
        decryptPermission={DecryptPermission.UponRequest}
        autoConnect
      >
        <WalletModalProvider>
          <body className={``}>

                {children}
          </body>
        </WalletModalProvider>
      </WalletProvider>
    </html>
  )
}
