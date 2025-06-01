"use client";

import { WalletMultiButton } from "@demox-labs/aleo-wallet-adapter-reactui";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="text-black border-b">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Link href="/">
              Aleo Prediction Market
            </Link>
          </div>
          <div className="hidden md:flex gap-6 text-sm font-medium">
            <Link href="/my-bets" className="hover:text-blue-400">My Bets</Link>
            <Link href="/create-market" className="hover:text-blue-400">Create Market</Link>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-gray-900 rounded-lg">
          <WalletMultiButton className="bg-gray-900 text-white" />
        </div>
      </div>
    </nav>
  );
} 