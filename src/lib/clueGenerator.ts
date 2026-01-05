import Anthropic from '@anthropic-ai/sdk';
import type { Keyword, ClueAnswer } from '../types/crossword';

const BATCH_SIZE = 10; // Number of words to process per API call

export interface ClueGenerationResult {
  clues: ClueAnswer[];
  errors: string[];
}

export async function generateClues(
  keywords: Keyword[],
  fullText: string,
  onProgress?: (completed: number, total: number, message?: string) => void
): Promise<ClueGenerationResult> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_ANTHROPIC_API_KEY is not set in environment variables');
  }
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const clues: ClueAnswer[] = [];
  const errors: string[] = [];

  // Truncate text if too long (keep first ~4000 chars for context)
  const truncatedText = fullText.length > 4000
    ? fullText.slice(0, 4000) + '...[truncated]'
    : fullText;

  // Process in batches
  for (let i = 0; i < keywords.length; i += BATCH_SIZE) {
    const batch = keywords.slice(i, i + BATCH_SIZE);

    const wordList = batch
      .map((k, idx) => `${idx + 1}. "${k.word}"`)
      .join('\n');

    const prompt = `You are creating a reading comprehension crossword puzzle. The solver has just read this article and must answer clues based on their understanding of it.

## THE ARTICLE:
${truncatedText}

## YOUR TASK:
Generate crossword clues for these words that TEST READING COMPREHENSION. Each clue should require knowledge of the article to answer - not just general knowledge.

## CLUE WRITING RULES:
1. **Reference the article**: Clues should describe how the word is used IN THE ARTICLE
2. **Fill-in-the-blank**: Use quotes from the article with a blank, e.g., "The president ___ ahead with scant deference" for BARRELED
3. **Paraphrase context**: Describe what the article says about this concept
4. **No answer in clue**: Never include the answer word
5. **Concise**: Keep clues under 12 words
6. **Grammatical match**: Plural answers need plural clues, past tense needs past tense

## GOOD CLUE EXAMPLES (reading comprehension style):
- For CONGRESS: "Body that learned 'hard lessons about the limits of its power'"
- For TARIFF: "Policy area where Bacon wished for more pushback"
- For SENATE: "Chamber where Thune serves as majority leader"
- For BARRELED: "___ ahead with scant deference" (fill-in-the-blank)

## BAD CLUE EXAMPLES (too generic):
- For CONGRESS: "Legislative body" (doesn't reference article)
- For TARIFF: "Import tax" (general knowledge, not article-specific)

## WORDS TO CLUE:
${wordList}

## OUTPUT FORMAT:
Return ONLY numbered clues, one per line. Example:
1. Body that learned "hard lessons" about power limits
2. Policy Bacon wished Republicans would push back on
3. Chamber led by Thune as majority leader

Generate reading comprehension clues now:`;

    try {
      onProgress?.(i, keywords.length, `Generating clues ${i + 1}-${Math.min(i + BATCH_SIZE, keywords.length)}...`);

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      // Parse the response
      const content = response.content[0];
      if (content.type === 'text') {
        const responseText = content.text;
        const lines = responseText.split('\n').filter(line => line.trim());

        for (let j = 0; j < batch.length; j++) {
          // Try multiple patterns for finding the clue
          const patterns = [
            new RegExp(`^${j + 1}[\\.\\)\\:]\\s*(.+)`, 'm'),
            new RegExp(`^${j + 1}\\s+(.+)`, 'm'),
          ];

          let clue: string | null = null;
          for (const pattern of patterns) {
            const match = responseText.match(pattern);
            if (match) {
              clue = match[1].trim();
              break;
            }
          }

          // Also try line-by-line matching
          if (!clue) {
            const lineMatch = lines.find(line => {
              const lineNum = line.match(/^(\d+)/);
              return lineNum && parseInt(lineNum[1]) === j + 1;
            });
            if (lineMatch) {
              clue = lineMatch.replace(/^\d+[\.\)\:\s]+/, '').trim();
            }
          }

          if (clue && clue.length > 2 && !clue.toLowerCase().includes('word from the text')) {
            clues.push({
              word: batch[j].word,
              clue,
              isGeneric: false,
            });
          } else {
            // Use a descriptive fallback based on context
            const fallbackClue = generateFallbackClue(batch[j]);
            clues.push({
              word: batch[j].word,
              clue: fallbackClue,
              isGeneric: true,
            });
            errors.push(`Could not parse clue for "${batch[j].word}" from response`);
          }
        }
      } else {
        throw new Error('Unexpected response format from API');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Batch ${i / BATCH_SIZE + 1} failed: ${errorMessage}`);

      // Add fallback clues for this batch
      for (const keyword of batch) {
        const fallbackClue = generateFallbackClue(keyword);
        clues.push({
          word: keyword.word,
          clue: fallbackClue,
          isGeneric: true,
        });
      }
    }

    onProgress?.(Math.min(i + BATCH_SIZE, keywords.length), keywords.length);
  }

  return { clues, errors };
}

/**
 * Generate a better fallback clue based on word characteristics and context
 */
function generateFallbackClue(keyword: Keyword): string {
  // Try to use the context snippet to create a fill-in-the-blank style clue
  if (keyword.context) {
    const word = keyword.word;
    const context = keyword.context;

    // Find the word in context and create a blank
    const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
    const match = context.match(wordRegex);

    if (match) {
      // Create fill-in-the-blank from context
      const blankContext = context.replace(wordRegex, '___');
      // Take a reasonable snippet around the blank
      const blankIndex = blankContext.indexOf('___');
      const start = Math.max(0, blankIndex - 30);
      const end = Math.min(blankContext.length, blankIndex + 33);
      let snippet = blankContext.slice(start, end).trim();

      // Clean up snippet
      if (start > 0) snippet = '...' + snippet;
      if (end < blankContext.length) snippet = snippet + '...';

      // Remove extra quotes if present
      snippet = snippet.replace(/[""]/g, '"');

      if (snippet.length < 80) {
        return `"${snippet}"`;
      }
    }
  }

  const word = keyword.word.toUpperCase();

  // Common word patterns with better generic clues
  const patterns: Array<{ test: (w: string) => boolean; clue: string }> = [
    { test: w => w.endsWith('TION'), clue: 'Process mentioned in the article' },
    { test: w => w.endsWith('MENT'), clue: 'Concept discussed in the text' },
    { test: w => w.endsWith('LY'), clue: 'Manner described in the article' },
    { test: w => w.endsWith('ING'), clue: 'Action referenced in the text' },
    { test: w => w.endsWith('ER'), clue: 'Person or thing from the article' },
    { test: w => w.endsWith('IST'), clue: 'Role mentioned in the text' },
    { test: w => w.endsWith('ISM'), clue: 'Concept from the article' },
    { test: w => w.endsWith('ITY'), clue: 'Quality discussed in the text' },
    { test: w => w.endsWith('NESS'), clue: 'State described in the article' },
    { test: w => w.endsWith('ABLE') || w.endsWith('IBLE'), clue: 'Capability mentioned in text' },
  ];

  for (const pattern of patterns) {
    if (pattern.test(word)) {
      return pattern.clue;
    }
  }

  // Default fallback
  return `Term from the article (${word.length} letters)`;
}
