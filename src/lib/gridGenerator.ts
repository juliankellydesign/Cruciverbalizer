import type { ClueAnswer, CrosswordGrid, PlacedWord } from '../types/crossword';

interface Position {
  row: number;
  col: number;
  direction: 'across' | 'down';
}

interface Candidate {
  word: string;
  clue: string;
  position: Position;
  score: number;
  intersections: number;
}

// Track which cells are covered by which direction
type CellCoverage = {
  across: boolean;
  down: boolean;
};

/**
 * Calculate optimal grid size based on words
 */
function calculateGridSize(words: string[]): number {
  const totalLetters = words.reduce((sum, w) => sum + w.length, 0);
  const rawSize = Math.sqrt(totalLetters * 2);
  const size = Math.round(rawSize);
  return Math.max(15, size % 2 === 0 ? size + 1 : size);
}

/**
 * Get cell value from grid safely
 */
function getCell(grid: (string | null)[][], row: number, col: number): string | null {
  if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length) {
    return null;
  }
  return grid[row][col];
}

/**
 * Check if a word can be placed at a position following crossword rules:
 * 1. Word must fit in grid
 * 2. No letter directly before the word start (left for across, above for down)
 * 3. No letter directly after the word end
 * 4. Each letter must either:
 *    - Match an existing letter (intersection), OR
 *    - Be empty with no parallel adjacent letters (no side-by-side words)
 * 5. Must have at least one intersection with existing words (except first word)
 */
function canPlace(
  grid: (string | null)[][],
  coverage: Map<string, CellCoverage>,
  word: string,
  row: number,
  col: number,
  direction: 'across' | 'down',
  isFirstWord: boolean
): { valid: boolean; intersections: number } {
  const height = grid.length;
  const width = grid[0].length;
  let intersections = 0;

  // Check bounds
  if (direction === 'across') {
    if (col < 0 || col + word.length > width || row < 0 || row >= height) {
      return { valid: false, intersections: 0 };
    }
  } else {
    if (row < 0 || row + word.length > height || col < 0 || col >= width) {
      return { valid: false, intersections: 0 };
    }
  }

  // Rule 2 & 3: Check no letters before start or after end
  if (direction === 'across') {
    // No letter to the left of start
    if (getCell(grid, row, col - 1) !== null) {
      return { valid: false, intersections: 0 };
    }
    // No letter to the right of end
    if (getCell(grid, row, col + word.length) !== null) {
      return { valid: false, intersections: 0 };
    }
  } else {
    // No letter above start
    if (getCell(grid, row - 1, col) !== null) {
      return { valid: false, intersections: 0 };
    }
    // No letter below end
    if (getCell(grid, row + word.length, col) !== null) {
      return { valid: false, intersections: 0 };
    }
  }

  // Check each letter position
  for (let i = 0; i < word.length; i++) {
    const r = direction === 'across' ? row : row + i;
    const c = direction === 'across' ? col + i : col;
    const letter = word[i];
    const existingCell = grid[r][c];
    const cellKey = `${r},${c}`;
    const cellCoverage = coverage.get(cellKey);

    if (existingCell !== null) {
      // Cell is occupied - must match the letter exactly
      if (existingCell !== letter) {
        return { valid: false, intersections: 0 };
      }

      // This is an intersection - the cell must be covered by the perpendicular direction
      if (direction === 'across') {
        if (!cellCoverage?.down) {
          // There's a letter here but it's not part of a down word - invalid
          return { valid: false, intersections: 0 };
        }
      } else {
        if (!cellCoverage?.across) {
          // There's a letter here but it's not part of an across word - invalid
          return { valid: false, intersections: 0 };
        }
      }

      intersections++;
    } else {
      // Cell is empty - check for illegal parallel adjacency
      // When placing an across word, we can't have letters above/below unless they're part of crossing down words
      // When placing a down word, we can't have letters left/right unless they're part of crossing across words

      if (direction === 'across') {
        // Check cell above
        const above = getCell(grid, r - 1, c);
        if (above !== null) {
          // There's a letter above - it must be part of a down word that crosses here
          // But since our cell is empty, there's no crossing - this is parallel adjacency
          return { valid: false, intersections: 0 };
        }
        // Check cell below
        const below = getCell(grid, r + 1, c);
        if (below !== null) {
          return { valid: false, intersections: 0 };
        }
      } else {
        // Check cell to the left
        const left = getCell(grid, r, c - 1);
        if (left !== null) {
          return { valid: false, intersections: 0 };
        }
        // Check cell to the right
        const right = getCell(grid, r, c + 1);
        if (right !== null) {
          return { valid: false, intersections: 0 };
        }
      }
    }
  }

  // Must have at least one intersection (except for first word)
  if (!isFirstWord && intersections === 0) {
    return { valid: false, intersections: 0 };
  }

  return { valid: true, intersections };
}

