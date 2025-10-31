# Data Structures and Algorithms

## Core Data Structures

### 1. **Board Representation**
```typescript
// Primary data structure: 2D array representing the game grid
export type BoardType = TileValue[][];
export type TileValue = number;

// Example 4x4 board:
const board: BoardType = [
  [0, 2, 4, 8],      // Row 0
  [16, 32, 64, 128], // Row 1
  [256, 512, 0, 0],  // Row 2
  [0, 0, 0, 0]       // Row 3
];
```

**Design Decisions:**
- **2D Array**: Intuitive grid representation matching visual layout
- **Row-major Order**: Natural left-to-right, top-to-bottom iteration
- **Zero Values**: Empty cells represented as `0` for easy filtering
- **Immutable Operations**: All transformations return new arrays

### 2. **Coordinate System**
```typescript
// Cell coordinates as tuple type
type Coordinates = [number, number]; // [row, column]

// Examples:
// - Empty cell detection: [number, number][]
// - New tile positions: Array<[number, number]>

const emptyCells: Coordinates[] = [[2, 2], [2, 3], [3, 0], [3, 1]];
```

## Core Algorithms

### 1. **Tile Movement Algorithm** (`slideAndMerge`)

**Problem**: Move all tiles in a row/column in one direction, merging identical adjacent tiles.

**Algorithm Steps:**
```typescript
function slideAndMerge(row: TileValue[]): {
  newRow: TileValue[];
  score: number;
} {
  // Step 1: Remove empty cells (filter)
  const filteredRow = row.filter(v => v !== 0);

  // Step 2: Merge adjacent identical tiles
  let newRow: TileValue[] = [];
  let score = 0;

  for (let i = 0; i < filteredRow.length; i++) {
    if (i + 1 < filteredRow.length && filtered[i] === filtered[i + 1]) {
      // Merge: Combine values
      const mergedValue = filtered[i] * 2;
      newRow.push(mergedValue);
      score += mergedValue;
      i++; // Skip next element (already merged)
    } else {
      // No merge: Keep tile as-is
      newRow.push(filtered[i]);
    }
  }

  // Step 3: Pad with zeros to maintain original length
  while (newRow.length < row.length) {
    newRow.push(0);
  }

  return { newRow, score };
}
```

**Time Complexity**: O(n) where n is row length
**Space Complexity**: O(n) for new arrays

**Key Insights:**
- **Single Pass**: Process each tile exactly once
- **Greedy Merging**: Leftmost tiles take precedence

### 2. **Board Rotation Algorithm**

**Problem**: Transform movement directions by rotating the entire board.

**Clockwise Rotation (rotateRight):**
```typescript
function rotateRight<T>(grid: T[][]): T[][] {
  const size = grid.length;
  const newGrid = Array.from({ length: size }, () => new Array<T>(size));

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      newGrid[c][size - 1 - r] = grid[r][c];
    }
  }

  return newGrid;
}
```

**Mathematical Insight:**
- **Matrix Rotation**: Standard 90-degree clockwise transformation
- **Coordinate Mapping**: `(r,c) → (c, size-1-r)`

**Counter-clockwise Rotation (rotateLeft):**
```typescript
function rotateLeft<T>(grid: T[][]): T[][] {
  const size = grid.length;
  const newGrid = Array.from({ length: size }, () => new Array<T>(size));

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      newGrid[size - 1 - c][r] = grid[r][c];
    }
  }

  return newGrid;
}
```

**Time Complexity**: O(n²) for n×n grid
**Space Complexity**: O(n²) for new grid

### 3. **Movement Direction Implementation**

