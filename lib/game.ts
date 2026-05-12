export type WireColor = 'red' | 'blue' | 'yellow' | 'white' | 'black';

export type WireConfig = {
  wires: WireColor[];
  solved: boolean;
  cutWire: number | null;
};

export type ButtonColor = 'red' | 'blue' | 'yellow' | 'white';
export type ButtonLabel = 'Detonate' | 'Hold' | 'Abort';

export type ButtonConfig = {
  color: ButtonColor;
  label: ButtonLabel;
  solved: boolean;
  held: boolean;
  released: boolean;
};

export type SimonColor = 'blue' | 'yellow' | 'red' | 'green';

export type SimonConfig = {
  sequence: SimonColor[];
  stage: number;
  solved: boolean;
  lastFlash: SimonColor | null;
};

export type PasswordColumn = {
  letters: string;
  currentIndex: number;
};

const PASSWORD_LETTERS_PER_SLOT = 6;

export type PasswordConfig = {
  columns: PasswordColumn[];
  solved: boolean;
};

export type KeypadSymbol = 
  | 'balloon' | 'copyright' | 'doublek' | 'euro' | 'filledstar' 
  | 'hollowstar' | 'hookn' | 'meltedthree' | 'omega' | 'paragraph'
  | 'pitchfork' | 'press' | 'six' | 'smileyface' | 'squidknife'
  | 'squigglyn' | 'tracks' | 'upsidedowny'
  | 'at' | 'ae' | 'cursive' | 'rightc' | 'leftc'
  | 'questionmark' | 'dragon' | 'nwithhat' | 'bt' | 'pumpkin';

export type KeypadConfig = {
  symbols: KeypadSymbol[];
  column: KeypadSymbol[];
  solved: boolean;
  pressed: number;
  pressedSymbols: KeypadSymbol[];
};

export type WhosOnFirstConfig = {
  display: string;
  buttons: string[];
  solved: boolean;
  stage: number;
};

export type MemoryConfig = {
  display: number;
  buttons: string[];
  stage: number;
  solved: boolean;
  pressedLabels: string[];
  pressedPositions: number[];
};

export type MorseCodeConfig = {
  word: string;
  frequency: number;
  solved: boolean;
};

export type ComplicatedWireColor = 'red' | 'blue' | 'yellow' | 'white' | 'black' | 'redblue';

export type ComplicatedWire = {
  color: ComplicatedWireColor;
  hasLED: boolean;
  hasStar: boolean;
  cut: boolean;
};

export type ComplicatedWiresConfig = {
  wires: ComplicatedWire[];
  solved: boolean;
};

export type WireSequenceWire = {
  color: 'red' | 'blue' | 'black';
  fromPosition: number;
  toLetter: 'A' | 'B' | 'C';
  cut?: boolean;
  occurrence: number;
};

export type WireSequencePanel = {
  letter: 'A' | 'B' | 'C';
  wires: WireSequenceWire[];
};

export type WireSequencesConfig = {
  panels: WireSequencePanel[];
  currentPanel: number;
  currentWire: number;
  solved: boolean;
  cutWires: string[];
  redSeen: number;
  blueSeen: number;
  blackSeen: number;
};

const PANEL_LETTERS: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];
const WIRE_COLORS: ('red' | 'blue' | 'black')[] = ['red', 'blue', 'black'];

export function generateWireSequences(): WireSequencesConfig {
  const panels: WireSequencePanel[] = [];
  let redCount = 0;
  let blueCount = 0;
  let blackCount = 0;
  
  for (let i = 0; i < 3; i++) {
    const numWires = 3 + Math.floor(Math.random() * 4);
    const wires: WireSequenceWire[] = [];
    for (let j = 0; j < numWires; j++) {
      const color = randomItem(WIRE_COLORS);
      const occurrence = color === 'red' ? ++redCount : color === 'blue' ? ++blueCount : ++blackCount;
      wires.push({
        color,
        fromPosition: j % 3,
        toLetter: randomItem(PANEL_LETTERS),
        occurrence,
      });
    }
    panels.push({
      letter: PANEL_LETTERS[i],
      wires,
    });
  }
  
  return {
    panels,
    currentPanel: 0,
    currentWire: 0,
    solved: false,
    cutWires: [],
    redSeen: 0,
    blueSeen: 0,
    blackSeen: 0,
  };
}