/**
 * Place a word on the grid and update coverage
 */
function placeWord(
  grid: (string | null)[][],
  coverage: Map<string, CellCoverage>,
  word: string,
  row: number,
  col: number,
  direction: 'across' | 'down'
): void {
  for (let i = 0; i < word.length; i++) {
    const r = direction === 'across' ? row : row + i;
    const c = direction === 'across' ? col + i : col;
    grid[r][c] = word[i];

    const cellKey = `${r},${c}`;
    const existing = coverage.get(cellKey) || { across: false, down: false };
    if (direction === 'across') {
      existing.across = true;
    } else {
      existing.down = true;
    }
    coverage.set(cellKey, existing);
  }
}

/**
 * Find all valid placements for a word
 */
function findPlacements(
  grid: (string | null)[][],
  coverage: Map<string, CellCoverage>,
  word: string,
  existingWords: PlacedWord[]
): Candidate[] {
  const candidates: Candidate[] = [];
  const height = grid.length;
  const width = grid[0].length;

  // If first word, place horizontally in center
  if (existingWords.length === 0) {
    const startRow = Math.floor(height / 2);
    const startCol = Math.floor((width - word.length) / 2);
    const { valid } = canPlace(grid, coverage, word, startRow, startCol, 'across', true);
    if (valid) {
      return [{
        word,
        clue: '',
        position: { row: startRow, col: startCol, direction: 'across' },
        score: 100,
        intersections: 0,
      }];
    }
    return [];
  }

  // Find intersections with existing words
  for (const existing of existingWords) {
    for (let i = 0; i < existing.word.length; i++) {
      const existingLetter = existing.word[i];

      // Find this letter in the new word
      for (let j = 0; j < word.length; j++) {
        if (word[j] !== existingLetter) continue;

        // Calculate position for perpendicular placement
        const direction: 'across' | 'down' = existing.direction === 'across' ? 'down' : 'across';
        let row: number, col: number;

        if (existing.direction === 'across') {
          // Existing is across, new word goes down
          // The intersection point is at existing.row, existing.col + i
          // New word's j-th letter should be at that point
          row = existing.row - j;
          col = existing.col + i;
        } else {
          // Existing is down, new word goes across
          // The intersection point is at existing.row + i, existing.col
          row = existing.row + i;
          col = existing.col - j;
        }

        const { valid, intersections } = canPlace(grid, coverage, word, row, col, direction, false);
        if (valid) {
          // Score based on intersections and centrality
          const centerRow = height / 2;
          const centerCol = width / 2;
          const wordCenterRow = direction === 'down' ? row + word.length / 2 : row;
          const wordCenterCol = direction === 'across' ? col + word.length / 2 : col;
          const distFromCenter = Math.sqrt(
            Math.pow(wordCenterRow - centerRow, 2) + Math.pow(wordCenterCol - centerCol, 2)
          );
          const centralityScore = Math.max(0, 50 - distFromCenter * 2);

          candidates.push({
            word,
            clue: '',
            position: { row, col, direction },
            score: intersections * 30 + centralityScore + word.length,
            intersections,
          });
        }
      }
    }
  }

  return candidates;
}

/**
 * Validate that all cells in the grid are covered by both directions
 * This is the key crossword rule: every letter must be part of both an across and down word
 */
function validateGrid(coverage: Map<string, CellCoverage>): { valid: boolean; uncoveredCells: string[] } {
  const uncoveredCells: string[] = [];

  for (const [cellKey, cellCoverage] of coverage.entries()) {
    if (!cellCoverage.across || !cellCoverage.down) {
      uncoveredCells.push(cellKey);
    }
  }

  return { valid: uncoveredCells.length === 0, uncoveredCells };
}

/**
 * Generate a crossword grid from clue/answer pairs
 */
