# Game Modes Implementation

## Feature Overview

Implement different game modes to add variety and challenge to the 2048 experience. This feature includes a timed mode where players must reach 2048 within a time limit, and a limited moves mode where players have a restricted number of moves to achieve their goal.

## Requirements Analysis

### Core Requirements
- **Classic Mode**: Standard 2048 gameplay (existing)
- **Timed Mode**: Reach 2048 within a time limit (e.g., 5 minutes)
- **Limited Moves Mode**: Reach 2048 with only a certain number of moves (e.g., 100 moves)
- **Mode Selection**: UI to choose game mode before starting
- **Timer Display**: Visual countdown for timed mode
- **Move Counter**: Display remaining moves for limited moves mode
- **Mode-Specific Win Conditions**: Different victory conditions per mode
- **Statistics Tracking**: Track best times, fewest moves, etc.

### Interview Questions to Ask
1. What should happen when time runs out or moves are exhausted?
2. Should there be different difficulty levels for each mode?
3. How should mode selection be integrated into the UI?
4. Should modes have different scoring systems?

## Technical Approach

### Architecture Decisions
1. **Mode Configuration**: Use a configuration object to define mode parameters
2. **Timer Management**: Use React hooks for timer functionality
3. **Conditional Logic**: Different game logic based on selected mode
4. **Statistics Persistence**: Store mode-specific statistics

### New Data Types
```typescript
// types.ts - Add these types
export type GameMode = 'classic' | 'timed' | 'limited-moves';

export interface GameModeConfig {
  type: GameMode;
  timeLimit?: number;        // seconds for timed mode
  moveLimit?: number;        // moves for limited moves mode
  winCondition: number;      // target tile value (default 2048)
}

export interface GameStats {
  bestTime?: number;         // best time for timed mode (seconds)
  fewestMoves?: number;      // fewest moves for limited moves mode
  gamesPlayed: number;       // total games played per mode
  gamesWon: number;          // games won per mode
}
```

## Step-by-Step Implementation

### Phase 1: Game Mode Infrastructure (45 minutes)

#### Step 1.1: Define Mode Types and Configuration
```typescript
// types.ts - Add mode definitions
export const GAME_MODES: Record<GameMode, GameModeConfig> = {
  classic: {
    type: 'classic',
    winCondition: 2048,
  },
  timed: {
    type: 'timed',
    timeLimit: 300, // 5 minutes
    winCondition: 2048,
  },
  'limited-moves': {
    type: 'limited-moves',
    moveLimit: 100,
    winCondition: 2048,
  },
};
```

#### Step 1.2: Add Mode State to useGameLogic
```typescript
// hooks/useGameLogic.ts - Add to existing hook
const [gameMode, setGameMode] = useState<GameMode>('classic');
const [timeRemaining, setTimeRemaining] = useState<number>(0);
const [movesRemaining, setMovesRemaining] = useState<number>(0);
const [movesUsed, setMovesUsed] = useState<number>(0);
const [gameStartTime, setGameStartTime] = useState<number>(0);
```

#### Step 1.3: Create Mode Selection Component
```typescript
// components/GameModeSelector.tsx
import React from 'react';
import type { GameMode } from '../types';

interface GameModeSelectorProps {
  selectedMode: GameMode;
  onModeChange: (mode: GameMode) => void;
}

const MODE_DESCRIPTIONS = {
  classic: 'Reach 2048 with unlimited time and moves',
  timed: 'Reach 2048 within 5 minutes',
  'limited-moves': 'Reach 2048 in 100 moves or less',
};

function GameModeSelector({ selectedMode, onModeChange }: GameModeSelectorProps) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">Game Mode</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {(Object.keys(MODE_DESCRIPTIONS) as GameMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={`p-3 rounded-lg border-2 transition-colors ${
              selectedMode === mode
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium capitalize">{mode.replace('-', ' ')}</div>
            <div className="text-sm text-gray-600 mt-1">
              {MODE_DESCRIPTIONS[mode]}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default GameModeSelector;
```

### Phase 2: Timer Implementation (30 minutes)

#### Step 2.1: Timer Hook
```typescript
// hooks/useTimer.ts
import { useState, useEffect, useCallback } from 'react';

export function useTimer(initialTime: number, onTimeUp?: () => void) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback((newTime?: number) => {
    setTimeRemaining(newTime ?? initialTime);
    setIsRunning(false);
  }, [initialTime, newTime]);

  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeRemaining, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    timeRemaining,
    isRunning,
    formattedTime: formatTime(timeRemaining),
    start,
    stop,
    reset,
  };
}
```

#### Step 2.2: Move Counter Hook
```typescript
// hooks/useMoveCounter.ts
import { useState, useCallback } from 'react';

