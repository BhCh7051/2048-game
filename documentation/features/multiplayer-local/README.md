# Multiplayer Local Implementation

## Feature Overview

Implement a local multiplayer mode where two players can take turns playing on the same device, competing to achieve the highest score or reach 2048 first in a hotseat-style game.

## Requirements Analysis

### Core Requirements
- **Turn-Based Gameplay**: Players alternate turns on the same device
- **Player Management**: Track current player and switch between players
- **Score Competition**: Compare scores between players
- **Game Session**: Manage multiplayer game sessions
- **Win Conditions**: Multiple ways to determine the winner
- **Player Profiles**: Basic player identification and statistics

### Interview Questions to Ask
1. How should turns be managed and enforced?
2. What happens when one player reaches 2048?
3. Should there be time limits per turn?
4. How should player switching be handled?

## Technical Approach

### Architecture Decisions
1. **Turn Management**: State machine for turn-based gameplay
2. **Player State**: Separate state tracking per player
3. **Session Management**: Handle multiplayer game lifecycle
4. **UI Adaptation**: Modify UI for multiplayer indicators

### New Data Types
```typescript
// types.ts - Add multiplayer types
export interface Player {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  isActive: boolean;
  score: number;
  moves: number;
  hasWon: boolean;
}

export interface MultiplayerSession {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  startTime: number;
  gameMode: GameMode;
  boardSize: number;
  status: 'waiting' | 'playing' | 'finished';
  winner?: Player;
}

export interface TurnState {
  currentPlayer: Player;
  turnStartTime: number;
  turnTimeLimit?: number;
  movesThisTurn: number;
}
```

## Step-by-Step Implementation

### Phase 1: Multiplayer Infrastructure (45 minutes)

#### Step 1.1: Define Multiplayer Types
```typescript
// types.ts - Add multiplayer system types
export interface Player {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  isActive: boolean;
  score: number;
  moves: number;
  hasWon: boolean;
}

export interface MultiplayerSession {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  startTime: number;
  gameMode: GameMode;
  boardSize: number;
  status: 'waiting' | 'playing' | 'finished';
  winner?: Player;
}

export interface TurnState {
  currentPlayer: Player;
  turnStartTime: number;
  turnTimeLimit?: number;
  movesThisTurn: number;
}
```

