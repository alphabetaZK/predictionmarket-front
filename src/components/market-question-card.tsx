import React from "react";

interface MarketQuestionCardProps {
  question: string;
  yesPercent: number;
  noPercent: number;
}

const ALPHABET = " abcdefghijklmnopqrstuvwxyzàâäéèêëîïôöùûüÿçñ-?0123456789$";
const BASE = ALPHABET.length;

export function decodeQuestion(question: string): string {
  try {
    let questionToDecode = question;
    if (question.endsWith('field')) {
      questionToDecode = question.slice(0, -5);
    }
    if (/^(\d+)$/.test(questionToDecode)) {
      let n = BigInt(questionToDecode);
      if (n === 0n) return ALPHABET[0];
      let chars = [];
      while (n > 0n) {
        const rem = n % BigInt(BASE);
        chars.push(ALPHABET[Number(rem)]);
        n = n / BigInt(BASE);
      }
      return chars.reverse().join('');
    }
    return question;
  } catch (e) {
    console.warn('Error decoding question:', e);
    return question;
  }
}

export const MarketQuestionCard: React.FC<MarketQuestionCardProps> = ({ question, yesPercent, noPercent }) => {
  const displayQuestion = decodeQuestion(question);
  
  return (
    <div className="z-20 my-0 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 text-white overflow-hidden w-fit rounded-lg">
      <div className="w-fit ml-0 p-6">
        <div className="flex items-center justify-between w-fit gap-8">
          <div className="text-lg font-semibold text-white w-full whitespace-nowrap">{displayQuestion}</div>
          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full px-2 py-1 text-xs">
            Active
          </span>
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20 w-full">
            <div className="flex items-center justify-between mb-1">
              <span className="text-green-400 font-medium text-sm">YES Tokens</span>
            </div>
            <div className="text-white font-bold text-lg">{yesPercent}%</div>
            <div className="text-green-400 text-xs">YES</div>
          </div>
          <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20 w-full">
            <div className="flex items-center justify-between mb-1">
              <span className="text-red-400 font-medium text-sm">NO Tokens</span>
            </div>
            <div className="text-white font-bold text-lg">{noPercent}%</div>
            <div className="text-red-400 text-xs">NO</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 