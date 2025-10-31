# Architecture and Design Patterns

## System Architecture Overview

This 2048 game follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────┐
│           UI Layer                  │
│   ┌─────────────┐ ┌─────────────┐   │
│   │ Components  │ │   Hooks     │   │
│   │ (React)     │ │ (Business   │   │
│   └─────────────┘ │   Logic)    │   │
└─────────────────────┼─────────────┘   │
┌─────────────────────────────────────┐ │
│         Logic Layer                 │ │
│   ┌─────────────┐ ┌─────────────┐   │ │
│   │   Utils     │ │   Types     │   │ │
│   │ (Pure       │ │ (TypeScript)│   │ │
│   │ Functions)  │ └─────────────┘   │ │
│   └─────────────┘                   │ │
└─────────────────────────────────────┘ │
┌─────────────────────────────────────┘
│         Runtime Layer
│   ┌─────────────┐ ┌─────────────┐
│   │   React     │ │   Browser   │
│   │   Engine    │ │   APIs      │
│   └─────────────┘ └─────────────┘
```

## Functional Programming Principles

The 2048 game implementation leverages functional programming principles to ensure predictability, testability, and maintainability.

### **Core Functional Programming Concepts Applied**

#### 1. **Pure Functions**
All game logic functions are **pure functions** - they have no side effects and always return the same output given the same input:

```typescript
// Pure function: No side effects, deterministic output
export function moveLeft(board: BoardType) {
  return operate(board); // Returns new board, doesn't mutate input
}

function operate(board: BoardType) {
  // Creates new arrays, doesn't modify existing ones
  const newBoard = board.map(row => {
    const { newRow, score } = slideAndMerge(row);
    return newRow;
  });
  return { newBoard, score: totalScore };
}
```

**Benefits:**
- **Testability**: Easy to test with predictable inputs/outputs
- **Debugging**: No hidden state changes to track
- **Memoization**: Results can be safely cached
- **Concurrency**: No race conditions or shared state issues

#### 2. **Immutability**
The game state follows immutability principles:

```typescript
// All state updates create new objects
const newBoard = board.map(row => [...row]);  // Deep copy each row
newBoard[r][c] = newValue;  // Create new tile value
```

**Benefits:**
- **Predictable Updates**: State changes are explicit and trackable
- **React Optimization**: Enables efficient change detection and re-rendering

#### 3. **Function Composition**
Complex operations are built by composing simpler functions:

```typescript
// Movement = Transform + Core Logic + Transform Back
export function moveUp(board: BoardType) {
  const rotated = rotateLeft(board);        // Transform
  const { newBoard, score } = operate(rotated);  // Core logic
  return {
    newBoard: rotateRight(newBoard),        // Transform back
    score
  };
}
```

#### 4. **Higher-Order Functions**
The codebase uses higher-order functions for reusable logic:

```typescript
// Generic rotation function works with any 2D array type
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

## Design Patterns Used

### 1. **Custom Hook Pattern** (`useGameLogic`)
- **Purpose**: Encapsulates all game state and business logic
- **Benefits**:
  - Single source of truth for game state
  - Reusable across components
  - Testable in isolation
  - Clean separation from UI concerns

```typescript
// Pattern: Custom hook encapsulates complex state logic
function useGameLogic(boardSize: number) {
  const [board, setBoard] = useState<BoardType>(() => initBoard(boardSize).board);
  const [score, setScore] = useState(0);
  // ... additional state and logic
}
```

### 2. **Strategy Pattern** (Movement Functions)
- **Purpose**: Different movement strategies (up, down, left, right) with shared logic
- **Implementation**: Board rotation technique to reuse left-movement logic

```typescript
// Pattern: Strategy pattern with board transformation
export function moveUp(board: BoardType) {
  const rotated = rotateLeft(board);        // Transform
  const { newBoard, score } = operate(rotated);  // Apply strategy
  return {
    newBoard: rotateRight(newBoard),        // Transform back
    score
  };
}
```

### 3. **Immutable Data Pattern**
- **Purpose**: Predictable state updates and easier debugging
- **Implementation**: All board operations return new arrays instead of mutating existing ones