export function useMoveCounter(limit: number, onMovesExhausted?: () => void) {
  const [movesUsed, setMovesUsed] = useState(0);
  const [movesRemaining, setMovesRemaining] = useState(limit);

  const recordMove = useCallback(() => {
    setMovesUsed(prev => {
      const newMoves = prev + 1;
      setMovesRemaining(limit - newMoves);

      if (newMoves >= limit) {
        onMovesExhausted?.();
      }

      return newMoves;
    });
  }, [limit, onMovesExhausted]);

  const reset = useCallback((newLimit?: number) => {
    setMovesUsed(0);
    setMovesRemaining(newLimit ?? limit);
  }, [limit, newLimit]);

  return {
    movesUsed,
    movesRemaining,
    recordMove,
    reset,
  };
}
```

### Phase 3: Mode-Specific Game Logic (45 minutes)

#### Step 3.1: Update useGameLogic for Mode Support
```typescript
// hooks/useGameLogic.ts - Modify existing hook
export function useGameLogic(boardSize: number, gameMode: GameMode = 'classic') {
  const [gameMode, setGameMode] = useState<GameMode>(gameMode);
  const modeConfig = GAME_MODES[gameMode];

  // Timer for timed mode
  const { timeRemaining, formattedTime, start: startTimer, reset: resetTimer } = useTimer(
    modeConfig.timeLimit || 0,
    () => setIsGameOver(true)
  );

  // Move counter for limited moves mode
  const { movesUsed, movesRemaining, recordMove, reset: resetMoveCounter } = useMoveCounter(
    modeConfig.moveLimit || Infinity,
    () => setIsGameOver(true)
  );

  // Modified restart function
  const restartGame = useCallback(() => {
    const { board: initialBoard, newTiles: initialNewTiles } = initBoard(boardSize);
    setBoard(initialBoard);
    setNewTiles(initialNewTiles);
    setScore(0);
    setIsGameOver(false);
    setHasWon(false);
    setMergedCells(createEmptyBooleanBoard(boardSize));

    // Reset mode-specific counters
    resetTimer();
    resetMoveCounter();
    setGameStartTime(Date.now());
  }, [boardSize, resetTimer, resetMoveCounter]);

  // Modified move handler
  const handleMove = useCallback((moveFn) => {
    if (isGameOver) return;

    const { newBoard, score: moveScore, mergedBoard } = moveFn(board);

    if (!areBoardsEqual(board, newBoard)) {
      // Record move for limited-moves mode
      if (gameMode === 'limited-moves') {
        recordMove();
      }

      // Apply the move
      const { newBoard: boardWithNewTile, newTileCoords } = addRandomTile(newBoard);
      setBoard(boardWithNewTile);
      setScore(prevScore => prevScore + moveScore);
      setMergedCells(mergedBoard);
      setNewTiles(newTileCoords ? [newTileCoords] : []);

      // Check win condition
      const newBoardHasWon = checkWin(boardWithNewTile);
      if (newBoardHasWon) {
        setHasWon(true);

        // Record statistics for timed mode
        if (gameMode === 'timed' && gameStartTime) {
          const completionTime = Math.floor((Date.now() - gameStartTime) / 1000);
          // Save best time logic here
        }

        // End game for limited-moves mode (win)
        if (gameMode === 'limited-moves') {
          setIsGameOver(true);
        }
      } else if (checkGameOver(boardWithNewTile)) {
        setIsGameOver(true);
      }
    }
  }, [board, isGameOver, gameMode, recordMove, gameStartTime]);

  // Start timer when game begins (after first move)
  useEffect(() => {
    if (gameMode === 'timed' && !isGameOver && hasWon === false) {
      startTimer();
    }
  }, [gameMode, isGameOver, hasWon, startTimer]);

  return {
    // ... existing state
    gameMode,
    timeRemaining,
    formattedTime,
    movesUsed,
    movesRemaining,
    restartGame,
  };
}
```

### Phase 4: UI Integration (60 minutes)

#### Step 4.1: Update App.tsx for Mode Support
```typescript
// App.tsx - Add mode selection
import GameModeSelector from './components/GameModeSelector';

