# Replay System Implementation

## Feature Overview

Implement a game replay system that records player moves and allows them to watch previous games, analyze their strategy, and share interesting game sessions with others.

## Requirements Analysis

### Core Requirements
- **Move Recording**: Capture every move made during gameplay
- **Replay Playback**: Play back recorded games at various speeds
- **Replay Controls**: Play, pause, speed control, and scrubbing
- **Replay Storage**: Save replays with metadata and thumbnails
- **Replay Sharing**: Export and share interesting game replays
- **Replay Analysis**: Show statistics and insights about the game

### Interview Questions to Ask
1. How many replays should be stored locally?
2. Should replays include visual effects or just board state?
3. What metadata should be captured with each replay?
4. How should replay sharing be implemented?

## Technical Approach

### Architecture Decisions
1. **Event Recording**: Capture game state changes as events
2. **Efficient Storage**: Compress replay data for storage
3. **Playback Engine**: Separate playback logic from game logic
4. **Metadata System**: Rich metadata for replay organization

### New Data Types
```typescript
// types.ts - Add replay types
export interface GameEvent {
  type: 'move' | 'tile-spawn' | 'merge' | 'game-start' | 'game-end';
  timestamp: number;
  data: any;
  gameState?: {
    board: BoardType;
    score: number;
    moves: number;
  };
}

export interface GameReplay {
  id: string;
  name: string;
  timestamp: number;
  duration: number;
  finalScore: number;
  boardSize: number;
  gameMode: GameMode;
  events: GameEvent[];
  thumbnail?: string; // Base64 encoded board screenshot
  tags: string[];
  isFavorite: boolean;
}

export interface ReplayPlayer {
  replay: GameReplay;
  currentEventIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onEvent?: (event: GameEvent) => void;
}
```

## Step-by-Step Implementation

### Phase 1: Replay Recording System (45 minutes)

#### Step 1.1: Define Replay Data Structures
```typescript
// types.ts - Add replay system types
export interface GameEvent {
  type: 'move' | 'tile-spawn' | 'merge' | 'game-start' | 'game-end';
  timestamp: number;
  data: {
    direction?: 'up' | 'down' | 'left' | 'right';
    position?: [number, number];
    tileValue?: number;
    score?: number;
  };
  gameState?: {
    board: BoardType;
    score: number;
    moves: number;
  };
}

export interface GameReplay {
  id: string;
  name: string;
  timestamp: number;
  duration: number;
  finalScore: number;
  boardSize: number;
  gameMode: GameMode;
  events: GameEvent[];
  thumbnail?: string;
  tags: string[];
  isFavorite: boolean;
}
```

#### Step 1.2: Create Replay Recording Hook
```typescript
// hooks/useReplayRecording.ts
import { useState, useEffect, useCallback } from 'react';
import type { GameEvent, GameReplay, BoardType, GameMode } from '../types';

export function useReplayRecording(boardSize: number, gameMode: GameMode) {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [isRecording, setIsRecording] = useState(false);

  // Start recording when game begins
  const startRecording = useCallback(() => {
    setGameStartTime(Date.now());
    setEvents([]);
    setIsRecording(true);

    // Record game start event
    const startEvent: GameEvent = {
      type: 'game-start',
      timestamp: 0,
      data: { boardSize, gameMode },
      gameState: {
        board: Array(boardSize).fill(null).map(() => Array(boardSize).fill(0)),
        score: 0,
        moves: 0,
      },
    };

    setEvents([startEvent]);
  }, [boardSize, gameMode]);

  // Stop recording when game ends
  const stopRecording = useCallback(() => {
    setIsRecording(false);

    if (events.length > 0) {
      // Add game end event
      const endEvent: GameEvent = {
        type: 'game-end',
        timestamp: Date.now() - gameStartTime,
        data: {},
      };

      setEvents(prev => [...prev, endEvent]);
    }
  }, [events.length, gameStartTime]);

  // Record a move event
  const recordMove = useCallback((
    direction: 'up' | 'down' | 'left' | 'right',
    board: BoardType,
    score: number,
    moves: number
  ) => {
    if (!isRecording) return;

    const moveEvent: GameEvent = {
      type: 'move',
      timestamp: Date.now() - gameStartTime,
      data: { direction },
      gameState: {
        board: board.map(row => [...row]),
        score,
        moves,
      },
    };

    setEvents(prev => [...prev, moveEvent]);
  }, [isRecording, gameStartTime]);

  // Record tile spawn event
  const recordTileSpawn = useCallback((
    position: [number, number],
    tileValue: number,
    board: BoardType,
    score: number,
    moves: number
  ) => {
    if (!isRecording) return;

    const spawnEvent: GameEvent = {
      type: 'tile-spawn',
      timestamp: Date.now() - gameStartTime,
      data: { position, tileValue },
      gameState: {
        board: board.map(row => [...row]),
        score,
        moves,
      },
    };

    setEvents(prev => [...prev, spawnEvent]);
  }, [isRecording, gameStartTime]);

  // Generate replay from recorded events
  const generateReplay = useCallback((name: string): GameReplay | null => {
    if (events.length === 0) return null;

    const duration = events.length > 0
      ? Math.max(...events.map(e => e.timestamp))
      : 0;

    const lastEvent = events[events.length - 1];
    const finalScore = lastEvent?.gameState?.score || 0;

    return {
      id: `replay_${Date.now()}`,
      name,
      timestamp: Date.now(),
      duration,
      finalScore,
      boardSize,
      gameMode,
      events: [...events],
      tags: [],
      isFavorite: false,
    };
  }, [events, boardSize, gameMode]);

  return {
    events,
    isRecording,
    startRecording,
    stopRecording,
    recordMove,
    recordTileSpawn,
    generateReplay,
  };
}
```

