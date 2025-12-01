import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Key, DoorOpen, Timer, AlertCircle, RefreshCw, Trophy, ArrowLeft } from 'lucide-react';

interface Props {
  onExit: () => void;
}

const LEVELS = [
  { id: 1, name: "Easy", gridSize: 3, wallCount: 2, timeLimit: 60 },
  { id: 2, name: "Medium", gridSize: 4, wallCount: 6, timeLimit: 90 },
  { id: 3, name: "Hard", gridSize: 5, wallCount: 12, timeLimit: 120 },
];

// BFS to check connectivity from start to target considering walls
const hasPath = (
  size: number, 
  walls: Set<string>, 
  start: {r: number, c: number}, 
  end: {r: number, c: number}
) => {
    const q = [start];
    const visited = new Set<string>();
    visited.add(`${start.r},${start.c}`);
    
    const dirs = [[0,1], [0,-1], [1,0], [-1,0]]; // R, L, D, U

    while (q.length > 0) {
        const curr = q.shift()!;
        if (curr.r === end.r && curr.c === end.c) return true;

        for (const [dr, dc] of dirs) {
            const nr = curr.r + dr;
            const nc = curr.c + dc;
            
            // Bounds check
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                // Wall check (ensure no wall between curr and next)
                const wallKey = [curr.r, curr.c, nr, nc].join(',');
                const reverseKey = [nr, nc, curr.r, curr.c].join(',');
                
                if (!walls.has(wallKey) && !walls.has(reverseKey)) {
                    const key = `${nr},${nc}`;
                    if (!visited.has(key)) {
                        visited.add(key);
                        q.push({r: nr, c: nc});
                    }
                }
            }
        }
    }
    return false;
};

