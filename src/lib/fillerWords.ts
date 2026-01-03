import type { ClueAnswer } from '../types/crossword';

// Common crossword filler words with generic clues
// Organized by length for easy lookup during grid generation
const FILLER_WORDS: Array<{ word: string; clue: string }> = [
  // 3-letter words
  { word: 'ERA', clue: 'Historical period' },
  { word: 'ORE', clue: 'Mined material' },
  { word: 'ATE', clue: 'Consumed food' },
  { word: 'ONE', clue: 'Single digit' },
  { word: 'ACE', clue: 'Top card or expert' },
  { word: 'AGE', clue: 'Number of years' },
  { word: 'AID', clue: 'Help or assistance' },
  { word: 'AIM', clue: 'Target or goal' },
  { word: 'AIR', clue: 'What we breathe' },
  { word: 'APE', clue: 'Primate' },
  { word: 'ARC', clue: 'Curved line' },
  { word: 'ARE', clue: 'Form of "to be"' },
  { word: 'ARK', clue: 'Noah\'s vessel' },
  { word: 'ARM', clue: 'Body limb' },
  { word: 'ART', clue: 'Creative expression' },
  { word: 'AWE', clue: 'Wonder or amazement' },
  { word: 'OAK', clue: 'Sturdy tree' },
  { word: 'OAR', clue: 'Rowing tool' },
  { word: 'OAT', clue: 'Breakfast grain' },
  { word: 'ODD', clue: 'Not even' },
  { word: 'ODE', clue: 'Lyric poem' },
  { word: 'OLD', clue: 'Not new' },
  { word: 'OWE', clue: 'Be in debt' },
  { word: 'OWL', clue: 'Nocturnal bird' },
  { word: 'OWN', clue: 'Possess' },
  { word: 'END', clue: 'Finish or conclusion' },
  { word: 'ELF', clue: 'Mythical small creature' },
  { word: 'ELM', clue: 'Shade tree' },
  { word: 'EAR', clue: 'Hearing organ' },
  { word: 'EAT', clue: 'Consume food' },
  { word: 'EGG', clue: 'Breakfast item' },

  // 4-letter words
  { word: 'AREA', clue: 'Region or zone' },
  { word: 'IDEA', clue: 'Thought or concept' },
  { word: 'ELSE', clue: 'Otherwise' },
  { word: 'EACH', clue: 'Every one' },
  { word: 'EASE', clue: 'Comfort or simplicity' },
  { word: 'EAST', clue: 'Direction of sunrise' },
  { word: 'EASY', clue: 'Not difficult' },
  { word: 'EDGE', clue: 'Border or margin' },
  { word: 'EDIT', clue: 'Revise text' },
  { word: 'ECHO', clue: 'Sound reflection' },
  { word: 'ABLE', clue: 'Capable' },
  { word: 'ALSO', clue: 'In addition' },
  { word: 'AGED', clue: 'Old or mature' },
  { word: 'AIDE', clue: 'Assistant' },
  { word: 'ALAS', clue: 'Expression of sorrow' },
  { word: 'ALOE', clue: 'Soothing plant' },
  { word: 'ORAL', clue: 'Spoken, not written' },
  { word: 'OPEN', clue: 'Not closed' },
  { word: 'OVEN', clue: 'Baking appliance' },
  { word: 'OVER', clue: 'Above or finished' },
  { word: 'OVAL', clue: 'Egg-shaped' },
  { word: 'NOTE', clue: 'Brief message' },
  { word: 'NAME', clue: 'What you\'re called' },
  { word: 'NEAR', clue: 'Close by' },
  { word: 'NEST', clue: 'Bird\'s home' },
  { word: 'NEWS', clue: 'Current events' },
  { word: 'NOSE', clue: 'Smelling organ' },

  // 5-letter words
  { word: 'OCEAN', clue: 'Large body of water' },
  { word: 'OPERA', clue: 'Musical drama' },
  { word: 'ORDER', clue: 'Arrangement or command' },
  { word: 'OTHER', clue: 'Different one' },
  { word: 'OUTER', clue: 'External' },
  { word: 'OASIS', clue: 'Desert refuge' },
  { word: 'ARENA', clue: 'Sports venue' },
  { word: 'ARISE', clue: 'Get up or emerge' },
  { word: 'ASIDE', clue: 'To the side' },
  { word: 'EAGER', clue: 'Enthusiastic' },
  { word: 'EAGLE', clue: 'Majestic bird' },
  { word: 'EARLY', clue: 'Before expected time' },
  { word: 'EARTH', clue: 'Our planet' },
  { word: 'EASEL', clue: 'Painter\'s stand' },
  { word: 'EATEN', clue: 'Consumed' },
  { word: 'ERASE', clue: 'Remove or delete' },
  { word: 'ERROR', clue: 'Mistake' },
  { word: 'ESSAY', clue: 'Written composition' },
  { word: 'EVENT', clue: 'Occurrence or happening' },
  { word: 'EXTRA', clue: 'Additional' },
  { word: 'IDEAL', clue: 'Perfect model' },
  { word: 'IMAGE', clue: 'Picture or likeness' },
  { word: 'INNER', clue: 'Internal' },
  { word: 'IRATE', clue: 'Very angry' },

  // 6-letter words
  { word: 'ORANGE', clue: 'Citrus fruit or color' },
  { word: 'ORIGIN', clue: 'Beginning or source' },
  { word: 'ORNATE', clue: 'Elaborately decorated' },
  { word: 'ARCADE', clue: 'Game room or covered walkway' },
  { word: 'ARDENT', clue: 'Passionate' },
  { word: 'ASHORE', clue: 'On land from water' },
  { word: 'EASTER', clue: 'Spring holiday' },
  { word: 'EDITOR', clue: 'Publication manager' },
  { word: 'EGGNOG', clue: 'Holiday drink' },
  { word: 'ELEVEN', clue: 'Number after ten' },
  { word: 'ENTICE', clue: 'Tempt or lure' },
  { word: 'ENTIRE', clue: 'Whole or complete' },
  { word: 'ESTATE', clue: 'Large property' },
  { word: 'ITALIC', clue: 'Slanted font style' },
];

