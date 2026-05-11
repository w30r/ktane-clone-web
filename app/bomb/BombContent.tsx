'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  createBomb,
  Bomb,
  isSerialOdd,
  hasIndicator,
  getCorrectWireToCut,
  shouldHoldButton,
  getButtonReleaseDigit,
  countWiresByColor,
  WireColor,
} from '@/lib/game';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const WIRE_COLORS: Record<WireColor, string> = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  yellow: 'bg-yellow-400',
  white: 'bg-zinc-200',
  black: 'bg-zinc-800',
};

export default function BombContent() {
  const searchParams = useSearchParams();
  const timerParam = searchParams.get('timer');
  const timerMinutes = timerParam ? parseInt(timerParam, 10) : 5;

  const [bomb, setBomb] = useState<Bomb>(() => createBomb(timerMinutes));
  const [heldTime, setHeldTime] = useState<number | null>(null);
  const [buttonStrip, setButtonStrip] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerSpeedRef = useRef(1000);

  useEffect(() => {
    if (bomb.gameOver) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setBomb((b) => {
        if (b.gameOver) return b;

        const newTimer = b.timerSeconds - 1;
        if (newTimer <= 0) {
          return { ...b, timerSeconds: 0, gameOver: true, won: false };
        }
        return { ...b, timerSeconds: newTimer };
      });
    }, timerSpeedRef.current);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [bomb.gameOver]);

  useEffect(() => {
    if (bomb.strikes > 0 && !bomb.gameOver) {
      timerSpeedRef.current = 700;
      const interval = setInterval(() => {
        setBomb((b) => ({ ...b, timerSeconds: Math.max(0, b.timerSeconds - 1) }));
      }, 700);
      return () => clearInterval(interval);
    } else {
      timerSpeedRef.current = 1000;
    }
  }, [bomb.strikes, bomb.gameOver]);

  const cutWire = useCallback((wireIndex: number) => {
    setBomb((b) => {
      if (b.wires.solved || b.gameOver) return b;

      const correctWire = getCorrectWireToCut(b);
      if (wireIndex === correctWire) {
        return {
          ...b,
          wires: { ...b.wires, solved: true, cutWire: wireIndex },
        };
      } else {
        const newStrikes = b.strikes + 1;
        if (newStrikes >= b.maxStrikes) {
          return { ...b, strikes: newStrikes, gameOver: true, won: false };
        }
        return { ...b, strikes: newStrikes };
      }
    });
  }, []);

  const pressButton = useCallback(() => {
    setBomb((b) => {
      if (b.button.solved || b.gameOver) return b;

      const hold = shouldHoldButton(b);
      if (!hold) {
        return { ...b, button: { ...b.button, solved: true } };
      } else {
        const strips = ['blue', 'white', 'yellow', 'red'];
        const strip = strips[Math.floor(Math.random() * strips.length)];
        setButtonStrip(strip);
        return { ...b, button: { ...b.button, held: true } };
      }
    });
  }, []);

  const releaseButton = useCallback(() => {
    setBomb((b) => {
      if (!b.button.held || b.button.solved || b.gameOver) return b;
      if (!buttonStrip) return b;

      const releaseDigit = getButtonReleaseDigit(b, buttonStrip);
      const currentTimeStr = formatTime(b.timerSeconds);
      const hasDigit = currentTimeStr.includes(releaseDigit.toString());

      if (hasDigit) {
        return { ...b, button: { ...b.button, solved: true, held: false, released: true } };
      } else {
        const newStrikes = b.strikes + 1;
        setButtonStrip(null);
        if (newStrikes >= b.maxStrikes) {
          return { ...b, strikes: newStrikes, gameOver: true, won: false, button: { ...b.button, held: false } };
        }
        return { ...b, strikes: newStrikes, button: { ...b.button, held: false } };
      }
    });
  }, [buttonStrip]);

  const bothSolved = bomb.wires.solved && bomb.button.solved;

  useEffect(() => {
    if (bothSolved && !bomb.gameOver) {
      setBomb((b) => ({ ...b, gameOver: true, won: true }));
    }
  }, [bothSolved, bomb.gameOver]);

  return (
    <div className="min-h-screen bg-zinc-900 p-4">
      {bomb.gameOver && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="text-center">
            <h1 className={`text-6xl font-bold mb-4 ${bomb.won ? 'text-green-500' : 'text-red-500'}`}>
              {bomb.won ? 'BOMB DEFUSED' : 'EXPLODED'}
            </h1>
            <p className="text-zinc-400 mb-8">
              {bomb.won
                ? `Defused with ${formatTime(bomb.timerSeconds)} remaining!`
                : 'The bomb exploded!'}
            </p>
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg"
            >
              Play Again
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-zinc-500 hover:text-zinc-400">
            ← Exit
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-zinc-500 text-sm">
              Strikes: <span className="text-red-400 font-bold">{bomb.strikes}/3</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              <div className="bg-zinc-900 px-4 py-2 rounded">
                <div className="text-xs text-zinc-500 mb-1">Serial Number</div>
                <div className="text-xl font-mono text-zinc-200">{bomb.serialNumber}</div>
              </div>
              <div className="bg-zinc-900 px-4 py-2 rounded">
                <div className="text-xs text-zinc-500 mb-1">Batteries</div>
                <div className="text-xl font-mono text-zinc-200">{bomb.batteries}</div>
              </div>
              {bomb.indicators.length > 0 && (
                <div className="bg-zinc-900 px-4 py-2 rounded">
                  <div className="text-xs text-zinc-500 mb-1">Indicators</div>
                  <div className="text-xl font-mono text-yellow-400">
                    {bomb.indicators.join(' ')}
                  </div>
                </div>
              )}
            </div>

            <div className={`text-5xl font-mono font-bold ${bomb.strikes > 0 ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
              {formatTime(bomb.timerSeconds)}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className={`bg-zinc-800 rounded-xl p-6 relative ${bomb.wires.solved ? 'opacity-60' : ''}`}>
            <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-zinc-600" />
            <div className={`absolute top-3 right-3 w-4 h-4 rounded-full ${bomb.wires.solved ? 'bg-green-500' : 'bg-zinc-600'}`} />
            <h2 className="text-lg font-semibold text-zinc-200 mb-4">Wires</h2>
            <div className="space-y-3">
              {bomb.wires.wires.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => cutWire(idx)}
                  disabled={bomb.wires.solved || bomb.wires.cutWire !== null}
                  className={`w-full h-12 rounded-lg flex items-center px-4 ${WIRE_COLORS[color]} ${
                    bomb.wires.cutWire === idx ? 'ring-4 ring-red-500' : ''
                  }`}
                >
                  <span className="text-black/70 font-medium">{idx + 1}</span>
                  {bomb.wires.cutWire === idx && (
                    <span className="ml-auto text-black font-bold">✂ CUT</span>
                  )}
                </button>
              ))}
            </div>
            {bomb.wires.solved && (
              <div className="mt-4 text-green-500 font-bold text-center">MODULE DISARMED</div>
            )}
          </div>

          <div className={`bg-zinc-800 rounded-xl p-6 relative ${bomb.button.solved ? 'opacity-60' : ''}`}>
            <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-zinc-600" />
            <div className={`absolute top-3 right-3 w-4 h-4 rounded-full ${bomb.button.solved ? 'bg-green-500' : 'bg-zinc-600'}`} />
            <h2 className="text-lg font-semibold text-zinc-200 mb-4">The Button</h2>
            <div className="flex flex-col items-center">
              <button
                onMouseDown={pressButton}
                onMouseUp={releaseButton}
                onMouseLeave={() => bomb.button.held && releaseButton()}
                disabled={bomb.button.solved || bomb.gameOver}
                className={`w-32 h-32 rounded-full font-bold text-xl transition-all ${
                  bomb.button.color === 'red' ? 'bg-red-600 hover:bg-red-500' :
                  bomb.button.color === 'blue' ? 'bg-blue-600 hover:bg-blue-500' :
                  bomb.button.color === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-400' :
                  'bg-zinc-300 hover:bg-zinc-200'
                } text-black disabled:opacity-50`}
              >
                {bomb.button.label}
              </button>

              {buttonStrip && (
                <div className={`mt-4 px-6 py-2 rounded ${buttonStrip === 'blue' ? 'bg-blue-500' : buttonStrip === 'white' ? 'bg-zinc-200' : buttonStrip === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                  <span className="text-black font-bold">HOLDING</span>
                </div>
              )}
            </div>
            {bomb.button.solved && (
              <div className="mt-4 text-green-500 font-bold text-center">MODULE DISARMED</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}