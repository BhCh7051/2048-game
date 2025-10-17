import React, { useState } from 'react';
import { useGameLogic } from './hooks/useGameLogic';
import Board from './components/Board';
import Header from './components/Header';
import GameOverModal from './components/GameOverModal';
import Settings from './components/Settings';

function App(): React.ReactElement {
  const [boardSize, setBoardSize] = useState(4);
  const {
    board,
    score,
    highScore,
    isGameOver,
    hasWon,
    restartGame,
  } = useGameLogic(boardSize);

  // Performance optimization: memoize expensive calculations
  const maxScore = React.useMemo(() => Math.max(score, highScore), [score, highScore]);

  function handleRestart() {
    restartGame();
  }
  
  function handleSizeChange(newSize: number) {
    if (newSize >= 3 && newSize <= 8) {
        setBoardSize(newSize);
    }
  }

  return (
    <div className="bg-slate-50 text-slate-800 h-screen w-screen flex flex-col items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-4xl mx-auto flex flex-col lg:flex-row-reverse lg:gap-8">

        {/* Right Column on Desktop / Top section on Mobile */}
        <div className="w-full lg:w-[280px] flex-shrink-0 mb-4 lg:mb-0">
          <Header score={score} highScore={highScore} onRestart={handleRestart} />
          <Settings currentSize={boardSize} onSizeChange={handleSizeChange} />
        </div>

        {/* Left Column on Desktop / Middle section on Mobile */}
        <div className="w-full">
          <div className="relative">
            <Board board={board} />
            {isGameOver && (
              <GameOverModal hasWon={hasWon} score={score} onRestart={handleRestart} />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