const SEQUENCE_LOGIC: Record<string, string[][]> = {
  red: [
    ['C'], ['B'], ['A'], ['A', 'C'], ['B'],
    ['A', 'C'], ['A', 'B', 'C'], ['A', 'B'], ['B']
  ],
  blue: [
    ['B'], ['A', 'C'], ['B'], ['A'], ['B'],
    ['B', 'C'], ['C'], ['A', 'C'], ['A']
  ],
  black: [
    ['A', 'B', 'C'], ['A', 'C'], ['B'], ['A', 'C'], ['B'],
    ['B', 'C'], ['A', 'B'], ['C'], ['C']
  ],
};

export function getWireSequenceSolution(
  panel: 'A' | 'B' | 'C',
  wireColor: 'red' | 'blue' | 'black',
  occurrence: number
): { cut: boolean; message: string } {
  const validDestinations = SEQUENCE_LOGIC[wireColor][occurrence - 1] || [];
  const isCut = validDestinations.includes(panel);
  return { cut: isCut, message: isCut ? 'Cut' : 'Do not cut' };
}

const WIRE_LOGIC: Record<string, string> = {
  "0000": "C",
  "0001": "D",
  "0010": "C",
  "0011": "B",
  "1000": "S",
  "1001": "B",
  "1010": "C",
  "1011": "B",
  "0100": "S",
  "0101": "P",
  "0110": "D",
  "0111": "P",
  "1100": "S",
  "1101": "S",
  "1110": "P",
  "1111": "D",
};

export function shouldCutWire(wire: ComplicatedWire, bomb: Bomb): boolean {
  const isRed = wire.color === 'red' || wire.color === 'redblue';
  const isBlue = wire.color === 'blue' || wire.color === 'redblue';
  
  const key = `${isRed ? '1' : '0'}${isBlue ? '1' : '0'}${wire.hasStar ? '1' : '0'}${wire.hasLED ? '1' : '0'}`;
  const action = WIRE_LOGIC[key] || "D";
  
  const serialIsEven = !isSerialOdd(bomb);
  
  switch (action) {
    case 'C': return true;
    case 'D': return false;
    case 'S': return serialIsEven;
    case 'P': return bomb.ports.includes('Parallel');
    case 'B': return bomb.batteries >= 2;
    default: return false;
  }
}

export function getComplicatedWireSolution(wires: ComplicatedWire[], bomb: Bomb): boolean[] {
  return wires.map(wire => shouldCutWire(wire, bomb));
}

export function generateComplicatedWires(seed: number): ComplicatedWiresConfig {
  const colors: ComplicatedWireColor[] = ['red', 'blue', 'yellow', 'white', 'black', 'redblue'];
  const numWires = 6 + Math.floor(Math.random() * 3);
  const wires: ComplicatedWire[] = [];
  
  for (let i = 0; i < numWires; i++) {
    wires.push({
      color: randomItem(colors),
      hasLED: Math.random() > 0.5,
      hasStar: Math.random() > 0.5,
      cut: false,
    });
  }
  
  return { wires, solved: false };
}

const MORSE_WORDS = [
  { word: 'shell', freq: 3.505 },
  { word: 'halls', freq: 3.515 },
  { word: 'slick', freq: 3.522 },
  { word: 'trick', freq: 3.532 },
  { word: 'boxes', freq: 3.535 },
  { word: 'leaks', freq: 3.542 },
  { word: 'strobe', freq: 3.545 },
  { word: 'bistro', freq: 3.552 },
  { word: 'flick', freq: 3.555 },
  { word: 'bombs', freq: 3.565 },
  { word: 'break', freq: 3.572 },
  { word: 'brick', freq: 3.575 },
  { word: 'steak', freq: 3.582 },
  { word: 'sting', freq: 3.592 },
  { word: 'vector', freq: 3.595 },
  { word: 'beats', freq: 3.600 },
];

