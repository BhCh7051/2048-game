# State Management and React Hooks

## State Management Architecture

The 2048 game uses a **centralized state management approach** with React hooks, implementing functional programming principles for predictable and maintainable state updates. All game state is managed in a single custom hook (`useGameLogic`), creating a clear separation between business logic and UI concerns.

### **State Management Principles**

#### 1. **Single Source of Truth**
All game state is centralized in the `useGameLogic` hook:

```typescript
function useGameLogic(boardSize: number) {
  // All state lives here - single source of truth
  const [board, setBoard] = useState<BoardType>(() => initBoard(boardSize).board);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  // All state updates happen through this hook's functions
  const restartGame = useCallback(() => { /* ... */ }, [boardSize]);
  const handleMove = useCallback((moveFn) => { /* ... */ }, [board, isGameOver]);

  return {
    // State exposed to components
    board, score, highScore, isGameOver, hasWon,
    // Actions exposed to components
    restartGame
  };
}
```

**Benefits:**
- **Consistency**: No conflicting state sources
- **Debugging**: Easy to trace state changes
- **Testing**: Mock the entire game state interface
- **Performance**: React can optimize re-renders effectively

#### 2. **Immutable State Updates**
All state updates follow immutability principles:

```typescript
// Correct: Creating new state
setBoard(prevBoard => {
  const newBoard = prevBoard.map(row => [...row]); // Deep copy
  const { newBoard: boardWithTile } = addRandomTile(newBoard);
  return boardWithTile;
});

// Functional updates
setScore(prevScore => prevScore + moveScore);
setHighScore(prevHigh => Math.max(prevHigh, score));
```

**Benefits:**
- **Predictability**: State changes are explicit and trackable
- **React Optimization**: Enables shallow comparison optimizations

## State Structure

### **Core Game State**
```typescript
interface GameState {
  // Primary game data
  board: BoardType;              // 2D array representing the game grid
  score: number;                 // Current game score
  highScore: number;             // Persistent high score from localStorage

  // Game status
  isGameOver: boolean;           // Whether game has ended
  hasWon: boolean;               // Whether player reached 2048
}
```

### **State Categories**

1. **Persistent State**: `highScore` (stored in localStorage)
2. **Dynamic State**: `board`, `score`, `isGameOver`, `hasWon`
3. **Configuration State**: `boardSize` (managed in App component)

## Custom Hook: `useGameLogic`

### **Hook Interface**
```typescript
function useGameLogic(boardSize: number): GameState & {
  restartGame: () => void;
}
```

**Parameters:**
- `boardSize: number` - Grid dimensions (3-8)

**Returns:**
- Complete game state object
- `restartGame` function for game reset

### **State Initialization**
```typescript
export function useGameLogic(boardSize: number) {
  // Lazy initialization with function to avoid unnecessary computation
  const [board, setBoard] = useState<BoardType>(() => initBoard(boardSize).board);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
}
```

**Design Decisions:**
- **Lazy Initialization**: `() => initBoard(boardSize)` prevents expensive computation on every render
- **Separate State Variables**: Each piece of state has its own `useState` for fine-grained updates

## State Update Patterns

### **Direct State Updates**
```typescript
// Immediate state changes (score, game status)
setScore(prevScore => prevScore + moveScore);
setIsGameOver(true);
setHasWon(true);
```

### **Computed State Updates**
```typescript
// State updates based on current state
setScore(prevScore => prevScore + moveScore);
setHighScore(prevHigh => Math.max(prevHigh, score));
```

### **Complex State Transitions**
```typescript
// Multiple related state updates in sequence
if (!areBoardsEqual(board, newBoard)) {
  const { newBoard: boardWithNewTile } = addRandomTile(newBoard);

  // Update multiple pieces of state atomically
  setBoard(boardWithNewTile);
  setScore(prevScore => prevScore + moveScore);

  // Check win/lose conditions
  const newBoardHasWon = checkWin(boardWithNewTile);
  if (newBoardHasWon) {
    setHasWon(true);
    setIsGameOver(true);
  } else if (checkGameOver(boardWithNewTile)) {
    setIsGameOver(true);
  }
}
```

## Side Effects Management

### **useEffect for Side Effects**

1. **High Score Persistence**
```typescript
useEffect(() => {
  const storedHighScore = localStorage.getItem('highScore2048');
  if (storedHighScore) {
    setHighScore(parseInt(storedHighScore, 10));
  }
}, []); // Empty dependency array - run once on mount

useEffect(() => {
  if (score > highScore) {
    setHighScore(score);
    localStorage.setItem('highScore2048', String(score));
  }
}, [score, highScore]); // Update when score or highScore changes
```