### Phase 2: Replay Playback Engine (60 minutes)

#### Step 2.1: Create Replay Player Hook
```typescript
// hooks/useReplayPlayer.ts
import { useState, useCallback, useEffect } from 'react';
import type { GameReplay, GameEvent } from '../types';

export function useReplayPlayer(replay: GameReplay) {
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentGameState, setCurrentGameState] = useState<any>(null);

  // Get current event
  const currentEvent = replay.events[currentEventIndex] || null;

  // Play replay
  const play = useCallback(() => {
    if (currentEventIndex >= replay.events.length - 1) return;
    setIsPlaying(true);
  }, [currentEventIndex, replay.events.length]);

  // Pause replay
  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Reset to beginning
  const reset = useCallback(() => {
    setCurrentEventIndex(0);
    setIsPlaying(false);
    setCurrentGameState(null);
  }, []);

  // Jump to specific event
  const jumpToEvent = useCallback((index: number) => {
    const targetIndex = Math.max(0, Math.min(index, replay.events.length - 1));
    setCurrentEventIndex(targetIndex);

    // Update game state to this point
    const eventsUpToIndex = replay.events.slice(0, targetIndex + 1);
    const targetEvent = replay.events[targetIndex];
    setCurrentGameState(targetEvent?.gameState || null);
  }, [replay.events]);

  // Playback control effect
  useEffect(() => {
    if (!isPlaying || currentEventIndex >= replay.events.length - 1) {
      setIsPlaying(false);
      return;
    }

    const currentEvent = replay.events[currentEventIndex];
    const nextEvent = replay.events[currentEventIndex + 1];

    if (!nextEvent) return;

    const delay = (nextEvent.timestamp - currentEvent.timestamp) / playbackSpeed;

    const timer = setTimeout(() => {
      setCurrentEventIndex(prev => prev + 1);
      setCurrentGameState(nextEvent.gameState);
    }, delay);

    return () => clearTimeout(timer);
  }, [isPlaying, currentEventIndex, playbackSpeed, replay.events]);

  return {
    currentEvent,
    currentEventIndex,
    isPlaying,
    playbackSpeed,
    currentGameState,
    totalEvents: replay.events.length,
    progress: replay.events.length > 0 ? (currentEventIndex / (replay.events.length - 1)) * 100 : 0,
    play,
    pause,
    reset,
    jumpToEvent,
    setPlaybackSpeed,
  };
}
```

