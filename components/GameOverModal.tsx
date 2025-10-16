import React from 'react';

interface GameOverModalProps {
  hasWon: boolean;
  score: number;
  onRestart: () => void;
}

function GameOverModal({ hasWon, score, onRestart }: GameOverModalProps): React.ReactElement {
  const message = hasWon ? "You Win!" : "Game Over!";
  const messageColor = hasWon ? "text-teal-500" : "text-slate-700";

  return (
    <div className="absolute inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center rounded-lg animate-fade-in">
      <h2 className={`text-5xl md:text-6xl font-extrabold mb-2 ${messageColor}`}>{message}</h2>
      <p className="text-slate-600 mb-4">Your final score: <span className="font-bold">{score}</span></p>
      <button
        onClick={onRestart}
        className="bg-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-75 shadow-lg text-lg"
      >
        Try Again
      </button>
    </div>
  );
}

export default GameOverModal;