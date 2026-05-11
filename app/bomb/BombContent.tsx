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
  checkKeypadOrder,
  KeypadSymbol,
  getWhosOnFirstSolution,
  getMemorySolution,
  getMorseCodeSequence,
  getComplicatedWireSolution,
  getWireSequenceSolution,
} from '@/lib/game';

const SYMBOL_IMAGES: Record<KeypadSymbol, string> = {
  balloon: '🎈',
  copyright: '©',
  doublek: 'KK',
  euro: '€',
  filledstar: '★',
  hollowstar: '☆',
  hookn: 'ʎ',
  meltedthree: '3',
  omega: 'Ω',
  paragraph: '¶',
  pitchfork: '⚡',
  press: 'PRESS',
  six: '6',
  smileyface: '😊',
  squidknife: '刀',
  squigglyn: '~',
  tracks: '⌘',
  trident: '三',
  upsidedowny: 'Y',
  wrench: '🔧',
  whirl: '≋',
  at: '@',
  ae: 'Æ',
  cursive: '¢',
  rightc: 'C',
  leftc: 'Ɔ',
  questionmark: '?',
  dragon: 'DRG',
  nwithhat: 'N',
  bt: 'BT',
  pumpkin: '🎃',
};

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
  black: 'bg-neutral-950 border border-zinc-600',
};