const InvisibleMazeGame: React.FC<Props> = ({ onExit }) => {
  const [levelIdx, setLevelIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<'practice' | 'challenge'>('practice');
  const [gridSize, setGridSize] = useState(3);
  
  // Game State
  const [playerPos, setPlayerPos] = useState({ r: 0, c: 0 });
  const [keyPos, setKeyPos] = useState({ r: 0, c: 1 });
  const [doorPos, setDoorPos] = useState({ r: 2, c: 2 });
  const [walls, setWalls] = useState<Set<string>>(new Set());
  const [revealedWalls, setRevealedWalls] = useState<Set<string>>(new Set());
  const [hasKey, setHasKey] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStatus, setGameStatus] = useState<'ready' | 'active' | 'hit' | 'won' | 'lost'>('ready');
  const [flashRed, setFlashRed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Level with solvable path guarantee
  const initLevel = useCallback(() => {
    const currentLevel = LEVELS[levelIdx];
    const size = currentLevel.gridSize;
    setGridSize(size);
    const startPos = { r: size - 1, c: 0 };
    setPlayerPos(startPos);
    setAttempts(0);
    setHasKey(false);
    setRevealedWalls(new Set());
    setGameStatus('active');
    setTimeLeft(currentLevel.timeLimit);

    let validMaze = false;
    let attemptsCount = 0;
    
    // Retry generation until a solvable maze is created
    while (!validMaze && attemptsCount < 500) {
        attemptsCount++;
        
        // Randomize Key and Door
        let kR, kC, dR, dC;
        do {
          kR = Math.floor(Math.random() * size);
          kC = Math.floor(Math.random() * size);
        } while (kR === startPos.r && kC === startPos.c);

        do {
          dR = Math.floor(Math.random() * size);
          dC = Math.floor(Math.random() * size);
        } while ((dR === startPos.r && dC === startPos.c) || (dR === kR && dC === kC));
        
        const tempKeyPos = { r: kR, c: kC };
        const tempDoorPos = { r: dR, c: dC };

        // Generate invisible walls
        const newWalls = new Set<string>();
        let count = 0;
        let safety = 0;
        
        // Try to place walls
        while (count < currentLevel.wallCount && safety < 100) {
          safety++;
          const isVertical = Math.random() > 0.5;
          let r1, c1, r2, c2;
          
          if (isVertical) {
            r1 = Math.floor(Math.random() * size);
            c1 = Math.floor(Math.random() * (size - 1));
            r2 = r1;
            c2 = c1 + 1;
          } else {
            r1 = Math.floor(Math.random() * (size - 1));
            c1 = Math.floor(Math.random() * size);
            r2 = r1 + 1;
            c2 = c1;
          }
          
          const wallId = [r1, c1, r2, c2].join(',');
          const reverseWallId = [r2, c2, r1, c1].join(',');
          
          if (!newWalls.has(wallId) && !newWalls.has(reverseWallId)) {
             newWalls.add(wallId);
             count++;
          }
        }

        // Validate Solvability: Start -> Key AND Key -> Door
        if (hasPath(size, newWalls, startPos, tempKeyPos) && hasPath(size, newWalls, tempKeyPos, tempDoorPos)) {
            validMaze = true;
            setKeyPos(tempKeyPos);
            setDoorPos(tempDoorPos);
            setWalls(newWalls);
        }
    }
    
    // Slight delay to ensure render happens before focus
    setTimeout(() => {
        containerRef.current?.focus();
    }, 100);
  }, [levelIdx]);

  // Timer
  useEffect(() => {
    if (gameStatus !== 'active' || mode === 'practice') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameStatus('lost');
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStatus, mode]);

  // Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'active') return;

      let nextR = playerPos.r;
      let nextC = playerPos.c;

      if (e.key === 'ArrowUp') nextR--;
      else if (e.key === 'ArrowDown') nextR++;
      else if (e.key === 'ArrowLeft') nextC--;
      else if (e.key === 'ArrowRight') nextC++;
      else return;

      // Check bounds
      if (nextR < 0 || nextR >= gridSize || nextC < 0 || nextC >= gridSize) return;

      // Check Wall
      const wallKey = [playerPos.r, playerPos.c, nextR, nextC].join(',');
      const reverseKey = [nextR, nextC, playerPos.r, playerPos.c].join(',');
      
      if (walls.has(wallKey) || walls.has(reverseKey)) {
        // Hit Wall
        setFlashRed(true);
        setTimeout(() => setFlashRed(false), 300);
        setRevealedWalls(prev => new Set(prev).add(wallKey).add(reverseKey));
        setAttempts(prev => prev + 1);
        setPlayerPos({ r: gridSize - 1, c: 0 }); // Reset to start
      } else {
        // Move Success
        setPlayerPos({ r: nextR, c: nextC });
        
        // Check Key
        if (nextR === keyPos.r && nextC === keyPos.c && !hasKey) {
          setHasKey(true);
        }

        // Check Door
        if (nextR === doorPos.r && nextC === doorPos.c) {
          if (hasKey) {
            setGameStatus('won');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerPos, walls, gameStatus, gridSize, keyPos, doorPos, hasKey]);


  const renderGrid = () => {
    const cells = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const isPlayer = playerPos.r === r && playerPos.c === c;
        const isKey = !hasKey && keyPos.r === r && keyPos.c === c;
        const isDoor = doorPos.r === r && doorPos.c === c;
        
        // Check right and bottom borders for revealed walls
        const rightWallKey = [r, c, r, c + 1].join(',');
        const bottomWallKey = [r, c, r + 1, c].join(',');
        const revRight = revealedWalls.has(rightWallKey) || revealedWalls.has([r, c + 1, r, c].join(','));
        const revBottom = revealedWalls.has(bottomWallKey) || revealedWalls.has([r + 1, c, r, c].join(','));

        cells.push(
          <div 
            key={`${r}-${c}`}
            className={`
              relative bg-white border-gray-200
              ${r === 0 ? 'border-t-2' : 'border-t'}
              ${c === 0 ? 'border-l-2' : 'border-l'}
              ${r === gridSize - 1 ? 'border-b-2' : 'border-b'}
              ${c === gridSize - 1 ? 'border-r-2' : 'border-r'}
            `}
            style={{
              width: `${100 / gridSize}%`,
              height: `${100 / gridSize}%`,
            }}
          >
            {/* Revealed Walls Visuals */}
            {revRight && <div className="absolute right-[-3px] top-[-1px] bottom-[-1px] w-[5px] bg-red-500 z-10" />}
            {revBottom && <div className="absolute bottom-[-3px] left-[-1px] right-[-1px] h-[5px] bg-red-500 z-10" />}

            {/* Icons */}
            <div className="flex items-center justify-center w-full h-full">
              {isDoor && <DoorOpen size={32} className={hasKey ? "text-green-600" : "text-gray-400"} />}
              {isKey && <Key size={28} className="text-yellow-500 animate-pulse" />}
              {isPlayer && (
                <div className={`transition-all duration-200 ${flashRed ? 'text-red-600 scale-110' : 'text-blue-600'}`}>
                   <User size={36} fill="currentColor" />
                </div>
              )}
            </div>
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 animate-fade-in">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6">
        <button onClick={onExit} className="flex items-center text-gray-500 hover:text-gray-800">
          <ArrowLeft size={20} className="mr-2" /> Back
        </button>
        <div className="flex gap-4">
           {mode === 'challenge' && (
             <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
               <Timer size={18} className="text-gray-400" />
               <span className={`font-mono text-xl font-bold ${timeLeft < 10 ? 'text-red-500' : 'text-gray-700'}`}>
                 {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
               </span>
             </div>
           )}
           <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
             <span className="text-xs font-bold text-gray-400 uppercase">Attempts</span>
             <span className="font-mono text-xl font-bold text-gray-700">{attempts}</span>
           </div>
        </div>
      </div>

      {/* Game Container */}
      {!isPlaying ? (
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Invisible Maze</h2>
          <p className="text-gray-600 mb-6">
            Navigate the grid to collect the Key <Key className="inline w-4 h-4" /> and reach the Door <DoorOpen className="inline w-4 h-4" />.
            <br/><br/>
            <strong>Beware!</strong> Walls are invisible until you hit them. If you hit a wall, you reset to the start.
          </p>

          <div className="flex justify-center gap-4 mb-6">
             <button 
                onClick={() => setMode('practice')}
                className={`px-4 py-2 rounded-lg border ${mode === 'practice' ? 'bg-purple-100 border-purple-500 text-purple-700' : 'border-gray-200'}`}
              >
               Practice Mode
             </button>
             <button 
                onClick={() => setMode('challenge')}
                className={`px-4 py-2 rounded-lg border ${mode === 'challenge' ? 'bg-purple-100 border-purple-500 text-purple-700' : 'border-gray-200'}`}
              >
               Challenge Mode
             </button>
          </div>

          <div className="space-y-2 mb-8">
            {LEVELS.map((lvl, idx) => (
              <button
                key={lvl.id}
                onClick={() => setLevelIdx(idx)}
                className={`w-full p-3 rounded-lg border text-left flex justify-between ${levelIdx === idx ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <span>{lvl.name} ({lvl.gridSize}x{lvl.gridSize})</span>
                <span className="text-gray-400 text-sm">{lvl.wallCount} walls</span>
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => {
              setIsPlaying(true);
              initLevel();
            }}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors shadow-md"
          >
            Start Game
          </button>
        </div>
      ) : (
        <div className="relative w-full max-w-[500px] aspect-square bg-gray-100 rounded-xl shadow-inner border-4 border-gray-300 overflow-hidden outline-none" ref={containerRef} tabIndex={0} autoFocus>
            {/* Overlay for Win/Loss */}
            {(gameStatus === 'won' || gameStatus === 'lost') && (
              <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center animate-fade-in">
                {gameStatus === 'won' ? (
                  <Trophy size={64} className="text-yellow-500 mb-4" />
                ) : (
                  <AlertCircle size={64} className="text-red-500 mb-4" />
                )}
                <h3 className="text-3xl font-bold mb-2">{gameStatus === 'won' ? 'Level Complete!' : 'Time Up!'}</h3>
                <p className="text-gray-600 mb-6">Attempts: {attempts}</p>
                <div className="flex gap-4">
                  <button 
                    onClick={initLevel}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-black"
                  >
                    <RefreshCw size={18} /> Retry
                  </button>
                  {gameStatus === 'won' && levelIdx < LEVELS.length - 1 && (
                     <button 
                     onClick={() => {
                       setLevelIdx(l => l + 1);
                       setTimeout(initLevel, 50); // Small delay to ensure state update
                     }}
                     className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                   >
                     Next Level
                   </button>
                  )}
                </div>
              </div>
            )}

            <div className="w-full h-full flex flex-wrap relative">
               {renderGrid()}
            </div>
        </div>
      )}
      
      {isPlaying && (
         <div className="mt-4 text-sm text-gray-500">
           Use Arrow Keys to move. Hitting a wall resets you to start!
         </div>
      )}
    </div>
  );
};

export default InvisibleMazeGame;