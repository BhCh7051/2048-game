# Undo/Redo System Implementation

## Feature Overview

Implement an undo/redo system that allows players to reverse their moves and potentially retry moves. This is a common feature request for puzzle games that enhances user experience and reduces frustration from accidental moves.

## Requirements Analysis

### Core Requirements
- **Undo Move**: Reverse the last move, restoring the board to its previous state
- **Redo Move**: Reapply a move that was undone
- **Multiple Levels**: Support undoing multiple moves in sequence
- **UI Controls**: Buttons or keyboard shortcuts for undo/redo actions
- **Visual Feedback**: Indicate when undo/redo is available
- **State Preservation**: Maintain score, tile positions, and game status correctly

### Interview Questions to Ask
1. How many moves should be stored in history? (Memory considerations)
2. Should score changes be reversible?
3. How should this interact with the "has won" state?
4. Should animations play when undoing/redoing?

## Technical Approach

### Architecture Decisions
1. **History Stack**: Use a stack data structure to store game states
2. **Deep Copy**: Store complete board states for accurate restoration
3. **Memory Management**: Limit history size to prevent memory issues
4. **State Consistency**: Ensure all game state is properly synchronized

### Data Structures
```typescript
interface GameSnapshot {
  board: BoardType;
  score: number;
  isGameOver: boolean;
  hasWon: boolean;
  // Add other relevant state as needed
}

interface UndoRedoState {
  history: GameSnapshot[];
  currentIndex: number;
  maxHistorySize: number;
}
```

## Step-by-Step Implementation

### Phase 1: Core Data Structure (30 minutes)

#### Step 1.1: Define History Types
```typescript
// types.ts - Add these interfaces
export interface GameSnapshot {
  board: BoardType;
  score: number;
  isGameOver: boolean;
  hasWon: boolean;
  mergedCells?: boolean[][];
  newTiles?: Coordinates[];
}

export interface UndoRedoState {
  history: GameSnapshot[];
  currentIndex: number;
  maxHistorySize: number;
}
```

#### Step 1.2: Create History Utility Functions
```typescript
// utils/history.ts
import type { BoardType, GameSnapshot } from '../types';

export function createSnapshot(
  board: BoardType,
  score: number,
  isGameOver: boolean,
  hasWon: boolean
): GameSnapshot {
  return {
    board: board.map(row => [...row]), // Deep copy
    score,
    isGameOver,
    hasWon,
  };
}

export function canUndo(currentIndex: number): boolean {
  return currentIndex > 0;
}

export function canRedo(currentIndex: number, historyLength: number): boolean {
  return currentIndex < historyLength - 1;
}
```

#### Step 1.3: Add History State to useGameLogic
```typescript
// hooks/useGameLogic.ts - Add to existing state
const [history, setHistory] = useState<GameSnapshot[]>([]);
const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
const MAX_HISTORY_SIZE = 50; // Configurable limit
```

### Phase 2: Move Recording (45 minutes)

#### Step 2.1: Modify handleMove to Record History
```typescript
const handleMove = useCallback(function(moveFn) {
  if (isGameOver) return;

  const previousSnapshot = createSnapshot(board, score, isGameOver, hasWon);

  const { newBoard, score: moveScore, mergedBoard } = moveFn(board);

  if (!areBoardsEqual(board, newBoard)) {
    // Record current state before making the move
    const newHistory = history.slice(0, currentHistoryIndex + 1);
    newHistory.push(previousSnapshot);

    // Limit history size
    if (newHistory.length > MAX_HISTORY_SIZE) {
      newHistory.shift(); // Remove oldest entry
    }

    setHistory(newHistory);
    setCurrentHistoryIndex(newHistory.length - 1);

    // Apply the move
    const { newBoard: boardWithNewTile, newTileCoords } = addRandomTile(newBoard);
    setBoard(boardWithNewTile);
    setScore(prevScore => prevScore + moveScore);
    setMergedCells(mergedBoard);
    setNewTiles(newTileCoords ? [newTileCoords] : []);

    // Check win/lose conditions
    const newBoardHasWon = checkWin(boardWithNewTile);
    if (newBoardHasWon) {
      setHasWon(true);
      setIsGameOver(true);
    } else if (checkGameOver(boardWithNewTile)) {
      setIsGameOver(true);
    }
  }
}, [board, isGameOver, history, currentHistoryIndex, score, hasWon]);
```

