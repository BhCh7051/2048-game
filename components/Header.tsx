import React from 'react';

interface HeaderProps {
  score: number;
  highScore: number;
  onRestart: () => void;
}

function Header({ score, highScore, onRestart }: HeaderProps): React.ReactElement {
  return (
    <div className="flex flex-row items-center justify-between mb-4 lg:flex-col lg:items-start lg:gap-4">
      <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-700">2048</h1>
      <div className="flex flex-col items-end gap-2 lg:flex-col lg:items-stretch lg:w-full lg:space-x-0 lg:space-y-2">
        <div className="flex items-center space-x-2 w-full">
            <div className="bg-slate-300 text-slate-800 rounded-lg px-4 py-2 text-center w-1/2">
              <div className="text-xs font-bold uppercase text-slate-500">Best</div>
              <div className="text-2xl font-bold">{highScore}</div>
            </div>
            <div className="bg-slate-300 text-slate-800 rounded-lg px-4 py-2 text-center w-1/2">
              <div className="text-xs font-bold uppercase text-slate-500">Score</div>
              <div className="text-2xl font-bold">{score}</div>
            </div>
        </div>
        <button
          onClick={onRestart}
          className="bg-orange-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-75 shadow-md w-full text-center"
        >
          New Game
        </button>
      </div>
    </div>
  );
}

export default Header;