export default function BombContent() {
  const searchParams = useSearchParams();
  const timerParam = searchParams.get('timer');
  const difficultyParam = searchParams.get('difficulty') as 'easy' | 'medium' | 'hard' | 'devtest' || 'easy';
  const timerMinutes = difficultyParam === 'devtest' ? 15 : (timerParam ? parseInt(timerParam, 10) : 5);
  const difficulty = difficultyParam;

  const [bomb, setBomb] = useState<Bomb>(() => createBomb(timerMinutes, difficulty));
  const [heldTime, setHeldTime] = useState<number | null>(null);
  const [buttonStrip, setButtonStrip] = useState<string | null>(null);
  const [keypadError, setKeypadError] = useState(false);
  const [strikeFlash, setStrikeFlash] = useState(false);
  const prevStrikesRef = useRef(bomb.strikes);
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

  useEffect(() => {
    if (bomb.strikes > prevStrikesRef.current && !bomb.gameOver) {
      setStrikeFlash(true);
      setTimeout(() => setStrikeFlash(false), 500);
    }
    prevStrikesRef.current = bomb.strikes;
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

  const pressKeypadKey = useCallback((symbol: KeypadSymbol) => {
    if (!bomb.keypad || bomb.keypad.solved || bomb.gameOver) return;
    
    const correct = checkKeypadOrder(bomb.keypad!, symbol);
    if (correct) {
      const newPressed = bomb.keypad.pressed + 1;
      if (newPressed === 3) {
        setBomb((b) => ({
          ...b,
          keypad: { ...b.keypad!, solved: true, pressed: newPressed },
        }));
      } else {
        setBomb((b) => ({
          ...b,
          keypad: { ...b.keypad!, pressed: newPressed },
        }));
      }
      setKeypadError(false);
    } else {
      const newStrikes = bomb.strikes + 1;
      setKeypadError(true);
      setTimeout(() => setKeypadError(false), 500);
      if (newStrikes >= bomb.maxStrikes) {
        setBomb((b) => ({ ...b, strikes: newStrikes, gameOver: true, won: false }));
      } else {
        setBomb((b) => ({ ...b, strikes: newStrikes }));
      }
    }
  }, [bomb]);

  const pressWhosOnFirst = useCallback((label: string) => {
    if (!bomb.whosOnFirst || bomb.whosOnFirst.solved || bomb.gameOver) return;
    
    const correctLabel = getWhosOnFirstSolution(bomb.whosOnFirst);
    if (label === correctLabel) {
      setBomb((b) => ({
        ...b,
        whosOnFirst: { ...b.whosOnFirst!, solved: true },
      }));
    } else {
      const newStrikes = bomb.strikes + 1;
      if (newStrikes >= bomb.maxStrikes) {
        setBomb((b) => ({ ...b, strikes: newStrikes, gameOver: true, won: false }));
      } else {
        setBomb((b) => ({ ...b, strikes: newStrikes }));
      }
    }
  }, [bomb]);

  const pressMemoryButton = useCallback((position: number, label: string) => {
    if (!bomb.memory || bomb.memory.solved || bomb.gameOver) return;
    
    const solution = getMemorySolution(bomb.memory);
    if (!solution) return;
    
    const { position: solPosition, label: solLabel } = solution;
    let correct = false;
    
    if (solPosition >= 0 && position === solPosition) correct = true;
    if (solLabel && label === solLabel) correct = true;
    
    if (correct) {
      const newStage = bomb.memory.stage + 1;
      const currentPressedLabels = bomb.memory.pressedLabels;
      const currentPressedPositions = bomb.memory.pressedPositions;
      if (newStage >= 5) {
        setBomb((b) => ({
          ...b,
          memory: { ...b.memory!, solved: true, stage: newStage },
        }));
      } else {
        const newLabels = [...bomb.memory.buttons];
        newLabels.sort(() => Math.random() - 0.5);
        setBomb((b) => ({
          ...b,
          memory: b.memory ? { 
            ...b.memory, 
            stage: newStage, 
            display: Math.floor(Math.random() * 4) + 1,
            buttons: newLabels,
            pressedLabels: [...currentPressedLabels, label],
            pressedPositions: [...currentPressedPositions, position],
          } : b.memory,
        }));
      }
    } else {
      const newStrikes = bomb.strikes + 1;
      if (newStrikes >= bomb.maxStrikes) {
        setBomb((b) => ({ ...b, strikes: newStrikes, gameOver: true, won: false }));
      } else {
        setBomb((b) => ({ 
          ...b, 
          strikes: newStrikes,
          memory: { ...b.memory!, stage: 0, pressedLabels: [], pressedPositions: [] },
        }));
      }
    }
  }, [bomb]);

  const pressMorseFrequency = useCallback((freq: number) => {
    if (!bomb.morseCode || bomb.morseCode.solved || bomb.gameOver) return;
    
    if (freq === bomb.morseCode.frequency) {
      setBomb((b) => ({
        ...b,
        morseCode: { ...b.morseCode!, solved: true },
      }));
    } else {
      const newStrikes = bomb.strikes + 1;
      if (newStrikes >= bomb.maxStrikes) {
        setBomb((b) => ({ ...b, strikes: newStrikes, gameOver: true, won: false }));
      } else {
        setBomb((b) => ({ ...b, strikes: newStrikes }));
      }
    }
  }, [bomb]);

  const cutComplicatedWire = useCallback((index: number) => {
    if (!bomb.complicatedWires || bomb.complicatedWires.solved || bomb.gameOver) return;
    
    const correctIndex = getComplicatedWireSolution(bomb.complicatedWires.wires, bomb.serialNumber);
    
    if (index === correctIndex) {
      setBomb((b) => ({
        ...b,
        complicatedWires: { ...b.complicatedWires!, solved: true },
      }));
    } else {
      const newStrikes = bomb.strikes + 1;
      if (newStrikes >= bomb.maxStrikes) {
        setBomb((b) => ({ ...b, strikes: newStrikes, gameOver: true, won: false }));
      } else {
        setBomb((b) => ({
          ...b,
          complicatedWires: {
            ...b.complicatedWires!,
            wires: b.complicatedWires!.wires.map((w, i) => i === index ? { ...w, cut: true } : w),
          },
          strikes: newStrikes,
        }));
      }
    }
  }, [bomb]);

  const cutWireSequence = useCallback((panelIndex: number, wireIndex: number) => {
    if (!bomb.wireSequences || bomb.wireSequences.solved || bomb.gameOver) return;
    if (panelIndex !== bomb.wireSequences.currentPanel) return;
    
    const panel = bomb.wireSequences.panels[panelIndex];
    const wire = panel.wires[wireIndex];
    if (wire.cut) return;
    
    const solution = getWireSequenceSolution(panel.letter, wire.color, bomb.wireSequences.cutWires);
    
    if (solution.cut) {
      const newCutWires = [...bomb.wireSequences.cutWires, wire.color];
      const updatedWires = panel.wires.map((w, i) => 
        i === wireIndex ? { ...w, cut: true } : w
      );
      
      const allCut = updatedWires.every(w => w.cut);
      if (allCut && panelIndex < 2) {
        setBomb((b) => ({
          ...b,
          wireSequences: {
            ...b.wireSequences!,
            panels: b.wireSequences!.panels.map((p, i) => 
              i === panelIndex ? { ...p, wires: updatedWires } : p
            ),
            currentPanel: panelIndex + 1,
            currentWire: 0,
            cutWires: newCutWires,
          },
        }));
      } else if (allCut && panelIndex === 2) {
        setBomb((b) => ({
          ...b,
          wireSequences: {
            ...b.wireSequences!,
            panels: b.wireSequences!.panels.map((p, i) => 
              i === panelIndex ? { ...p, wires: updatedWires } : p
            ),
            solved: true,
            cutWires: newCutWires,
          },
        }));
      } else {
        setBomb((b) => ({
          ...b,
          wireSequences: {
            ...b.wireSequences!,
            panels: b.wireSequences!.panels.map((p, i) => 
              i === panelIndex ? { ...p, wires: updatedWires } : p
            ),
            cutWires: newCutWires,
          },
        }));
      }
    } else {
      const newStrikes = bomb.strikes + 1;
      if (newStrikes >= bomb.maxStrikes) {
        setBomb((b) => ({ ...b, strikes: newStrikes, gameOver: true, won: false }));
      } else {
        setBomb((b) => ({ ...b, strikes: newStrikes }));
      }
    }
  }, [bomb]);

  const switchWireSequencePanel = useCallback((direction: 'up' | 'down') => {
    if (!bomb.wireSequences || bomb.wireSequences.solved || bomb.gameOver) return;
    
    setBomb((b) => {
      const current = b.wireSequences!.currentPanel;
      let newPanel: number;
      if (direction === 'down') {
        newPanel = (current + 1) % 3;
      } else {
        newPanel = (current - 1 + 3) % 3;
      }
      return {
        ...b,
        wireSequences: { ...b.wireSequences!, currentPanel: newPanel },
      };
    });
  }, []);

  const bothSolved = bomb.wires.solved && bomb.button.solved && (bomb.keypad?.solved ?? true) && (bomb.whosOnFirst?.solved ?? true) && (bomb.memory?.solved ?? true) && (bomb.morseCode?.solved ?? true) && (bomb.complicatedWires?.solved ?? true) && (bomb.wireSequences?.solved ?? true);

  useEffect(() => {
    if (bothSolved && !bomb.gameOver) {
      setBomb((b) => ({ ...b, gameOver: true, won: true }));
    }
  }, [bothSolved, bomb.gameOver]);

  return (
    <div className="min-h-screen bg-zinc-900 p-4">
      {strikeFlash && (
        <div className="fixed inset-0 z-40 animate-strike-flash pointer-events-none" />
      )}
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

      <div className="max-w-4xl mx-auto pt-4">
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

        <div className="bg-zinc-800 rounded-xl p-4 mb-6 sticky top-0 z-30 backdrop-blur-md bg-zinc-800/95">
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              <div className="bg-zinc-900 px-4 py-2 rounded">
                <div className="text-xs text-zinc-500 mb-1">Serial Number</div>
                <div className="text-xl font-mono text-zinc-200">{bomb.serialNumber}</div>
              </div>
              <div className="bg-zinc-900 px-4 py-2 rounded">
                <div className="text-xs text-zinc-500 mb-1">Batteries</div>
                <div className="flex gap-1">
                  {Array.from({ length: bomb.batteries }).map((_, i) => (
                    <span key={i} className="text-xl">🔋</span>
                  ))}
                  {bomb.batteries === 0 && <span className="text-zinc-600">-</span>}
                </div>
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
          {bomb.keypad && (
            <div className={`bg-zinc-800 rounded-xl p-6 relative ${bomb.keypad.solved ? 'opacity-60' : ''}`}>
              <div className={`absolute top-3 right-3 w-4 h-4 rounded-full ${bomb.keypad.solved ? 'bg-green-500' : 'bg-zinc-600'}`} />
              {difficulty === 'devtest' && <h2 className="text-lg font-semibold text-zinc-200 mb-4">Keypad</h2>}
              <div className="grid grid-cols-4 gap-2">
                {bomb.keypad.symbols.map((symbol, idx) => (
                  <button
                    key={idx}
                    onClick={() => pressKeypadKey(symbol)}
                    disabled={bomb.keypad!.solved || bomb.gameOver}
                    className={`h-14 bg-zinc-700 rounded-lg text-2xl flex items-center justify-center hover:bg-zinc-600 transition-colors ${
                      keypadError ? 'animate-shake' : ''
                    } disabled:opacity-50`}
                  >
                    {SYMBOL_IMAGES[symbol]}
                  </button>
                ))}
              </div>
              <div className="mt-4 text-center text-zinc-500 text-sm">
                Press in order: {bomb.keypad.pressed + 1}/4
              </div>
              {bomb.keypad.solved && (
                <div className="mt-2 text-green-500 font-bold text-center">MODULE DISARMED</div>
              )}
            </div>
          )}

          {bomb.whosOnFirst && (
            <div className={`bg-zinc-800 rounded-xl p-6 relative ${bomb.whosOnFirst.solved ? 'opacity-60' : ''}`}>
              <div className={`absolute top-3 right-3 w-4 h-4 rounded-full ${bomb.whosOnFirst.solved ? 'bg-green-500' : 'bg-zinc-600'}`} />
              {difficulty === 'devtest' && <h2 className="text-lg font-semibold text-zinc-200 mb-4">Who's on First</h2>}
              <div className="bg-zinc-900 rounded-lg p-4 mb-4 text-center">
                <span className="text-2xl font-bold text-yellow-400">{bomb.whosOnFirst.display}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {bomb.whosOnFirst.buttons.map((label, idx) => (
                  <button
                    key={idx}
                    onClick={() => pressWhosOnFirst(label)}
                    disabled={bomb.whosOnFirst!.solved || bomb.gameOver}
                    className="h-12 bg-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-600 transition-colors disabled:opacity-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
              {bomb.whosOnFirst.solved && (
                <div className="mt-4 text-green-500 font-bold text-center">MODULE DISARMED</div>
              )}
            </div>
          )}

          {bomb.memory && (
            <div className={`bg-zinc-800 rounded-xl p-6 relative ${bomb.memory.solved ? 'opacity-60' : ''}`}>
              <div className={`absolute top-3 right-3 w-4 h-4 rounded-full ${bomb.memory.solved ? 'bg-green-500' : 'bg-zinc-600'}`} />
              {difficulty === 'devtest' && <h2 className="text-lg font-semibold text-zinc-200 mb-4">Memory</h2>}
              <div className="bg-zinc-900 rounded-lg p-4 mb-4 text-center">
                <span className="text-4xl font-bold text-yellow-400">{bomb.memory.display}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {bomb.memory.buttons.map((label, idx) => (
                  <button
                    key={idx}
                    onClick={() => pressMemoryButton(idx, label)}
                    disabled={bomb.memory!.solved || bomb.gameOver}
                    className="h-16 bg-zinc-700 rounded-lg text-2xl font-bold hover:bg-zinc-600 transition-colors disabled:opacity-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-4 text-center text-zinc-500 text-sm">
                Stage: {bomb.memory.stage + 1}/5
              </div>
              {bomb.memory.solved && (
                <div className="mt-2 text-green-500 font-bold text-center">MODULE DISARMED</div>
              )}
            </div>
          )}

          {bomb.morseCode && (
            <div className={`bg-zinc-800 rounded-xl p-6 relative ${bomb.morseCode.solved ? 'opacity-60' : ''}`}>
              <div className={`absolute top-3 right-3 w-4 h-4 rounded-full ${bomb.morseCode.solved ? 'bg-green-500' : 'bg-zinc-600'}`} />
              {difficulty === 'devtest' && <h2 className="text-lg font-semibold text-zinc-200 mb-4">Morse Code</h2>}
              <div className="bg-zinc-900 rounded-lg p-4 mb-4 text-center">
                <span className="text-2xl font-bold text-yellow-400">
                  {getMorseCodeSequence(bomb.morseCode.word).join(' ')}
                </span>
              </div>
              <p className="text-zinc-400 text-sm mb-4">Select the correct frequency:</p>
              <div className="grid grid-cols-4 gap-2">
                {[3.505, 3.515, 3.522, 3.532, 3.535, 3.542, 3.545, 3.552, 3.555, 3.565, 3.572, 3.575, 3.582, 3.592, 3.595, 3.600].map((freq) => (
                  <button
                    key={freq}
                    onClick={() => pressMorseFrequency(freq)}
                    disabled={bomb.morseCode!.solved || bomb.gameOver}
                    className="h-12 bg-zinc-700 rounded-lg text-sm font-bold hover:bg-zinc-600 transition-colors disabled:opacity-50"
                  >
                    {freq.toFixed(3)}
                  </button>
                ))}
              </div>
              {bomb.morseCode.solved && (
                <div className="mt-4 text-green-500 font-bold text-center">MODULE DISARMED</div>
              )}
            </div>
          )}

          {bomb.complicatedWires && (
            <div className={`bg-zinc-800 rounded-xl p-6 relative ${bomb.complicatedWires.solved ? 'opacity-60' : ''}`}>
              <div className={`absolute top-3 right-3 w-4 h-4 rounded-full ${bomb.complicatedWires.solved ? 'bg-green-500' : 'bg-zinc-600'}`} />
              {difficulty === 'devtest' && <h2 className="text-lg font-semibold text-zinc-200 mb-4">Complicated Wires</h2>}
              <div className="space-y-3">
                {bomb.complicatedWires.wires.map((wire, idx) => (
                  <button
                    key={idx}
                    onClick={() => cutComplicatedWire(idx)}
                    disabled={bomb.complicatedWires!.solved || bomb.gameOver || wire.cut}
                    className={`w-full h-12 rounded-lg flex items-center px-4 relative ${
                      wire.cut ? 'opacity-50' : ''
                    } ${
                      wire.color === 'red' ? 'bg-red-600' :
                      wire.color === 'blue' ? 'bg-blue-600' :
                      wire.color === 'yellow' ? 'bg-yellow-500' :
                      wire.color === 'white' ? 'bg-white' :
                      'bg-neutral-950 border border-zinc-500'
                    }`}
                  >
                    {wire.hasLED && (
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2 animate-pulse" />
                    )}
                    <span className={`font-medium ${wire.color === 'white' || wire.color === 'yellow' ? 'text-black' : 'text-white'}`}>
                      {idx + 1}
                    </span>
                    {wire.hasStar && (
                      <span className={`ml-auto text-lg ${wire.color === 'white' || wire.color === 'yellow' ? 'text-black' : 'text-white'}`}>★</span>
                    )}
                    {wire.cut && (
                      <span className="ml-auto text-black font-bold">✂</span>
                    )}
                  </button>
                ))}
              </div>
              {bomb.complicatedWires.solved && (
                <div className="mt-4 text-green-500 font-bold text-center">MODULE DISARMED</div>
              )}
            </div>
          )}

          {bomb.wireSequences && (
            <div className={`bg-zinc-800 rounded-xl p-6 relative ${bomb.wireSequences.solved ? 'opacity-60' : ''}`}>
              <div className={`absolute top-3 right-3 w-4 h-4 rounded-full ${bomb.wireSequences.solved ? 'bg-green-500' : 'bg-zinc-600'}`} />
              {difficulty === 'devtest' && <h2 className="text-lg font-semibold text-zinc-200 mb-4">Wire Sequences</h2>}
              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={() => switchWireSequencePanel('up')}
                  disabled={bomb.wireSequences.solved || bomb.gameOver}
                  className="w-10 h-10 bg-zinc-700 rounded-lg text-white font-bold text-xl hover:bg-zinc-600 disabled:opacity-50"
                >
                  ▲
                </button>
                <div className="px-4 py-2 bg-zinc-900 rounded-lg">
                  <span className="text-yellow-400 font-bold text-xl">Panel {bomb.wireSequences.panels[bomb.wireSequences.currentPanel].letter}</span>
                </div>
                <button
                  onClick={() => switchWireSequencePanel('down')}
                  disabled={bomb.wireSequences.solved || bomb.gameOver}
                  className="w-10 h-10 bg-zinc-700 rounded-lg text-white font-bold text-xl hover:bg-zinc-600 disabled:opacity-50"
                >
                  ▼
                </button>
              </div>
              <div className="text-center text-zinc-500 text-sm mb-4">
                Red wires cut: {bomb.wireSequences.cutWires.filter(c => c === 'red').length} | 
                Blue wires cut: {bomb.wireSequences.cutWires.filter(c => c === 'blue').length} | 
                Black wires cut: {bomb.wireSequences.cutWires.filter(c => c === 'black').length}
              </div>
              {(() => {
                const panel = bomb.wireSequences.panels[bomb.wireSequences.currentPanel];
                const leftX = 60;
                const rightX = 340;
                const rowHeight = 44;
                const startY = rowHeight / 2;
                const endY = rowHeight / 2;
                
                const letterToY: Record<string, number> = { 'A': rowHeight * 0.5, 'B': rowHeight * 1.5, 'C': rowHeight * 2.5 };
                
                return (
                  <div className="p-4 rounded-lg bg-zinc-700">
                    <svg width="400" height="150" className="mx-auto">
                      {[0, 1, 2].map((pos) => (
                        <g key={`left-${pos}`}>
                          <rect x="20" y={pos * rowHeight + 10} width="40" height="40" rx="8" className="fill-zinc-600" />
                          <text x="40" y={pos * rowHeight + 38} textAnchor="middle" className="fill-white font-bold text-lg">{pos + 1}</text>
                        </g>
                      ))}
                      {['A', 'B', 'C'].map((letter, idx) => (
                        <g key={`right-${letter}`}>
                          <rect x="340" y={idx * rowHeight + 10} width="40" height="40" rx="8" className={panel.wires.some(w => w.toLetter === letter) ? 'fill-zinc-600' : 'fill-zinc-800'} />
                          <text x="360" y={idx * rowHeight + 38} textAnchor="middle" className="fill-white font-bold text-lg">{letter}</text>
                        </g>
                      ))}
                      {panel.wires.map((wire, wireIdx) => {
                        const fromY = wire.fromPosition * rowHeight + rowHeight / 2;
                        const toY = letterToY[wire.toLetter];
                        const color = wire.color === 'red' ? '#dc2626' : wire.color === 'blue' ? '#2563eb' : '#000000';
                        const strokeWidth = wire.cut ? 2 : 4;
                        const opacity = wire.cut ? 0.3 : 1;
                        const midX = (leftX + rightX) / 2 + (Math.random() - 0.5) * 30;
                        
                        return (
                          <g key={wireIdx}>
                            <path
                              d={`M ${leftX + 40} ${fromY} Q ${midX} ${(fromY + toY) / 2} ${rightX} ${toY}`}
                              stroke={color}
                              strokeWidth={strokeWidth}
                              fill="none"
                              opacity={opacity}
                              style={{ cursor: wire.cut ? 'default' : 'pointer' }}
                              onClick={() => !wire.cut && !bomb.wireSequences!.solved && !bomb.gameOver && cutWireSequence(bomb.wireSequences!.currentPanel, wireIdx)}
                            />
                            {!wire.cut && (
                              <circle
                                cx={(leftX + 40 + rightX) / 2}
                                cy={(fromY + toY) / 2}
                                r="12"
                                fill="transparent"
                                style={{ cursor: 'pointer' }}
                                onClick={() => cutWireSequence(bomb.wireSequences!.currentPanel, wireIdx)}
                              />
                            )}
                          </g>
                        );
                      })}
                    </svg>
                    <div className="mt-2 text-xs text-zinc-500 text-center">
                      Click on a wire to cut it
                    </div>
                  </div>
                );
              })()}
              {bomb.wireSequences.solved && (
                <div className="mt-4 text-green-500 font-bold text-center">MODULE DISARMED</div>
              )}
            </div>
          )}

          <div className={`bg-zinc-800 rounded-xl p-6 relative ${bomb.wires.solved ? 'opacity-60' : ''}`}>
            <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-zinc-600" />
            <div className={`absolute top-3 right-3 w-4 h-4 rounded-full ${bomb.wires.solved ? 'bg-green-500' : 'bg-zinc-600'}`} />
            {difficulty === 'devtest' && <h2 className="text-lg font-semibold text-zinc-200 mb-4">Wires</h2>}
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
            {difficulty === 'devtest' && <h2 className="text-lg font-semibold text-zinc-200 mb-4">The Button</h2>}
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