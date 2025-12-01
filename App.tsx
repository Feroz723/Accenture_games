import React, { useState } from 'react';
import { LayoutGrid, Map, Calculator, ArrowLeft } from 'lucide-react';
import InvisibleMazeGame from './components/InvisibleMazeGame';
import PathPuzzleGame from './components/PathPuzzleGame';
import BubbleSortGame from './components/BubbleSortGame';

enum GameView {
  Menu,
  Maze,
  Path,
  Bubble
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<GameView>(GameView.Menu);

  const renderGame = () => {
    switch (currentView) {
      case GameView.Maze:
        return <InvisibleMazeGame onExit={() => setCurrentView(GameView.Menu)} />;
      case GameView.Path:
        return <PathPuzzleGame onExit={() => setCurrentView(GameView.Menu)} />;
      case GameView.Bubble:
        return <BubbleSortGame onExit={() => setCurrentView(GameView.Menu)} />;
      default:
        return null;
    }
  };

  if (currentView !== GameView.Menu) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {renderGame()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center justify-center font-sans">
      <header className="mb-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="text-purple-600 font-bold text-3xl tracking-tighter">&gt;</div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Cognitive Assessment Suite</h1>
        </div>
        <p className="text-gray-600 max-w-lg mx-auto">
          Select an assessment module below to begin. These exercises mimic professional cognitive ability tests used in recruitment.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        {/* Card 1: Invisible Maze */}
        <button 
          onClick={() => setCurrentView(GameView.Maze)}
          className="group bg-white p-8 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 flex flex-col items-center text-center hover:border-purple-300"
        >
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-purple-100 transition-colors">
            <LayoutGrid className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Invisible Maze</h2>
          <p className="text-sm text-gray-500 mb-4">Spatial Memory & Navigation</p>
          <div className="text-xs text-gray-400">
            Navigate a grid with hidden obstacles. Remember the path to reach the door.
          </div>
        </button>

        {/* Card 2: Path Puzzle */}
        <button 
          onClick={() => setCurrentView(GameView.Path)}
          className="group bg-white p-8 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 flex flex-col items-center text-center hover:border-blue-300"
        >
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
            <Map className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Arrow Path</h2>
          <p className="text-sm text-gray-500 mb-4">Logic & Spatial Reasoning</p>
          <div className="text-xs text-gray-400">
            Connect the start to the end by rotating and modifying directional tiles.
          </div>
        </button>

        {/* Card 3: Bubble Sort */}
        <button 
          onClick={() => setCurrentView(GameView.Bubble)}
          className="group bg-white p-8 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 flex flex-col items-center text-center hover:border-emerald-300"
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-emerald-100 transition-colors">
            <Calculator className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Numerical Sort</h2>
          <p className="text-sm text-gray-500 mb-4">Quantitative Reasoning</p>
          <div className="text-xs text-gray-400">
            Select numerical expressions in ascending order under time pressure.
          </div>
        </button>
      </div>

      <footer className="mt-16 text-xs text-gray-400">
        Recreated for educational purposes. Inspired by Accenture Assessments.
      </footer>
    </div>
  );
};

export default App;