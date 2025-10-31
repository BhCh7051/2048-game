# Save/Load Game State Implementation

## Feature Overview

Implement a save/load system that allows players to save their current game progress and resume it later. This feature enhances user experience by preventing loss of progress and enabling players to take breaks during long games.

## Requirements Analysis

### Core Requirements
- **Save Game**: Save current game state to persistent storage
- **Load Game**: Restore previously saved game state
- **Multiple Slots**: Support multiple save slots (e.g., 3-5 slots)
- **Auto-Save**: Optionally save game state automatically
- **Save Management**: View, delete, and manage saved games
- **State Validation**: Ensure saved games are valid and compatible
- **UI Integration**: Buttons and dialogs for save/load operations

### Interview Questions to Ask
1. How many save slots should be available?
2. Should saves be manual only or include auto-save?
3. What should happen when loading an incompatible save?
4. How should save data be structured and versioned?

## Technical Approach

### Architecture Decisions
1. **Serialization Strategy**: JSON serialization for game state
2. **Storage Backend**: localStorage with fallback options
3. **Version Management**: Include version info in save data
4. **Validation**: Validate save data before loading
5. **Error Handling**: Graceful handling of corrupted saves

### New Data Types
```typescript
// types.ts - Add these types
export interface SaveData {
  version: string;
  timestamp: number;
  gameMode: GameMode;
  boardSize: number;
  board: BoardType;
  score: number;
  isGameOver: boolean;
  hasWon: boolean;
  // Add other state as needed
}

export interface SaveSlot {
  id: string;
  name: string;
  saveData: SaveData;
  preview?: {
    score: number;
    boardSize: number;
    gameMode: GameMode;
    isGameOver: boolean;
    hasWon: boolean;
  };
}

export interface SaveLoadState {
  saveSlots: SaveSlot[];
  autoSaveEnabled: boolean;
  lastAutoSave?: number;
}
```

## Step-by-Step Implementation

### Phase 1: Save System Infrastructure (30 minutes)

#### Step 1.1: Define Save Data Structure
```typescript
// types.ts - Add save-related types
export interface SaveData {
  version: string;
  timestamp: number;
  gameMode: GameMode;
  boardSize: number;
  board: BoardType;
  score: number;
  isGameOver: boolean;
  hasWon: boolean;
  timeRemaining?: number;    // For timed mode
  movesUsed?: number;        // For limited moves mode
}

export interface SaveSlot {
  id: string;
  name: string;
  saveData: SaveData;
  timestamp: number;
}
```

#### Step 1.2: Create Save/Load Utility Functions
```typescript
// utils/saveLoad.ts
import type { SaveData, SaveSlot, BoardType, GameMode } from '../types';

const SAVE_VERSION = '1.0.0';
const STORAGE_KEY = 'gameSaves';
const MAX_SAVE_SLOTS = 5;

export function createSaveData(
  board: BoardType,
  score: number,
  isGameOver: boolean,
  hasWon: boolean,
  gameMode: GameMode,
  boardSize: number,
  timeRemaining?: number,
  movesUsed?: number
): SaveData {
  return {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    gameMode,
    boardSize,
    board: board.map(row => [...row]), // Deep copy
    score,
    isGameOver,
    hasWon,
    timeRemaining,
    movesUsed,
  };
}

export function validateSaveData(saveData: any): saveData is SaveData {
  return (
    saveData &&
    typeof saveData.version === 'string' &&
    typeof saveData.timestamp === 'number' &&
    typeof saveData.gameMode === 'string' &&
    typeof saveData.boardSize === 'number' &&
    Array.isArray(saveData.board) &&
    typeof saveData.score === 'number' &&
    typeof saveData.isGameOver === 'boolean' &&
    typeof saveData.hasWon === 'boolean'
  );
}

export function getSaveSlots(): SaveSlot[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(slot => slot && slot.id && slot.saveData);
  } catch (error) {
    console.error('Failed to load save slots:', error);
    return [];
  }
}

export function saveGame(saveSlotId: string, saveData: SaveData, slotName?: string): boolean {
  try {
    const slots = getSaveSlots();
    const slotIndex = slots.findIndex(slot => slot.id === saveSlotId);

    const saveSlot: SaveSlot = {
      id: saveSlotId,
      name: slotName || `Save ${saveSlotId}`,
      saveData,
      timestamp: Date.now(),
    };

    if (slotIndex >= 0) {
      slots[slotIndex] = saveSlot;
    } else {
      // Add new slot if under limit
      if (slots.length < MAX_SAVE_SLOTS) {
        slots.push(saveSlot);
      } else {
        // Replace oldest save if at limit
        const oldestIndex = slots.reduce((oldest, slot, index) =>
          slot.timestamp < slots[oldest].timestamp ? index : oldest, 0
        );
        slots[oldestIndex] = saveSlot;
      }
    }

    // Sort by timestamp (newest first)
    slots.sort((a, b) => b.timestamp - a.timestamp);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
    return true;
  } catch (error) {
    console.error('Failed to save game:', error);
    return false;
  }
}

export function loadGame(saveSlotId: string): SaveData | null {
  try {
    const slots = getSaveSlots();
    const slot = slots.find(s => s.id === saveSlotId);

    if (!slot) return null;

    if (!validateSaveData(slot.saveData)) {
      console.error('Invalid save data in slot:', saveSlotId);
      return null;
    }

    return slot.saveData;
  } catch (error) {
    console.error('Failed to load game:', error);
    return null;
  }
}

export function deleteSave(saveSlotId: string): boolean {
  try {
    const slots = getSaveSlots();
    const filtered = slots.filter(slot => slot.id !== saveSlotId);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to delete save:', error);
    return false;
  }
}
```

