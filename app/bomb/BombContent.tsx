"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Bomb,
  SimonColor,
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
  hasVowel,
  getSimonPressColor,
} from "@/lib/game";
import {
  initSoundsOnClient,
  playSound,
  startBeepLoop,
  stopBeepLoop,
} from "@/lib/sounds";

const SYMBOL_IMAGES: Record<KeypadSymbol, string> = {
  balloon: "🎈",
  copyright: "©",
  doublek: "KK",
  euro: "€",
  filledstar: "★",
  hollowstar: "☆",
  hookn: "ʎ",
  meltedthree: "3",
  omega: "Ω",
  paragraph: "¶",
  pitchfork: "⚡",
  press: "PRESS",
  six: "6",
  smileyface: "😊",
  squidknife: "刀",
  squigglyn: "∿",
  tracks: "⌘",
  upsidedowny: "Y",
  at: "@",
  ae: "Æ",
  cursive: "ϲ",
  rightc: "⊂",
  leftc: "Ɔ",
  questionmark: "?",
  dragon: "ᗺ",
  nwithhat: "Ń",
  bt: "ϕ",
  pumpkin: "🎃",
};

const SYMBOL_IMAGE_URLS: Record<KeypadSymbol, string> = {
  balloon: "https://static.wikia.nocookie.net/ktane/images/0/06/Keypad28.png",
  copyright: "https://static.wikia.nocookie.net/ktane/images/0/0b/Keypad01.png",
  doublek: "https://static.wikia.nocookie.net/ktane/images/6/67/Keypad05.png",
  euro: "https://static.wikia.nocookie.net/ktane/images/6/6b/Keypad16.png",
  filledstar:
    "https://static.wikia.nocookie.net/ktane/images/f/f9/Keypad02.png",
  hollowstar:
    "https://static.wikia.nocookie.net/ktane/images/3/3d/Keypad03.png",
  hookn: "https://static.wikia.nocookie.net/ktane/images/9/9d/Keypad09.png/",
  meltedthree:
    "https://static.wikia.nocookie.net/ktane/images/3/30/Keypad15.png",
  omega: "https://static.wikia.nocookie.net/ktane/images/2/27/Keypad06.png/",
  paragraph: "https://static.wikia.nocookie.net/ktane/images/7/7d/Keypad21.png",
  pitchfork: "https://static.wikia.nocookie.net/ktane/images/5/5c/Keypad24.png",
  press: "",
  six: "https://static.wikia.nocookie.net/ktane/images/0/03/Keypad11.png",
  smileyface:
    "https://static.wikia.nocookie.net/ktane/images/1/16/Keypad04.png",
  squidknife:
    "https://static.wikia.nocookie.net/ktane/images/e/e4/Keypad07.png/",
  squigglyn:
    "https://static.wikia.nocookie.net/ktane/images/5/50/Keypad12.png/",
  tracks: "https://static.wikia.nocookie.net/ktane/images/7/70/Keypad27.png",
  upsidedowny:
    "https://static.wikia.nocookie.net/ktane/images/1/16/Keypad30.png",
  at: "https://static.wikia.nocookie.net/ktane/images/b/b7/Keypad13.png",
  ae: "https://static.wikia.nocookie.net/ktane/images/f/f0/Keypad14.png",
  cursive: "https://static.wikia.nocookie.net/ktane/images/b/b3/Keypad26.png",
  rightc: "https://static.wikia.nocookie.net/ktane/images/2/28/Keypad22.png/",
  leftc: "https://static.wikia.nocookie.net/ktane/images/d/d8/Keypad23.png",
  questionmark:
    "https://static.wikia.nocookie.net/ktane/images/3/34/Keypad20.png",
  dragon: "https://static.wikia.nocookie.net/ktane/images/3/32/Keypad19.png/",
  nwithhat: "https://static.wikia.nocookie.net/ktane/images/d/d4/Keypad18.png/",
  bt: "https://static.wikia.nocookie.net/ktane/images/2/27/Keypad31.png/",
  pumpkin: "https://static.wikia.nocookie.net/ktane/images/9/9e/Keypad08.png",
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const WIRE_COLORS: Record<WireColor, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  yellow: "bg-yellow-400",
  white: "bg-zinc-200",
  black: "bg-neutral-950 border border-zinc-600",
};

const MORSE_FREQUENCIES = [
  3.505, 3.515, 3.522, 3.532, 3.535, 3.542, 3.545, 3.552, 3.555, 3.565, 3.572,
  3.575, 3.582, 3.592, 3.595, 3.6,
];

const PORT_IMAGES: Record<string, string> = {
  "DVI-D":
    "https://static.wikia.nocookie.net/ktane/images/4/46/PortWidget_DVI.svg",
  Parallel:
    "https://static.wikia.nocookie.net/ktane/images/6/68/PortWidget_Parallel.svg",
  Serial: "https://static.wikia.nocookie.net/ktane/images/d/d3/Serial.svg",
  "PS/2":
    "https://static.wikia.nocookie.net/ktane/images/b/ba/PortWidget_PS2.svg",
  "Stereo RCA":
    "https://static.wikia.nocookie.net/ktane/images/5/55/StereoRCA.svg",
};

interface Props {
  initialBomb: Bomb;
  difficulty: "easy" | "medium" | "hard" | "devtest";
}

