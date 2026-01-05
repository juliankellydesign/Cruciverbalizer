interface ControlPanelProps {
  fillerPercent: number;
  onFillerPercentChange: (value: number) => void;
  onGenerate: () => void;
  onRegenerate: () => void;
  isGenerating: boolean;
  hasGrid: boolean;
}

export function ControlPanel({
  fillerPercent,
  onFillerPercentChange,
  onGenerate,
  onRegenerate,
  isGenerating,
  hasGrid,
}: ControlPanelProps) {
  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">
          Filler Words: {fillerPercent}%
        </label>
        <input
          type="range"
          min="0"
          max="50"
          step="5"
          value={fillerPercent}
          onChange={(e) => onFillerPercentChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <p className="text-xs text-gray-500">
          Add common crossword words to help fill the grid
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? 'Generating...' : 'Generate Crossword'}
        </button>

        {hasGrid && (
          <button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Regenerate
          </button>
        )}
      </div>
    </div>
  );
}