const MORSE_CODE: Record<string, string> = {
  'A': '.-',
  'B': '-...',
  'C': '-.-.',
  'D': '-..',
  'E': '.',
  'F': '..-.',
  'G': '--.',
  'H': '....',
  'I': '..',
  'J': '.---',
  'K': '-.-',
  'L': '.-..',
  'M': '--',
  'N': '-.',
  'O': '---',
  'P': '.--.',
  'Q': '--.-',
  'R': '.-.',
  'S': '...',
  'T': '-',
  'U': '..-',
  'V': '...-',
  'W': '.--',
  'X': '-..-',
  'Y': '-.--',
  'Z': '--..',
};

export function generateMorseCode(): MorseCodeConfig {
  const morseEntry = randomItem(MORSE_WORDS);
  return {
    word: morseEntry.word,
    frequency: morseEntry.freq,
    solved: false,
  };
}

export function getMorseCodeSequence(word: string): string[] {
  return word.toUpperCase().split('').map(letter => MORSE_CODE[letter] || '').filter(Boolean);
}

const MEMORY_LABELS = ['1', '2', '3', '4'];

export function generateMemory(): MemoryConfig {
  const labels = [...MEMORY_LABELS].sort(() => Math.random() - 0.5);
  return {
    display: Math.floor(Math.random() * 4) + 1,
    buttons: labels,
    stage: 0,
    solved: false,
    pressedLabels: [],
    pressedPositions: [],
  };
}

export function getMemorySolution(config: MemoryConfig): { position: number; label: string } | null {
  const display = config.display;
  const stage = config.stage;
  const pressedLabel = config.pressedLabels[0];
  const pressedPosition = config.pressedPositions[0];
  const pressedLabel2 = config.pressedLabels[1];
  const pressedPosition2 = config.pressedPositions[1];
  const pressedLabel4 = config.pressedLabels[3];
  const pressedLabel3 = config.pressedLabels[2];
  
  if (stage === 0) {
    switch (display) {
      case 1: return { position: 1, label: '' };
      case 2: return { position: 1, label: '' };
      case 3: return { position: 2, label: '' };
      case 4: return { position: 3, label: '' };
    }
  }
  
  if (stage === 1) {
    switch (display) {
      case 1: return { position: -1, label: '4' };
      case 2: return { position: pressedPosition, label: '' };
      case 3: return { position: 0, label: '' };
      case 4: return { position: pressedPosition, label: '' };
    }
  }
  
  if (stage === 2) {
    switch (display) {
      case 1: return { position: -1, label: pressedLabel2 || '' };
      case 2: return { position: -1, label: pressedLabel || '' };
      case 3: return { position: 2, label: '' };
      case 4: return { position: -1, label: '4' };
    }
  }
  
  if (stage === 3) {
    switch (display) {
      case 1: return { position: pressedPosition, label: '' };
      case 2: return { position: 0, label: '' };
      case 3: return { position: pressedPosition2, label: '' };
      case 4: return { position: pressedPosition2, label: '' };
    }
  }
  
  if (stage === 4) {
    switch (display) {
      case 1: return { position: -1, label: pressedLabel || '' };
      case 2: return { position: -1, label: pressedLabel2 || '' };
      case 3: return { position: -1, label: pressedLabel4 || '' };
      case 4: return { position: -1, label: pressedLabel3 || '' };
    }
  }
  
  return null;
}

const WHOSONFIRST_DISPLAYS = [
  'YES', 'FIRST', 'DISPLAY', 'OKAY', 'SAYS', 'NOTHING', 'BLANK', 'NO',
  'LED', 'LEAD', 'READ', 'RED', 'REED', 'LEED', 'HOLD ON', 'YOU',
  'YOU ARE', 'YOUR', "YOU'RE", 'UR', 'THERE', "THEY'RE", 'THEIR',
  'THEY ARE', 'SEE', 'C', 'CEE'
];

const WHOSONFIRST_BUTTON_LABELS = [
  'YES', 'OKAY', 'WHAT', 'MIDDLE', 'LEFT', 'PRESS', 'RIGHT', 'BLANK',
  'READY', 'NO', 'FIRST', 'UHHH', 'NOTHING', 'WAIT', 'READY', 'BLANK',
  'WHAT', 'PRESS', 'FIRST', 'NOTHING', 'WAIT', 'YES', 'LEFT', 'YOU',
  'SURE', 'YOU ARE', 'YOUR', "YOU'RE", 'NEXT', 'UH HUH', 'UR', 'HOLD',
  'WHAT?', 'DONE', 'U'
];

