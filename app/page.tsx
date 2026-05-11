'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const [selectedTimer, setSelectedTimer] = useState<number | null>(null);

  const difficultyOptions = [
    { value: 'easy', label: 'Easy', desc: '2 modules (Wires + Button)' },
    { value: 'medium', label: 'Medium', desc: '4 modules (+ Simon Says + Passwords)' },
    { value: 'hard', label: 'Hard', desc: '4 modules + harder rules' },
  ];

  const timerOptions = [
    { minutes: 3, label: '3 min', desc: 'Quick game' },
    { minutes: 5, label: '5 min', desc: 'Standard' },
    { minutes: 8, label: '8 min', desc: 'Relaxed' },
  ];

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 tracking-wider mb-2">
            KEEP TALKING
          </h1>
          <h2 className="text-2xl text-zinc-400">
            & Nobody Explodes
          </h2>
          <p className="text-zinc-500 mt-4 text-sm">
            You are the Defuser. Experts have the manual.
          </p>
        </div>

        <div className="bg-zinc-800 rounded-lg p-6 space-y-6">
          <h3 className="text-zinc-300 font-medium text-center mb-4">
            Select Difficulty
          </h3>
          <div className="grid gap-3">
            {difficultyOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedDifficulty(opt.value as 'easy' | 'medium' | 'hard')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedDifficulty === opt.value
                    ? 'border-red-500 bg-red-500/20 text-red-400'
                    : 'border-zinc-600 bg-zinc-700 text-zinc-300 hover:border-zinc-500'
                }`}
              >
                <div className="font-bold">{opt.label}</div>
                <div className="text-xs text-zinc-500">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-zinc-800 rounded-lg p-6 space-y-6">
          <h3 className="text-zinc-300 font-medium text-center mb-4">
            Select Timer
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {timerOptions.map((opt) => (
              <button
                key={opt.minutes}
                onClick={() => setSelectedTimer(opt.minutes)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedTimer === opt.minutes
                    ? 'border-red-500 bg-red-500/20 text-red-400'
                    : 'border-zinc-600 bg-zinc-700 text-zinc-300 hover:border-zinc-500'
                }`}
              >
                <div className="text-2xl font-bold">{opt.label}</div>
                <div className="text-xs text-zinc-500">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {selectedDifficulty && selectedTimer && (
          <Link
            href={`/bomb?difficulty=${selectedDifficulty}&timer=${selectedTimer}`}
            className="block w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold text-center rounded-lg transition-colors"
          >
            START DEFUSING
          </Link>
        )}

        <div className="text-center">
          <Link
            href="/manual"
            className="text-zinc-500 hover:text-zinc-400 text-sm underline"
          >
            Expert Manual →
          </Link>
        </div>

        <div className="bg-zinc-800/50 rounded-lg p-4 text-center">
          <p className="text-zinc-500 text-sm">
            How it works: You see the bomb. Experts read the manual. Talk to solve modules before time runs out!
          </p>
        </div>
      </div>
    </div>
  );
}