export interface Keyword {
  word: string;
  context: string;
  score: number;
}

export interface ClueAnswer {
  word: string;
  clue: string;
  isGeneric: boolean;
}

export interface PlacedWord {
  word: string;
  clue: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
  number: number;
}

export interface CrosswordGrid {
  cells: (string | null)[][];
  placedWords: PlacedWord[];
  width: number;
  height: number;
}

// Format expected by @jaredreisinger/react-crossword
export interface CrosswordData {
  across: Record<string, CrosswordClue>;
  down: Record<string, CrosswordClue>;
}

export interface CrosswordClue {
  clue: string;
  answer: string;
  row: number;
  col: number;
}

export interface GenerationState {
  status: 'idle' | 'extracting' | 'generating-clues' | 'building-grid' | 'complete' | 'error';
  progress: number;
  message: string;
}