const DISPLAY_MAP: Record<string, number> = {
  "UR": 0, "FIRST": 1, "OKAY": 1, "C": 1, "YES": 2, "NOTHING": 2,
  "LED": 2, "THEY ARE": 2, "BLANK": 3, "READ": 3, "RED": 3, "YOU": 3,
  "YOUR": 3, "YOU'RE": 3, "THEIR": 3, "": 4, "REED": 4, "LEED": 4,
  "THEY'RE": 4, "DISPLAY": 5, "SAYS": 5, "NO": 5, "LEAD": 5,
  "HOLD ON": 5, "YOU ARE": 5, "THERE": 5, "SEE": 5, "CEE": 5
};

const PRIORITY_LISTS: Record<string, string[]> = {
  "READY": ["YES", "OKAY", "WHAT", "MIDDLE", "LEFT", "PRESS", "RIGHT", "BLANK", "READY", "NO", "FIRST", "UHHH", "NOTHING", "WAIT"],
  "FIRST": ["LEFT", "OKAY", "YES", "MIDDLE", "NO", "RIGHT", "NOTHING", "UHHH", "WAIT", "READY", "BLANK", "WHAT", "PRESS", "FIRST"],
  "NO": ["BLANK", "UHHH", "WAIT", "FIRST", "WHAT", "READY", "RIGHT", "YES", "NOTHING", "LEFT", "PRESS", "OKAY", "NO", "MIDDLE"],
  "BLANK": ["WAIT", "RIGHT", "OKAY", "MIDDLE", "BLANK", "PRESS", "READY", "NOTHING", "NO", "WHAT", "LEFT", "UHHH", "YES", "FIRST"],
  "NOTHING": ["UHHH", "RIGHT", "OKAY", "MIDDLE", "YES", "BLANK", "NO", "PRESS", "LEFT", "WHAT", "WAIT", "FIRST", "NOTHING", "READY"],
  "YES": ["OKAY", "RIGHT", "UHHH", "MIDDLE", "FIRST", "WHAT", "PRESS", "READY", "NOTHING", "YES", "LEFT", "BLANK", "NO", "WAIT"],
  "WHAT": ["UHHH", "WHAT", "LEFT", "NOTHING", "READY", "BLANK", "MIDDLE", "NO", "OKAY", "FIRST", "WAIT", "YES", "PRESS", "RIGHT"],
  "UHHH": ["READY", "NOTHING", "LEFT", "WHAT", "OKAY", "YES", "RIGHT", "NO", "PRESS", "BLANK", "UHHH", "WAIT", "FIRST", "MIDDLE"],
  "LEFT": ["RIGHT", "LEFT", "READY", "NO", "MIDDLE", "OKAY", "UHHH", "WHAT", "WAIT", "FIRST", "NOTHING", "READY", "BLANK", "YES"],
  "RIGHT": ["YES", "NOTHING", "READY", "PRESS", "NO", "WAIT", "WHAT", "RIGHT", "MIDDLE", "LEFT", "UHHH", "BLANK", "OKAY", "FIRST"],
  "MIDDLE": ["BLANK", "READY", "OKAY", "WHAT", "NOTHING", "PRESS", "NO", "WAIT", "LEFT", "MIDDLE", "RIGHT", "FIRST", "UHHH", "YES"],
  "OKAY": ["MIDDLE", "NO", "FIRST", "YES", "UHHH", "NOTHING", "WAIT", "OKAY", "LEFT", "READY", "BLANK", "PRESS", "WHAT", "RIGHT"],
  "WAIT": ["UHHH", "NO", "BLANK", "OKAY", "YES", "LEFT", "FIRST", "PRESS", "WHAT", "WAIT", "NOTHING", "READY", "RIGHT", "MIDDLE"],
  "PRESS": ["RIGHT", "MIDDLE", "YES", "READY", "PRESS", "OKAY", "NOTHING", "UHHH", "BLANK", "LEFT", "FIRST", "WHAT", "NO", "WAIT"],
  "YOU": ["SURE", "YOU ARE", "YOUR", "YOU'RE", "NEXT", "UH HUH", "UR", "HOLD", "WHAT?", "YOU", "U", "DONE", "UHHH", "LIKE"],
  "YOU ARE": ["YOUR", "NEXT", "LIKE", "UH HUH", "WHAT?", "DONE", "UHHH", "HOLD", "YOU", "U", "YOU'RE", "SURE", "UR", "YOU ARE"],
  "YOUR": ["UH HUH", "YOU ARE", "UH UH", "YOUR", "NEXT", "UR", "SURE", "U", "YOU'RE", "YOU", "WHAT?", "HOLD", "LIKE", "DONE"],
  "YOU'RE": ["YOU", "YOU'RE", "UR", "NEXT", "UH UH", "YOU ARE", "U", "YOUR", "WHAT?", "UH HUH", "DONE", "LIKE", "HOLD", "SURE"],
  "UR": ["DONE", "U", "UR", "UH HUH", "WHAT?", "SURE", "YOUR", "IT", "HOLD", "YOU'RE", "LIKE", "NEXT", "UH UH", "YOU ARE"],
  "U": ["UH HUH", "SURE", "NEXT", "WHAT?", "YOU'RE", "UR", "UH UH", "DONE", "U", "YOU", "LIKE", "HOLD", "YOU ARE", "YOUR"],
  "UH HUH": ["UH HUH", "YOUR", "YOU ARE", "YOU", "DONE", "HOLD", "UH UH", "NEXT", "SURE", "LIKE", "YOU'RE", "UR", "U", "WHAT?"],
  "UH UH": ["UR", "U", "DONE", "UH UH", "NEXT", "YOU", "YOU'RE", "SURE", "HOLD", "UH HUH", "YOUR", "IT", "WHAT?", "YOU ARE"],
  "WHAT?": ["YOU", "HOLD", "YOU'RE", "YOUR", "U", "DONE", "UH UH", "LIKE", "YOU ARE", "UH HUH", "UR", "NEXT", "WHAT?", "SURE"],
  "DONE": ["SURE", "UH HUH", "NEXT", "WHAT?", "YOUR", "UR", "YOU'RE", "HOLD", "LIKE", "YOU", "U", "YOU ARE", "UH UH", "DONE"],
  "NEXT": ["WHAT?", "UH HUH", "UH UH", "YOUR", "HOLD", "SURE", "NEXT", "LIKE", "DONE", "YOU ARE", "UR", "YOU'RE", "U", "YOU"],
  "HOLD": ["SURE", "YOU ARE", "NEXT", "DONE", "UH HUH", "UR", "UH UH", "IT", "YOUR", "WHAT?", "YOU", "U", "YOU'RE", "HOLD"],
  "SURE": ["YOU ARE", "DONE", "LIKE", "YOU'RE", "YOU", "HOLD", "UH HUH", "UR", "SURE", "U", "NEXT", "UH UH", "YOUR", "WHAT?"],
  "LIKE": ["YOU'RE", "NEXT", "U", "UR", "HOLD", "DONE", "UH UH", "WHAT?", "UH HUH", "YOU", "LIKE", "SURE", "YOU ARE", "YOUR"]
};