#### Step 1.2: Create Multiplayer Session Hook
```typescript
// hooks/useMultiplayerSession.ts
import { useState, useCallback } from 'react';
import type { Player, MultiplayerSession, TurnState, GameMode } from '../types';

export function useMultiplayerSession(gameMode: GameMode, boardSize: number) {
  const [session, setSession] = useState<MultiplayerSession | null>(null);
  const [turnState, setTurnState] = useState<TurnState | null>(null);

  // Start multiplayer session
  const startMultiplayerSession = useCallback((player1Name: string, player2Name: string) => {
    const player1: Player = {
      id: 'player1',
      name: player1Name,
      color: '#3b82f6',
      isActive: true,
      score: 0,
      moves: 0,
      hasWon: false,
    };

    const player2: Player = {
      id: 'player2',
      name: player2Name,
      color: '#ef4444',
      isActive: false,
      score: 0,
      moves: 0,
      hasWon: false,
    };

    const newSession: MultiplayerSession = {
      id: `session_${Date.now()}`,
      players: [player1, player2],
      currentPlayerIndex: 0,
      startTime: Date.now(),
      gameMode,
      boardSize,
      status: 'playing',
    };

    const initialTurnState: TurnState = {
      currentPlayer: player1,
      turnStartTime: Date.now(),
      turnTimeLimit: gameMode === 'timed' ? 30 : undefined, // 30 seconds per turn in timed mode
      movesThisTurn: 0,
    };

    setSession(newSession);
    setTurnState(initialTurnState);
  }, [gameMode, boardSize]);

  // End turn and switch to next player
  const endTurn = useCallback(() => {
    if (!session || !turnState) return;

    const nextPlayerIndex = (session.currentPlayerIndex + 1) % session.players.length;
    const nextPlayer = session.players[nextPlayerIndex];

    // Update current player's moves
    const updatedPlayers = session.players.map((player, index) => {
      if (index === session.currentPlayerIndex) {
        return { ...player, moves: player.moves + turnState.movesThisTurn };
      }
      return player;
    });

    const newSession = {
      ...session,
      players: updatedPlayers,
      currentPlayerIndex: nextPlayerIndex,
    };

    const newTurnState: TurnState = {
      currentPlayer: nextPlayer,
      turnStartTime: Date.now(),
      turnTimeLimit: turnState.turnTimeLimit,
      movesThisTurn: 0,
    };

    setSession(newSession);
    setTurnState(newTurnState);
  }, [session, turnState]);

  // Record move for current player
  const recordPlayerMove = useCallback(() => {
    if (!turnState) return;

    setTurnState(prev => prev ? {
      ...prev,
      movesThisTurn: prev.movesThisTurn + 1,
    } : null);
  }, [turnState]);

  // Update player score
  const updatePlayerScore = useCallback((playerId: string, newScore: number) => {
    if (!session) return;

    const updatedPlayers = session.players.map(player => {
      if (player.id === playerId) {
        const hasJustWon = !player.hasWon && newScore >= 2048;
        return {
          ...player,
          score: newScore,
          hasWon: hasJustWon || player.hasWon,
        };
      }
      return player;
    });

    // Check for game end conditions
    const winningPlayer = updatedPlayers.find(p => p.hasWon);
    const allPlayersFinished = updatedPlayers.every(p => p.hasWon || p.moves > 100); // Example condition

    const newSession = {
      ...session,
      players: updatedPlayers,
      status: winningPlayer || allPlayersFinished ? 'finished' : 'playing',
      winner: winningPlayer,
    };

    setSession(newSession);
  }, [session]);

  // Reset multiplayer session
  const resetMultiplayerSession = useCallback(() => {
    setSession(null);
    setTurnState(null);
  }, []);

  return {
    session,
    turnState,
    currentPlayer: turnState?.currentPlayer || null,
    startMultiplayerSession,
    endTurn,
    recordPlayerMove,
    updatePlayerScore,
    resetMultiplayerSession,
  };
}
```

### Phase 2: Player Setup UI (45 minutes)

#### Step 2.1: Player Setup Component
```typescript
// components/PlayerSetup.tsx
import React, { useState } from 'react';

interface PlayerSetupProps {
  onStartGame: (player1Name: string, player2Name: string) => void;
  onCancel: () => void;
}

function PlayerSetup({ onStartGame, onCancel }: PlayerSetupProps) {
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');

  const handleStart = () => {
    const name1 = player1Name.trim() || 'Player 1';
    const name2 = player2Name.trim() || 'Player 2';

    if (name1 !== name2) {
      onStartGame(name1, name2);
    }
  };

  return (
    <div className="player-setup fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-6 text-center">Multiplayer Setup</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Player 1 Name</label>
            <input
              type="text"
              value={player1Name}
              onChange={e => setPlayer1Name(e.target.value)}
              placeholder="Enter player 1 name"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Player 2 Name</label>
            <input
              type="text"
              value={player2Name}
              onChange={e => setPlayer2Name(e.target.value)}
              placeholder="Enter player 2 name"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              maxLength={20}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={!player1Name.trim() || !player2Name.trim() || player1Name.trim() === player2Name.trim()}
            className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlayerSetup;
```