2. **Board Size Changes**
```typescript
// Reset game when board size changes
useEffect(() => {
  restartGame();
}, [boardSize, restartGame]);
```

### **Event Listener Management**

1. **Keyboard Controls**
```typescript
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    // Handle arrow key presses
    switch (e.key) {
      case 'ArrowUp':
        handleMove(moveUp);
        break;
      // ... other cases
    }
  }

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [handleMove]); // Depends on handleMove function
```

2. **Touch Controls**
```typescript
useEffect(() => {
  const touchStart = { x: 0, y: 0 };

  function handleTouchStart(e: TouchEvent) {
    touchStart.x = e.changedTouches[0].clientX;
    touchStart.y = e.changedTouches[0].clientY;
  }

  function handleTouchEnd(e: TouchEvent) {
    const deltaX = e.changedTouches[0].clientX - touchStart.x;
    const deltaY = e.changedTouches[0].clientY - touchStart.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > 30) {
        handleMove(deltaX > 0 ? moveRight : moveLeft);
      }
    } else {
      if (Math.abs(deltaY) > 30) {
        handleMove(deltaY > 0 ? moveDown : moveUp);
      }
    }
  }

  window.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('touchend', handleTouchEnd, { passive: false });

  return () => {
    window.removeEventListener('touchstart', handleTouchStart);
    window.removeEventListener('touchend', handleTouchEnd);
  };
}, [handleMove]);
```

## Function Memoization with useCallback

### **Performance Optimization**
```typescript
// Memoize expensive function to prevent unnecessary re-renders
const restartGame = useCallback(function() {
  const { board: initialBoard } = initBoard(boardSize);
  setBoard(initialBoard);
  setScore(0);
  setIsGameOver(false);
  setHasWon(false);
}, [boardSize]); // Only recreate when boardSize changes

// Memoize move handler to prevent child re-renders
const handleMove = useCallback(function(moveFn) {
  if (isGameOver) return;

  const { newBoard, score: moveScore } = moveFn(board);

  if (!areBoardsEqual(board, newBoard)) {
    // ... move logic
  }
}, [board, isGameOver]); // Minimal dependencies
```

**Benefits:**
- **Prevents Re-renders**: Child components don't unnecessarily update
- **Stabilizes References**: Event listeners don't get recreated
- **Performance**: Reduces function creation overhead

## State Dependencies and Effects

### **Dependency Management**
```typescript
// Careful dependency management prevents infinite loops
useEffect(() => {
  if (score > highScore) {
    setHighScore(score);
    localStorage.setItem('highScore2048', String(score));
  }
}, [score, highScore]); // Both dependencies needed
```

**Common Patterns:**
- **Empty Array `[]`**: Run once on mount (componentDidMount)
- **State Variables**: Run when specific state changes
- **Functions**: Include memoized functions in dependencies

## State Validation and Error Handling

### **Defensive State Management**
```typescript
// Validate board size constraints
function handleSizeChange(newSize: number) {
  if (newSize >= 3 && newSize <= 8) {
    setBoardSize(newSize);
  }
}
```

### **State Consistency**
- **Atomic Updates**: Related state changes happen together
- **Validation**: Input validation before state changes
- **Type Safety**: TypeScript ensures state shape consistency

## Local Storage Integration

### **Persistent State Pattern**
```typescript
// Initialize from localStorage
useEffect(() => {
  const stored = localStorage.getItem('highScore2048');
  if (stored) {
    setHighScore(parseInt(stored, 10));
  }
}, []);

// Update localStorage when state changes
useEffect(() => {
  if (score > highScore) {
    const newHighScore = score;
    setHighScore(newHighScore);
    localStorage.setItem('highScore2048', String(newHighScore));
  }
}, [score, highScore]);
```

**Design Decisions:**
- **Selective Persistence**: Only high score persisted, not entire game state
- **Type Safety**: ParseInt with fallback for corrupted data
- **Performance**: Debounced writes (natural through state updates)

## Best Practices Applied

1. **Single Source of Truth**: All game state in one hook
2. **Immutable Updates**: State updates don't mutate existing data
3. **Proper Cleanup**: Effects clean up resources and subscriptions
4. **Memoization**: Expensive functions properly memoized
5. **Type Safety**: Full TypeScript coverage for state shapes
6. **Error Handling**: Defensive programming for edge cases

This state management approach provides a robust, maintainable, and performant foundation for the 2048 game while demonstrating modern React patterns and best practices.