export function generateWhosOnFirst(): WhosOnFirstConfig {
  const display = randomItem(WHOSONFIRST_DISPLAYS);
  const buttonLabels = [...WHOSONFIRST_BUTTON_LABELS];
  const shuffled = buttonLabels.sort(() => Math.random() - 0.5).slice(0, 6);
  
  return {
    display,
    buttons: shuffled,
    solved: false,
    stage: 0,
  };
}

export function getWhosOnFirstSolution(config: WhosOnFirstConfig): string {
  const readIndex = DISPLAY_MAP[config.display];
  if (readIndex === undefined) return config.buttons[0];
  
  const labelToLookUp = config.buttons[readIndex];
  if (!labelToLookUp) return config.buttons[0];
  
  const list = PRIORITY_LISTS[labelToLookUp];
  if (!list) return config.buttons[0];
  
  return list.find(word => config.buttons.includes(word)) || config.buttons[0];
}

const KEYPAD_COLUMNS: KeypadSymbol[][] = [
  ['balloon', 'at', 'upsidedowny', 'squigglyn', 'squidknife', 'hookn', 'leftc'],
  ['euro', 'balloon', 'leftc', 'cursive', 'hollowstar', 'hookn', 'questionmark'],
  ['copyright', 'pumpkin', 'cursive', 'doublek', 'meltedthree', 'upsidedowny', 'hollowstar'],
  ['six', 'paragraph', 'bt', 'squidknife', 'doublek', 'questionmark', 'smileyface'],
  ['pitchfork', 'smileyface', 'bt', 'rightc', 'paragraph', 'dragon', 'filledstar'],
  ['six', 'euro', 'tracks', 'ae', 'pitchfork', 'nwithhat', 'omega'],
];

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateKeypad(): KeypadConfig {
  const column = randomItem(KEYPAD_COLUMNS);
  const shuffled = shuffle(column).slice(0, 4);
  
  return {
    symbols: shuffled,
    column,
    solved: false,
    pressed: -1,
    pressedSymbols: [],
  };
}