#### Step 2.2: Player Turn Indicator Component
```typescript
// components/PlayerTurnIndicator.tsx
import React from 'react';
import type { Player, TurnState } from '../types';

interface PlayerTurnIndicatorProps {
  players: Player[];
  turnState: TurnState | null;
  onEndTurn: () => void;
}

function PlayerTurnIndicator({ players, turnState, onEndTurn }: PlayerTurnIndicatorProps) {
  if (!turnState) return null;

  return (
    <div className="player-turn-indicator bg-white rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: turnState.currentPlayer.color }}
          />
          <div>
            <div className="font-semibold">{turnState.currentPlayer.name}'s Turn</div>
            <div className="text-sm text-gray-600">
              Score: {turnState.currentPlayer.score} | Moves: {turnState.movesThisTurn}
            </div>
          </div>
        </div>

        <button
          onClick={onEndTurn}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
        >
          End Turn
        </button>
      </div>

      {/* Player List */}
      <div className="mt-3 pt-3 border-t">
        <div className="flex justify-between text-sm">
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`flex items-center gap-2 ${
                index === players.findIndex(p => p.id === turnState.currentPlayer.id)
                  ? 'font-semibold'
                  : 'text-gray-600'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: player.color }}
              />
              <span>{player.name}</span>
              <span className="text-xs">({player.score})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PlayerTurnIndicator;
```

### Phase 3: Game State Integration (45 minutes)

#### Step 3.1: Update useGameLogic for Multiplayer
```typescript
// hooks/useGameLogic.ts - Add multiplayer support
export function useGameLogic(
  boardSize: number,
  gameMode: GameMode = 'classic',
  multiplayerSession?: MultiplayerSession | null
) {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);

  // Multiplayer-aware move handling
  const handleMove = useCallback((moveFn) => {
    if (isGameOver) return;

    const { newBoard, score: moveScore, mergedBoard } = moveFn(board);

    if (!areBoardsEqual(board, newBoard)) {
      // Record move for multiplayer
      if (multiplayerSession && currentPlayer) {
        recordPlayerMove();
      }

      // Apply the move
      const { newBoard: boardWithNewTile, newTileCoords } = addRandomTile(newBoard);
      setBoard(boardWithNewTile);

      // Update score for current player in multiplayer
      if (multiplayerSession && currentPlayer) {
        const newScore = score + moveScore;
        setScore(newScore);
        updatePlayerScore(currentPlayer.id, newScore);
      } else {
        setScore(prevScore => prevScore + moveScore);
      }

      // ... rest of existing move logic
    }
  }, [board, isGameOver, score, multiplayerSession, currentPlayer, recordPlayerMove, updatePlayerScore]);

  // Multiplayer-aware game end handling
  useEffect(() => {
    if (isGameOver && multiplayerSession && currentPlayer) {
      // Update final score for current player
      updatePlayerScore(currentPlayer.id, score);

      // Check for multiplayer win conditions
      const activePlayers = multiplayerSession.players.filter(p => !p.hasWon);
      if (activePlayers.length <= 1) {
        // Game ended, determine winner
        const winner = multiplayerSession.players.find(p => p.hasWon) || activePlayers[0];
        // Handle game end
      }
    }
  }, [isGameOver, score, multiplayerSession, currentPlayer, updatePlayerScore]);

  return {
    // ... existing state
    currentPlayer,
    setCurrentPlayer,
  };
}
```

#### Step 3.2: Multiplayer Game Over Component
```typescript
// components/MultiplayerGameOver.tsx
import React from 'react';
import type { MultiplayerSession } from '../types';

interface MultiplayerGameOverProps {
  session: MultiplayerSession;
  onRestart: () => void;
  onNewGame: () => void;
}

