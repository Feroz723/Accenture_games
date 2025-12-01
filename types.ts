// Invisible Maze Types
export interface MazeLevel {
  id: number;
  name: string;
  gridSize: number;
  wallCount: number;
  timeLimit?: number; // seconds
}

export interface MazeState {
  playerPos: { r: number; c: number };
  keyPos: { r: number; c: number };
  doorPos: { r: number; c: number };
  walls: Set<string>; // Format "r1,c1-r2,c2"
  revealedWalls: Set<string>;
  hasKey: boolean;
  attempts: number;
  status: 'playing' | 'failed' | 'won' | 'hit';
}

// Path Puzzle Types
export enum Direction {
  Up = 0,
  Right = 1,
  Down = 2,
  Left = 3,
}

export interface TileData {
  id: string;
  r: number;
  c: number;
  connections: boolean[]; // [Up, Right, Down, Left]
  rotation: number; // 0, 90, 180, 270
  isLocked?: boolean;
}

// Bubble Sort Types
export interface BubbleData {
  id: number;
  display: string;
  value: number;
}

export enum BubblePhase {
  Intro = 'Intro',
  PracticeInfo = 'PracticeInfo',
  Practice = 'Practice',
  PracticeEnd = 'PracticeEnd',
  Assessment = 'Assessment',
  Complete = 'Complete',
}