#### Step 2.2: Update restartGame to Clear History
```typescript
const restartGame = useCallback(function() {
  const { board: initialBoard, newTiles: initialNewTiles } = initBoard(boardSize);
  setBoard(initialBoard);
  setNewTiles(initialNewTiles);
  setScore(0);
  setIsGameOver(false);
  setHasWon(false);
  setMergedCells(createEmptyBooleanBoard(boardSize));

  // Clear history
  setHistory([]);
  setCurrentHistoryIndex(-1);
}, [boardSize]);
```

### Phase 3: Undo/Redo Functions (30 minutes)

#### Step 3.1: Implement Undo Function
```typescript
const undo = useCallback(() => {
  if (!canUndo(currentHistoryIndex)) return null;

  const previousIndex = currentHistoryIndex - 1;
  const previousSnapshot = history[previousIndex];

  if (previousSnapshot) {
    // Restore state
    setBoard(previousSnapshot.board);
    setScore(previousSnapshot.score);
    setIsGameOver(previousSnapshot.isGameOver);
    setHasWon(previousSnapshot.hasWon);
    setMergedCells(createEmptyBooleanBoard(boardSize));
    setNewTiles([]);
    setCurrentHistoryIndex(previousIndex);

    return previousSnapshot;
  }

  return null;
}, [history, currentHistoryIndex, boardSize]);
```

#### Step 3.2: Implement Redo Function
```typescript
const redo = useCallback(() => {
  if (!canRedo(currentHistoryIndex, history.length)) return null;

  const nextIndex = currentHistoryIndex + 1;
  const nextSnapshot = history[nextIndex];

  if (nextSnapshot) {
    // Restore state
    setBoard(nextSnapshot.board);
    setScore(nextSnapshot.score);
    setIsGameOver(nextSnapshot.isGameOver);
    setHasWon(nextSnapshot.hasWon);
    setMergedCells(createEmptyBooleanBoard(boardSize));
    setNewTiles([]);
    setCurrentHistoryIndex(nextIndex);

    return nextSnapshot;
  }

  return null;
}, [history, currentHistoryIndex, boardSize]);
```

### Phase 4: UI Integration (45 minutes)

#### Step 4.1: Add Undo/Redo Buttons to Header
```typescript
// components/Header.tsx - Add to existing component
interface HeaderProps {
  // ... existing props
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

function Header({ score, highScore, onRestart, canUndo, canRedo, onUndo, onRedo }) {
  return (
    <header className="flex justify-between items-center mb-4">
      <div className="flex gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`px-3 py-1 rounded ${
            canUndo ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
          }`}
        >
          ↶ Undo
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`px-3 py-1 rounded ${
            canRedo ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
          }`}
        >
          ↷ Redo
        </button>
      </div>

      <div className="text-center">
        <div className="text-sm text-gray-600">Score</div>
        <div className="text-xl font-bold">{score}</div>
        <div className="text-xs text-gray-500">High: {highScore}</div>
      </div>

      <button
        onClick={onRestart}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        New Game
      </button>
    </header>
  );
}
```

#### Step 4.2: Update App.tsx to Pass Undo/Redo Props
```typescript
// App.tsx - Update to pass undo/redo capabilities
function App() {
  const [boardSize, setBoardSize] = useState(4);
  const gameState = useGameLogic(boardSize);

  return (
    <div className="game-container">
      <Header
        {...gameState}
        canUndo={gameState.canUndo}
        canRedo={gameState.canRedo}
        onUndo={gameState.undo}
        onRedo={gameState.redo}
        onRestart={handleRestart}
      />
      {/* ... rest of component */}
    </div>
  );
}
```

#### Step 4.3: Add Keyboard Shortcuts
```typescript
// Add keyboard shortcuts for undo (Ctrl+Z) and redo (Ctrl+Y)
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'z':
          e.preventDefault();
          if (gameState.canUndo) gameState.undo();
          break;
        case 'y':
          e.preventDefault();
          if (gameState.canRedo) gameState.redo();
          break;
      }
    }
  }

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [gameState.canUndo, gameState.canRedo, gameState.undo, gameState.redo]);
```