function MultiplayerGameOver({ session, onRestart, onNewGame }: MultiplayerGameOverProps) {
  const sortedPlayers = [...session.players].sort((a, b) => b.score - a.score);

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md">
        <h2 className="text-2xl font-bold mb-4">Game Over!</h2>

        {session.winner ? (
          <div className="text-center mb-6">
            <div className="text-4xl mb-2"></div>
            <div className="text-xl font-semibold text-green-600">
              {session.winner.name} Wins!
            </div>
            <div className="text-lg">Final Score: {session.winner.score}</div>
          </div>
        ) : (
          <div className="text-center mb-6">
            <div className="text-4xl mb-2"></div>
            <div className="text-xl font-semibold">It's a Tie!</div>
          </div>
        )}

        {/* Final Scores */}
        <div className="space-y-3 mb-6">
          {sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                player.id === session.winner?.id ? 'bg-yellow-50 border-2 border-yellow-400' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: player.color }}
                />
                <span className="font-medium">{player.name}</span>
                {index === 0 && <span className="text-yellow-600"></span>}
              </div>
              <div className="text-right">
                <div className="font-bold">{player.score}</div>
                <div className="text-sm text-gray-600">{player.moves} moves</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onRestart}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Play Again
          </button>
          <button
            onClick={onNewGame}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            New Players
          </button>
        </div>
      </div>
    </div>
  );
}

export default MultiplayerGameOver;
```

### Phase 4: App Integration (30 minutes)

#### Step 4.1: Update App.tsx for Multiplayer
```typescript
// App.tsx - Add multiplayer support
import PlayerSetup from './components/PlayerSetup';
import PlayerTurnIndicator from './components/PlayerTurnIndicator';
import MultiplayerGameOver from './components/MultiplayerGameOver';

