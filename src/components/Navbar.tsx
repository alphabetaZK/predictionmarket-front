"use client";

import { WalletMultiButton } from "@demox-labs/aleo-wallet-adapter-reactui";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Link from "next/link";
export default function Navbar() {
  return (
    <nav className="bg-slate-950 text-white border-b">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Link href="/">
              Aleo Prediction Market
            </Link>
          </div>
          <div className="hidden md:flex gap-6 text-sm font-medium">
            <a href="#" className="hover:text-blue-400">Leaderboard</a>
            <a href="#" className="hover:text-blue-400">FAQ</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Search" className="pl-8 w-[200px] bg-[#1a2233] text-white border-none" />
          </div>
          <WalletMultiButton />
        </div>
      </div>
    </nav>
  );
} 