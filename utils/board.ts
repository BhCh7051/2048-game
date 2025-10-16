import type { BoardType, TileValue } from '../types';

// Helper to create an empty board
export function createEmptyBoard(size: number): BoardType {
  return Array(size).fill(null).map(() => Array(size).fill(0));
}



// Helper to get all empty cells
export function getEmptyCells(board: BoardType): [number, number][] {
  const emptyCells: [number, number][] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      if (board[r][c] === 0) {
        emptyCells.push([r, c]);
      }
    }
  }
  return emptyCells;
}

// Add a new random tile (2 or 4) to an empty cell
export function addRandomTile(board: BoardType): { newBoard: BoardType; newTileCoords: [number, number] | null } {
  const newBoard = board.map(row => [...row]);
  const emptyCells = getEmptyCells(newBoard);
  if (emptyCells.length === 0) {
    return { newBoard, newTileCoords: null };
  }
  const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
  return { newBoard, newTileCoords: [r, c] };
}

// Initialize the board with a given size and two random tiles
export function initBoard(size: number): { board: BoardType; newTiles: Array<[number, number]> } {
  let board = createEmptyBoard(size);
  const newTiles: Array<[number, number]> = [];

  const result1 = addRandomTile(board);
  if (result1.newTileCoords) {
      board = result1.newBoard;
      newTiles.push(result1.newTileCoords);
  }

  const result2 = addRandomTile(board);
  if (result2.newTileCoords) {
      board = result2.newBoard;
      newTiles.push(result2.newTileCoords);
  }

  return { board, newTiles };
}

// Core logic for sliding and merging a single row/column to the "left"
export function slideAndMerge(row: TileValue[]): { newRow: TileValue[]; score: number } {
  const size = row.length;
  const filtered: number[] = [];
  for (let i = 0; i < size; i++) {
    if (row[i] !== 0) {
      filtered.push(row[i]);
    }
  }

  let newRow: TileValue[] = [];
  let score = 0;

  for (let i = 0; i < filtered.length; i++) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const mergedValue = filtered[i] * 2;
      newRow.push(mergedValue);
      score += mergedValue;
      i++; // Skip next element as it's merged
    } else {
      newRow.push(filtered[i]);
    }
  }

  // Pad with zeros to match original length
  while (newRow.length < size) {
    newRow.push(0);
  }
  return { newRow, score };
}

// Rotates a grid 90 degrees clockwise
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

// Rotates a grid 90 degrees counter-clockwise
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

// Generic move operation
function operate(board: BoardType): { newBoard: BoardType; score: number } {
  let totalScore = 0;
  const newBoard = board.map(row => {
    const { newRow, score } = slideAndMerge(row);
    totalScore += score;
    return newRow;
  });
  return { newBoard, score: totalScore };
}

export function moveLeft(board: BoardType) {
  const { newBoard, score } = operate(board);
  return { newBoard, score };
}

export function moveRight(board: BoardType) {
  const size = board.length;
  const reversed = board.map(row => [...row].reverse());
  const { newBoard: newReversed, score } = operate(reversed);
  const newBoard = newReversed.map(row => [...row].reverse());
  return { newBoard, score };
}

export function moveUp(board: BoardType) {
  const rotated = rotateLeft(board);
  const { newBoard: newRotated, score } = operate(rotated);
  const newBoard = rotateRight(newRotated);
  return { newBoard, score };
}

export function moveDown(board: BoardType) {
  const rotated = rotateRight(board);
  const { newBoard: newRotated, score } = operate(rotated);
  const newBoard = rotateLeft(newRotated);
  return { newBoard, score };
}

// Check if the board has changed - optimized version
export function areBoardsEqual(b1: BoardType, b2: BoardType): boolean {
  if (b1 === b2) return true;
  if (b1.length !== b2.length) return false;

  for (let i = 0; i < b1.length; i++) {
    if (b1[i].length !== b2[i].length) return false;
    for (let j = 0; j < b1[i].length; j++) {
      if (b1[i][j] !== b2[i][j]) return false;
    }
  }
  return true;
}

// Check for win condition (2048 tile)
export function hasWon(board: BoardType): boolean {
  return board.some(row => row.some(cell => cell === 2048));
}

// Check if any moves are possible
function canMove(board: BoardType): boolean {
  const size = board.length;
  // Check for adjacent same numbers
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (r < size - 1 && board[r][c] === board[r + 1][c]) return true;
      if (c < size - 1 && board[r][c] === board[r][c + 1]) return true;
    }
  }
  return false;
}

// Check for game over condition
export function isGameOver(board: BoardType): boolean {
  const hasEmptyCells = getEmptyCells(board).length > 0;
  if (hasEmptyCells) return false;
  return !canMove(board);
}
