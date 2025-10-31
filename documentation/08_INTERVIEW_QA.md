# Interview Q&A Guide

## Project Overview Questions

### **Q: Can you give me a high-level overview of your 2048 game project?**

**A:** This is a fully functional 2048 puzzle game built with React, TypeScript, and Tailwind CSS. The game features a responsive design that works on both desktop and mobile devices, with touch/swipe controls for mobile and keyboard controls for desktop.

**Key features include:**
- Classic 2048 gameplay with tile sliding and merging
- Configurable board sizes (3x3 to 8x8)
- Persistent high score storage
- Clean, responsive user interface

The project demonstrates modern React patterns, clean architecture, and performance optimization techniques.

### **Q: What was your role in this project?**

**A:** I was the sole developer for this project, responsible for:
- Designing and implementing the entire game logic and algorithms
- Creating the React component architecture
- Implementing responsive UI/UX design
- Optimizing performance for smooth gameplay
- Ensuring type safety with TypeScript usage

## Architecture & Design Questions

### **Q: Can you explain the overall architecture of your application?**

**A:** The application follows a **layered architecture** with clear separation of concerns:

1. **Logic Layer** (`utils/board.ts`): Pure functions for game mechanics
2. **State Layer** (`hooks/useGameLogic.ts`): Custom hook managing all game state
3. **UI Layer** (`components/`): React components for presentation
4. **Runtime Layer**: React engine and browser APIs

This architecture ensures:
- **Testability**: Pure functions can be tested in isolation
- **Maintainability**: Clear separation makes changes easier
- **Reusability**: Logic can be reused across different UI implementations

### **Q: Why did you choose to use a custom hook for state management?**

**A:** The `useGameLogic` custom hook centralizes all game state and business logic, providing several benefits:

1. **Single Source of Truth**: All game state in one place
2. **Encapsulation**: Game logic separated from UI concerns
3. **Reusability**: Hook can be used by any component that needs game state
4. **Testability**: Business logic can be tested independently of React components
5. **Clean Components**: UI components focus purely on presentation

### **Q: How does your component architecture follow React best practices?**

**A:** The component architecture follows several React best practices:

1. **Single Responsibility**: Each component has one clear purpose
2. **Composition over Inheritance**: Components are composed together
3. **Props Down, Events Up**: Clear data flow from parent to children
4. **Pure Components**: Components are pure functions of their props
5. **Proper State Colocation**: State managed at appropriate levels

## Algorithm & Data Structure Questions

### **Q: Can you explain how the tile movement algorithm works?**

**A:** The tile movement algorithm uses a clever **board rotation technique**:

1. **Core Function**: `slideAndMerge()` handles movement in one direction (left)
2. **Other Directions**: Implemented by rotating the board, applying the core function, then rotating back

```typescript
// Move up: rotate left → apply left-move logic → rotate right
export function moveUp(board: BoardType) {
  const rotated = rotateLeft(board);
  const { newBoard, score } = operate(rotated);
  return {
    newBoard: rotateRight(newBoard),
    score
  };
}
```

This approach:
- **DRY Principle**: Single movement logic reused for all directions
- **Consistency**: All movement directions behave identically
- **Maintainability**: Changes only need to be made in one place

### **Q: What data structures do you use for the game board?**

**A:** I use **2D arrays** for the game board representation:

```typescript
export type BoardType = TileValue[][];
export type TileValue = number;

// Example 4x4 board:
const board: BoardType = [
  [0, 2, 4, 8],      // Row 0: empty, 2, 4, 8
  [16, 32, 64, 128], // Row 1: 16, 32, 64, 128
  [256, 512, 0, 0],  // Row 2: 256, 512, empty, empty
  [0, 0, 0, 0]       // Row 3: all empty
];
```

**Design Decisions:**
- **Intuitive Representation**: Matches visual grid layout
- **Efficient Access**: O(1) access to any cell with `board[row][col]`
- **Memory Efficient**: Contiguous memory layout
- **Immutable Operations**: All transformations return new arrays

### **Q: How do you handle the game over condition detection?**

**A:** Game over detection uses a two-step algorithm:

```typescript
export function isGameOver(board: BoardType): boolean {
  // Step 1: Check if there are any empty cells
  const hasEmptyCells = getEmptyCells(board).length > 0;
  if (hasEmptyCells) return false;  // Game continues if cells are empty

  // Step 2: Check if any moves are possible (adjacent identical tiles)
  return !canMove(board);
}

function canMove(board: BoardType): boolean {
  const size = board.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Check right neighbor
      if (c < size - 1 && board[r][c] === board[r][c + 1]) return true;
      // Check bottom neighbor
      if (r < size - 1 && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}
```

**Algorithm Characteristics:**
- **Early Termination**: Returns false immediately if empty cells exist
- **Comprehensive Check**: Examines all possible merge opportunities
- **Time Complexity**: O(n²) where n is board size
- **Space Complexity**: O(1) additional space