#### Step 2.2: Create Replay Storage Manager
```typescript
// utils/replayStorage.ts
import type { GameReplay } from '../types';

const STORAGE_KEY = 'gameReplays';
const MAX_REPLAYS = 20;

export function saveReplay(replay: GameReplay): boolean {
  try {
    const replays = getStoredReplays();

    // Check if replay with this ID already exists
    const existingIndex = replays.findIndex(r => r.id === replay.id);

    if (existingIndex >= 0) {
      replays[existingIndex] = replay;
    } else {
      // Add new replay
      if (replays.length >= MAX_REPLAYS) {
        // Remove oldest replay
        replays.shift();
      }
      replays.push(replay);
    }

    // Sort by timestamp (newest first)
    replays.sort((a, b) => b.timestamp - a.timestamp);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(replays));
    return true;
  } catch (error) {
    console.error('Failed to save replay:', error);
    return false;
  }
}

export function getStoredReplays(): GameReplay[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load replays:', error);
    return [];
  }
}

export function deleteReplay(replayId: string): boolean {
  try {
    const replays = getStoredReplays();
    const filtered = replays.filter(r => r.id !== replayId);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to delete replay:', error);
    return false;
  }
}

export function generateReplayThumbnail(replay: GameReplay): string {
  // Generate a simple text-based thumbnail
  const board = replay.events[replay.events.length - 1]?.gameState?.board;
  if (!board) return '';

  // Create a simple ASCII representation
  const thumbnail = board.map(row =>
    row.map(cell => cell === 0 ? '.' : cell.toString()[0]).join('')
  ).join('\n');

  return btoa(thumbnail); // Base64 encode for storage
}
```

### Phase 3: Replay UI Components (75 minutes)

#### Step 3.1: Replay Player Component
```typescript
// components/ReplayPlayer.tsx
import React from 'react';
import type { GameReplay } from '../types';
import { useReplayPlayer } from '../hooks/useReplayPlayer';

interface ReplayPlayerProps {
  replay: GameReplay;
  onClose: () => void;
}

function ReplayPlayer({ replay, onClose }: ReplayPlayerProps) {
  const {
    currentEvent,
    currentEventIndex,
    isPlaying,
    playbackSpeed,
    currentGameState,
    progress,
    play,
    pause,
    reset,
    jumpToEvent,
    setPlaybackSpeed,
  } = useReplayPlayer(replay);

  const formatTime = (timestamp: number) => {
    const seconds = Math.floor(timestamp / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="replay-player fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{replay.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
           
          </button>
        </div>

        {/* Replay Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
          <div>
            <div className="text-gray-600">Final Score</div>
            <div className="font-medium">{replay.finalScore}</div>
          </div>
          <div>
            <div className="text-gray-600">Duration</div>
            <div className="font-medium">{formatTime(replay.duration)}</div>
          </div>
          <div>
            <div className="text-gray-600">Board Size</div>
            <div className="font-medium">{replay.boardSize}×{replay.boardSize}</div>
          </div>
          <div>
            <div className="text-gray-600">Mode</div>
            <div className="font-medium capitalize">{replay.gameMode}</div>
          </div>
        </div>

        {/* Game Board Display */}
        {currentGameState && (
          <div className="mb-4">
            <div className="text-center mb-2 text-sm text-gray-600">
              Score: {currentGameState.score} | Moves: {currentGameState.moves}
            </div>
            <div className="board-container">
              <div className="grid-background">
                {currentGameState.board.map((row: number[], rowIndex: number) =>
                  row.map((value: number, colIndex: number) => (
                    <div key={`${rowIndex}-${colIndex}`} className="cell">
                      <div className={`tile ${value > 0 ? 'bg-blue-200' : ''}`}>
                        {value || ''}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Playback Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={isPlaying ? pause : play}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {isPlaying ? ' Pause' : ' Play'}
          </button>

          <button
            onClick={reset}
            className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Reset
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm">Speed:</span>
            <select
              value={playbackSpeed}
              onChange={e => setPlaybackSpeed(Number(e.target.value))}
              className="px-2 py-1 border rounded"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={4}>4x</option>
            </select>
          </div>

          <div className="flex-1">
            <div className="text-sm text-gray-600 mb-1">
              {formatTime(currentEvent?.timestamp || 0)} / {formatTime(replay.duration)}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Timeline Scrubbing */}
        <div className="mt-4">
          <input
            type="range"
            min={0}
            max={replay.events.length - 1}
            value={currentEventIndex}
            onChange={e => jumpToEvent(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

export default ReplayPlayer;
```