### Phase 2: Save/Load Integration (45 minutes)

#### Step 2.1: Update useGameLogic for Save/Load Support
```typescript
// hooks/useGameLogic.ts - Add save/load capabilities
import { createSaveData, saveGame, loadGame, getSaveSlots } from '../utils/saveLoad';

export function useGameLogic(boardSize: number, gameMode: GameMode = 'classic') {
  // ... existing state

  // Save/Load state
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([]);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Load save slots on mount
  useEffect(() => {
    setSaveSlots(getSaveSlots());
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || isGameOver) return;

    const interval = setInterval(() => {
      const saveData = createSaveData(
        board,
        score,
        isGameOver,
        hasWon,
        gameMode,
        boardSize,
        timeRemaining,
        movesUsed
      );

      saveGame('auto', saveData, 'Auto Save');
      setSaveSlots(getSaveSlots());
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(interval);
  }, [autoSaveEnabled, board, score, isGameOver, hasWon, gameMode, boardSize, timeRemaining, movesUsed]);

  // Manual save function
  const saveCurrentGame = useCallback((slotId: string, slotName?: string) => {
    const saveData = createSaveData(
      board,
      score,
      isGameOver,
      hasWon,
      gameMode,
      boardSize,
      timeRemaining,
      movesUsed
    );

    const success = saveGame(slotId, saveData, slotName);
    if (success) {
      setSaveSlots(getSaveSlots());
    }
    return success;
  }, [board, score, isGameOver, hasWon, gameMode, boardSize, timeRemaining, movesUsed]);

  // Load game function
  const loadSavedGame = useCallback((slotId: string) => {
    const saveData = loadGame(slotId);
    if (!saveData) return false;

    // Validate compatibility
    if (saveData.boardSize !== boardSize || saveData.gameMode !== gameMode) {
      alert('Save data is not compatible with current game settings.');
      return false;
    }

    // Restore state
    setBoard(saveData.board);
    setScore(saveData.score);
    setIsGameOver(saveData.isGameOver);
    setHasWon(saveData.hasWon);

    if (saveData.timeRemaining !== undefined) {
      setTimeRemaining(saveData.timeRemaining);
    }

    if (saveData.movesUsed !== undefined) {
      setMovesUsed(saveData.movesUsed);
    }

    setMergedCells(createEmptyBooleanBoard(boardSize));
    setNewTiles([]);

    return true;
  }, [boardSize, gameMode]);

  // Delete save function
  const deleteSavedGame = useCallback((slotId: string) => {
    const success = deleteSave(slotId);
    if (success) {
      setSaveSlots(getSaveSlots());
    }
    return success;
  }, []);

  return {
    // ... existing state and functions
    saveSlots,
    autoSaveEnabled,
    setAutoSaveEnabled,
    saveCurrentGame,
    loadSavedGame,
    deleteSavedGame,
  };
}
```

### Phase 3: Save/Load UI Components (60 minutes)

#### Step 3.1: Save Game Dialog Component
```typescript
// components/SaveGameDialog.tsx
import React, { useState } from 'react';

interface SaveGameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (slotId: string, name: string) => boolean;
  existingSlots: SaveSlot[];
}

function SaveGameDialog({ isOpen, onClose, onSave, existingSlots }: SaveGameDialogProps) {
  const [selectedSlot, setSelectedSlot] = useState<string>('slot1');
  const [slotName, setSlotName] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    const name = slotName.trim() || `Save ${selectedSlot}`;
    const success = onSave(selectedSlot, name);

    if (success) {
      onClose();
      setSlotName('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Save Game</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Save Slot</label>
          <select
            value={selectedSlot}
            onChange={e => setSelectedSlot(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const slotId = `slot${i + 1}`;
              const existingSlot = existingSlots.find(s => s.id === slotId);
              return (
                <option key={slotId} value={slotId}>
                  {slotId} {existingSlot ? `(Occupied - ${existingSlot.name})` : '(Empty)'}
                </option>
              );
            })}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Save Name (Optional)</label>
          <input
            type="text"
            value={slotName}
            onChange={e => setSlotName(e.target.value)}
            placeholder="Enter save name..."
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save Game
          </button>
        </div>
      </div>
    </div>
  );
}

export default SaveGameDialog;
```