**Strategy Pattern Applied:**
```typescript
// All directions use the same underlying logic through rotation
export function moveLeft(board: BoardType) {
  return operate(board); // Direct application
}

export function moveRight(board: BoardType) {
  const reversed = board.map(row => [...row].reverse());
  const { newBoard, score } = operate(reversed);
  return {
    newBoard: newBoard.map(row => [...row].reverse()),
    score
  };
}

export function moveUp(board: BoardType) {
  const rotated = rotateLeft(board);        // Transform
  const { newBoard, score } = operate(rotated);
  return {
    newBoard: rotateRight(newBoard),        // Transform back
    score
  };
}

export function moveDown(board: BoardType) {
  const rotated = rotateRight(board);       // Transform
  const { newBoard, score } = operate(rotated);
  return {
    newBoard: rotateLeft(newBoard),         // Transform back
    score
  };
}
```

**Design Benefits:**
- **DRY Principle**: Single `slideAndMerge` function handles all cases
- **Consistency**: All movement directions behave identically
- **Maintainability**: Changes to movement logic only need one place

### 4. **Random Tile Generation**

**Algorithm for Adding New Tiles:**
```typescript
export function addRandomTile(board: BoardType): {
  newBoard: BoardType;
  newTileCoords: Coordinates | null
} {
  const newBoard = board.map(row => [...row]);  // Deep copy
  const emptyCells = getEmptyCells(newBoard);

  if (emptyCells.length === 0) {
    return { newBoard, newTileCoords: null };
  }

  // Random selection with uniform distribution
  const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;  // 90% chance of 2, 10% of 4

  return { newBoard, newTileCoords: [r, c] };
}
```

**Key Features:**
- **Uniform Randomness**: Equal probability for each empty cell
- **Weighted Values**: 90/10 split between 2 and 4 (matches original game)
- **Immutable**: Returns new board without modifying input

### 5. **Game State Detection**

**Win Condition:**
```typescript
export function hasWon(board: BoardType): boolean {
  return board.some(row => row.some(cell => cell === 2048));
}
```
- **Simple Scan**: O(n²) search for target value
- **Early Detection**: Can continue playing after winning

**Game Over Detection:**
```typescript
export function isGameOver(board: BoardType): boolean {
  const hasEmptyCells = getEmptyCells(board).length > 0;
  if (hasEmptyCells) return false;

  // Check for possible merges (adjacent identical tiles)
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

**Optimization Insight:**
- **Short-circuit**: Return early on first possible move
- **Comprehensive**: Check all adjacent pairs (horizontal and vertical)

## Algorithm Complexity Analysis

| Operation | Time Complexity | Space Complexity | Notes |
|-----------|----------------|------------------|-------|
| `slideAndMerge` | O(n) | O(n) | Single row/column |
| Board Rotation | O(n²) | O(n²) | Full grid transformation |
| Movement Operations | O(n²) | O(n²) | Process entire board |
| Empty Cell Detection | O(n²) | O(1) | Scan all cells |
| Game Over Check | O(n²) | O(1) | Short-circuit possible |
| Random Tile Add | O(n²) | O(n²) | Find empty cells + update |

## Optimizations Implemented

### 1. **Immutable Data Structures**
- **Benefit**: Predictable state changes, easier debugging
- **Trade-off**: Higher memory usage for array copies
- **React Integration**: Triggers proper re-renders when state changes

### 2. **Efficient Empty Cell Tracking**
- **Naive Approach**: Scan entire board each time
- **Current Approach**: Same (acceptable for small n ≤ 8)

### 3. **Event Handling Optimization**
- **Touch Events**: Proper touch event handling for mobile gameplay
- **Keyboard Events**: Proper cleanup to prevent memory leaks

## Edge Cases Handled

1. **Empty Board**: Handled by `initBoard` with two random tiles
2. **Full Board**: No more moves possible, game over detection works
3. **Single Tile**: Merging logic handles gracefully
4. **Maximum Tile (2048)**: Win condition properly detected
5. **Board Boundaries**: Rotation algorithms handle all sizes correctly

This implementation demonstrates a balance between algorithmic efficiency, code clarity, and practical performance for a web-based puzzle game.

