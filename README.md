# Cruciverbalizer

A reading comprehension crossword generator. Input any text and get an interactive crossword puzzle where clues are based on the article content.

## Features

- **Automatic keyword extraction** from input text using NLP (retext-keywords)
- **AI-powered clue generation** using Anthropic Claude API for reading comprehension clues
- **Smart grid generation** using constraint satisfaction algorithms
- **Customizable filler words** to help with grid construction
- **Interactive crossword solver** built with React

## How It Works

1. **Extract Keywords** - Uses NLP to identify significant terms from the input text
2. **Generate Reading Comprehension Clues** - Claude API creates clues that reference the article
3. **Build Crossword Grid** - Constraint satisfaction algorithm places words with proper crossword rules
4. **Mix Filler Words** - Optional common crossword words added to improve grid density
5. **Display Interactive Puzzle** - Solve using standard crossword interface

## Getting Started

### Prerequisites

- Node.js 18+
- Anthropic API key

### Installation

```bash
npm install
```

### Environment Setup

Create a `.env.local` file:

```
VITE_ANTHROPIC_API_KEY=your-api-key-here
```

### Development

```bash
npm run dev
```

Open http://localhost:5173 and paste text to generate crosswords.

### Build

```bash
npm run build
```

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **NLP**: retext + retext-keywords + retext-pos
- **LLM**: Anthropic Claude Sonnet
- **Crossword Display**: @jaredreisinger/react-crossword
- **Grid Generation**: Custom CSP algorithm

## How Clues Work

Clues are generated to test reading comprehension, not just general knowledge. For example:

- Good clue: "Body that learned 'hard lessons about the limits of its power'" (requires reading)
- Bad clue: "Legislative body" (general knowledge)

## Grid Generation Rules

Valid crossword grids follow these rules:

1. No letter directly before word start (left for across, above for down)
2. No letter directly after word end
3. Each letter must be part of both an across and down word (when possible)
4. No parallel adjacency (words running side-by-side)
5. All intersections must match letters exactly

## License

MIT
