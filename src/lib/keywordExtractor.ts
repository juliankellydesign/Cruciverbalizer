import { retext } from 'retext';
import retextPos from 'retext-pos';
import retextKeywords from 'retext-keywords';
import { toString } from 'nlcst-to-string';
import type { Keyword } from '../types/crossword';

export interface ExtractionResult {
  keywords: Keyword[];
  stats: {
    totalWordsInText: number;
    rawKeywordsFound: number;
    rawKeyphrasesFound: number;
    filteredOut: {
      tooShort: number;
      tooLong: number;
      hasNumbers: number;
      isStopword: number;
      duplicate: number;
    };
    finalCount: number;
  };
}

// Common stopwords to filter out
const STOPWORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  'is', 'are', 'was', 'were', 'been', 'being', 'has', 'had', 'does', 'did',
  'very', 'just', 'more', 'such', 'each', 'own', 'same', 'both', 'few', 'may'
]);

type FilterReason = 'tooShort' | 'tooLong' | 'hasNumbers' | 'isStopword' | 'valid';

// Check if a word is valid for crossword use
function checkWord(word: string): FilterReason {
  // Must be 3-15 characters
  if (word.length < 3) return 'tooShort';
  if (word.length > 15) return 'tooLong';

  // Must be letters only (no numbers, hyphens, apostrophes)
  if (!/^[a-zA-Z]+$/.test(word)) return 'hasNumbers';

  // Must not be a stopword
  if (STOPWORDS.has(word.toLowerCase())) return 'isStopword';

  return 'valid';
}


// Extract a context snippet around a word in the original text
function extractContext(text: string, word: string, contextLength: number = 100): string {
  const lowerText = text.toLowerCase();
  const lowerWord = word.toLowerCase();
  const index = lowerText.indexOf(lowerWord);

  if (index === -1) return text.slice(0, contextLength);

  const start = Math.max(0, index - contextLength / 2);
  const end = Math.min(text.length, index + word.length + contextLength / 2);

  let context = text.slice(start, end).trim();
  if (start > 0) context = '...' + context;
  if (end < text.length) context = context + '...';

  return context;
}

export async function extractKeywords(text: string, maxKeywords: number = 50): Promise<ExtractionResult> {
  const stats = {
    totalWordsInText: text.trim().split(/\s+/).filter(w => w.length > 0).length,
    rawKeywordsFound: 0,
    rawKeyphrasesFound: 0,
    filteredOut: {
      tooShort: 0,
      tooLong: 0,
      hasNumbers: 0,
      isStopword: 0,
      duplicate: 0,
    },
    finalCount: 0,
  };

  // Process text with retext-keywords (requires retext-pos for POS tagging first)
  const file = await retext()
    .use(retextPos)
    .use(retextKeywords, { maximum: maxKeywords * 2 }) // Request extra to filter
    .process(text);

  const keywords: Keyword[] = [];
  const seenWords = new Set<string>();

  // Extract keywords from retext results
  const rawKeywords = file.data.keywords as Array<{ stem: string; score: number; matches: Array<{ node: unknown }> }> | undefined;
  stats.rawKeywordsFound = rawKeywords?.length ?? 0;

  if (rawKeywords) {
    for (const keyword of rawKeywords) {
      for (const match of keyword.matches) {
        const word = toString(match.node as Parameters<typeof toString>[0]);
        const normalizedWord = word.toUpperCase();

        if (seenWords.has(normalizedWord)) {
          stats.filteredOut.duplicate++;
          continue;
        }

        const checkResult = checkWord(word);
        if (checkResult !== 'valid') {
          stats.filteredOut[checkResult]++;
          continue;
        }

        seenWords.add(normalizedWord);
        keywords.push({
          word: normalizedWord,
          context: extractContext(text, word),
          score: keyword.score,
        });
      }
    }
  }

  // Also extract keyphrases and take individual words from them
  const rawKeyphrases = file.data.keyphrases as Array<{ score: number; matches: Array<{ nodes: unknown[] }> }> | undefined;
  stats.rawKeyphrasesFound = rawKeyphrases?.length ?? 0;

  if (rawKeyphrases) {
    for (const keyphrase of rawKeyphrases) {
      for (const match of keyphrase.matches) {
        const phrase = match.nodes.map((n: unknown) => toString(n as Parameters<typeof toString>[0])).join('');
        // Split phrase into words and check each
        const words = phrase.split(/\s+/);
        for (const word of words) {
          const normalizedWord = word.toUpperCase();

          if (seenWords.has(normalizedWord)) {
            stats.filteredOut.duplicate++;
            continue;
          }

          const checkResult = checkWord(word);
          if (checkResult !== 'valid') {
            stats.filteredOut[checkResult]++;
            continue;
          }

          seenWords.add(normalizedWord);
          keywords.push({
            word: normalizedWord,
            context: extractContext(text, word),
            score: keyphrase.score * 0.8, // Slightly lower score for phrase-extracted words
          });
        }
      }
    }
  }

  // Sort by score (descending) and limit
  const result = keywords
    .sort((a, b) => b.score - a.score)
    .slice(0, maxKeywords);

  stats.finalCount = result.length;

  return { keywords: result, stats };
}
