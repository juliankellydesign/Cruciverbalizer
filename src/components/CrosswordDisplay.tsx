import Crossword from '@jaredreisinger/react-crossword';
import type { CrosswordGrid } from '../types/crossword';
import { toReactCrosswordFormat } from '../lib/gridGenerator';

interface CrosswordDisplayProps {
  grid: CrosswordGrid;
}

export function CrosswordDisplay({ grid }: CrosswordDisplayProps) {
  const data = toReactCrosswordFormat(grid);

  const acrossCount = Object.keys(data.across).length;
  const downCount = Object.keys(data.down).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-gray-600">
        {acrossCount + downCount} words placed ({grid.width}x{grid.height} grid)
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <Crossword
          data={data}
          theme={{
            gridBackground: '#ffffff',
            cellBackground: '#ffffff',
            cellBorder: '#000000',
            textColor: '#000000',
            numberColor: '#333333',
            focusBackground: '#ffe082',
            highlightBackground: '#fff59d',
          }}
        />
      </div>
    </div>
  );
}