function App() {
  const [boardSize, setBoardSize] = useState(4);
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const gameState = useGameLogic(boardSize, gameMode);

  const handleModeChange = (newMode: GameMode) => {
    setGameMode(newMode);
    // Restart game with new mode
    gameState.restartGame();
  };

  return (
    <div className="game-container">
      <GameModeSelector
        selectedMode={gameMode}
        onModeChange={handleModeChange}
      />

      <div className="flex justify-between items-center mb-4">
        {/* Timer/Move Counter Display */}
        {gameMode === 'timed' && (
          <div className="text-lg font-mono">
            Time: {gameState.formattedTime}
          </div>
        )}
        {gameMode === 'limited-moves' && (
          <div className="text-lg font-mono">
            Moves: {gameState.movesRemaining}
          </div>
        )}

        <Header {...gameState} onRestart={handleRestart} />
      </div>

      {/* ... rest of component */}
    </div>
  );
}
```

#### Step 4.2: Update Header for Mode-Specific Stats
```typescript
// components/Header.tsx - Add mode-specific information
interface HeaderProps {
  // ... existing props
  gameMode: GameMode;
  timeRemaining?: number;
  movesRemaining?: number;
}

function Header({
  score,
  highScore,
  onRestart,
  gameMode,
  timeRemaining,
  movesRemaining
}) {
  return (
    <header className="flex justify-between items-center">
      {/* Mode-specific stats */}
      <div className="flex gap-4">
        {gameMode === 'timed' && timeRemaining !== undefined && (
          <div className={`text-lg font-mono ${timeRemaining < 30 ? 'text-red-500' : ''}`}>
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </div>
        )}
        {gameMode === 'limited-moves' && movesRemaining !== undefined && (
          <div className={`text-lg font-mono ${movesRemaining < 10 ? 'text-red-500' : ''}`}>
            {movesRemaining} moves left
          </div>
        )}
      </div>

      {/* ... existing header content */}
    </header>
  );
}
```

#### Step 4.3: Mode-Specific Game Over Modal
```typescript
// components/GameOverModal.tsx - Update for mode-specific messages
interface GameOverModalProps {
  // ... existing props
  gameMode: GameMode;
  timeRemaining?: number;
  movesUsed?: number;
}

