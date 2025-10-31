# Theme System Implementation

## Feature Overview

Implement a comprehensive theme system that allows players to customize the visual appearance of the game. This includes different color schemes, backgrounds, and UI styling options to enhance user experience and accessibility.

## Requirements Analysis

### Core Requirements
- **Color Themes**: Multiple predefined color schemes (light, dark, high contrast, etc.)
- **Theme Selection**: UI for choosing and applying themes
- **Persistent Preferences**: Save user's theme choice across sessions
- **Dynamic Updates**: Apply themes without restarting the game
- **Accessibility**: Ensure all themes meet accessibility standards
- **Custom Colors**: Allow limited customization of theme colors
- **Theme Preview**: Show theme previews before applying

### Interview Questions to Ask
1. Should themes be purely cosmetic or affect gameplay?
2. How many predefined themes should be available?
3. Should users be able to create fully custom themes?
4. How should themes interact with system dark mode preferences?

## Technical Approach

### Architecture Decisions
1. **Theme Configuration**: Centralized theme definitions with CSS custom properties
2. **Dynamic Styling**: CSS-in-JS or CSS custom properties for runtime theme switching
3. **Persistence**: localStorage for theme preferences
4. **Performance**: Efficient theme switching without full re-renders

### New Data Types
```typescript
// types.ts - Add theme-related types
export type ThemeName = 'light' | 'dark' | 'ocean' | 'forest' | 'sunset' | 'high-contrast';

export interface ThemeColors {
  // Background colors
  background: string;
  boardBackground: string;
  cellBackground: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textAccent: string;

  // Tile colors (by value)
  tileColors: Record<number, string>;

  // UI element colors
  buttonPrimary: string;
  buttonSecondary: string;
  modalBackground: string;
  borderColor: string;
}

export interface Theme {
  name: ThemeName;
  displayName: string;
  colors: ThemeColors;
  isDark: boolean;
}
```

## Step-by-Step Implementation

### Phase 1: Theme Infrastructure (45 minutes)

#### Step 1.1: Define Theme Types and Configurations
```typescript
// types.ts - Add theme types
export interface ThemeColors {
  background: string;
  boardBackground: string;
  cellBackground: string;
  textPrimary: string;
  textSecondary: string;
  textAccent: string;
  tileColors: Record<number, string>;
  buttonPrimary: string;
  buttonSecondary: string;
  modalBackground: string;
  borderColor: string;
}

export interface Theme {
  name: ThemeName;
  displayName: string;
  colors: ThemeColors;
  isDark: boolean;
}
```

#### Step 1.2: Create Theme Definitions
```typescript
// themes/themeDefinitions.ts
import type { Theme, ThemeName } from '../types';

export const THEMES: Record<ThemeName, Theme> = {
  light: {
    name: 'light',
    displayName: 'Light',
    isDark: false,
    colors: {
      background: '#f8fafc',
      boardBackground: '#cbd5e1',
      cellBackground: '#94a3b8',
      textPrimary: '#1e293b',
      textSecondary: '#64748b',
      textAccent: '#3b82f6',
      tileColors: {
        0: '#e2e8f0',
        2: '#fef3c7',
        4: '#fde68a',
        8: '#f59e0b',
        16: '#d97706',
        32: '#dc2626',
        64: '#b91c1c',
        128: '#991b1b',
        256: '#7c2d12',
        512: '#6b21a8',
        1024: '#581c87',
        2048: '#3b82f6',
      },
      buttonPrimary: '#3b82f6',
      buttonSecondary: '#6b7280',
      modalBackground: '#ffffff',
      borderColor: '#e5e7eb',
    },
  },

  dark: {
    name: 'dark',
    displayName: 'Dark',
    isDark: true,
    colors: {
      background: '#0f172a',
      boardBackground: '#334155',
      cellBackground: '#475569',
      textPrimary: '#f1f5f9',
      textSecondary: '#cbd5e1',
      textAccent: '#60a5fa',
      tileColors: {
        0: '#334155',
        2: '#1e293b',
        4: '#374151',
        8: '#4b5563',
        16: '#6b7280',
        32: '#9ca3af',
        64: '#d1d5db',
        128: '#e5e7eb',
        256: '#f3f4f6',
        512: '#fbbf24',
        1024: '#f59e0b',
        2048: '#3b82f6',
      },
      buttonPrimary: '#60a5fa',
      buttonSecondary: '#9ca3af',
      modalBackground: '#1e293b',
      borderColor: '#374151',
    },
  },

  ocean: {
    name: 'ocean',
    displayName: 'Ocean',
    isDark: false,
    colors: {
      background: '#f0f9ff',
      boardBackground: '#bae6fd',
      cellBackground: '#7dd3fc',
      textPrimary: '#0c4a6e',
      textSecondary: '#0369a1',
      textAccent: '#0284c7',
      tileColors: {
        0: '#e0f2fe',
        2: '#b3e5fc',
        4: '#81d4fa',
        8: '#4fc3f7',
        16: '#29b6f6',
        32: '#03a9f4',
        64: '#039be5',
        128: '#0288d1',
        256: '#0277bd',
        512: '#01579b',
        1024: '#014d87',
        2048: '#013a6b',
      },
      buttonPrimary: '#0284c7',
      buttonSecondary: '#64748b',
      modalBackground: '#ffffff',
      borderColor: '#bae6fd',
    },
  },

  forest: {
    name: 'forest',
    displayName: 'Forest',
    isDark: false,
    colors: {
      background: '#f0fdf4',
      boardBackground: '#bbf7d0',
      cellBackground: '#86efac',
      textPrimary: '#14532d',
      textSecondary: '#166534',
      textAccent: '#16a34a',
      tileColors: {
        0: '#dcfce7',
        2: '#bbf7d0',
        4: '#86efac',
        8: '#4ade80',
        16: '#22c55e',
        32: '#16a34a',
        64: '#15803d',
        128: '#166534',
        256: '#14532d',
        512: '#052e16',
        1024: '#063d1f',
        2048: '#064e3b',
      },
      buttonPrimary: '#16a34a',
      buttonSecondary: '#64748b',
      modalBackground: '#ffffff',
      borderColor: '#bbf7d0',
    },
  },
};
```