```typescript
// Pattern: Immutable transformations
export function moveLeft(board: BoardType) {
  return operate(board); // Returns new board, doesn't modify input
}

function operate(board: BoardType) {
  let totalScore = 0;
  const newBoard = board.map(row => {  // Creates new arrays
    const { newRow, score } = slideAndMerge(row);
    // ...
  });
}
```

### 4. **Observer Pattern** (Event Listeners)
- **Purpose**: Handle user input (keyboard, touch) events
- **Implementation**: useEffect hooks register and cleanup event listeners

```typescript
// Pattern: Observer pattern for input handling
useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    // Handle keyboard input
  }

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [handleMove]);
```

## Component Architecture

### **Single Responsibility Principle**
Each component has one clear purpose:

- **App.tsx**: Layout composition and state orchestration
- **Board.tsx**: Grid rendering and tile positioning
- **Tile.tsx**: Individual tile presentation and styling
- **Header.tsx**: Score display and game controls
- **Settings.tsx**: Configuration options
- **GameOverModal.tsx**: Win/lose state presentation

### **Composition over Inheritance**
Components are composed together rather than extending each other:

```typescript
// Composition: App composes multiple components
function App() {
  return (
    <div className="game-layout">
      <Header score={score} highScore={highScore} onRestart={handleRestart} />
      <Settings currentSize={boardSize} onSizeChange={handleSizeChange} />
      <Board board={board} />
      {isGameOver && <GameOverModal />}
    </div>
  );
}
```

## State Management Architecture

### **Unidirectional Data Flow**
State flows from parent to children via props:

```
useGameLogic Hook (State Owner)
       ↓ (props)
       App Component
       ↓ (props)
       Board Component
       ↓ (props)
       Tile Components
```

### **Lifting State Up**
Game logic state is managed at the highest level (useGameLogic hook) and passed down:

```typescript
// State lifted to highest component that needs it
function App() {
  const gameState = useGameLogic(boardSize); // All state here
  return (
    <Board {...gameState} /> // Passed down as props
  );
}
```

## Error Handling Strategy

### **Defensive Programming**
- **Input Validation**: Board size constraints (3-8)
- **Null Checks**: Safe handling of empty game states
- **Boundary Conditions**: Proper handling of edge cases in algorithms

```typescript
// Defensive: Validate board size constraints
function handleSizeChange(newSize: number) {
  if (newSize >= 3 && newSize <= 8) {
    setBoardSize(newSize);
  }
}
```

## Performance Architecture

### **Memoization Strategy**
- **useCallback**: Prevents unnecessary re-renders of child components
- **Dependency Optimization**: Carefully managed useEffect dependencies

```typescript
// Performance: Memoize expensive function
const handleMove = useCallback(function(moveFn) {
  // Expensive game logic
}, [board, isGameOver]); // Minimal dependencies
```

### **Event Listener Optimization**
- **Touch Events**: Proper touch event handling for mobile gameplay
- **Cleanup**: Proper event listener removal to prevent memory leaks

## Code Organization Principles

### **SOLID Principles Applied**

1. **Single Responsibility**: Each module has one reason to change
2. **Open/Closed**: Movement functions extensible through rotation
3. **Liskov Substitution**: All move functions have same interface
4. **Interface Segregation**: Small, focused interfaces (props)
5. **Dependency Inversion**: Components depend on abstractions (hooks)

### **DRY (Don't Repeat Yourself)**
- Movement logic consolidated through board rotation
- Common utility functions extracted to `utils/board.ts`
- Shared types centralized in `types.ts`

## Scalability Considerations

### **Extensibility Points**
- **Board Operations**: Easy to add new tile types or special moves
- **UI Components**: Simple to add new game modes or features
- **Hook Pattern**: Game logic easily extendable for new features

### **Performance Scaling**
- **Algorithm Complexity**: All operations O(n) where n = board size
- **Memory Usage**: Predictable memory consumption patterns
- **Bundle Size**: Tree-shakable imports and code splitting ready

This architecture provides a solid foundation for the 2048 game while demonstrating modern React patterns, clean code principles, and scalable design decisions.