## React & State Management Questions

### **Q: How do you handle side effects in your React application?**

**A:** I use `useEffect` hooks to manage side effects properly:

```typescript
// Keyboard event listeners
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    // Handle arrow key presses
  }

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown); // Cleanup
}, [handleMove]);

// localStorage persistence
useEffect(() => {
  if (score > highScore) {
    setHighScore(score);
    localStorage.setItem('highScore2048', String(score));
  }
}, [score, highScore]);
```

**Key Practices:**
- **Proper Cleanup**: All effects return cleanup functions
- **Minimal Dependencies**: Careful dependency array management
- **Separation of Concerns**: Each effect handles one specific side effect

### **Q: How do you optimize performance in your React components?**

**A:** I use several performance optimization techniques:

1. **useCallback for Expensive Functions**:
```typescript
const handleMove = useCallback(function(moveFn) {
  // Complex move logic
}, [board, isGameOver]); // Minimal dependencies
```

2. **Pure Components**: Components are pure functions of props
3. **Efficient Event Handling**: Proper touch event handling for mobile

### **Q: Can you explain your touch handling implementation?**

**A:** The touch handling uses gesture recognition for mobile devices:

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

**Key Features:**
- **Gesture Recognition**: Distinguishes between swipes and scrolls
- **Performance Optimized**: Proper event handling for mobile
- **Cross-platform**: Works on different touch devices

## Performance & Optimization Questions

### **Q: What are the time and space complexities of your algorithms?**

**A:**
| Operation | Time Complexity | Space Complexity | Notes |
|-----------|----------------|------------------|-------|
| `slideAndMerge` | O(n) | O(n) | Single row/column |
| Board rotation | O(n²) | O(n²) | Full grid transformation |
| Movement operations | O(n²) | O(n²) | Process entire board |
| Empty cell detection | O(n²) | O(1) | Scan all cells |
| Game over check | O(n²) | O(1) | Early termination possible |

For a typical 4x4 board (n=4):
- **Move Operations**: ~16 operations, very fast
- **Memory Usage**: ~2-5MB total application memory

## Code Quality & Best Practices Questions

### **Q: How do you ensure type safety in your TypeScript code?**

**A:** I use TypeScript best practices:

1. **Strict Configuration**: Type checking enabled
2. **Custom Types**: Centralized type definitions in `types.ts`
3. **Interface Design**: Well-designed component props interfaces

```typescript
// TypeScript config includes type safety
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

## Behavioral & Problem-Solving Questions

### **Q: What was the most challenging part of this project?**

**A:** The most challenging aspects were:

1. **Touch Gesture Recognition**: Implementing accurate swipe detection for mobile devices
2. **Responsive Design**: Creating a layout that works seamlessly across all device sizes
3. **State Management**: Coordinating game state updates with UI rendering

### **Q: How did you approach debugging complex game state issues?**

**A:** I used several debugging strategies:

1. **Development Validation**: Added runtime checks for state consistency
2. **Step-by-Step Testing**: Isolated each algorithm component
3. **Browser Dev Tools**: Used React DevTools to inspect component state

## Technical Deep Dive Questions

### **Q: Can you walk me through the board rotation algorithm?**

**A:** The board rotation algorithm is a key optimization that allows reusing the same movement logic for all directions:

```typescript
function rotateRight<T>(grid: T[][]): T[][] {
  const size = grid.length;
  const newGrid = Array.from({ length: size }, () => new Array<T>(size));

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Rotate 90 degrees clockwise: (r,c) -> (c, size-1-r)
      newGrid[c][size - 1 - r] = grid[r][c];
    }
  }

  return newGrid;
}
```

**Mathematical Insight:**
- **Coordinate Transformation**: Each cell (r,c) moves to (c, size-1-r)
- **Matrix Rotation**: Standard linear algebra transformation
- **Generic Implementation**: Works for any 2D array type

### **Q: How do you handle the random tile generation?**

**A:** Random tile generation uses a fair distribution algorithm:

```typescript
export function addRandomTile(board: BoardType): {
  newBoard: BoardType;
  newTileCoords: [number, number] | null
} {
  const newBoard = board.map(row => [...row]); // Deep copy
  const emptyCells = getEmptyCells(newBoard);

  if (emptyCells.length === 0) {
    return { newBoard, newTileCoords: null };
  }

  // Uniform random selection
  const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];

  // Weighted value distribution (90% chance of 2, 10% chance of 4)
  newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;

  return { newBoard, newTileCoords: [r, c] };
}
```

**Key Features:**
- **Fair Distribution**: Equal probability for each empty cell
- **Immutable**: Returns new board without mutating input
- **Weighted Values**: Matches original 2048 game probabilities

This Q&A guide demonstrates understanding of the 2048 game implementation, from high-level architecture to low-level algorithm details.