#### Step 1.3: Create Theme Context
```typescript
// contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ThemeName, Theme } from '../types';
import { THEMES } from '../themes/themeDefinitions';

interface ThemeContextType {
  currentTheme: ThemeName;
  theme: Theme;
  setTheme: (theme: ThemeName) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeName;
}

export function ThemeProvider({ children, defaultTheme = 'light' }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(defaultTheme);

  // Load theme preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('gameTheme');
    if (stored && Object.keys(THEMES).includes(stored)) {
      setCurrentTheme(stored as ThemeName);
    }
  }, []);

  // Save theme preference to localStorage
  const setTheme = (theme: ThemeName) => {
    setCurrentTheme(theme);
    localStorage.setItem('gameTheme', theme);
  };

  const theme = THEMES[currentTheme];
  const availableThemes = Object.values(THEMES);

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      theme,
      setTheme,
      availableThemes,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

### Phase 2: Dynamic Styling System (45 minutes)

#### Step 2.1: Create Theme CSS Variables Hook
```typescript
// hooks/useThemeStyles.ts
import { useMemo } from 'react';
import type { Theme } from '../types';

export function useThemeStyles(theme: Theme) {
  return useMemo(() => {
    const root = document.documentElement;

    // Apply theme colors as CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (key === 'tileColors') {
        // Handle tile colors separately
        Object.entries(value).forEach(([tileValue, color]) => {
          root.style.setProperty(`--tile-${tileValue}`, color);
        });
      } else {
        root.style.setProperty(`--${key}`, value);
      }
    });

    return {
      // Return computed styles for components
      container: {
        backgroundColor: theme.colors.background,
        color: theme.colors.textPrimary,
      },
      board: {
        backgroundColor: theme.colors.boardBackground,
      },
      cell: {
        backgroundColor: theme.colors.cellBackground,
      },
      button: {
        backgroundColor: theme.colors.buttonPrimary,
        color: 'white',
        border: 'none',
      },
      buttonSecondary: {
        backgroundColor: theme.colors.buttonSecondary,
        color: theme.colors.textPrimary,
        border: `1px solid ${theme.colors.borderColor}`,
      },
    };
  }, [theme]);
}
```

#### Step 2.2: Update CSS with Theme Variables
```typescript
// Add to your CSS file or use a CSS-in-JS solution
:root {
  /* Default theme variables (light theme) */
  --background: #f8fafc;
  --board-background: #cbd5e1;
  --cell-background: #94a3b8;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-accent: #3b82f6;
  --button-primary: #3b82f6;
  --button-secondary: #6b7280;
  --modal-background: #ffffff;
  --border-color: #e5e7eb;

  /* Tile colors */
  --tile-0: #e2e8f0;
  --tile-2: #fef3c7;
  --tile-4: #fde68a;
  /* ... other tile colors */
}

