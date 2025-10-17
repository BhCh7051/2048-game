import React from 'react';
import type { TileValue } from '../types';

interface TileProps {
  value: TileValue;
  boardSize: number;
}

const TILE_COLORS: { [key: number]: string } = {
  0: 'bg-transparent',
  2: 'bg-amber-100 text-amber-900 shadow-md',
  4: 'bg-amber-200 text-amber-900 shadow-md',
  8: 'bg-orange-400 text-white shadow-lg',
  16: 'bg-orange-500 text-white shadow-lg',
  32: 'bg-red-500 text-white shadow-lg',
  64: 'bg-red-600 text-white shadow-lg',
  128: 'bg-purple-500 text-white shadow-xl',
  256: 'bg-purple-600 text-white shadow-xl',
  512: 'bg-blue-500 text-white shadow-xl',
  1024: 'bg-blue-600 text-white shadow-xl',
  2048: 'bg-green-500 text-white shadow-xl',
  4096: 'bg-green-600 text-white shadow-xl',
  8192: 'bg-pink-500 text-white shadow-xl',
};

function getTileStyles(value: TileValue, boardSize: number) {
    const colorClass = TILE_COLORS[value] || 'bg-red-500 text-white';

    let fontSize;
    const numDigits = String(value).length;

    if (boardSize <= 4) {
      if (numDigits < 4) fontSize = 'text-4xl md:text-5xl';
      else if (numDigits < 5) fontSize = 'text-3xl md:text-4xl';
      else fontSize = 'text-2xl md:text-3xl';
    } else if (boardSize <= 6) {
      if (numDigits < 4) fontSize = 'text-3xl md:text-4xl';
      else if (numDigits < 5) fontSize = 'text-2xl md:text-3xl';
      else fontSize = 'text-xl md:text-2xl';
    } else {
      if (numDigits < 4) fontSize = 'text-2xl md:text-3xl';
      else if (numDigits < 5) fontSize = 'text-xl md:text-2xl';
      else fontSize = 'text-lg md:text-xl';
    }

    return `${colorClass} ${fontSize}`;
}

function Tile({ value, boardSize }: TileProps): React.ReactElement {
  const styleClasses = getTileStyles(value, boardSize);
  const showValue = value !== 0;

  return (
    <div
      className={`
        w-full h-full rounded-md
        flex items-center justify-center
        font-bold select-none
        ${styleClasses}
        ${showValue ? 'opacity-100' : 'opacity-0'}
      `}
      role="gridcell"
      aria-label={showValue ? `${value} tile` : 'empty tile'}
    >
      {showValue ? value : ''}
    </div>
  );
}

export default Tile;