## Testing Strategy

### Unit Tests
```typescript
// tests/utils/history.test.ts
describe('History Utilities', () => {
  test('should create accurate snapshots', () => {
    const board = [[2, 4], [8, 0]];
    const snapshot = createSnapshot(board, 100, false, false);

    expect(snapshot.board).toEqual(board);
    expect(snapshot.board).not.toBe(board); // Different reference
    expect(snapshot.score).toBe(100);
  });

  test('should detect undo/redo availability', () => {
    expect(canUndo(0)).toBe(false);
    expect(canUndo(1)).toBe(true);
    expect(canRedo(0, 2)).toBe(true);
    expect(canRedo(1, 2)).toBe(false);
  });
});
```

### Integration Tests
```typescript
// tests/hooks/useGameLogic.test.tsx
describe('Undo/Redo Integration', () => {
  test('should undo move correctly', () => {
    const { result } = renderHook(() => useGameLogic(4));

    // Make a move
    act(() => {
      result.current.handleMove(moveLeft);
    });

    const scoreAfterMove = result.current.score;

    // Undo the move
    act(() => {
      result.current.undo();
    });

    expect(result.current.score).toBeLessThan(scoreAfterMove);
  });

  test('should handle history limits', () => {
    const { result } = renderHook(() => useGameLogic(4));

    // Make many moves to exceed history limit
    for (let i = 0; i < 60; i++) {
      act(() => {
        result.current.handleMove(moveLeft);
      });
    }

    // Should still be able to undo (limited history)
    expect(result.current.canUndo).toBe(true);
  });
});
```

## Edge Cases & Error Handling

### Edge Cases to Handle
1. **Game Over State**: Undoing should restore pre-game-over state
2. **Win State**: Undoing a winning move should clear win status
3. **Empty History**: Handle gracefully when no moves to undo
4. **Full History**: Implement proper history size management
5. **Concurrent Moves**: Prevent race conditions

### Error Conditions
1. **Corrupted History**: Validate history entries on load
2. **State Inconsistency**: Verify state consistency after undo/redo
3. **Memory Issues**: Handle large history sizes gracefully

## Interview Discussion Points

### Technical Questions
- **Q: How does your undo system handle the random tile generation?**
  **A:** The snapshot includes the complete board state before the random tile is added, ensuring perfect restoration.

- **Q: What happens to the score when you undo a move?**
  **A:** The score is restored to its previous value, maintaining game state consistency.

- **Q: How do you prevent memory leaks with the history system?**
  **A:** We limit the history size and use efficient data structures (arrays with size limits).

### Design Decisions
- **Deep Copy Strategy**: Ensures complete state isolation
- **History Limits**: Prevents unlimited memory growth
- **UI Feedback**: Clear indication of available actions

## Performance Considerations

### Memory Usage
- **History Storage**: Each snapshot stores a complete board state
- **Growth Management**: Fixed-size history prevents unbounded growth
- **Garbage Collection**: Proper cleanup of old history entries

### Performance Impact
- **Move Time**: Slightly increased due to snapshot creation
- **Memory Usage**: Additional memory for history storage
- **UI Responsiveness**: Minimal impact on game performance

## Future Enhancements

1. **Persistent Undo History**: Save undo history across browser sessions
2. **Selective Undo**: Allow undoing specific moves, not just sequential
3. **Animation on Undo**: Show reverse animations when undoing moves
4. **History Visualization**: Show a preview of previous board states

## Implementation Time Estimate

- **Phase 1**: 30 minutes (data structures and types)
- **Phase 2**: 45 minutes (move recording)
- **Phase 3**: 30 minutes (undo/redo functions)
- **Phase 4**: 45 minutes (UI integration and keyboard shortcuts)
- **Testing**: 30 minutes (unit and integration tests)

**Total Estimated Time**: ~3 hours

This implementation demonstrates advanced state management, data structure design, and user experience considerations that are valuable in technical interviews.