.game-container {
  background-color: var(--background);
  color: var(--text-primary);
  min-height: 100vh;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.board {
  background-color: var(--board-background);
  transition: background-color 0.3s ease;
}

.cell {
  background-color: var(--cell-background);
  transition: background-color 0.3s ease;
}

.tile {
  background-color: var(--tile-2); /* Default fallback */
  transition: background-color 0.3s ease;
}

/* Dynamic tile colors based on value */
.tile[data-value="2"] { background-color: var(--tile-2); }
.tile[data-value="4"] { background-color: var(--tile-4); }
.tile[data-value="8"] { background-color: var(--tile-8); }
/* ... continue for all tile values */

.button-primary {
  background-color: var(--button-primary);
  transition: background-color 0.3s ease;
}

.button-secondary {
  background-color: var(--button-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}
```

### Phase 3: Theme Selection UI (45 minutes)

#### Step 3.1: Theme Selector Component
```typescript
// components/ThemeSelector.tsx
import React from 'react';
import type { ThemeName, Theme } from '../types';

interface ThemeSelectorProps {
  currentTheme: ThemeName;
  themes: Theme[];
  onThemeChange: (theme: ThemeName) => void;
}

function ThemeSelector({ currentTheme, themes, onThemeChange }: ThemeSelectorProps) {
  return (
    <div className="theme-selector mb-4">
      <h3 className="text-lg font-semibold mb-3">Theme</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {themes.map((theme) => (
          <button
            key={theme.name}
            onClick={() => onThemeChange(theme.name)}
            className={`p-3 rounded-lg border-2 transition-all ${
              currentTheme === theme.name
                ? 'border-blue-500 scale-105'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            style={{
              backgroundColor: theme.colors.background,
              color: theme.colors.textPrimary,
            }}
          >
            <div className="font-medium text-sm">{theme.displayName}</div>
            <div className="mt-2 flex gap-1">
              {Object.entries(theme.colors.tileColors).slice(0, 4).map(([value, color]) => (
                <div
                  key={value}
                  className="w-4 h-4 rounded-sm"
                  style={{ backgroundColor: color }}
                  title={`Tile ${value}`}
                />
              ))}
              <div className="w-4 h-4 rounded-sm bg-gray-400" title="...more" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default ThemeSelector;
```

#### Step 3.2: Update App.tsx for Theme Support
```typescript
// App.tsx - Add theme provider and selector
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import ThemeSelector from './components/ThemeSelector';

function GameContent() {
  const { currentTheme, theme, setTheme, availableThemes } = useTheme();
  const [boardSize, setBoardSize] = useState(4);
  const [gameMode, setGameMode] = useState<GameMode>('classic');
  const gameState = useGameLogic(boardSize, gameMode);

  return (
    <div className="game-container" style={useThemeStyles(theme).container}>
      <ThemeSelector
        currentTheme={currentTheme}
        themes={availableThemes}
        onThemeChange={setTheme}
      />

      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          Current theme: {theme.displayName}
        </div>
        <Header {...gameState} onRestart={handleRestart} />
      </div>

      {/* ... rest of game content with theme-aware styling */}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <GameContent />
    </ThemeProvider>
  );
}
```

#### Step 3.3: Update Components for Theme Support
```typescript
// components/Tile.tsx - Make theme-aware
import { useTheme } from '../contexts/ThemeContext';

function Tile({ value, boardSize, isMerged, isNew }) {
  const { theme } = useTheme();

  const tileColor = theme.colors.tileColors[value] || theme.colors.tileColors[2048];
  const textColor = value > 4 ? 'white' : theme.colors.textPrimary;

  return (
    <div
      className={`tile ${isMerged ? 'merged' : ''} ${isNew ? 'new' : ''}`}
      style={{
        backgroundColor: tileColor,
        color: textColor,
        transition: 'all 0.3s ease',
      }}
      data-value={value}
    >
      {value || ''}
    </div>
  );
}

// components/Header.tsx - Theme-aware styling
function Header({ score, highScore, onRestart }) {
  const { theme } = useTheme();

  return (
    <header className="flex justify-between items-center mb-4">
      <div className="text-center">
        <div className="text-sm" style={{ color: theme.colors.textSecondary }}>
          Score
        </div>
        <div className="text-xl font-bold" style={{ color: theme.colors.textPrimary }}>
          {score}
        </div>
        <div className="text-xs" style={{ color: theme.colors.textSecondary }}>
          High: {highScore}
        </div>
      </div>

      <button
        onClick={onRestart}
        className="button-primary"
        style={{
          backgroundColor: theme.colors.buttonPrimary,
          color: 'white',
        }}
      >
        New Game
      </button>
    </header>
  );
}
```

### Phase 4: Advanced Features (30 minutes)

#### Step 4.1: System Theme Detection
```typescript
// contexts/ThemeContext.tsx - Add system theme detection
export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    // Check system preference
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark && defaultTheme === 'light') {
        return 'dark';
      }
    }
    return defaultTheme;
  });

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually selected a theme
      const stored = localStorage.getItem('gameTheme');
      if (!stored) {
        setCurrentTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // ... rest of provider
}
```

#### Step 4.2: Theme Persistence and Management
```typescript
// Add theme management to settings
function Settings({ /* ... existing props */ }) {
  const { currentTheme, theme, setTheme, availableThemes } = useTheme();

  return (
    <div className="settings-panel">
      {/* ... existing settings */}

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Theme</h3>
          <button
            onClick={() => setTheme(currentTheme)} // Refresh current theme
            className="text-xs text-blue-500 hover:text-blue-600"
          >
            Reset to Default
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {availableThemes.map((themeOption) => (
            <button
              key={themeOption.name}
              onClick={() => setTheme(themeOption.name)}
              className={`p-2 rounded text-sm transition-colors ${
                currentTheme === themeOption.name
                  ? 'ring-2 ring-blue-500'
                  : 'hover:bg-gray-100'
              }`}
              style={{
                backgroundColor: themeOption.colors.background,
                color: themeOption.colors.textPrimary,
              }}
            >
              {themeOption.displayName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Testing Strategy

### Unit Tests
```typescript
// tests/themes/themeDefinitions.test.ts
describe('Theme Definitions', () => {
  test('should have valid theme structure', () => {
    Object.values(THEMES).forEach(theme => {
      expect(theme.name).toBeDefined();
      expect(theme.displayName).toBeDefined();
      expect(theme.colors).toBeDefined();
      expect(typeof theme.isDark).toBe('boolean');
      expect(theme.colors.tileColors).toBeDefined();
    });
  });

  test('should have consistent tile color progression', () => {
    const lightTheme = THEMES.light;
    expect(Object.keys(lightTheme.colors.tileColors).length).toBeGreaterThan(10);
  });
});
```

### Integration Tests
```typescript
// tests/contexts/ThemeContext.test.tsx
describe('Theme Context', () => {
  test('should apply theme correctly', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
      ),
    });

    expect(result.current.currentTheme).toBe('dark');
    expect(result.current.theme.name).toBe('dark');
  });

  test('should persist theme preference', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ({ children }) => (
        <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
      ),
    });

    act(() => {
      result.current.setTheme('ocean');
    });

    expect(result.current.currentTheme).toBe('ocean');
    expect(localStorage.getItem('gameTheme')).toBe('ocean');
  });
});
```

## Edge Cases & Error Handling

### Edge Cases to Handle
1. **Invalid Theme Data**: Handle corrupted theme definitions
2. **CSS Variable Conflicts**: Prevent theme CSS variable conflicts
3. **Performance Impact**: Ensure theme switching doesn't cause layout thrashing
4. **Accessibility**: Ensure all themes meet contrast requirements
5. **Browser Compatibility**: Handle CSS custom property limitations

### Error Conditions
1. **Theme Load Failure**: Fallback to default theme
2. **CSS Application Errors**: Handle CSS variable setting failures
3. **Storage Errors**: Handle localStorage theme preference failures

## Interview Discussion Points

### Technical Questions
- **Q: How do you ensure theme performance doesn't impact gameplay?**
  **A:** We use CSS custom properties for efficient theme switching and ensure transitions are hardware-accelerated.

- **Q: How do you handle theme accessibility requirements?**
  **A:** Each theme includes contrast validation and we provide a high-contrast theme option.

- **Q: What happens if a theme definition is corrupted?**
  **A:** We validate theme data and fall back to a default theme with appropriate error handling.

### Design Decisions
- **CSS Custom Properties**: Enables efficient runtime theme switching
- **Context Pattern**: Provides theme access throughout the component tree
- **Validation**: Ensures theme data integrity before application

## Performance Considerations

### Theme Switching Performance
- **CSS Variables**: Minimal runtime overhead for theme changes
- **Transition Management**: Smooth transitions without layout thrashing
- **Memory Usage**: Theme definitions stored efficiently in memory

### Bundle Size Impact
- **Theme Data**: Theme definitions add to bundle size
- **CSS Generation**: Dynamic CSS variable management
- **Tree Shaking**: Unused themes can be eliminated in production

## Future Enhancements

1. **Custom Theme Builder**: Allow users to create their own themes
2. **Theme Animations**: Animate between theme transitions
3. **Theme Presets**: Seasonal or holiday-themed themes
4. **Theme Export/Import**: Share themes between players
5. **System Integration**: Better integration with OS dark mode

## Implementation Time Estimate

- **Phase 1**: 45 minutes (theme infrastructure and types)
- **Phase 2**: 45 minutes (dynamic styling system)
- **Phase 3**: 45 minutes (theme selection UI)
- **Phase 4**: 30 minutes (advanced features and polish)
- **Testing**: 30 minutes (unit and integration tests)

**Total Estimated Time**: ~3.5 hours

This implementation demonstrates UI customization, CSS management, user preferences, and accessibility considerations that are valuable in modern web development interviews.









