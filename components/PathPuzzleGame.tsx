import React, { useState, useEffect, useCallback } from 'react';
import { RotateCw, ArrowLeftRight, Check, ArrowLeft, Timer, PlayCircle } from 'lucide-react';
import { TileData, Direction } from '../types';

interface Props {
  onExit: () => void;
}

// Tile Configuration Presets
// Connections array: [Up, Right, Down, Left]
const TILE_TYPES = [
  { name: 'Straight', connections: [true, false, true, false] }, // |
  { name: 'Corner', connections: [true, true, false, false] },   // L
  { name: 'Tee', connections: [false, true, true, true] },       // T pointing down
  { name: 'Cross', connections: [true, true, true, true] },      // +
];

const PathPuzzleGame: React.FC<Props> = ({ onExit }) => {
  const [level, setLevel] = useState(1);
  const [mode, setMode] = useState<'practice' | 'assessment'>('practice');
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(3);
  const [startRow, setStartRow] = useState(0);
  const [endRow, setEndRow] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'success' | 'fail'>('intro');
  const [moveCount, setMoveCount] = useState(0);

  // Generate Level
  const initLevel = useCallback((lvl: number, isPractice: boolean) => {
    // Determine size
    let size = 3;
    if (lvl > 10) size = 4;
    if (lvl > 20) size = 5;
    
    setGridSize(size);
    setMoveCount(0);
    setGameState('playing');
    
    // Randomize Start (Left side) and End (Right side) rows
    const sRow = Math.floor(Math.random() * size);
    const eRow = Math.floor(Math.random() * size);
    setStartRow(sRow);
    setEndRow(eRow);

    // Timer setup
    let time = 0;
    if (!isPractice) {
       if (size === 3) time = 60;
       else if (size === 4) time = 90;
       else time = 120;
    }
    setTimeLeft(time);

    // Generate Tiles
    const newTiles: TileData[] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const typeIdx = Math.floor(Math.random() * TILE_TYPES.length);
        const rotation = Math.floor(Math.random() * 4) * 90;
        
        newTiles.push({
          id: `${r}-${c}`,
          r,
          c,
          connections: [...TILE_TYPES[typeIdx].connections],
          rotation: rotation,
        });
      }
    }
    setTiles(newTiles);
    setSelectedTileId(null);
  }, []);

  // Timer Effect
  useEffect(() => {
    if (gameState !== 'playing' || mode === 'practice') return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('fail');
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, mode]);

  // Actions
  const handleRotate = () => {
    if (!selectedTileId || gameState !== 'playing') return;
    setMoveCount(c => c + 1);
    setTiles(prev => prev.map(t => {
      if (t.id === selectedTileId) {
        // Rotate connections array: [U, R, D, L] -> [L, U, R, D] (Clockwise)
        const [u, r, d, l] = t.connections;
        return {
          ...t,
          rotation: (t.rotation + 90) % 360,
          connections: [l, u, r, d] 
        };
      }
      return t;
    }));
  };

  const handleSwapType = () => {
    if (!selectedTileId || gameState !== 'playing') return;
    setMoveCount(c => c + 1);
    setTiles(prev => prev.map(t => {
      if (t.id === selectedTileId) {
        const typeIdx = Math.floor(Math.random() * TILE_TYPES.length);
        return {
            ...t,
            connections: [...TILE_TYPES[typeIdx].connections],
            rotation: 0 // Reset rotation on type change for clarity
        };
      }
      return t;
    }));
  };

  // Validation Logic (DFS)
  const checkPath = () => {
    // The path must start at (startRow, 0) and the tile must have a LEFT connection open.
    // The path must end at (endRow, size-1) and the tile must have a RIGHT connection open.
    
    const startTile = tiles.find(t => t.r === startRow && t.c === 0);
    if (!startTile || !startTile.connections[3]) {
        alert("Path must start at the indicated start point!");
        return;
    }

    const visited = new Set<string>();
    const stack: TileData[] = [startTile];
    
    let found = false;
    
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current.id)) continue;
      visited.add(current.id);
      
      // If we are at the designated end tile and have Right opening, WIN
      if (current.r === endRow && current.c === gridSize - 1 && current.connections[1]) {
        found = true;
        break;
      }
      
      // Check neighbors
      // Up
      if (current.connections[0]) { 
        const neighbor = tiles.find(t => t.r === current.r - 1 && t.c === current.c);
        if (neighbor && neighbor.connections[2]) stack.push(neighbor); // Neighbor has Down open
      }
      // Right
      if (current.connections[1]) { 
        const neighbor = tiles.find(t => t.r === current.r && t.c === current.c + 1);
        if (neighbor && neighbor.connections[3]) stack.push(neighbor); // Neighbor has Left open
      }
      // Down
      if (current.connections[2]) { 
        const neighbor = tiles.find(t => t.r === current.r + 1 && t.c === current.c);
        if (neighbor && neighbor.connections[0]) stack.push(neighbor); // Neighbor has Up open
      }
      // Left
      if (current.connections[3]) { 
        const neighbor = tiles.find(t => t.r === current.r && t.c === current.c - 1);
        if (neighbor && neighbor.connections[1]) stack.push(neighbor); // Neighbor has Right open
      }
    }

    if (found) {
        setGameState('success');
    } else {
        alert("Path is not complete or invalid! Check connections.");
    }
  };

  // Render Arrow inside Tile based on connections
  const renderTileArrows = (t: TileData) => {
      return (
          <div className="relative w-full h-full flex items-center justify-center">
              {/* Center hub */}
              <div className="w-1/3 h-1/3 bg-gray-600 rounded-sm z-10"></div>
              {/* Arms */}
              {t.connections[0] && <div className="absolute top-0 left-1/3 w-1/3 h-1/2 bg-gray-600">
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-white"></div>
              </div>}
              {t.connections[1] && <div className="absolute top-1/3 right-0 w-1/2 h-1/3 bg-gray-600">
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 border-t-[6px] border-b-[6px] border-l-[8px] border-t-transparent border-b-transparent border-l-white"></div>
              </div>}
              {t.connections[2] && <div className="absolute bottom-0 left-1/3 w-1/3 h-1/2 bg-gray-600">
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white"></div>
              </div>}
              {t.connections[3] && <div className="absolute top-1/3 left-0 w-1/2 h-1/3 bg-gray-600">
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 border-t-[6px] border-b-[6px] border-r-[8px] border-t-transparent border-b-transparent border-r-white"></div>
              </div>}
          </div>
      )
  }

  if (gameState === 'intro') {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen p-8 max-w-2xl mx-auto">
              <h1 className="text-3xl font-bold mb-6 text-gray-800">Arrow Path Puzzle</h1>
              <div className="bg-white p-8 rounded-xl shadow-lg border text-center">
                  <p className="mb-6 text-gray-600">Connect the path from Start to End by rotating tiles and changing their types.</p>
                  <div className="flex gap-4 justify-center">
                      <button 
                        onClick={() => { setMode('practice'); initLevel(1, true); }}
                        className="px-6 py-3 bg-blue-100 text-blue-700 rounded-lg font-bold hover:bg-blue-200"
                      >
                          Practice Mode
                      </button>
                      <button 
                         onClick={() => { setMode('assessment'); initLevel(2, false); }}
                         className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                      >
                          Start Assessment
                      </button>
                  </div>
              </div>
              <button onClick={onExit} className="mt-8 text-gray-500 underline">Back to Menu</button>
          </div>
      )
  }

  return (
    <div className="flex flex-col items-center p-4 w-full max-w-4xl mx-auto animate-fade-in">
       {/* Top Bar */}
       <div className="w-full flex justify-between items-center mb-6 border-b pb-4">
           <div className="flex items-center gap-2">
               <button onClick={onExit}><ArrowLeft className="text-gray-500" /></button>
               <h2 className="text-lg font-bold">Level {level} {mode === 'practice' ? '(Practice)' : ''}</h2>
           </div>
           {mode === 'assessment' && (
               <div className="flex items-center gap-2 text-2xl font-mono font-bold">
                   <Timer className={timeLeft < 10 ? 'text-red-500' : 'text-gray-700'} />
                   <span className={timeLeft < 10 ? 'text-red-500' : 'text-gray-700'}>{timeLeft}s</span>
               </div>
           )}
       </div>

       {/* Main Game Area with Positioning */}
       <div className="flex justify-center items-center mb-6 relative">
           
           {/* Wrapper for absolute positioning context */}
           <div className="relative p-4">
               
               {/* Start Icon (Absolute Left) */}
               <div 
                  className="absolute left-[-60px] flex flex-col items-center transition-all duration-300"
                  style={{ top: `${(startRow / gridSize) * 100}%`, transform: `translateY(15%)` }}
               >
                   <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-500 mb-2">
                       <PlayCircle className="text-green-600" />
                   </div>
                   <span className="text-xs font-bold text-gray-400">START</span>
               </div>

               {/* Grid */}
               <div 
                 className="grid bg-gray-200 gap-[1px] border border-gray-300 shadow-lg"
                 style={{
                     gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                     width: 'min(80vw, 400px)',
                     aspectRatio: '1/1'
                 }}
               >
                   {tiles.map(tile => (
                       <div 
                         key={tile.id}
                         onClick={() => gameState === 'playing' && setSelectedTileId(tile.id)}
                         className={`
                            relative bg-white cursor-pointer transition-all duration-200
                            ${selectedTileId === tile.id ? 'ring-4 ring-yellow-400 z-10' : 'hover:bg-gray-50'}
                         `}
                       >
                           {renderTileArrows(tile)}
                       </div>
                   ))}
               </div>

               {/* End Icon (Absolute Right) */}
               <div 
                  className="absolute right-[-60px] flex flex-col items-center transition-all duration-300"
                  style={{ top: `${(endRow / gridSize) * 100}%`, transform: `translateY(15%)` }}
               >
                   <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center border-2 border-red-500 mb-2">
                       <div className="w-4 h-4 bg-red-500 rounded-sm" />
                   </div>
                   <span className="text-xs font-bold text-gray-400">END</span>
               </div>
           </div>
       </div>

       {/* Controls */}
       <div className="flex gap-4 mb-6">
           <button 
             onClick={handleRotate}
             disabled={!selectedTileId}
             className="w-16 h-16 bg-gray-800 text-white rounded-lg flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
           >
               <RotateCw size={28} />
           </button>
           <button 
             onClick={handleSwapType}
             disabled={!selectedTileId}
             className="w-16 h-16 bg-gray-800 text-white rounded-lg flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
           >
               <ArrowLeftRight size={28} />
           </button>
           <button 
             onClick={checkPath}
             className="w-16 h-16 bg-green-600 text-white rounded-lg flex items-center justify-center active:scale-95 transition-transform hover:bg-green-700"
           >
               <Check size={32} />
           </button>
       </div>

       {gameState === 'success' && (
           <div className="bg-green-100 text-green-800 p-4 rounded-lg w-full max-w-md text-center">
               <h3 className="font-bold text-xl">Path Valid!</h3>
               <p>Move to next level...</p>
               <button onClick={() => {
                   setLevel(l => l + 1);
                   initLevel(level + 1, mode === 'practice');
               }} className="mt-2 bg-green-600 text-white px-4 py-2 rounded">Next Level</button>
           </div>
       )}
        {gameState === 'fail' && (
           <div className="bg-red-100 text-red-800 p-4 rounded-lg w-full max-w-md text-center">
               <h3 className="font-bold text-xl">Assessment Failed</h3>
               <button onClick={() => initLevel(level, false)} className="mt-2 bg-red-600 text-white px-4 py-2 rounded">Retry</button>
           </div>
       )}

    </div>
  );
};

export default PathPuzzleGame;