// Index by word length for faster lookup
const FILLER_BY_LENGTH: Map<number, Array<{ word: string; clue: string }>> = new Map();
for (const filler of FILLER_WORDS) {
  const len = filler.word.length;
  if (!FILLER_BY_LENGTH.has(len)) {
    FILLER_BY_LENGTH.set(len, []);
  }
  FILLER_BY_LENGTH.get(len)!.push(filler);
}

/**
 * Get filler words to supplement content words
 * @param contentClues - The clues generated from user content
 * @param fillerPercent - Percentage of total words that should be fillers (0-50)
 * @returns Mixed array of content and filler clues
 */
export function mixFillerWords(
  contentClues: ClueAnswer[],
  fillerPercent: number
): ClueAnswer[] {
  if (fillerPercent <= 0) return contentClues;

  // Calculate how many filler words to add
  const contentCount = contentClues.length;
  const targetTotal = Math.ceil(contentCount / (1 - fillerPercent / 100));
  const fillerCount = targetTotal - contentCount;

  if (fillerCount <= 0) return contentClues;

  // Get words already used (to avoid duplicates)
  const usedWords = new Set(contentClues.map(c => c.word.toUpperCase()));

  // Collect available fillers
  const availableFillers = FILLER_WORDS.filter(f => !usedWords.has(f.word));

  // Shuffle and take needed amount
  const shuffled = [...availableFillers].sort(() => Math.random() - 0.5);
  const selectedFillers = shuffled.slice(0, fillerCount);

  // Convert to ClueAnswer format
  const fillerClues: ClueAnswer[] = selectedFillers.map(f => ({
    word: f.word,
    clue: f.clue,
    isGeneric: true,
  }));

  // Return combined array
  return [...contentClues, ...fillerClues];
}

/**
 * Get filler words of a specific length
 * Useful for grid generation when we need words of specific sizes
 */
export function getFillersByLength(length: number): Array<{ word: string; clue: string }> {
  return FILLER_BY_LENGTH.get(length) || [];
}

/**
 * Get all available filler words
 */
export function getAllFillers(): Array<{ word: string; clue: string }> {
  return [...FILLER_WORDS];
}