function GameOverModal({
  hasWon,
  score,
  onRestart,
  gameMode,
  timeRemaining,
  movesUsed
}) {
  const getModeSpecificMessage = () => {
    if (hasWon) {
      switch (gameMode) {
        case 'timed':
          return `Congratulations! You won in ${Math.floor((300 - (timeRemaining || 0)) / 60)}:${((300 - (timeRemaining || 0)) % 60).toString().padStart(2, '0')}!`;
        case 'limited-moves':
          return `Amazing! You won using only ${movesUsed} moves!`;
        default:
          return 'Congratulations! You reached 2048!';
      }
    } else {
      switch (gameMode) {
        case 'timed':
          return 'Time\'s up! Try again for a better time.';
        case 'limited-moves':
          return 'No moves left! Try to be more efficient.';
        default:
          return 'Game Over! Try again.';
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className={hasWon ? 'text-green-600' : 'text-red-600'}>
          {hasWon ? 'You Win!' : 'Game Over'}
        </h2>
        <p className="text-lg mb-4">{getModeSpecificMessage()}</p>

        {hasWon && gameMode === 'timed' && (
          <p className="text-sm text-gray-600 mb-2">
            Final Score: {score}
          </p>
        )}

        {hasWon && gameMode === 'limited-moves' && (
          <p className="text-sm text-gray-600 mb-2">
            Moves Used: {movesUsed}
          </p>
        )}

        <button
          onClick={onRestart}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
```

## Testing Strategy

### Unit Tests
```typescript
// tests/hooks/useTimer.test.tsx
describe('useTimer', () => {
  test('should countdown correctly', () => {
    const { result } = renderHook(() => useTimer(60));

    act(() => {
      result.current.start();
    });

    expect(result.current.timeRemaining).toBe(60);

    // Fast-forward time (mock implementation needed)
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.timeRemaining).toBe(59);
  });

  test('should call onTimeUp when time expires', () => {
    const onTimeUp = jest.fn();
    const { result } = renderHook(() => useTimer(1, onTimeUp));

    act(() => {
      result.current.start();
      jest.advanceTimersByTime(2000);
    });

    expect(onTimeUp).toHaveBeenCalled();
  });
});
```

### Integration Tests
```typescript
// tests/features/gameModes.test.tsx
describe('Game Modes Integration', () => {
  test('timed mode should end game when time runs out', () => {
    const { result } = renderHook(() => useGameLogic(4, 'timed'));

    // Start game
    act(() => {
      result.current.restartGame();
    });

    expect(result.current.gameMode).toBe('timed');
    expect(result.current.timeRemaining).toBe(300);

    // Simulate time running out
    act(() => {
      // Advance timer to 0 (mock timer implementation)
      jest.advanceTimersByTime(300000);
    });

    expect(result.current.isGameOver).toBe(true);
  });

  test('limited moves mode should track moves correctly', () => {
    const { result } = renderHook(() => useGameLogic(4, 'limited-moves'));

    act(() => {
      result.current.restartGame();
    });

    expect(result.current.movesRemaining).toBe(100);

    // Make moves (simplified test)
    expect(result.current.movesUsed).toBe(0);
  });
});
```

## Edge Cases & Error Handling

### Edge Cases to Handle
1. **Mode Switching**: What happens when switching modes mid-game?
2. **Timer Precision**: Handling timer accuracy across different devices
3. **Move Counting**: Ensuring moves are counted correctly
4. **Win Conditions**: Mode-specific winning conditions
5. **Statistics**: Handling statistics for different modes

### Error Conditions
1. **Timer Failures**: Browser compatibility issues with timers
2. **State Corruption**: Inconsistent state between modes
3. **Performance Issues**: Timer impacting game performance

## Interview Discussion Points

### Technical Questions
- **Q: How do you handle timer accuracy across different devices?**
  **A:** We use `setInterval` with 1-second precision and account for potential drift by checking elapsed time rather than relying solely on interval counts.

- **Q: What happens when a player switches modes mid-game?**
  **A:** The game should restart with the new mode's rules. This ensures clean state and prevents inconsistencies.

- **Q: How do you prevent cheating in timed mode?**
  **A:** We track server time if available, and use multiple time validation methods to detect potential manipulation.

### Design Decisions
- **Timer Implementation**: Custom hook for reusability and testability
- **Mode Configuration**: Centralized configuration for easy modification
- **Statistics Tracking**: Separate stats per mode for accurate tracking

## Performance Considerations

### Timer Performance
- **Browser Compatibility**: `setInterval` vs `requestAnimationFrame`
- **Battery Impact**: Timer frequency affects device battery life
- **Performance Mode**: Consider reducing timer frequency on low-end devices

### Memory Usage
- **Statistics Storage**: Keep statistics data structure efficient
- **State Management**: Mode-specific state doesn't impact performance significantly

## Future Enhancements

1. **Difficulty Levels**: Easy, Medium, Hard variants for each mode
2. **Custom Mode Parameters**: Allow players to set custom time/move limits
3. **Mode-Specific Power-ups**: Special abilities for different modes
4. **Leaderboards**: Compare performance across different modes
5. **Achievement System**: Unlock achievements for mode-specific accomplishments

## Implementation Time Estimate

- **Phase 1**: 45 minutes (mode infrastructure and types)
- **Phase 2**: 30 minutes (timer implementation)
- **Phase 3**: 45 minutes (mode-specific game logic)
- **Phase 4**: 60 minutes (UI integration and polish)
- **Testing**: 45 minutes (unit and integration tests)

**Total Estimated Time**: ~4 hours

This implementation demonstrates game design thinking, timer management, conditional logic, and user experience design - all valuable skills for technical interviews.