export function solveKeypad(inputSymbols: KeypadSymbol[]): KeypadSymbol[] {
  const matchingColumn = KEYPAD_COLUMNS.find(col =>
    inputSymbols.every(sym => col.includes(sym))
  );
  
  if (!matchingColumn) return inputSymbols;
  
  return [...inputSymbols].sort((a, b) => 
    matchingColumn.indexOf(a) - matchingColumn.indexOf(b)
  );
}

export function checkKeypadOrder(config: KeypadConfig, symbol: KeypadSymbol): boolean {
  if (config.solved) return false;
  
  const expectedOrder = solveKeypad(config.symbols);
  const currentIndex = config.pressed + 1;
  const expectedSymbol = expectedOrder[currentIndex];
  
  return symbol === expectedSymbol;
}

export type Bomb = {
  serialNumber: string;
  batteries: number;
  indicators: string[];
  ports: string[];
  timerSeconds: number;
  initialTimerSeconds: number;
  strikes: number;
  maxStrikes: number;
  gameOver: boolean;
  won: boolean;
  wires: WireConfig;
  button: ButtonConfig;
  keypad?: KeypadConfig;
  whosOnFirst?: WhosOnFirstConfig;
  memory?: MemoryConfig;
  morseCode?: MorseCodeConfig;
  complicatedWires?: ComplicatedWiresConfig;
  wireSequences?: WireSequencesConfig;
  simon?: SimonConfig;
  passwords?: PasswordConfig;
};