export function generateGrid(
  clues: ClueAnswer[],
  onProgress?: (placed: number, total: number) => void
): CrosswordGrid | null {
  if (clues.length === 0) return null;

  // Sort words by length (longest first) for better placement
  const sortedClues = [...clues].sort((a, b) => b.word.length - a.word.length);

  // Calculate grid size
  const size = calculateGridSize(sortedClues.map(c => c.word));
  const grid: (string | null)[][] = Array(size).fill(null).map(() => Array(size).fill(null));
  const coverage = new Map<string, CellCoverage>();

  const placedWords: PlacedWord[] = [];
  const usedWords = new Set<string>();

  // Try to place each word
  for (const clue of sortedClues) {
    if (usedWords.has(clue.word)) continue;

    const candidates = findPlacements(grid, coverage, clue.word, placedWords);

    if (candidates.length > 0) {
      // Sort by score and pick the best
      candidates.sort((a, b) => b.score - a.score);
      const best = candidates[0];

      // Place the word
      placeWord(grid, coverage, clue.word, best.position.row, best.position.col, best.position.direction);

      placedWords.push({
        word: clue.word,
        clue: clue.clue,
        row: best.position.row,
        col: best.position.col,
        direction: best.position.direction,
        number: 0, // Will be assigned later
      });

      usedWords.add(clue.word);
    }

    onProgress?.(placedWords.length, sortedClues.length);
  }

  if (placedWords.length === 0) {
    return null;
  }

  // Validate that all cells are properly covered
  const validation = validateGrid(coverage);
  if (!validation.valid) {
    console.warn(`Grid has ${validation.uncoveredCells.length} cells not covered by both directions`);
    // For now, we'll still return the grid but log the warning
    // In a stricter implementation, we could reject and retry
  }

  // Trim the grid to remove empty rows/columns
  const { trimmedGrid, offsetRow, offsetCol } = trimGrid(grid);

  // Adjust word positions for trimming
  const adjustedWords = placedWords.map(w => ({
    ...w,
    row: w.row - offsetRow,
    col: w.col - offsetCol,
  }));

  // Re-number words based on position (top-to-bottom, left-to-right)
  const renumbered = renumberWords(adjustedWords);

  return {
    cells: trimmedGrid,
    placedWords: renumbered,
    width: trimmedGrid[0]?.length || 0,
    height: trimmedGrid.length,
  };
}

/**
 * Trim empty rows and columns from grid edges
 */
function trimGrid(grid: (string | null)[][]): {
  trimmedGrid: (string | null)[][];
  offsetRow: number;
  offsetCol: number;
} {
  let minRow = grid.length, maxRow = 0;
  let minCol = grid[0].length, maxCol = 0;

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (grid[r][c] !== null) {
        minRow = Math.min(minRow, r);
        maxRow = Math.max(maxRow, r);
        minCol = Math.min(minCol, c);
        maxCol = Math.max(maxCol, c);
      }
    }
  }

  if (minRow > maxRow) {
    return { trimmedGrid: [[]], offsetRow: 0, offsetCol: 0 };
  }

  const trimmedGrid: (string | null)[][] = [];
  for (let r = minRow; r <= maxRow; r++) {
    trimmedGrid.push(grid[r].slice(minCol, maxCol + 1));
  }

  return { trimmedGrid, offsetRow: minRow, offsetCol: minCol };
}

/**
 * Re-number words based on standard crossword numbering
 * (top-to-bottom, left-to-right)
 */
function renumberWords(words: PlacedWord[]): PlacedWord[] {
  // Get unique cell positions that start words
  const startCells = new Map<string, { row: number; col: number; words: PlacedWord[] }>();

  for (const word of words) {
    const key = `${word.row},${word.col}`;
    if (!startCells.has(key)) {
      startCells.set(key, { row: word.row, col: word.col, words: [] });
    }
    startCells.get(key)!.words.push(word);
  }

  // Sort cells by position (row first, then column)
  const sortedCells = Array.from(startCells.values()).sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });

  // Assign new numbers
  const result: PlacedWord[] = [];
  let number = 1;

  for (const cell of sortedCells) {
    for (const word of cell.words) {
      result.push({ ...word, number });
    }
    number++;
  }

  return result;
}

/**
 * Convert our grid format to react-crossword format
 */
export function toReactCrosswordFormat(grid: CrosswordGrid): {
  across: Record<string, { clue: string; answer: string; row: number; col: number }>;
  down: Record<string, { clue: string; answer: string; row: number; col: number }>;
} {
  const across: Record<string, { clue: string; answer: string; row: number; col: number }> = {};
  const down: Record<string, { clue: string; answer: string; row: number; col: number }> = {};

  for (const word of grid.placedWords) {
    const entry = {
      clue: word.clue,
      answer: word.word,
      row: word.row,
      col: word.col,
    };

    if (word.direction === 'across') {
      across[String(word.number)] = entry;
    } else {
      down[String(word.number)] = entry;
    }
  }

  return { across, down };
}