function App() {
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [showPlayerSetup, setShowPlayerSetup] = useState(false);
  const [boardSize, setBoardSize] = useState(4);
  const [gameMode, setGameMode] = useState<GameMode>('classic');

  const gameState = useGameLogic(boardSize, gameMode, multiplayerSession);
  const {
    session,
    turnState,
    currentPlayer,
    startMultiplayerSession,
    endTurn,
    recordPlayerMove,
    resetMultiplayerSession,
  } = useMultiplayerSession(gameMode, boardSize);

  const handleStartMultiplayer = (player1Name: string, player2Name: string) => {
    startMultiplayerSession(player1Name, player2Name);
    setIsMultiplayer(true);
    setShowPlayerSetup(false);
    gameState.restartGame();
  };

  const handleEndTurn = () => {
    endTurn();
    gameState.restartGame(); // Reset board for next player
  };

  return (
    <div className="game-container">
      {/* Game Mode Selection */}
      <div className="mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setIsMultiplayer(false);
              resetMultiplayerSession();
            }}
            className={`px-4 py-2 rounded ${!isMultiplayer ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Single Player
          </button>
          <button
            onClick={() => setShowPlayerSetup(true)}
            className={`px-4 py-2 rounded ${isMultiplayer ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Multiplayer
          </button>
        </div>
      </div>

      {/* Player Setup Modal */}
      {showPlayerSetup && (
        <PlayerSetup
          onStartGame={handleStartMultiplayer}
          onCancel={() => setShowPlayerSetup(false)}
        />
      )}

      {/* Multiplayer Turn Indicator */}
      {isMultiplayer && turnState && (
        <PlayerTurnIndicator
          players={session?.players || []}
          turnState={turnState}
          onEndTurn={handleEndTurn}
        />
      )}

      {/* Multiplayer Game Over */}
      {isMultiplayer && session?.status === 'finished' && (
        <MultiplayerGameOver
          session={session}
          onRestart={() => {
            gameState.restartGame();
            // Reset to first player
          }}
          onNewGame={() => {
            setIsMultiplayer(false);
            resetMultiplayerSession();
          }}
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
// tests/hooks/useMultiplayerSession.test.tsx
describe('Multiplayer Session', () => {
  test('should start multiplayer session correctly', () => {
    const { result } = renderHook(() => useMultiplayerSession('classic', 4));

    act(() => {
      result.current.startMultiplayerSession('Alice', 'Bob');
    });

    expect(result.current.session?.players).toHaveLength(2);
    expect(result.current.session?.players[0].name).toBe('Alice');
    expect(result.current.currentPlayer?.name).toBe('Alice');
  });

  test('should switch turns correctly', () => {
    const { result } = renderHook(() => useMultiplayerSession('classic', 4));

    act(() => {
      result.current.startMultiplayerSession('Alice', 'Bob');
    });

    const firstPlayer = result.current.currentPlayer;

    act(() => {
      result.current.endTurn();
    });

    expect(result.current.currentPlayer?.name).not.toBe(firstPlayer?.name);
  });
});
```

### Integration Tests
```typescript
// tests/features/multiplayer.test.tsx
describe('Multiplayer Integration', () => {
  test('should handle multiplayer game flow', () => {
    const { result: gameResult } = renderHook(() => useGameLogic(4, 'classic', session));
    const { result: sessionResult } = renderHook(() => useMultiplayerSession('classic', 4));

    // Start multiplayer session
    act(() => {
      sessionResult.current.startMultiplayerSession('Alice', 'Bob');
    });

    // Make moves as first player
    act(() => {
      gameResult.current.handleMove(moveLeft);
      sessionResult.current.recordPlayerMove();
    });

    expect(sessionResult.current.turnState?.movesThisTurn).toBe(1);

    // End turn
    act(() => {
      sessionResult.current.endTurn();
    });

    expect(sessionResult.current.currentPlayer?.name).toBe('Bob');
  });
});
```

## Edge Cases & Error Handling

### Edge Cases to Handle
1. **Player Disconnection**: Handle player leaving mid-game
2. **Turn Timeouts**: Automatic turn ending for inactive players
3. **Invalid Moves**: Prevent players from making moves out of turn
4. **Session Recovery**: Restore multiplayer state after page refresh
5. **Score Ties**: Handle games ending in ties

### Error Conditions
1. **Session Corruption**: Validate multiplayer session data
2. **Player State Sync**: Ensure player states remain synchronized
3. **Turn Management**: Handle turn switching errors

## Interview Discussion Points

### Technical Questions
- **Q: How do you prevent players from making moves out of turn?**
  **A:** We validate the current player before allowing moves and disable input controls for inactive players.

- **Q: How do you handle session persistence across page refreshes?**
  **A:** We save multiplayer session state to localStorage and restore it on page load with validation.

- **Q: What happens when a player reaches 2048 in multiplayer?**
  **A:** The game can continue for other players, or end immediately based on the configured win condition.

### Design Decisions
- **Turn-Based Architecture**: Clear turn boundaries prevent conflicts
- **Player State Isolation**: Each player's progress tracked separately
- **Session Management**: Centralized multiplayer state management

## Performance Considerations

### Multiplayer Performance
- **State Synchronization**: Efficient state updates between players
- **UI Responsiveness**: Quick player switching without lag
- **Memory Usage**: Reasonable memory overhead for player tracking

### Scalability
- **Player Limits**: Currently designed for 2 players, but extensible
- **Session Size**: Manage session data size for storage
- **Network Ready**: Architecture could support remote multiplayer

## Future Enhancements

1. **Remote Multiplayer**: Real-time multiplayer over network
2. **Spectator Mode**: Allow others to watch multiplayer games
3. **Player Statistics**: Track multiplayer-specific statistics
4. **Custom Rules**: Allow players to set custom multiplayer rules
5. **Tournament Mode**: Bracket-style multiplayer competitions

## Implementation Time Estimate

- **Phase 1**: 45 minutes (multiplayer infrastructure and types)
- **Phase 2**: 45 minutes (player setup UI)
- **Phase 3**: 45 minutes (game state integration)
- **Phase 4**: 30 minutes (App integration and polish)
- **Testing**: 45 minutes (unit and integration tests)

**Total Estimated Time**: ~3.5 hours

This implementation demonstrates multiplayer game design, turn management, state synchronization, and user interface adaptation that are valuable in game development and technical interviews.
