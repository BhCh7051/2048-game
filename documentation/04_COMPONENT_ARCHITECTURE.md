# React Component Architecture

## Component Hierarchy

```
App (Root Container)
├── Header (Game Info & Controls)
├── Settings (Configuration)
├── Board (Game Grid Container)
│   └── Tile (Individual Cells)
└── GameOverModal (Game State Overlay)
```

## Component Design Principles

### 1. **Single Responsibility Principle**
Each component has one clear, focused purpose:

- **App**: Orchestrates layout and manages top-level state
- **Header**: Displays score information and game controls
- **Settings**: Handles board size configuration
- **Board**: Renders the game grid and manages tile positioning
- **Tile**: Presents individual tile data with styling
- **GameOverModal**: Shows win/lose states and restart options

### 2. **Composition over Inheritance**
Components are composed together rather than extending each other:

```typescript
// App composes multiple focused components
function App() {
  const gameState = useGameLogic(boardSize);

  return (
    <div className="game-container">
      <Header {...gameState} onRestart={handleRestart} />
      <Settings currentSize={boardSize} onSizeChange={handleSizeChange} />

      <div className="game-area">
        <Board {...gameState} />
        {gameState.isGameOver && (
          <GameOverModal {...gameState} onRestart={handleRestart} />
        )}
      </div>
    </div>
  );
}
```

## Detailed Component Analysis

### **App Component** (`App.tsx`)
**Responsibility**: Root layout and state orchestration

**Key Features:**
- **State Management**: Integrates `useGameLogic` hook
- **Responsive Layout**: Two-column desktop, single-column mobile
- **Event Handling**: Restart and size change coordination
- **Conditional Rendering**: Shows game over modal when appropriate

**Design Decisions:**
- **Hook Integration**: Uses custom hook for clean separation of concerns
- **Responsive Design**: CSS Grid/Flexbox for adaptive layouts
- **Event Delegation**: Handles high-level user actions

### **Board Component** (`Board.tsx`)
**Responsibility**: Game grid rendering and tile management

**Key Features:**
- **Grid Layout**: CSS Grid for responsive tile positioning
- **Tile Rendering**: Maps over board state to render tiles
- **Responsive**: Grid auto-sizes based on container dimensions

**Architecture Pattern:**
```typescript
// Simple grid rendering approach
function Board({ board }) {
  return (
    <div className="board-container">
      <div className="grid-background">
        {board.map((row, rowIndex) =>
          row.map((value, colIndex) => (
            <Tile
              key={`${rowIndex}-${colIndex}`}
              value={value}
              boardSize={board.length}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

**Design Decisions:**
- **Separation of Concerns**: Background grid and tile content
- **Performance**: Efficient rendering of grid structure
- **Responsive**: Grid auto-sizes based on container dimensions

### **Tile Component** (`Tile.tsx`) - Pure Presentational Component

**Responsibility**: Individual tile rendering and styling

**Key Features:**
- **Dynamic Styling**: Color and size based on tile value
- **Responsive Sizing**: Scales with board size and container

**Props Interface:**
```typescript
interface TileProps {
  value: TileValue;        // 0, 2, 4, 8, 16, etc.
  boardSize: number;       // 3-8, affects sizing
}
```

**Styling Algorithm:**
```typescript
function getTileStyles(value: TileValue, boardSize: number) {
  // Color mapping based on value
  const colorMap: Record<TileValue, string> = {
    0: 'bg-slate-200',
    2: 'bg-slate-100',
    4: 'bg-slate-200',
    // ... logarithmic color progression
  };

  // Size scaling based on board size and value
  const sizeClass = boardSize <= 4 ? 'text-2xl' : 'text-xl';
  const fontSize = Math.max(12, 24 - (boardSize - 3) * 2);

  return {
    backgroundColor: colorMap[value] || 'bg-yellow-300',
    fontSize: `${fontSize}px`,
    className: `${sizeClass} ${value > 1000 ? 'text-white' : 'text-slate-700'}`
  };
}
```

**Design Decisions:**
- **Pure Component**: No internal state, fully controlled by props
- **Performance**: Minimal re-renders through simple structure
- **Accessibility**: Proper semantic structure

### **Header Component** (`Header.tsx`)
**Responsibility**: Score display and game controls

**Key Features:**
- **Score Tracking**: Current score and persistent high score
- **Game Controls**: Restart functionality
- **Responsive Layout**: Adapts to available space

**Props Interface:**
```typescript
interface HeaderProps {
  score: number;
  highScore: number;
  onRestart: () => void;
}
```

**Design Decisions:**
- **Stateless**: Pure presentational component
- **Event Handling**: Delegates restart logic to parent
- **Storage Integration**: Displays localStorage-persisted high score

### **Settings Component** (`Settings.tsx`)
**Responsibility**: Board size configuration

**Key Features:**
- **Dynamic Options**: Generates size options (3-8)
- **Input Validation**: Prevents invalid board sizes
- **State Management**: Controlled component pattern

**Props Interface:**
```typescript
interface SettingsProps {
  currentSize: number;
  onSizeChange: (size: number) => void;
}
```

**Design Decisions:**
- **Controlled Input**: Parent manages size state
- **Validation**: Client-side constraints before state update
- **Accessibility**: Proper form labels and keyboard navigation

### **GameOverModal Component** (`GameOverModal.tsx`)
**Responsibility**: Win/lose state presentation

**Key Features:**
- **Conditional Display**: Only shown when game ends
- **Game State Feedback**: Different messages for win vs. lose
- **Restart Functionality**: Provides game reset option

**Props Interface:**
```typescript
interface GameOverModalProps {
  hasWon: boolean;
  score: number;
  onRestart: () => void;
}
```

**Design Decisions:**
- **Overlay Pattern**: Positioned absolutely over game board
- **Accessibility**: Focus management and keyboard navigation
- **User Feedback**: Clear messaging about game outcome

## Component Communication Patterns

### **Props Down, Events Up**
```typescript
// Parent (App) manages state
function App() {
  const [boardSize, setBoardSize] = useState(4);

  const handleSizeChange = (newSize: number) => {
    if (newSize >= 3 && newSize <= 8) {
      setBoardSize(newSize);
    }
  };

  return (
    <Settings
      currentSize={boardSize}
      onSizeChange={handleSizeChange}  // Event handler passed down
    />
  );
}

