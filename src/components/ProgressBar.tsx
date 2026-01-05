import type { GenerationState } from '../types/crossword';

interface ProgressBarProps {
  state: GenerationState;
}

export function ProgressBar({ state }: ProgressBarProps) {
  if (state.status === 'idle' || state.status === 'complete') {
    return null;
  }

  const statusLabels: Record<string, string> = {
    extracting: 'Extracting keywords...',
    'generating-clues': 'Generating clues with AI...',
    'building-grid': 'Building crossword grid...',
    error: 'Error occurred',
  };

  return (
    <div className="w-full p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex justify-between text-sm text-blue-700 mb-2">
        <span>{statusLabels[state.status] || state.status}</span>
        <span>{Math.round(state.progress)}%</span>
      </div>
      <div className="w-full bg-blue-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${state.progress}%` }}
        />
      </div>
      {state.message && (
        <p className="mt-2 text-sm text-blue-600">{state.message}</p>
      )}
    </div>
  );
}
