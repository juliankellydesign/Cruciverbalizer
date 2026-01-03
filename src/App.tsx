import { useState, useCallback } from 'react';
import { TextInput } from './components/TextInput';
import { ControlPanel } from './components/ControlPanel';
import { CrosswordDisplay } from './components/CrosswordDisplay';
import { ProgressBar } from './components/ProgressBar';
import { extractKeywords } from './lib/keywordExtractor';
import { generateClues } from './lib/clueGenerator';
import { mixFillerWords } from './lib/fillerWords';
import { generateGrid } from './lib/gridGenerator';
import type { CrosswordGrid, GenerationState } from './types/crossword';

function App() {
  const [inputText, setInputText] = useState('');
  const [fillerPercent, setFillerPercent] = useState(20);
  const [grid, setGrid] = useState<CrosswordGrid | null>(null);
  const [generationState, setGenerationState] = useState<GenerationState>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!inputText.trim()) return;

    setError(null);
    setGrid(null);

    try {
      // Step 1: Extract keywords
      setGenerationState({
        status: 'extracting',
        progress: 10,
        message: 'Analyzing text and extracting key terms...',
      });

      const { keywords, stats } = await extractKeywords(inputText);

      if (keywords.length === 0) {
        const reasons: string[] = [];
        if (stats.totalWordsInText < 50) {
          reasons.push(`Text is too short (${stats.totalWordsInText} words - try at least 50)`);
        }
        if (stats.rawKeywordsFound === 0 && stats.rawKeyphrasesFound === 0) {
          reasons.push('NLP could not identify any significant terms in the text');
        }
        if (stats.filteredOut.tooShort > 0) {
          reasons.push(`${stats.filteredOut.tooShort} words were too short (< 3 letters)`);
        }
        if (stats.filteredOut.hasNumbers > 0) {
          reasons.push(`${stats.filteredOut.hasNumbers} words contained numbers or special characters`);
        }
        if (stats.filteredOut.isStopword > 0) {
          reasons.push(`${stats.filteredOut.isStopword} words were common stopwords`);
        }

        const details = reasons.length > 0
          ? `\n\nDetails:\n- ${reasons.join('\n- ')}`
          : '';

        throw new Error(
          `No suitable keywords found in the text.${details}\n\nStats: ${stats.totalWordsInText} words in text, ` +
          `${stats.rawKeywordsFound} raw keywords found, ${stats.rawKeyphrasesFound} keyphrases found.`
        );
      }

      setGenerationState({
        status: 'extracting',
        progress: 20,
        message: `Found ${keywords.length} keywords from ${stats.totalWordsInText} words`,
      });

      // Step 2: Generate clues with LLM
      setGenerationState({
        status: 'generating-clues',
        progress: 25,
        message: 'Generating contextual clues with AI...',
      });

      const { clues, errors: clueErrors } = await generateClues(keywords, inputText, (completed, total, message) => {
        const progress = 25 + (completed / total) * 50;
        setGenerationState({
          status: 'generating-clues',
          progress,
          message: message || `Generated ${completed}/${total} clues`,
        });
      });

      // Log any clue generation errors (non-fatal)
      if (clueErrors.length > 0) {
        console.warn('Clue generation warnings:', clueErrors);
      }

      // Step 3: Mix in filler words
      const allClues = mixFillerWords(clues, fillerPercent);

      setGenerationState({
        status: 'building-grid',
        progress: 80,
        message: `Building grid with ${allClues.length} words...`,
      });

      // Step 4: Generate the grid
      const newGrid = generateGrid(allClues, (placed, total) => {
        const progress = 80 + (placed / total) * 15;
        setGenerationState({
          status: 'building-grid',
          progress,
          message: `Placed ${placed} words`,
        });
      });

      if (!newGrid || newGrid.placedWords.length === 0) {
        throw new Error('Could not generate a crossword grid. Try adding more filler words or different text.');
      }

      setGrid(newGrid);
      setGenerationState({
        status: 'complete',
        progress: 100,
        message: `Created crossword with ${newGrid.placedWords.length} words!`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
      setGenerationState({
        status: 'error',
        progress: 0,
        message,
      });
    }
  }, [inputText, fillerPercent]);

  const isGenerating = generationState.status !== 'idle' &&
    generationState.status !== 'complete' &&
    generationState.status !== 'error';

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cruciverbalizer
          </h1>
          <p className="text-gray-600">
            Turn any text into an interactive crossword puzzle
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column: Input and controls */}
          <div className="flex flex-col gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <TextInput
                value={inputText}
                onChange={setInputText}
                disabled={isGenerating}
              />
            </div>

            <ControlPanel
              fillerPercent={fillerPercent}
              onFillerPercentChange={setFillerPercent}
              onGenerate={handleGenerate}
              onRegenerate={handleGenerate}
              isGenerating={isGenerating}
              hasGrid={grid !== null}
            />

            {isGenerating && <ProgressBar state={generationState} />}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium mb-2">Generation failed</p>
                <pre className="text-red-700 text-sm whitespace-pre-wrap font-mono">{error}</pre>
              </div>
            )}
          </div>

          {/* Right column: Crossword display */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            {grid ? (
              <CrosswordDisplay grid={grid} />
            ) : (
              <div className="flex items-center justify-center h-96 text-gray-400">
                <div className="text-center">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                    />
                  </svg>
                  <p>Your crossword will appear here</p>
                  <p className="text-sm mt-1">Paste text and click Generate</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
