import { useState, useEffect, useCallback } from 'react';
import type { BoardType } from '../types';
import {
  initBoard,
  addRandomTile,
  moveLeft,
  moveRight,
  moveUp,
  moveDown,
  areBoardsEqual,
  hasWon as checkWin,
  isGameOver as checkGameOver
} from '../utils/board';

export function useGameLogic(boardSize: number) {
  const [board, setBoard] = useState<BoardType>(() => initBoard(boardSize).board);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  useEffect(() => {
    try {
      const storedHighScore = localStorage.getItem('highScore2048');
      if (storedHighScore) {
        const parsedScore = parseInt(storedHighScore, 10);
        if (!isNaN(parsedScore) && parsedScore >= 0) {
          setHighScore(parsedScore);
        }
      }
    } catch (error) {
      console.warn('Failed to load high score from localStorage:', error);
    }
  }, []);

  useEffect(() => {
    if (score > highScore && score > 0) {
      setHighScore(score);
      try {
        localStorage.setItem('highScore2048', String(score));
      } catch (error) {
        console.warn('Failed to save high score to localStorage:', error);
      }
    }
  }, [score, highScore]);

  const restartGame = useCallback(function() {
    const { board: initialBoard } = initBoard(boardSize);
    setBoard(initialBoard);
    setScore(0);
    setIsGameOver(false);
    setHasWon(false);
  }, [boardSize]);

  // Reset the board whenever the size changes.
  useEffect(() => {
    restartGame();
  }, [boardSize, restartGame]);

  const handleMove = useCallback(function(moveFn: (board: BoardType) => { newBoard: BoardType; score: number }) {
    if (isGameOver) return;

    const { newBoard, score: moveScore } = moveFn(board);

    if (!areBoardsEqual(board, newBoard)) {
      const { newBoard: boardWithNewTile } = addRandomTile(newBoard);
      setBoard(boardWithNewTile);
      setScore(prevScore => prevScore + moveScore);

      const newBoardHasWon = checkWin(boardWithNewTile);
      if (newBoardHasWon) {
        setHasWon(true);
        setIsGameOver(true);
      } else if (checkGameOver(boardWithNewTile)) {
        setIsGameOver(true);
      }
    }
  }, [board, isGameOver]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      let moveFunc;

      switch (e.key) {
        case 'ArrowUp':
          moveFunc = moveUp;
          break;
        case 'ArrowDown':
          moveFunc = moveDown;
          break;
        case 'ArrowLeft':
          moveFunc = moveLeft;
          break;
        case 'ArrowRight':
          moveFunc = moveRight;
          break;
      }

      if (moveFunc) {
        e.preventDefault();
        handleMove(moveFunc);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleMove]);

  // Touch controls for mobile with improved accuracy
  useEffect(() => {
    const touchStart = { x: 0, y: 0 };
    const minSwipeDistance = 30;
    const maxSwipeTime = 500; // Maximum time for a swipe (ms)
    const touchStartTime = { value: 0 };

    function handleTouchStart(e: TouchEvent) {
      touchStart.x = e.changedTouches[0].clientX;
      touchStart.y = e.changedTouches[0].clientY;
      touchStartTime.value = Date.now();
    }

    function handleTouchEnd(e: TouchEvent) {
      if (touchStart.x === 0 && touchStart.y === 0) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStart.x;
      const deltaY = touchEndY - touchStart.y;
      const touchDuration = Date.now() - touchStartTime.value;

      // Reset touch start coordinates
      touchStart.x = 0;
      touchStart.y = 0;

      // Ignore very slow swipes or very short touches
      if (touchDuration > maxSwipeTime || touchDuration < 50) return;

      let moveFunc;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
          moveFunc = deltaX > 0 ? moveRight : moveLeft;
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
          moveFunc = deltaY > 0 ? moveDown : moveUp;
        }
      }

      if (moveFunc) {
        e.preventDefault();
        handleMove(moveFunc);
      }
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMove]);

  return {
    board,
    score,
    highScore,
    isGameOver,
    hasWon,
    restartGame,
  };
}
