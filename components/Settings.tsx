import React from 'react';

interface SettingsProps {
  currentSize: number;
  onSizeChange: (newSize: number) => void;
}

function Settings({ currentSize, onSizeChange }: SettingsProps): React.ReactElement {
  function handleDecrement() {
    onSizeChange(currentSize - 1);
  }

  function handleIncrement() {
    onSizeChange(currentSize + 1);
  }

  return (
    <div className="flex items-center justify-between bg-slate-200 p-3 rounded-lg w-full">
      <div className="flex items-center gap-2">
        <label htmlFor="boardSize" className="font-semibold text-slate-600">
          Board Size:
        </label>
        <div className="relative group focus:outline-none" tabIndex={0}>
            {/* Info Icon SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 cursor-pointer" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-700 text-white text-sm rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
              <p className="font-bold text-base mb-1">How to Play</p>
              <ul className="list-disc list-inside space-y-1 text-slate-200">
                <li>Use <strong>arrow keys</strong> or <strong>swipe</strong> to move tiles.</li>
                <li>Tiles with the same number merge into one.</li>
                <li>Join numbers to get the <strong>2048 tile!</strong></li>
              </ul>
              {/* Arrow */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-700"></div>
            </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button 
          onClick={handleDecrement}
          disabled={currentSize <= 3}
          className="w-8 h-8 rounded-full bg-slate-300 text-slate-700 font-bold text-xl disabled:opacity-50 hover:bg-slate-400 transition"
        >-</button>
         <span className="font-bold text-lg w-12 text-center">{currentSize} x {currentSize}</span>
        <button
          onClick={handleIncrement}
          disabled={currentSize >= 8}
          className="w-8 h-8 rounded-full bg-slate-300 text-slate-700 font-bold text-xl disabled:opacity-50 hover:bg-slate-400 transition"
        >+</button>
      </div>
    </div>
  );
}

export default Settings;