import React from 'react';
import type { BoardType } from '../types';
import Tile from './Tile';

interface BoardProps {
  board: BoardType;
}

function Board({ board }: BoardProps): React.ReactElement {
  const size = board.length;
  const gap = 'gap-2 md:gap-3';

  return (
    <div
      className="bg-slate-300 p-2 md:p-3 rounded-lg shadow-lg relative"
      role="grid"
      aria-label={`${size} by ${size} game board`}
    >
      {/* Background Grid */}
      <div
        className={`grid ${gap}`}
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`
        }}
        role="presentation"
      >
        {board.map((row, rowIndex) =>
          row.map((_, colIndex) => (
            <div
              key={`bg-${rowIndex}-${colIndex}`}
              className="bg-gray-200 rounded-md aspect-square border border-gray-300"
              role="presentation"
            />
          ))
        )}
      </div>

      {/* Tile Grid */}
      <div
        className="absolute inset-0 p-2 md:p-3"
        role="presentation"
      >
          <div
            className={`grid ${gap} w-full h-full`}
            style={{
              gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`
            }}
            role="grid"
            aria-label="Game tiles"
          >
              {board.map((row, rowIndex) =>
                row.map((value, colIndex) => (
                    <div key={`tile-${rowIndex}-${colIndex}`}>
                      <Tile
                        value={value}
                        boardSize={size}
                      />
                    </div>
                ))
              )}
          </div>
      </div>
    </div>
  );
}

export default Board;
