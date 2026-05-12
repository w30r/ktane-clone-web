# KTANE Clone Web

A web-based implementation of the bomb defusal puzzle game "Keep Talking and Nobody Explodes".

## Modules

### Easy Mode
- **Wires** - Cut the correct wire based on serial number and wire colors
- **Button** - Hold or release the button at the right time
- **Keypad** - Press symbols in the correct order

### Medium Mode
- **Wires** - Easy modules +:
- **Who's on First** - Identify the correct button based on displayed words
- **Memory** - Remember and repeat the sequence
- **Passwords** - Find the correct password from cycling letters

### Hard Mode
- **All modules** from Medium plus:
- **Simon** - Repeat the color sequence with KTaNE logic
- **Morse Code** - Match frequency to decoded message
- **Complicated Wires** - Complex wire cutting with LED/star/blue stripe rules
- **Wire Sequences** - Cut wires based on letter panel rules

## Features
- Server-side bomb generation
- Sound effects (click, strike, solved, explode, countdown beep)
- iOS PWA support (add to homescreen)
- Mobile-optimized layout
- Touch support for button hold
- Difficulty selection (Easy/Medium/Hard)
- Timer selection (3/5/8 minutes)

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- KTaNE Wiki images for icons