export default function BombContent({ initialBomb, difficulty }: Props) {
  const [bomb, setBomb] = useState<Bomb>(initialBomb);
  const [heldTime, setHeldTime] = useState<number | null>(null);
  const [buttonStrip, setButtonStrip] = useState<string | null>(null);
  const [keypadError, setKeypadError] = useState(false);
  const [strikeFlash, setStrikeFlash] = useState(false);
  const [morseSelectedIndex, setMorseSelectedIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(3);
  const [simonPhase, setSimonPhase] = useState<"idle" | "playing" | "input">(
    "idle",
  );
  const [simonLitColor, setSimonLitColor] = useState<SimonColor | null>(null);
  const [simonInputIndex, setSimonInputIndex] = useState(0);
  const simonTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevStrikesRef = useRef(bomb.strikes);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerSpeedRef = useRef(1000);

  const prevWiresSolved = useRef(bomb.wires.solved);
  const prevButtonSolved = useRef(bomb.button.solved);
  const prevKeypadSolved = useRef(bomb.keypad?.solved ?? true);
  const prevWhosOnFirstSolved = useRef(bomb.whosOnFirst?.solved ?? true);
  const prevMemorySolved = useRef(bomb.memory?.solved ?? true);
  const prevMorseCodeSolved = useRef(bomb.morseCode?.solved ?? true);
  const prevComplicatedWiresSolved = useRef(
    bomb.complicatedWires?.solved ?? true,
  );
  const prevWireSequencesSolved = useRef(bomb.wireSequences?.solved ?? true);
  const prevSimonSolved = useRef(bomb.simon?.solved ?? true);
  const prevPasswordsSolved = useRef(bomb.passwords?.solved ?? true);
  const prevGameOverRef = useRef(bomb.gameOver);
  const prevCountdownRef = useRef(countdown);

  useEffect(() => {
    initSoundsOnClient();
  }, []);

  // Explode sound
  useEffect(() => {
    if (bomb.gameOver && !bomb.won && !prevGameOverRef.current) {
      playSound("explode", 100);
    }
    prevGameOverRef.current = bomb.gameOver;
  }, [bomb.gameOver, bomb.won]);

  // Beep loop - start when countdown ends, stop when game over
  useEffect(() => {
    const countdownEnded =
      prevCountdownRef.current !== null && countdown === null;
    if (countdownEnded && !bomb.gameOver) {
      startBeepLoop(1000);
    }
    if (bomb.gameOver) {
      stopBeepLoop();
    }
    prevCountdownRef.current = countdown;
  }, [countdown, bomb.gameOver]);

  useEffect(() => {
    if (bomb.gameOver) return;

    const modules = [
      { current: bomb.wires.solved, prev: prevWiresSolved, name: "wires" },
      { current: bomb.button.solved, prev: prevButtonSolved, name: "button" },
      {
        current: bomb.keypad?.solved ?? true,
        prev: prevKeypadSolved,
        name: "keypad",
      },
      {
        current: bomb.whosOnFirst?.solved ?? true,
        prev: prevWhosOnFirstSolved,
        name: "whosOnFirst",
      },
      {
        current: bomb.memory?.solved ?? true,
        prev: prevMemorySolved,
        name: "memory",
      },
      {
        current: bomb.morseCode?.solved ?? true,
        prev: prevMorseCodeSolved,
        name: "morseCode",
      },
      {
        current: bomb.complicatedWires?.solved ?? true,
        prev: prevComplicatedWiresSolved,
        name: "complicatedWires",
      },
      {
        current: bomb.wireSequences?.solved ?? true,
        prev: prevWireSequencesSolved,
        name: "wireSequences",
      },
      {
        current: bomb.simon?.solved ?? true,
        prev: prevSimonSolved,
        name: "simon",
      },
      {
        current: bomb.passwords?.solved ?? true,
        prev: prevPasswordsSolved,
        name: "passwords",
      },
    ];

    modules.forEach((mod) => {
      const wasSolved = mod.prev.current;
      if (mod.current && !wasSolved) {
        playSound("solved", 150);
      }
      mod.prev.current = mod.current;
    });
  }, [
    bomb.wires.solved,
    bomb.button.solved,
    bomb.keypad?.solved,
    bomb.whosOnFirst?.solved,
    bomb.memory?.solved,
    bomb.morseCode?.solved,
    bomb.complicatedWires?.solved,
    bomb.wireSequences?.solved,
    bomb.simon?.solved,
    bomb.passwords?.solved,
    bomb.gameOver,
  ]);

  // Countdown effect
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Timer effect - paused during countdown
  useEffect(() => {
    if (bomb.gameOver || countdown !== null) {
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
  }, [bomb.gameOver, countdown]);

  useEffect(() => {
    if (bomb.strikes > 0 && !bomb.gameOver) {
      timerSpeedRef.current = 700;
      const interval = setInterval(() => {
        setBomb((b) => ({
          ...b,
          timerSeconds: Math.max(0, b.timerSeconds - 1),
        }));
      }, 700);
      return () => clearInterval(interval);
    } else {
      timerSpeedRef.current = 1000;
    }
  }, [bomb.strikes, bomb.gameOver]);

  useEffect(() => {
    if (bomb.strikes > prevStrikesRef.current && !bomb.gameOver) {
      playSound("strike");
      setStrikeFlash(true);
      setTimeout(() => setStrikeFlash(false), 500);
    }
    prevStrikesRef.current = bomb.strikes;
  }, [bomb.strikes, bomb.gameOver]);

  const cutWire = useCallback((wireIndex: number) => {
    playSound("click");
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
    playSound("click");
    setBomb((b) => {
      if (b.button.solved || b.gameOver) return b;

      const hold = shouldHoldButton(b);
      if (!hold) {
        return { ...b, button: { ...b.button, solved: true } };
      } else {
        const strips = ["blue", "white", "yellow", "red"];
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
        return {
          ...b,
          button: { ...b.button, solved: true, held: false, released: true },
        };
      } else {
        const newStrikes = b.strikes + 1;
        setButtonStrip(null);
        if (newStrikes >= b.maxStrikes) {
          return {
            ...b,
            strikes: newStrikes,
            gameOver: true,
            won: false,
            button: { ...b.button, held: false },
          };
        }
        return {
          ...b,
          strikes: newStrikes,
          button: { ...b.button, held: false },
        };
      }
    });
  }, [buttonStrip]);

  const pressKeypadKey = useCallback(
    (symbol: KeypadSymbol) => {
      if (!bomb.keypad || bomb.keypad.solved || bomb.gameOver) return;

      playSound("click");
      const correct = checkKeypadOrder(bomb.keypad!, symbol);
      if (correct) {
        const newPressed = bomb.keypad.pressed + 1;
        const newPressedSymbols = [...bomb.keypad.pressedSymbols, symbol];
        if (newPressed === 3) {
          setBomb((b) => ({
            ...b,
            keypad: {
              ...b.keypad!,
              solved: true,
              pressed: newPressed,
              pressedSymbols: newPressedSymbols,
            },
          }));
        } else {
          setBomb((b) => ({
            ...b,
            keypad: {
              ...b.keypad!,
              pressed: newPressed,
              pressedSymbols: newPressedSymbols,
            },
          }));
        }
        setKeypadError(false);
      } else {
        const newStrikes = bomb.strikes + 1;
        setKeypadError(true);
        setTimeout(() => setKeypadError(false), 500);
        if (newStrikes >= bomb.maxStrikes) {
          setBomb((b) => ({
            ...b,
            strikes: newStrikes,
            gameOver: true,
            won: false,
          }));
        } else {
          setBomb((b) => ({ ...b, strikes: newStrikes }));
        }
      }
    },
    [bomb],
  );

  const pressWhosOnFirst = useCallback(
    (label: string) => {
      if (!bomb.whosOnFirst || bomb.whosOnFirst.solved || bomb.gameOver) return;

      playSound("click");
      const correctLabel = getWhosOnFirstSolution(bomb.whosOnFirst);
      if (label === correctLabel) {
        setBomb((b) => ({
          ...b,
          whosOnFirst: { ...b.whosOnFirst!, solved: true },
        }));
      } else {
        const newStrikes = bomb.strikes + 1;
        if (newStrikes >= bomb.maxStrikes) {
          setBomb((b) => ({
            ...b,
            strikes: newStrikes,
            gameOver: true,
            won: false,
          }));
        } else {
          setBomb((b) => ({ ...b, strikes: newStrikes }));
        }
      }
    },
    [bomb],
  );

  const pressMemoryButton = useCallback(
    (position: number, label: string) => {
      if (!bomb.memory || bomb.memory.solved || bomb.gameOver) return;

      playSound("click");
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
            memory: b.memory
              ? {
                  ...b.memory,
                  stage: newStage,
                  display: Math.floor(Math.random() * 4) + 1,
                  buttons: newLabels,
                  pressedLabels: [...currentPressedLabels, label],
                  pressedPositions: [...currentPressedPositions, position],
                }
              : b.memory,
          }));
        }
      } else {
        const newStrikes = bomb.strikes + 1;
        if (newStrikes >= bomb.maxStrikes) {
          setBomb((b) => ({
            ...b,
            strikes: newStrikes,
            gameOver: true,
            won: false,
          }));
        } else {
          setBomb((b) => ({
            ...b,
            strikes: newStrikes,
            memory: {
              ...b.memory!,
              stage: 0,
              pressedLabels: [],
              pressedPositions: [],
            },
          }));
        }
      }
    },
    [bomb],
  );

  const pressMorseFrequency = useCallback(
    (freq: number) => {
      if (!bomb.morseCode || bomb.morseCode.solved || bomb.gameOver) return;

      playSound("click");
      if (freq === bomb.morseCode.frequency) {
        setBomb((b) => ({
          ...b,
          morseCode: { ...b.morseCode!, solved: true },
        }));
      } else {
        const newStrikes = bomb.strikes + 1;
        if (newStrikes >= bomb.maxStrikes) {
          setBomb((b) => ({
            ...b,
            strikes: newStrikes,
            gameOver: true,
            won: false,
          }));
        } else {
          setBomb((b) => ({ ...b, strikes: newStrikes }));
        }
      }
    },
    [bomb],
  );

  const changeMorseFrequency = useCallback((direction: "left" | "right") => {
    playSound("click");
    setMorseSelectedIndex((prev) => {
      if (direction === "left") {
        return prev === 0 ? MORSE_FREQUENCIES.length - 1 : prev - 1;
      } else {
        return prev === MORSE_FREQUENCIES.length - 1 ? 0 : prev + 1;
      }
    });
  }, []);

  const cutComplicatedWire = useCallback(
    (index: number) => {
      if (
        !bomb.complicatedWires ||
        bomb.complicatedWires.solved ||
        bomb.gameOver
      )
        return;

      playSound("click");
      const shouldCut = getComplicatedWireSolution(
        bomb.complicatedWires.wires,
        bomb,
      );

      if (shouldCut[index]) {
        setBomb((b) => ({
          ...b,
          complicatedWires: { ...b.complicatedWires!, solved: true },
        }));
      } else {
        const newStrikes = bomb.strikes + 1;
        if (newStrikes >= bomb.maxStrikes) {
          setBomb((b) => ({
            ...b,
            strikes: newStrikes,
            gameOver: true,
            won: false,
          }));
        } else {
          setBomb((b) => ({
            ...b,
            complicatedWires: {
              ...b.complicatedWires!,
              wires: b.complicatedWires!.wires.map((w, i) =>
                i === index ? { ...w, cut: true } : w,
              ),
            },
            strikes: newStrikes,
          }));
        }
      }
    },
    [bomb],
  );

  const cutWireSequence = useCallback(
    (panelIndex: number, wireIndex: number) => {
      if (!bomb.wireSequences || bomb.wireSequences.solved || bomb.gameOver)
        return;
      if (panelIndex !== bomb.wireSequences.currentPanel) return;

      playSound("click");
      const panel = bomb.wireSequences.panels[panelIndex];
      const wire = panel.wires[wireIndex];
      if (wire.cut) return;

      const solution = getWireSequenceSolution(
        wire.toLetter,
        wire.color,
        wire.occurrence,
      );

      if (solution.cut) {
        setBomb((b) => ({
          ...b,
          wireSequences: {
            ...b.wireSequences!,
            panels: b.wireSequences!.panels.map((p, i) =>
              i === panelIndex
                ? { ...p, wires: p.wires.map((w, j) => (j === wireIndex ? { ...w, cut: true } : w)) }
                : p,
            ),
            cutWires: [...b.wireSequences!.cutWires, wire.color],
          },
        }));
      } else {
        const newStrikes = bomb.strikes + 1;
        if (newStrikes >= bomb.maxStrikes) {
          setBomb((b) => ({
            ...b,
            strikes: newStrikes,
            gameOver: true,
            won: false,
          }));
        } else {
          setBomb((b) => ({ ...b, strikes: newStrikes }));
        }
      }
    },
    [bomb],
  );

  const switchWireSequencePanel = useCallback((direction: "up" | "down") => {
    if (direction === "up") {
      return; // Disable up arrow - only down arrow works
    } else {
      setBomb((b) => {
        if (!b.wireSequences || b.wireSequences.solved || b.gameOver) return b;
        const current = b.wireSequences.currentPanel;
        const panel = b.wireSequences.panels[current];

        // Check if any uncut wire SHOULD be cut
        const uncutShouldCut = panel.wires.some((w) => {
          if (w.cut) return false;
          const solution = getWireSequenceSolution(w.toLetter, w.color, w.occurrence);
          return solution.cut;
        });

        // If there's any wire that should be cut but isn't, don't advance
        if (uncutShouldCut) {
          return b;
        }

        if (current === 2) {
          return { ...b, wireSequences: { ...b.wireSequences, solved: true } };
        }

        return {
          ...b,
          wireSequences: { ...b.wireSequences, currentPanel: current + 1 },
        };
      });
    }
  }, []);

  function clearSimonTimer() {
    if (simonTimerRef.current) {
      clearTimeout(simonTimerRef.current);
      simonTimerRef.current = null;
    }
  }

  function startSimonAutoPlay(sequence: SimonColor[]) {
    if (!sequence || sequence.length === 0) return;

    setSimonPhase("playing");
    setSimonLitColor(null);

    let flashIndex = 0;

    function flashNext() {
      if (flashIndex >= sequence.length) {
        setSimonLitColor(null);
        setSimonPhase("input");
        return;
      }

      setSimonLitColor(sequence[flashIndex]);

      simonTimerRef.current = setTimeout(() => {
        setSimonLitColor(null);

        simonTimerRef.current = setTimeout(() => {
          flashIndex++;
          flashNext();
        }, 200);
      }, 600);
    }

    flashNext();
  }

  // Auto-play effect when phase is idle
  useEffect(() => {
    if (!bomb.simon || bomb.simon.solved || bomb.gameOver) return;

    if (simonPhase === "idle") {
      const delay = setTimeout(() => {
        startSimonAutoPlay(bomb.simon!.sequence);
      }, 800);
      return () => clearTimeout(delay);
    }
  }, [simonPhase, bomb.simon?.solved, bomb.gameOver]);

  const pressSimonButton = useCallback(
    (color: SimonColor) => {
      if (!bomb.simon || bomb.simon.solved || bomb.gameOver) return;
      if (simonPhase !== "input") return;

      playSound("click");

      const flashColor = bomb.simon.sequence[simonInputIndex];
      const expectedColor = getSimonPressColor(
        flashColor,
        bomb.strikes,
        hasVowel(bomb),
      );

      if (color === expectedColor) {
        const newIndex = simonInputIndex + 1;
        setSimonInputIndex(newIndex);

        if (newIndex >= bomb.simon.sequence.length) {
          setBomb((b) => ({
            ...b,
            simon: { ...b.simon!, solved: true, stage: newIndex },
          }));
          setSimonPhase("idle");
          setSimonInputIndex(0);
        }
      } else {
        const newStrikes = bomb.strikes + 1;
        if (newStrikes >= bomb.maxStrikes) {
          setBomb((b) => ({
            ...b,
            strikes: newStrikes,
            gameOver: true,
            won: false,
          }));
        } else {
          setBomb((b) => ({ ...b, strikes: newStrikes }));
        }
        clearSimonTimer();
        setSimonLitColor(null);
        setSimonPhase("idle");
        setSimonInputIndex(0);
      }
    },
    [bomb, simonPhase, simonInputIndex],
  );

  const changePasswordLetter = useCallback(
    (columnIndex: number, direction: "up" | "down") => {
      if (!bomb.passwords || bomb.passwords.solved || bomb.gameOver) return;

      playSound("click");

      setBomb((b) => {
        const columns = [...b.passwords!.columns];
        const currentIndex = columns[columnIndex].currentIndex;
        const newIndex =
          direction === "up"
            ? (currentIndex + 1) % 6
            : (currentIndex - 1 + 6) % 6;
        columns[columnIndex] = {
          ...columns[columnIndex],
          currentIndex: newIndex,
        };

        const word = columns
          .map((col) => col.letters[col.currentIndex])
          .join("")
          .toLowerCase();
        const { PASSWORD_WORDS } = require("@/lib/game");
        const solved = PASSWORD_WORDS.has(word);

        return {
          ...b,
          passwords: { ...b.passwords!, columns, solved },
        };
      });
    },
    [],
  );

  const bothSolved =
    bomb.wires.solved &&
    bomb.button.solved &&
    (bomb.keypad?.solved ?? true) &&
    (bomb.whosOnFirst?.solved ?? true) &&
    (bomb.memory?.solved ?? true) &&
    (bomb.morseCode?.solved ?? true) &&
    (bomb.complicatedWires?.solved ?? true) &&
    (bomb.wireSequences?.solved ?? true) &&
    (bomb.simon?.solved ?? true) &&
    (bomb.passwords?.solved ?? true);

  useEffect(() => {
    if (bothSolved && !bomb.gameOver) {
      setBomb((b) => ({ ...b, gameOver: true, won: true }));
    }
  }, [bothSolved, bomb.gameOver]);

  return (
    <div className="min-h-screen bg-zinc-900 p-4">
      {/* Countdown overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="text-9xl font-bold text-amber-500 animate-pulse">
              {countdown}
            </div>
            <div className="text-xl text-zinc-400 mt-4">Get Ready...</div>
          </div>
        </div>
      )}
      {strikeFlash && (
        <div className="fixed inset-0 z-40 animate-strike-flash pointer-events-none" />
      )}
      {bomb.gameOver && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="text-center">
            <h1
              className={`text-6xl font-bold mb-4 ${bomb.won ? "text-green-500" : "text-red-500"}`}
            >
              {bomb.won ? "BOMB DEFUSED" : "EXPLODED"}
            </h1>
            <p className="text-zinc-400 mb-8">
              {bomb.won
                ? `Defused with ${formatTime(bomb.timerSeconds)} remaining!`
                : "The bomb exploded!"}
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
          <Link href="/" onClick={() => stopBeepLoop()} className="text-zinc-500 hover:text-zinc-400">
            ← Exit
          </Link>
        </div>

        <div className="bg-zinc-800 rounded-xl p-2 sm:p-4 mb-3 sm:mb-6 sticky top-0 z-30 backdrop-blur-md bg-zinc-800/95">
          <div className="flex items-start justify-between gap-2 sm:gap-8">
            {/* Left sidebar - Edgework */}
            <div className="flex gap-1 sm:gap-8 overflow-x-auto">
              {/* Serial Number */}
              <div className="bg-zinc-900 px-1 sm:px-3 py-1 sm:py-2 rounded border border-zinc-700">
                <div className="text-[10px] sm:text-xs text-zinc-500 mb-0.5 sm:mb-1">Serial #</div>
                <div className="text-sm sm:text-lg font-mono text-zinc-200 tracking-wider">
                  {bomb.serialNumber}
                </div>
              </div>

              {/* Ports */}
              {bomb.ports.length > 0 && (
                <div className="bg-zinc-900 px-1 sm:px-3 py-1 sm:py-2 rounded border border-zinc-700">
                  <div className="text-[10px] sm:text-xs text-zinc-500 mb-0.5 sm:mb-1">Ports</div>
                  <div className="flex gap-1 sm:gap-2">
                    {bomb.ports.map((port, idx) => (
                      <img
                        key={idx}
                        src={PORT_IMAGES[port]}
                        alt={port}
                        className="h-4 sm:h-8 w-auto opacity-90"
                        title={port}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Indicators */}
              {bomb.indicators.length > 0 && (
                <div className="bg-zinc-900 px-1 sm:px-3 py-1 sm:py-2 rounded border border-zinc-700">
                  <div className="text-[10px] sm:text-xs text-zinc-500 mb-0.5 sm:mb-1">Indicators</div>
                  <div className="flex gap-1 sm:gap-2">
                    {bomb.indicators.map((ind, idx) => (
                      <div
                        key={idx}
                        className="text-sm sm:text-lg font-mono text-yellow-400"
                      >
                        {ind}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Batteries */}
              <div className="bg-zinc-900 px-1 sm:px-3 py-1 sm:py-2 rounded border border-zinc-700">
                <div className="text-[10px] sm:text-xs text-zinc-500 mb-0.5 sm:mb-1">Batteries</div>
                <div className="flex gap-0.5 sm:gap-1">
                  {Array.from({ length: bomb.batteries }).map((_, i) => (
                    <span key={i} className="text-sm sm:text-lg">
                      🔋
                    </span>
                  ))}
                  {bomb.batteries === 0 && (
                    <span className="text-zinc-600 text-sm sm:text-lg">-</span>
                  )}
                </div>
              </div>
            </div>

            {/* Timer */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className={`text-2xl sm:text-5xl font-mono font-bold ${bomb.strikes > 0 ? "text-red-500 animate-pulse" : "text-green-500"}`}
              >
                {formatTime(bomb.timerSeconds)}
              </div>
              <div className="text-zinc-500 text-[10px] sm:text-sm">
                Strikes: <span className="text-red-400 font-bold">{bomb.strikes}/3</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {bomb.keypad && (
            <div
              className={`bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-6 relative border-2 border-zinc-700/50 shadow-2xl ${bomb.keypad.solved ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i <= bomb.keypad!.pressed
                            ? "bg-green-400 shadow-sm shadow-green-400/50"
                            : "bg-zinc-600"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {bomb.keypad.symbols.map((symbol, idx) => {
                  const isPressed =
                    bomb.keypad!.pressedSymbols.includes(symbol);
                  return (
                    <button
                      key={idx}
                      onClick={() => pressKeypadKey(symbol)}
                      disabled={bomb.keypad!.solved || bomb.gameOver}
                      className={`h-16 rounded-xl border-2 border-amber-300/50 bg-gradient-to-b from-amber-100 to-amber-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-150 flex items-center justify-center ${
                        keypadError ? "animate-shake" : ""
                      } ${isPressed ? "opacity-40" : ""} disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg`}
                    >
                      {SYMBOL_IMAGE_URLS[symbol] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={SYMBOL_IMAGE_URLS[symbol]}
                          alt={symbol}
                          className={`w-12 h-12 object-contain drop-shadow-sm ${isPressed ? "opacity-60" : ""}`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                            (
                              e.target as HTMLImageElement
                            ).nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <span
                        className={
                          SYMBOL_IMAGE_URLS[symbol]
                            ? `hidden text-amber-900 text-2xl font-bold ${isPressed ? "opacity-60" : ""}`
                            : `text-amber-900 text-2xl font-bold ${isPressed ? "opacity-60" : ""}`
                        }
                      >
                        {SYMBOL_IMAGES[symbol]}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-center gap-2">
                {bomb.keypad.solved ? (
                  <div className="text-green-400 font-bold tracking-wider text-sm">
                    ✦ DISARMED ✦
                  </div>
                ) : (
                  <div className="text-zinc-400 text-xs tracking-widest">
                    SEQUENCE:{" "}
                    <span className="text-amber-400 font-bold">
                      {bomb.keypad.pressed + 1}/4
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {bomb.whosOnFirst && (
            <div
              className={`bg-zinc-800 rounded-xl p-6 relative ${bomb.whosOnFirst.solved ? "opacity-60" : ""}`}
            >
              <div
                className={`absolute top-3 right-3 w-4 h-4 rounded-full ${bomb.whosOnFirst.solved ? "bg-green-500" : "bg-zinc-600"}`}
              />
              {difficulty === "devtest" && (
                <h2 className="text-lg font-semibold text-zinc-200 mb-4">
                  Who's on First
                </h2>
              )}
              <div className="bg-zinc-900 rounded-lg p-4 mb-4 text-center">
                <span className="text-2xl font-bold text-yellow-400">
                  {bomb.whosOnFirst.display}
                </span>
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
                <div className="mt-4 text-green-500 font-bold text-center">
                  MODULE DISARMED
                </div>
              )}
            </div>
          )}

          {bomb.memory && (
            <div
              className={`bg-zinc-800 rounded-xl p-6 relative ${bomb.memory.solved ? "opacity-60" : ""}`}
            >
              <div
                className={`absolute top-3 right-3 w-4 h-4 rounded-full ${bomb.memory.solved ? "bg-green-500" : "bg-zinc-600"}`}
              />
              {difficulty === "devtest" && (
                <h2 className="text-lg font-semibold text-zinc-200 mb-4">
                  Memory
                </h2>
              )}
              <div className="bg-zinc-900 rounded-lg p-4 mb-4 text-center">
                <span className="text-4xl font-bold text-yellow-400">
                  {bomb.memory.display}
                </span>
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
                <div className="mt-2 text-green-500 font-bold text-center">
                  MODULE DISARMED
                </div>
              )}
            </div>
          )}

          {bomb.morseCode && (
            <div
              className={`bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-6 relative border-2 border-zinc-700/50 shadow-2xl ${bomb.morseCode.solved ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-zinc-200 tracking-wider uppercase">
                  Morse Code
                </h2>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4 mb-4 text-center border border-zinc-700/50">
                <span className="text-2xl font-bold text-yellow-400">
                  {getMorseCodeSequence(bomb.morseCode.word).join(" ")}
                </span>
              </div>
              <p className="text-zinc-400 text-sm mb-4">
                Select frequency and click display to submit:
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => changeMorseFrequency("left")}
                  disabled={bomb.morseCode!.solved || bomb.gameOver}
                  className="w-12 h-16 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors flex items-center justify-center text-2xl disabled:opacity-50"
                >
                  ◀
                </button>
                <button
                  onClick={() =>
                    pressMorseFrequency(MORSE_FREQUENCIES[morseSelectedIndex])
                  }
                  disabled={bomb.morseCode!.solved || bomb.gameOver}
                  className="h-16 px-8 rounded-lg bg-zinc-900 border-2 border-amber-500/50 hover:border-amber-400 transition-colors flex items-center justify-center"
                >
                  <span className="text-amber-400 font-mono text-xl font-bold">
                    {MORSE_FREQUENCIES[morseSelectedIndex].toFixed(3)}
                  </span>
                </button>
                <button
                  onClick={() => changeMorseFrequency("right")}
                  disabled={bomb.morseCode!.solved || bomb.gameOver}
                  className="w-12 h-16 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors flex items-center justify-center text-2xl disabled:opacity-50"
                >
                  ▶
                </button>
              </div>
              {bomb.morseCode.solved && (
                <div className="mt-4 text-green-500 font-bold text-center">
                  ✦ DISARMED ✦
                </div>
              )}
            </div>
          )}

          {bomb.complicatedWires && (
            <div
              className={`bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-6 relative border-2 border-zinc-700/50 shadow-2xl ${bomb.complicatedWires.solved ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-zinc-200 tracking-wider uppercase">
                  Complicated Wires
                </h2>
              </div>
              <div className="space-y-2">
                {bomb.complicatedWires.wires.map((wire, idx) => {
                  const isLightColor =
                    wire.color === "white" || wire.color === "yellow";
                  const isRedBlue = wire.color === "redblue";
                  return (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          {wire.hasLED && (
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          )}
                          {wire.hasStar && (
                            <span className="text-amber-400 text-sm">★</span>
                          )}
                        </div>
                        <span className="text-zinc-500 text-xs">{idx + 1}</span>
                      </div>
                      <button
                        onClick={() => cutComplicatedWire(idx)}
                        disabled={
                          bomb.complicatedWires!.solved ||
                          bomb.gameOver ||
                          wire.cut
                        }
                        className={`w-full h-6 rounded relative ${
                          wire.cut ? "opacity-40" : ""
                        } ${
                          isRedBlue
                            ? "bg-gradient-to-r from-red-600 via-red-500 to-blue-500"
                            : wire.color === "red"
                              ? "bg-red-600"
                              : wire.color === "blue"
                                ? "bg-blue-600"
                                : wire.color === "yellow"
                                  ? "bg-yellow-500"
                                  : wire.color === "white"
                                    ? "bg-zinc-200"
                                    : "bg-neutral-900"
                        }`}
                      >
                        {wire.cut && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full h-0.5 bg-black/30" />
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
              {bomb.complicatedWires.solved && (
                <div className="mt-4 text-green-500 font-bold text-center">
                  MODULE DISARMED
                </div>
              )}
            </div>
          )}

          {bomb.wireSequences && (
            <div
              className={`bg-zinc-800 rounded-xl p-6 relative ${bomb.wireSequences.solved ? "opacity-60" : ""}`}
            >
              <div
                className={`absolute top-3 right-3 w-4 h-4 rounded-full ${bomb.wireSequences.solved ? "bg-green-500" : "bg-zinc-600"}`}
              />
              {difficulty === "devtest" && (
                <h2 className="text-lg font-semibold text-zinc-200 mb-4">
                  Wire Sequences
                </h2>
              )}
              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={() => switchWireSequencePanel("up")}
                  disabled={bomb.wireSequences.solved || bomb.gameOver}
                  className="w-10 h-10 bg-zinc-700 rounded-lg text-white font-bold text-xl hover:bg-zinc-600 disabled:opacity-50"
                >
                  ▲
                </button>
                <div className="px-4 py-2 bg-zinc-900 rounded-lg">
                  <span className="text-yellow-400 font-bold text-xl">
                    Panel{" "}
                    {
                      bomb.wireSequences.panels[bomb.wireSequences.currentPanel]
                        .letter
                    }
                  </span>
                </div>
                <button
                  onClick={() => switchWireSequencePanel("down")}
                  disabled={bomb.wireSequences.solved || bomb.gameOver}
                  className="w-10 h-10 bg-zinc-700 rounded-lg text-white font-bold text-xl hover:bg-zinc-600 disabled:opacity-50"
                >
                  ▼
                </button>
              </div>
              <div className="text-center text-zinc-500 text-sm mb-4">
                Red wires cut:{" "}
                {bomb.wireSequences.cutWires.filter((c) => c === "red").length}{" "}
                | Blue wires cut:{" "}
                {bomb.wireSequences.cutWires.filter((c) => c === "blue").length}{" "}
                | Black wires cut:{" "}
                {
                  bomb.wireSequences.cutWires.filter((c) => c === "black")
                    .length
                }
              </div>
              {(() => {
                const panel =
                  bomb.wireSequences.panels[bomb.wireSequences.currentPanel];
                return (
                  <div className="space-y-2">
                    {panel.wires.map((wire, wireIdx) => {
                      const colorClasses =
                        wire.color === "red"
                          ? "bg-red-700"
                          : wire.color === "blue"
                            ? "bg-blue-700"
                            : "bg-neutral-900 border border-zinc-500";
                      return (
                        <div key={wireIdx} className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {wire.fromPosition + 1}
                          </div>
                          <button
                            onClick={() => cutWireSequence(bomb.wireSequences!.currentPanel, wireIdx)}
                            disabled={bomb.wireSequences!.solved || bomb.gameOver || wire.cut}
                            className={`flex-1 h-10 rounded-lg relative transition-all ${colorClasses} ${wire.cut ? "opacity-30" : "opacity-80 hover:opacity-100"}`}
                          >
                            {wire.cut && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-full h-0.5 bg-zinc-400" />
                              </div>
                            )}
                          </button>
                          <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {wire.toLetter}
                          </div>
                        </div>
                      );
                    })}
                    <div className="text-xs text-zinc-500 text-center mt-2">
                      Click a wire to cut it
                    </div>
                  </div>
                );
              })()}
              {bomb.wireSequences.solved && (
                <div className="mt-4 text-green-500 font-bold text-center">
                  MODULE DISARMED
                </div>
              )}
            </div>
          )}

          {bomb.simon && (
            <div
              className={`bg-zinc-800 rounded-xl p-6 relative ${bomb.simon.solved ? "opacity-60" : ""}`}
            >
              <div
                className={`absolute top-3 right-3 w-4 h-4 rounded-full ${bomb.simon.solved ? "bg-green-500" : "bg-zinc-600"}`}
              />
              {difficulty === "devtest" && (
                <h2 className="text-lg font-semibold text-zinc-200 mb-4">
                  Simon
                </h2>
              )}
              <div className="flex flex-col items-center">
                <div className="text-zinc-400 text-sm mb-4">
                  {simonPhase === "playing"
                    ? "Watch the sequence..."
                    : simonPhase === "input"
                      ? `Step ${simonInputIndex + 1}/${bomb.simon.sequence.length}`
                      : `Step ${simonInputIndex + 1}/${bomb.simon.sequence.length}`}
                </div>
                <div className="grid grid-cols-2 gap-3 -rotate-45 scale-75">
                  {(["red", "blue", "green", "yellow"] as const).map(
                    (color) => {
                      const isLit =
                        simonLitColor === color && simonPhase === "playing";
                      return (
                        <button
                          key={color}
                          onClick={() => pressSimonButton(color)}
                          disabled={bomb.simon!.solved || bomb.gameOver}
                          className={`w-20 h-20 rounded-lg transition-all duration-150 ${
                            isLit
                              ? "scale-110 shadow-2xl brightness-150"
                              : "brightness-75 hover:brightness-100"
                          } ${
                            color === "red"
                              ? isLit
                                ? "bg-red-400 shadow-red-400/60"
                                : "bg-red-700"
                              : color === "blue"
                                ? isLit
                                  ? "bg-blue-400 shadow-blue-400/60"
                                  : "bg-blue-700"
                                : color === "green"
                                  ? isLit
                                    ? "bg-green-400 shadow-green-400/60"
                                    : "bg-green-700"
                                  : isLit
                                    ? "bg-yellow-300 shadow-yellow-300/60"
                                    : "bg-yellow-600"
                          } disabled:opacity-50`}
                        />
                      );
                    },
                  )}
                </div>
                {simonPhase === "input" && !bomb.simon.solved && (
                  <button
                    onClick={() => {
                      setSimonInputIndex(0);
                      startSimonAutoPlay(bomb.simon!.sequence);
                    }}
                    className="mt-4 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-sm rounded-lg transition-colors"
                  >
                    Replay
                  </button>
                )}
              </div>
              {bomb.simon.solved && (
                <div className="mt-4 text-green-500 font-bold text-center">
                  MODULE DISARMED
                </div>
              )}
            </div>
          )}

          {bomb.passwords && (
            <div
              className={`bg-zinc-800 rounded-xl p-6 relative ${bomb.passwords.solved ? "opacity-60" : ""}`}
            >
              <div
                className={`absolute top-3 right-3 w-4 h-4 rounded-full ${bomb.passwords.solved ? "bg-green-500" : "bg-zinc-600"}`}
              />
              {difficulty === "devtest" && (
                <h2 className="text-lg font-semibold text-zinc-200 mb-4">
                  Passwords
                </h2>
              )}
              <div className="flex flex-col items-center gap-2">
                <div className="grid grid-cols-5 gap-2">
                  {bomb.passwords.columns.map((col, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <button
                        onClick={() => changePasswordLetter(idx, "up")}
                        disabled={bomb.passwords!.solved || bomb.gameOver}
                        className="w-12 h-8 bg-gradient-to-b from-zinc-600 to-zinc-700 rounded-t-lg hover:from-zinc-500 hover:to-zinc-600 disabled:opacity-50 flex items-center justify-center"
                      >
                        <span className="text-zinc-300 text-lg">▲</span>
                      </button>
                      <div className="w-12 h-14 bg-zinc-900 rounded border-2 border-zinc-600 flex items-center justify-center shadow-inner">
                        <span className="text-3xl font-bold text-yellow-400">
                          {col.letters[col.currentIndex]}
                        </span>
                      </div>
                      <button
                        onClick={() => changePasswordLetter(idx, "down")}
                        disabled={bomb.passwords!.solved || bomb.gameOver}
                        className="w-12 h-8 bg-gradient-to-b from-zinc-700 to-zinc-600 rounded-b-lg hover:from-zinc-600 hover:to-zinc-500 disabled:opacity-50 flex items-center justify-center"
                      >
                        <span className="text-zinc-300 text-lg">▼</span>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-zinc-500 mt-2">
                  Form a valid password word
                </div>
              </div>
              {bomb.passwords.solved && (
                <div className="mt-4 text-green-500 font-bold text-center">
                  MODULE DISARMED
                </div>
              )}
            </div>
          )}

          <div
            className={`bg-zinc-800 rounded-xl p-6 relative ${bomb.wires.solved ? "opacity-60" : ""}`}
          >
            <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-zinc-600" />
            <div
              className={`absolute top-3 right-3 w-4 h-4 rounded-full ${bomb.wires.solved ? "bg-green-500" : "bg-zinc-600"}`}
            />
            {difficulty === "devtest" && (
              <h2 className="text-lg font-semibold text-zinc-200 mb-4">
                Wires
              </h2>
            )}
            <div className="space-y-3">
              {bomb.wires.wires.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => cutWire(idx)}
                  disabled={bomb.wires.solved || bomb.wires.cutWire !== null}
                  className={`w-full h-12 rounded-lg flex items-center px-4 ${WIRE_COLORS[color]} ${
                    bomb.wires.cutWire === idx ? "ring-4 ring-red-500" : ""
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
              <div className="mt-4 text-green-500 font-bold text-center">
                MODULE DISARMED
              </div>
            )}
          </div>

          <div
            className={`bg-zinc-800 rounded-xl p-6 relative ${bomb.button.solved ? "opacity-60" : ""}`}
          >
            <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-zinc-600" />
            <div
              className={`absolute top-3 right-3 w-4 h-4 rounded-full ${bomb.button.solved ? "bg-green-500" : "bg-zinc-600"}`}
            />
            {difficulty === "devtest" && (
              <h2 className="text-lg font-semibold text-zinc-200 mb-4">
                The Button
              </h2>
            )}
            <div className="flex flex-col items-center">
              <button
                onMouseDown={pressButton}
                onMouseUp={releaseButton}
                onMouseLeave={() => bomb.button.held && releaseButton()}
                onTouchStart={pressButton}
                onTouchEnd={releaseButton}
                disabled={bomb.button.solved || bomb.gameOver}
                className={`w-32 h-32 rounded-full font-bold text-xl transition-all ${
                  bomb.button.color === "red"
                    ? "bg-red-600 hover:bg-red-500"
                    : bomb.button.color === "blue"
                      ? "bg-blue-600 hover:bg-blue-500"
                      : bomb.button.color === "yellow"
                        ? "bg-yellow-500 hover:bg-yellow-400"
                        : "bg-zinc-300 hover:bg-zinc-200"
                } text-black disabled:opacity-50`}
              >
                {bomb.button.label}
              </button>

              {buttonStrip && (
                <div
                  className={`mt-4 px-6 py-2 rounded ${buttonStrip === "blue" ? "bg-blue-500" : buttonStrip === "white" ? "bg-zinc-200" : buttonStrip === "yellow" ? "bg-yellow-500" : "bg-red-500"}`}
                >
                  <span className="text-black font-bold">HOLDING</span>
                </div>
              )}
            </div>
            {bomb.button.solved && (
              <div className="mt-4 text-green-500 font-bold text-center">
                MODULE DISARMED
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