// Child (Settings) calls parent handler
function Settings({ currentSize, onSizeChange }) {
  return (
    <select
      value={currentSize}
      onChange={(e) => onSizeChange(Number(e.target.value))}  // Event up
    >
      {/* options */}
    </select>
  );
}
```

### **State Colocation**
- **High-level State**: Game logic in `useGameLogic` hook
- **Component State**: Minimal local UI state
- **Lifted State**: Shared state managed at appropriate level

## Performance Optimizations

### **Render Optimization**
- **Key Props**: Proper React keys for list rendering efficiency
- **Conditional Rendering**: Avoid rendering hidden components
- **Pure Components**: Components are pure functions of props

## Responsive Design Strategy

### **Mobile-First Approach**
```typescript
// CSS strategy: Mobile-first with progressive enhancement
function Board() {
  return (
    <div className="
      bg-slate-300 p-2 md:p-3     /* Mobile: small padding, Desktop: larger */
      grid gap-2 md:gap-3         /* Responsive gaps */
    ">
      {/* Grid auto-sizes based on container */}
    </div>
  );
}
```

### **Flexible Layout**
- **CSS Grid**: For board layout (responsive columns/rows)
- **Flexbox**: For component arrangement (mobile stacking)
- **Responsive Units**: rem, em, percentages for scalability

## Accessibility Considerations

### **Keyboard Navigation**
- **Tab Order**: Logical focus flow through interactive elements
- **Arrow Keys**: Game control via keyboard
- **Focus Management**: Proper focus indicators and management

### **Screen Reader Support**
- **ARIA Labels**: Descriptive labels for game elements
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **Color Independence**: High contrast ratios and non-color indicators

### **Touch Accessibility**
- **Touch Targets**: Minimum 44px touch targets
- **Gesture Support**: Standard swipe patterns
- **Screen Reader Gestures**: Compatible with assistive technologies

## Testing Strategy

### **Component Testing Approach**
- **Unit Tests**: Individual component rendering and props
- **Integration Tests**: Component interaction and state changes
- **Accessibility Tests**: Screen reader and keyboard navigation

### **Mock Strategy**
- **Game Logic**: Mock `useGameLogic` hook for component tests
- **Event Handlers**: Test event delegation patterns

This component architecture demonstrates modern React patterns, responsive design principles, and accessibility best practices while maintaining clean separation of concerns and optimal performance.

