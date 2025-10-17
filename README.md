# 2048 Game

A modern implementation of the classic 2048 puzzle game built with React, TypeScript, and Tailwind CSS.

## Features

- **Classic 2048 Gameplay**: Slide and merge tiles to reach the 2048 tile
- **Responsive Design**: Works on desktop and mobile devices
- **Touch & Swipe Controls**: Intuitive mobile gameplay
- **Configurable Board Size**: Choose from 3x3 to 8x8 grids
- **Persistent High Score**: Your best score is saved locally
- **Keyboard Controls**: Arrow keys for desktop play

## How to Play

1. Use **arrow keys** on desktop or **swipe** on touch devices to move tiles
2. Tiles with the same number merge when they touch
3. A new tile (2 or 4) appears after each move
4. Reach the **2048 tile** to win!

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/BhCh7051/2048-game.git
cd 2048-game
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Technology Stack

- **React** 19.2.0 - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling

## Project Structure

```
2048-game/
├── src/
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Game logic utilities
│   ├── App.tsx         # Main application
│   └── types.ts        # TypeScript definitions
├── index.html
└── package.json
```