#### Step 3.2: Replay List Component
```typescript
// components/ReplayList.tsx
import React, { useState } from 'react';
import type { GameReplay } from '../types';

interface ReplayListProps {
  replays: GameReplay[];
  onSelectReplay: (replay: GameReplay) => void;
  onDeleteReplay: (replayId: string) => void;
  onClose: () => void;
}

function ReplayList({ replays, onSelectReplay, onDeleteReplay, onClose }: ReplayListProps) {
  const [sortBy, setSortBy] = useState<'timestamp' | 'score' | 'duration'>('timestamp');

  const sortedReplays = [...replays].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.finalScore - a.finalScore;
      case 'duration':
        return b.duration - a.duration;
      default:
        return b.timestamp - a.timestamp;
    }
  });

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (duration: number) => {
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="replay-list fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Game Replays</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
           
          </button>
        </div>

        {/* Sort Controls */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSortBy('timestamp')}
            className={`px-3 py-1 rounded ${sortBy === 'timestamp' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Newest
          </button>
          <button
            onClick={() => setSortBy('score')}
            className={`px-3 py-1 rounded ${sortBy === 'score' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Best Score
          </button>
          <button
            onClick={() => setSortBy('duration')}
            className={`px-3 py-1 rounded ${sortBy === 'duration' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Longest
          </button>
        </div>

        {/* Replay List */}
        <div className="max-h-96 overflow-y-auto">
          {sortedReplays.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No replays found.</p>
          ) : (
            <div className="grid gap-3">
              {sortedReplays.map(replay => (
                <div
                  key={replay.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{replay.name}</h3>
                      <div className="text-sm text-gray-600">
                        {formatTime(replay.timestamp)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectReplay(replay);
                        }}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        Play
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteReplay(replay.id);
                        }}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <div className="font-medium text-gray-800">{replay.finalScore}</div>
                      <div>Final Score</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{formatDuration(replay.duration)}</div>
                      <div>Duration</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 capitalize">{replay.gameMode}</div>
                      <div>Mode</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReplayList;
```

### Phase 4: Integration and Export (45 minutes)

#### Step 4.1: Update useGameLogic for Replay Recording
```typescript
// hooks/useGameLogic.ts - Add replay recording
export function useGameLogic(boardSize: number, gameMode: GameMode = 'classic') {
  const {
    events,
    isRecording,
    startRecording,
    stopRecording,
    recordMove,
    recordTileSpawn,
    generateReplay,
  } = useReplayRecording(boardSize, gameMode);

  // Start recording when game begins
  const restartGame = useCallback(() => {
    startRecording();
    // ... existing restart logic
  }, [boardSize, startRecording]);

  // Record moves during gameplay
  const handleMove = useCallback((moveFn) => {
    if (isGameOver) return;

    const { newBoard, score: moveScore, mergedBoard } = moveFn(board);

    if (!areBoardsEqual(board, newBoard)) {
      // Record the move
      const direction = getMoveDirection(moveFn);
      recordMove(direction, board, score, totalMoves);

      // ... rest of existing move logic

      // Record tile spawn if new tile was added
      if (newTileCoords) {
        recordTileSpawn(newTileCoords, boardWithNewTile[r][c], boardWithNewTile, score, totalMoves);
      }
    }
  }, [board, isGameOver, score, totalMoves, recordMove, recordTileSpawn]);

  // Stop recording when game ends
  useEffect(() => {
    if (isGameOver) {
      stopRecording();
    }
  }, [isGameOver, stopRecording]);

  return {
    // ... existing state
    generateReplay,
  };
}
```

#### Step 4.2: Add Replay Controls to App
```typescript
// App.tsx - Add replay functionality
import ReplayList from './components/ReplayList';
import ReplayPlayer from './components/ReplayPlayer';

function App() {
  const [showReplays, setShowReplays] = useState(false);
  const [selectedReplay, setSelectedReplay] = useState<GameReplay | null>(null);
  const [replays, setReplays] = useState<GameReplay[]>([]);

  // Load replays on mount
  useEffect(() => {
    setReplays(getStoredReplays());
  }, []);

  const handleSaveReplay = () => {
    const replay = gameState.generateReplay(`Game ${Date.now()}`);
    if (replay) {
      saveReplay(replay);
      setReplays(getStoredReplays());
    }
  };

  return (
    <div className="game-container">
      {/* Replay Controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowReplays(true)}
          className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Replays
        </button>
        <button
          onClick={handleSaveReplay}
          className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Save Replay
        </button>
      </div>

      {/* Replay List Modal */}
      {showReplays && (
        <ReplayList
          replays={replays}
          onSelectReplay={(replay) => {
            setSelectedReplay(replay);
            setShowReplays(false);
          }}
          onDeleteReplay={(replayId) => {
            deleteReplay(replayId);
            setReplays(getStoredReplays());
          }}
          onClose={() => setShowReplays(false)}
        />
      )}

      {/* Replay Player Modal */}
      {selectedReplay && (
        <ReplayPlayer
          replay={selectedReplay}
          onClose={() => setSelectedReplay(null)}
        />
      )}

      {/* ... rest of game content */}
    </div>
  );
}
```

## Testing Strategy

### Unit Tests
```typescript
// tests/hooks/useReplayRecording.test.ts
describe('Replay Recording', () => {
  test('should record game events correctly', () => {
    const { result } = renderHook(() => useReplayRecording(4, 'classic'));

    act(() => {
      result.current.startRecording();
    });

    expect(result.current.isRecording).toBe(true);
    expect(result.current.events.length).toBe(1); // Game start event
  });

  test('should generate valid replay', () => {
    const { result } = renderHook(() => useReplayRecording(4, 'classic'));

    act(() => {
      result.current.startRecording();
    });

    const replay = result.current.generateReplay('Test Replay');
    expect(replay).toBeDefined();
    expect(replay?.name).toBe('Test Replay');
    expect(replay?.boardSize).toBe(4);
  });
});
```

### Integration Tests
```typescript
// tests/hooks/useReplayPlayer.test.tsx
describe('Replay Player', () => {
  const mockReplay: GameReplay = {
    id: 'test',
    name: 'Test Replay',
    timestamp: Date.now(),
    duration: 10000,
    finalScore: 2048,
    boardSize: 4,
    gameMode: 'classic',
    events: [
      {
        type: 'game-start',
        timestamp: 0,
        data: {},
      },
      {
        type: 'move',
        timestamp: 1000,
        data: { direction: 'left' },
      },
    ],
    tags: [],
    isFavorite: false,
  };

  test('should play through events correctly', () => {
    const { result } = renderHook(() => useReplayPlayer(mockReplay));

    expect(result.current.currentEventIndex).toBe(0);

    act(() => {
      result.current.play();
    });

    // Should advance to next event after delay
    expect(result.current.isPlaying).toBe(true);
  });
});
```

## Edge Cases & Error Handling

### Edge Cases to Handle
1. **Recording Failures**: Handle cases where recording fails mid-game
2. **Large Replays**: Manage memory for very long games
3. **Playback Interruption**: Handle replay stopping mid-playback
4. **Storage Limits**: Handle localStorage quota exceeded
5. **Corrupted Replays**: Validate replay data before playback

### Error Conditions
1. **Event Recording Errors**: Handle failures during event capture
2. **Storage Errors**: Handle localStorage write failures
3. **Playback Errors**: Handle invalid replay data during playback

## Interview Discussion Points

### Technical Questions
- **Q: How do you handle replay storage and memory management?**
  **A:** We limit the number of stored replays and implement size-based cleanup to prevent memory issues.

- **Q: How do you ensure replay accuracy?**
  **A:** We capture complete game state with each event and validate data integrity before saving.

- **Q: What happens if recording fails mid-game?**
  **A:** We implement graceful degradation - the current game continues even if recording fails.

### Design Decisions
- **Event-Based Recording**: Capture only meaningful game events
- **Compressed Storage**: Store only essential game state data
- **Playback Isolation**: Separate playback logic from game logic

## Performance Considerations

### Recording Performance
- **Minimal Overhead**: Event recording adds minimal performance cost
- **Efficient Storage**: Compress event data for storage
- **Background Processing**: Non-blocking replay generation

### Playback Performance
- **Smooth Playback**: Controlled playback speed for smooth experience
- **Memory Efficient**: Load only necessary game states
- **Responsive Controls**: Fast scrubbing and speed changes

## Future Enhancements

1. **Replay Sharing**: Export replays as shareable files or URLs
2. **Replay Editing**: Allow editing replay metadata and adding commentary
3. **Replay Analytics**: Detailed analysis of player strategies
4. **Multiplayer Replays**: Record and replay multiplayer sessions
5. **Replay Search**: Search and filter replays by various criteria

## Implementation Time Estimate

- **Phase 1**: 45 minutes (replay recording system)
- **Phase 2**: 60 minutes (replay playback engine)
- **Phase 3**: 75 minutes (replay UI components)
- **Phase 4**: 45 minutes (integration and export)
- **Testing**: 60 minutes (unit and integration tests)

**Total Estimated Time**: ~4.5 hours

This implementation demonstrates game recording, playback systems, data serialization, and user experience design that are valuable in game development and technical interviews.