#### Step 3.2: Load Game Dialog Component
```typescript
// components/LoadGameDialog.tsx
import React from 'react';
import type { SaveSlot } from '../types';

interface LoadGameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (slotId: string) => boolean;
  saveSlots: SaveSlot[];
}

function LoadGameDialog({ isOpen, onClose, onLoad, saveSlots }: LoadGameDialogProps) {
  if (!isOpen) return null;

  const handleLoad = (slotId: string) => {
    const success = onLoad(slotId);
    if (success) {
      onClose();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Load Game</h2>

        {saveSlots.length === 0 ? (
          <p className="text-gray-600 mb-4">No saved games found.</p>
        ) : (
          <div className="grid gap-2 mb-4">
            {saveSlots.map(slot => (
              <div
                key={slot.id}
                className="border rounded p-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleLoad(slot.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{slot.name}</h3>
                  <span className="text-sm text-gray-500">
                    {formatDate(slot.timestamp)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                  <div>Score: {slot.saveData.score}</div>
                  <div>Mode: {slot.saveData.gameMode}</div>
                  <div>Size: {slot.saveData.boardSize}×{slot.saveData.boardSize}</div>
                  <div>
                    {slot.saveData.hasWon ? 'Won' : slot.saveData.isGameOver ? 'Lost' : 'In Progress'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoadGameDialog;
```

#### Step 3.3: Settings Panel Updates
```typescript
// components/Settings.tsx - Add save/load controls
interface SettingsProps {
  // ... existing props
  saveSlots: SaveSlot[];
  autoSaveEnabled: boolean;
  onToggleAutoSave: () => void;
  onSaveGame: () => void;
  onLoadGame: () => void;
}

function Settings({
  currentSize,
  onSizeChange,
  saveSlots,
  autoSaveEnabled,
  onToggleAutoSave,
  onSaveGame,
  onLoadGame
}) {
  return (
    <div className="settings-panel">
      {/* ... existing settings */}

      <div className="mb-4">
        <h3 className="font-medium mb-2">Game Management</h3>

        <div className="flex gap-2 mb-3">
          <button
            onClick={onSaveGame}
            className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Save Game
          </button>
          <button
            onClick={onLoadGame}
            className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Load Game
          </button>
        </div>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={autoSaveEnabled}
            onChange={onToggleAutoSave}
            className="mr-2"
          />
          <span className="text-sm">Auto-save every 30 seconds</span>
        </label>

        {saveSlots.length > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            {saveSlots.length} save{saveSlots.length !== 1 ? 's' : ''} available
          </div>
        )}
      </div>
    </div>
  );
}
```

### Phase 4: App Integration (30 minutes)

#### Step 4.1: Update App.tsx for Save/Load
```typescript
// App.tsx - Add save/load state and dialogs
import SaveGameDialog from './components/SaveGameDialog';
import LoadGameDialog from './components/LoadGameDialog';

function App() {
  const [boardSize, setBoardSize] = useState(4);
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const gameState = useGameLogic(boardSize, gameMode);

  // Dialog states
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);

  const handleSaveGame = () => setShowSaveDialog(true);
  const handleLoadGame = () => setShowLoadDialog(true);

  const handleToggleAutoSave = () => {
    gameState.setAutoSaveEnabled(!gameState.autoSaveEnabled);
  };

  return (
    <div className="game-container">
      <Settings
        currentSize={boardSize}
        onSizeChange={handleSizeChange}
        saveSlots={gameState.saveSlots}
        autoSaveEnabled={gameState.autoSaveEnabled}
        onToggleAutoSave={handleToggleAutoSave}
        onSaveGame={handleSaveGame}
        onLoadGame={handleLoadGame}
      />

      <SaveGameDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={(slotId, name) => {
          const success = gameState.saveCurrentGame(slotId, name);
          if (success) setShowSaveDialog(false);
          return success;
        }}
        existingSlots={gameState.saveSlots}
      />

      <LoadGameDialog
        isOpen={showLoadDialog}
        onClose={() => setShowLoadDialog(false)}
        onLoad={(slotId) => {
          const success = gameState.loadSavedGame(slotId);
          if (success) setShowLoadDialog(false);
          return success;
        }}
        saveSlots={gameState.saveSlots}
      />

      {/* ... rest of component */}
    </div>
  );
}
```