const SERIAL_LETTERS: string[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const SERIAL_DIGITS: string[] = '0123456789'.split('');
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

const SIMON_COLORS: SimonColor[] = ['blue', 'yellow', 'red', 'green'];

const ALL_PORTS = ['DVI-D', 'Parallel', 'PS/2', 'RJ-45', 'Serial', 'Stereo RCA'];

function randomPorts(): string[] {
  const count = Math.floor(Math.random() * 3);
  const ports: string[] = [];
  const available = [...ALL_PORTS];
  for (let i = 0; i < count; i++) {
    if (available.length === 0) break;
    const idx = Math.floor(Math.random() * available.length);
    ports.push(available.splice(idx, 1)[0]);
  }
  return ports;
}

export const PASSWORD_WORDS = new Set([
  'about', 'after', 'again', 'below', 'could', 'every', 'first', 'found', 'great', 'house',
  'large', 'learn', 'never', 'other', 'place', 'plant', 'point', 'right', 'small', 'sound',
  'spell', 'still', 'study', 'their', 'there', 'these', 'thing', 'think', 'three', 'water',
  'where', 'which', 'world', 'would', 'write'
]);

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSerialNumber(): string {
  const letter1 = randomItem(SERIAL_LETTERS);
  const letter2 = randomItem(SERIAL_LETTERS);
  const digit1 = randomItem(SERIAL_DIGITS);
  const digit2 = randomItem(SERIAL_DIGITS);
  return `${letter1}${letter2}${digit1}${digit2}`;
}

function randomBatteries(): number {
  return Math.floor(Math.random() * 5) + 1;
}

function randomIndicators(): string[] {
  const allIndicators = ['SND', 'CLR', 'CAR', 'IND', 'FRQ', 'SIG', 'NSA', 'MSA', 'TRN', 'BOB', 'FRK'];
  const count = Math.floor(Math.random() * 4);
  const selected: string[] = [];
  for (let i = 0; i < count; i++) {
    const ind = randomItem(allIndicators);
    if (!selected.includes(ind)) selected.push(ind);
  }
  return selected;
}

function randomWires(): WireColor[] {
  const colors: WireColor[] = ['red', 'blue', 'yellow', 'white', 'black'];
  const wireCount = Math.floor(Math.random() * 4) + 3;
  const wires: WireColor[] = [];
  for (let i = 0; i < wireCount; i++) {
    wires.push(randomItem(colors));
  }
  return wires;
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'devtest';

export function createBomb(timerMinutes: number, difficulty: Difficulty): Bomb {
  const serialNumber = randomSerialNumber();
  const batteries = randomBatteries();
  const indicators = randomIndicators();
  const ports = randomPorts();
  const timerSeconds = timerMinutes * 60;
  
  const bomb: Bomb = {
    serialNumber,
    batteries,
    indicators,
    ports,
    timerSeconds,
    initialTimerSeconds: timerSeconds,
    strikes: 0,
    maxStrikes: 3,
    gameOver: false,
    won: false,
    wires: {
      wires: randomWires(),
      solved: false,
      cutWire: null,
    },
    button: {
      color: randomItem(['red', 'blue', 'yellow', 'white']),
      label: randomItem(['Detonate', 'Hold', 'Abort']),
      solved: false,
      held: false,
      released: false,
    },
  };

  if (difficulty === 'devtest') {
    bomb.keypad = generateKeypad();
    bomb.whosOnFirst = generateWhosOnFirst();
    bomb.memory = generateMemory();
    bomb.morseCode = generateMorseCode();
    bomb.complicatedWires = generateComplicatedWires(0);
    bomb.wireSequences = generateWireSequences();
    bomb.simon = generateSimon();
    bomb.passwords = { columns: generatePasswordColumns(), solved: false };
  } else if (difficulty === 'easy') {
    bomb.keypad = generateKeypad();
  } else if (difficulty === 'medium') {
    bomb.keypad = generateKeypad();
    bomb.whosOnFirst = generateWhosOnFirst();
    bomb.memory = generateMemory();
    bomb.passwords = { columns: generatePasswordColumns(), solved: false };
  } else {
    bomb.keypad = generateKeypad();
    bomb.whosOnFirst = generateWhosOnFirst();
    bomb.memory = generateMemory();
    bomb.morseCode = generateMorseCode();
    bomb.complicatedWires = generateComplicatedWires(0);
    bomb.wireSequences = generateWireSequences();
    bomb.simon = generateSimon();
    bomb.passwords = { columns: generatePasswordColumns(), solved: false };
  }
  
  return bomb;
}

export function getSerialLastDigit(bomb: Bomb): number {
  return parseInt(bomb.serialNumber.slice(-1), 10);
}

export function hasIndicator(bomb: Bomb, indicator: string): boolean {
  return bomb.indicators.includes(indicator);
}

export function isSerialOdd(bomb: Bomb): boolean {
  return getSerialLastDigit(bomb) % 2 === 1;
}

export function countWiresByColor(wires: WireColor[], color: WireColor): number {
  return wires.filter((w) => w === color).length;
}

export function getCorrectWireToCut(bomb: Bomb): number {
  const wires = bomb.wires.wires;
  const wireCount = wires.length;
  const serialLastDigit = getSerialLastDigit(bomb);
  const serialIsOdd = serialLastDigit % 2 === 1;
  const redCount = countWiresByColor(wires, 'red');
  const blueCount = countWiresByColor(wires, 'blue');
  const yellowCount = countWiresByColor(wires, 'yellow');
  const whiteCount = countWiresByColor(wires, 'white');
  const blackCount = countWiresByColor(wires, 'black');
  const lastWire = wires[wireCount - 1];

  if (wireCount === 3) {
    if (redCount === 0) return 1;
    if (lastWire === 'white') return wireCount - 1;
    if (blueCount > 1) return wires.lastIndexOf('blue');
    return wireCount - 1;
  }

  if (wireCount === 4) {
    if (redCount > 1 && serialIsOdd) return wires.lastIndexOf('red');
    if (lastWire === 'yellow' && redCount === 0) return 0;
    if (blueCount === 1) return 0;
    if (yellowCount > 1) return wireCount - 1;
    return 1;
  }

  if (wireCount === 5) {
    if (lastWire === 'black' && serialIsOdd) return 3;
    if (redCount === 1 && yellowCount > 1) return 0;
    if (blackCount === 0) return 1;
    return 0;
  }

  if (wireCount === 6) {
    if (yellowCount === 0 && serialIsOdd) return 2;
    if (yellowCount === 1 && whiteCount > 1) return 3;
    if (redCount === 0) return wireCount - 1;
    return 3;
  }

  return 0;
}

export function shouldHoldButton(bomb: Bomb): boolean {
  const { color, label } = bomb.button;

  if (color === 'blue' && label === 'Abort') return true;
  if (bomb.batteries > 1 && label === 'Detonate') return false;
  if (color === 'white' && hasIndicator(bomb, 'CAR')) return true;
  if (bomb.batteries > 2 && hasIndicator(bomb, 'FRK')) return false;
  if (color === 'yellow') return true;
  if (color === 'red' && label === 'Hold') return false;
  return true;
}

export function getButtonReleaseDigit(bomb: Bomb, stripColor: string): number {
  const releaseMap: Record<string, number> = {
    blue: 4,
    white: 1,
    yellow: 5,
  };
  return releaseMap[stripColor] ?? 1;
}

export function hasVowel(bomb: Bomb): boolean {
  const firstLetter = bomb.serialNumber[0] as string;
  const secondLetter = bomb.serialNumber[1] as string;
  return VOWELS.has(firstLetter) || VOWELS.has(secondLetter);
}

export function hasPort(bomb: Bomb, port: string): boolean {
  return bomb.ports.includes(port);
}

export function isSerialEven(bomb: Bomb): boolean {
  return getSerialLastDigit(bomb) % 2 === 0;
}

const SIMON_MAPS: Record<string, Record<number, Record<SimonColor, SimonColor>>> = {
  hasVowel: {
    0: { red: "blue", blue: "red", green: "yellow", yellow: "green" },
    1: { red: "yellow", blue: "blue", green: "green", yellow: "red" },
    2: { red: "green", blue: "red", green: "yellow", yellow: "blue" }
  },
  noVowel: {
    0: { red: "blue", blue: "yellow", green: "green", yellow: "red" },
    1: { red: "red", blue: "blue", green: "yellow", yellow: "green" },
    2: { red: "yellow", blue: "green", green: "blue", yellow: "red" }
  }
};

export function getSimonPressColor(flashColor: SimonColor, strikes: number, hasVowel: boolean): SimonColor {
  const strikeKey = Math.min(strikes, 2);
  const vowelKey = hasVowel ? "hasVowel" : "noVowel";
  return SIMON_MAPS[vowelKey][strikeKey][flashColor];
}

export function validatePassword(columns: PasswordColumn[]): boolean {
  const word = columns.map(col => 
    col.letters[col.currentIndex]
  ).join('').toLowerCase();
  
  return PASSWORD_WORDS.has(word);
}

export function generateRandomSimonFlash(): SimonColor {
  return SIMON_COLORS[Math.floor(Math.random() * SIMON_COLORS.length)];
}

export function generatePasswordColumns(): PasswordColumn[] {
  const words = Array.from(PASSWORD_WORDS);
  const solutionWord = words[Math.floor(Math.random() * words.length)];
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  return solutionWord.split('').map((correctLetter) => {
    const pool = [correctLetter];
    const remaining = alphabet.replace(correctLetter, '');
    for (let i = 0; i < PASSWORD_LETTERS_PER_SLOT - 1; i++) {
      const randomIdx = Math.floor(Math.random() * remaining.length);
      pool.push(remaining[randomIdx]);
      // Remove the used letter to avoid duplicates
      const remainingArr = remaining.split('');
      remainingArr.splice(randomIdx, 1);
    }
    // Shuffle so correct letter isn't at same position
    const shuffled = pool.sort(() => Math.random() - 0.5);
    return {
      letters: shuffled.join(''),
      currentIndex: Math.floor(Math.random() * PASSWORD_LETTERS_PER_SLOT)
    };
  });
}

export function generateSimon(): SimonConfig {
  const sequence = Array.from({ length: 4 }, () => generateRandomSimonFlash());
  return {
    sequence,
    stage: 0,
    solved: false,
    lastFlash: null,
  };
}