## Testing Strategy

### Unit Tests
```typescript
// tests/utils/saveLoad.test.ts
describe('Save/Load Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should create valid save data', () => {
    const board = [[2, 4], [8, 0]];
    const saveData = createSaveData(board, 100, false, false, 'classic', 4);

    expect(saveData.version).toBe(SAVE_VERSION);
    expect(saveData.board).toEqual(board);
    expect(saveData.score).toBe(100);
  });

  test('should save and load game correctly', () => {
    const saveData = createSaveData([[2, 0], [0, 0]], 50, false, false, 'classic', 4);

    const success = saveGame('slot1', saveData, 'Test Save');
    expect(success).toBe(true);

    const loaded = loadGame('slot1');
    expect(loaded).toEqual(saveData);
  });

  test('should validate save data correctly', () => {
    expect(validateSaveData(createSaveData([[2]], 0, false, false, 'classic', 4))).toBe(true);
    expect(validateSaveData({ invalid: 'data' })).toBe(false);
  });
});
```

### Integration Tests
```typescript
// tests/features/saveLoad.test.tsx
describe('Save/Load Integration', () => {
  test('should save and restore complete game state', () => {
    const { result } = renderHook(() => useGameLogic(4, 'classic'));

    // Make some moves
    act(() => {
      result.current.handleMove(moveLeft);
    });

    const scoreBeforeSave = result.current.score;

    // Save game
    act(() => {
      result.current.saveCurrentGame('test-slot', 'Test Game');
    });

    // Change game state
    act(() => {
      result.current.handleMove(moveRight);
    });

    expect(result.current.score).not.toBe(scoreBeforeSave);

    // Load saved game
    act(() => {
      result.current.loadSavedGame('test-slot');
    });

    expect(result.current.score).toBe(scoreBeforeSave);
  });

  test('should handle auto-save correctly', () => {
    const { result } = renderHook(() => useGameLogic(4, 'classic'));

    // Enable auto-save
    act(() => {
      result.current.setAutoSaveEnabled(true);
    });

    // Make moves to trigger auto-save
    act(() => {
      result.current.handleMove(moveLeft);
    });

    // Check that auto-save exists
    const slots = getSaveSlots();
    const autoSave = slots.find(slot => slot.id === 'auto');
    expect(autoSave).toBeDefined();
  });
});
```

## Edge Cases & Error Handling

### Edge Cases to Handle
1. **Storage Quota Exceeded**: localStorage full
2. **Corrupted Save Data**: Invalid JSON or incomplete data
3. **Version Mismatch**: Old save format incompatibility
4. **Browser Compatibility**: localStorage not available
5. **Concurrent Access**: Multiple tabs accessing saves

### Error Conditions
1. **Save Failure**: Handle localStorage write errors
2. **Load Failure**: Handle corrupted or missing save data
3. **Validation Errors**: Handle invalid save data gracefully
4. **Quota Errors**: Handle storage quota exceeded

## Interview Discussion Points

### Technical Questions
- **Q: How do you handle save data versioning?**
  **A:** Each save includes a version number. We validate compatibility and provide migration paths for older versions.

- **Q: What happens if localStorage is not available?**
  **A:** We provide fallback options like sessionStorage or in-memory storage, with appropriate user feedback.

- **Q: How do you prevent save data corruption?**
  **A:** We validate data before saving and after loading, with atomic write operations and error recovery.

### Design Decisions
- **JSON Serialization**: Simple, human-readable format for debugging
- **Slot Management**: Fixed number of slots with automatic cleanup
- **Auto-save**: Optional feature with clear user control

## Performance Considerations

### Storage Performance
- **JSON Overhead**: Serialization/deserialization cost
- **Storage Limits**: Respect browser storage quotas
- **Compression**: Consider data compression for large saves

### Memory Usage
- **Deep Copy Cost**: Board state duplication for each save
- **Slot Management**: Limit number of concurrent saves
- **Cleanup Strategy**: Remove old saves when limit reached

## Future Enhancements

1. **Cloud Saves**: Sync saves across devices
2. **Save Encryption**: Protect sensitive game data
3. **Save Sharing**: Share save files with other players
4. **Save History**: Track save/load operations for debugging
5. **Selective Save**: Save only specific aspects of game state

## Implementation Time Estimate

- **Phase 1**: 30 minutes (save system infrastructure)
- **Phase 2**: 45 minutes (save/load integration)
- **Phase 3**: 60 minutes (UI components)
- **Phase 4**: 30 minutes (App integration)
- **Testing**: 45 minutes (unit and integration tests)

**Total Estimated Time**: ~3.5 hours

This implementation demonstrates data persistence, error handling, user experience design, and practical software engineering considerations that are valuable in technical interviews.









