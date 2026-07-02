// Board Logic & Physics Engine for Royal Rescue: Aqua Match

export type TileType = 
  | 'ruby'   // Red gem
  | 'sapphire' // Blue gem
  | 'emerald'  // Green gem
  | 'amethyst' // Purple gem
  | 'coin'     // Gold coin (ingredient/matchable)
  | 'valve';   // Valve (drains water)

export interface CellState {
  id: string;      // Unique key for CSS animations and list tracking
  type: TileType;  // Active tile type
  algae: boolean;  // Lock blocker (cannot swap tile, must match next to it)
  isNew?: boolean; // Highlight flag
}

export type GridState = (CellState | null)[][]; // 8x8 grid: [row][col]

export interface LevelConfig {
  id: number;
  name: string;
  targetCoins: number;
  initialWaterLevel: number; // 0 to 8 (number of flooded rows from bottom)
  waterRiseRate: number;     // % water rise per turn (e.g. 3)
  movesLimit: number;
  hasAlgae: boolean;
  hasValves: boolean;
  algaeCount: number;
  tutorialText: string[];
}

export const LEVELS: Record<number, LevelConfig> = {
  1: {
    id: 1,
    name: 'The Dungeon Cellar',
    targetCoins: 12,
    initialWaterLevel: 1, // Only 1 row flooded
    waterRiseRate: 2,     // 2% rise per move
    movesLimit: 25,
    hasAlgae: false,
    hasValves: false,
    algaeCount: 0,
    tutorialText: [
      "Let's save the King! Swap adjacent candies to match 3 or more of the same type.",
      "Earn 1 Coin for each Gold Coin matched directly or collected by matching adjacent candies!",
      "Watch the water level! It rises after every move. Save him before the water fills the chamber."
    ]
  },
  2: {
    id: 2,
    name: 'The Flooding Chamber',
    targetCoins: 20,
    initialWaterLevel: 3, // 3 rows flooded
    waterRiseRate: 3,     // 3% rise per move
    movesLimit: 28,
    hasAlgae: false,
    hasValves: false,
    algaeCount: 0,
    tutorialText: [
      "High tide has reached the grid! Above this blue line, candies fall DOWN. Below it, candies float UPWARDS!"
    ]
  },
  3: {
    id: 3,
    name: 'The Rusty Valves',
    targetCoins: 25,
    initialWaterLevel: 4,
    waterRiseRate: 4,
    movesLimit: 30,
    hasAlgae: false,
    hasValves: true,
    algaeCount: 0,
    tutorialText: [
      "Valves are now active! Match candies next to a Valve to spin it and drain water level by 15%!"
    ]
  },
  4: {
    id: 4,
    name: 'The Algae Garden',
    targetCoins: 25,
    initialWaterLevel: 3,
    waterRiseRate: 3,
    movesLimit: 32,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 12,
    tutorialText: [
      "Thick Algae locks candies! Algae tiles cannot be swapped until you match candies next to them!"
    ]
  },
  5: {
    id: 5,
    name: 'The Deep Escape',
    targetCoins: 35,
    initialWaterLevel: 5,
    waterRiseRate: 5, // Fast rise!
    movesLimit: 30,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 16,
    tutorialText: [
      "This is the final chamber! The water rises extremely fast here (5% per turn). Rescue the King!"
    ]
  }
};

const TILE_TYPES: TileType[] = ['ruby', 'sapphire', 'emerald', 'amethyst'];

// Generate a random tile type excluding coins and valves by default
export function getRandomTileType(exclude: TileType[] = []): TileType {
  const available = TILE_TYPES.filter(t => !exclude.includes(t));
  return available[Math.floor(Math.random() * available.length)];
}

// Generate a unique ID for React list key tracking
let idCounter = 0;
export function generateUniqueId(): string {
  idCounter++;
  return `tile_${idCounter}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate a new board state for a level configuration
export function createInitialBoard(level: LevelConfig): GridState {
  const rows = 8;
  const cols = 8;
  const grid: GridState = Array(rows).fill(null).map(() => Array(cols).fill(null));

  // Step 1: Populate grid with random gems, ensuring no match-3s on start
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const excluded: TileType[] = [];
      
      // Check left
      if (c >= 2 && grid[r][c-1] && grid[r][c-2] && grid[r][c-1]!.type === grid[r][c-2]!.type) {
        excluded.push(grid[r][c-1]!.type);
      }
      // Check top
      if (r >= 2 && grid[r-1][c] && grid[r-2][c] && grid[r-1][c]!.type === grid[r-2][c]!.type) {
        excluded.push(grid[r-1][c]!.type);
      }

      grid[r][c] = {
        id: generateUniqueId(),
        type: getRandomTileType(excluded),
        algae: false
      };
    }
  }

  // Step 2: Inject Level Obstacles (Algae)
  if (level.hasAlgae) {
    let algaePlaced = 0;
    // Distribute algae mostly in the center/middle rows for maximum impact
    while (algaePlaced < level.algaeCount) {
      const r = Math.floor(Math.random() * 6) + 1; // rows 1 to 6
      const c = Math.floor(Math.random() * 8);      // any col
      if (grid[r][c] && !grid[r][c]!.algae) {
        grid[r][c]!.algae = true;
        algaePlaced++;
      }
    }
  }

  // Step 3: Inject initial special items (Valves and Coins)
  if (level.hasValves) {
    // Inject 2-3 initial valves
    for (let i = 0; i < 3; i++) {
      const r = Math.floor(Math.random() * 6) + 1;
      const c = Math.floor(Math.random() * 8);
      if (grid[r][c] && !grid[r][c]!.algae && grid[r][c]!.type !== 'valve') {
        grid[r][c]!.type = 'valve';
      }
    }
  }

  // Inject 2-3 initial coins
  for (let i = 0; i < 3; i++) {
    const r = Math.floor(Math.random() * 6) + 1;
    const c = Math.floor(Math.random() * 8);
    if (grid[r][c] && !grid[r][c]!.algae && grid[r][c]!.type !== 'valve' && grid[r][c]!.type !== 'coin') {
      grid[r][c]!.type = 'coin';
    }
  }

  return grid;
}

// Scan the grid for any match-3s or special collects.
// Returns an array of matched cell coordinates {r, c}.
export function scanMatches(grid: GridState): { matches: { r: number; c: number }[]; isValveActivated: boolean; coinCountCollected: number } {
  const rows = 8;
  const cols = 8;
  const matchMask = Array(rows).fill(null).map(() => Array(cols).fill(false));
  let isValveActivated = false;
  let coinCountCollected = 0;

  // 1. Horizontal scans
  for (let r = 0; r < rows; r++) {
    let matchLen = 1;
    
    for (let c = 0; c < cols; c++) {
      const current = grid[r][c];
      const next = c < cols - 1 ? grid[r][c+1] : null;

      if (current && next && current.type === next.type) {
        matchLen++;
      } else {
        if (matchLen >= 3 && current) {
          // Mark all in match
          for (let i = c - matchLen + 1; i <= c; i++) {
            matchMask[r][i] = true;
          }
        }
        matchLen = 1;
      }
    }
  }

  // 2. Vertical scans
  for (let c = 0; c < cols; c++) {
    let matchLen = 1;
    for (let r = 0; r < rows; r++) {
      const current = grid[r][c];
      const next = r < rows - 1 ? grid[r+1][c] : null;

      if (current && next && current.type === next.type) {
        matchLen++;
      } else {
        if (matchLen >= 3 && current) {
          for (let i = r - matchLen + 1; i <= r; i++) {
            matchMask[i][c] = true;
          }
        }
        matchLen = 1;
      }
    }
  }

  // Compile list of matching coordinates
  const matchedCoords: { r: number; c: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (matchMask[r][c]) {
        matchedCoords.push({ r, c });
        if (grid[r][c]?.type === 'valve') isValveActivated = true;
        if (grid[r][c]?.type === 'coin') coinCountCollected++;
      }
    }
  }

  // 3. Scan for adjacent activations (Valves & Algae)
  // If there's a match next to a Valve, activate it.
  // If there's a match next to Algae, clear the algae wrapper.
  const adjacentToMatch = (r: number, c: number): boolean => {
    const dirs = [[-1,0], [1,0], [0,-1], [0,1]];
    return dirs.some(([dr, dc]) => {
      const nr = r + dr;
      const nc = c + dc;
      return nr >= 0 && nr < rows && nc >= 0 && nc < cols && matchMask[nr][nc];
    });
  };

  const algaeToClear: { r: number; c: number }[] = [];
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (!cell) continue;

      // Match next to Valve activates it
      if (cell.type === 'valve' && !matchMask[r][c] && adjacentToMatch(r, c)) {
        isValveActivated = true;
        // Also clear it so player gets points/visual satisfaction
        matchedCoords.push({ r, c });
      }

      // Match next to Coin collects it
      if (cell.type === 'coin' && !matchMask[r][c] && adjacentToMatch(r, c)) {
        coinCountCollected++;
        matchMask[r][c] = true;
        matchedCoords.push({ r, c });
      }

      // Match next to Algae clears the algae block
      if (cell.algae && (matchMask[r][c] || adjacentToMatch(r, c))) {
        algaeToClear.push({ r, c });
      }
    }
  }

  return {
    matches: matchedCoords,
    isValveActivated,
    coinCountCollected
  };
}

// Check if two cells are adjacent (distance of exactly 1 in cardinal directions)
export function isAdjacent(r1: number, c1: number, r2: number, c2: number): boolean {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

// Swap two cells, validating adjacency and lock state (algae blocks swaps)
export function swapTiles(grid: GridState, r1: number, c1: number, r2: number, c2: number): GridState | null {
  if (!isAdjacent(r1, c1, r2, c2)) return null;

  const cell1 = grid[r1][c1];
  const cell2 = grid[r2][c2];

  // Cannot swap empty cells or cells locked by algae
  if (!cell1 || !cell2 || cell1.algae || cell2.algae) return null;

  // Clone grid and swap
  const newGrid = grid.map(row => [...row]);
  newGrid[r1][c1] = cell2;
  newGrid[r2][c2] = cell1;

  return newGrid;
}

// Buoyancy and Gravity update loop!
// - waterLevelRow is the row index where water starts (0 to 8).
// - Wet Zone: Rows >= waterLevelRow. Gravity goes UP (tiles float to waterLevelRow).
// - Dry Zone: Rows < waterLevelRow. Gravity goes DOWN (tiles fall to waterLevelRow - 1).
export function applyBuoyancyAndGravity(grid: GridState, waterLevelRow: number, hasValves: boolean): { grid: GridState; spawnedCount: number } {
  const rows = 8;
  const cols = 8;
  const newGrid = grid.map(row => [...row]);
  let spawnedCount = 0;

  // Let's sweep column by column
  for (let c = 0; c < cols; c++) {
    // ----------------------------------------------------
    // 1. UPDATE DRY ZONE (Rows 0 to waterLevelRow - 1)
    // Gravity pulls DOWN towards waterLevelRow - 1
    // ----------------------------------------------------
    const dryMaxRow = waterLevelRow - 1;
    if (dryMaxRow >= 0) {
      // Fall logic: scan from dryMaxRow down to 0
      for (let r = dryMaxRow; r >= 0; r--) {
        if (newGrid[r][c] === null) {
          // Find the first non-null tile ABOVE r
          let foundRow = -1;
          for (let checkR = r - 1; checkR >= 0; checkR--) {
            // Tiles locked by algae cannot fall!
            if (newGrid[checkR][c] !== null && !newGrid[checkR][c]!.algae) {
              foundRow = checkR;
              break;
            }
          }

          if (foundRow !== -1) {
            // Slide tile down
            newGrid[r][c] = newGrid[foundRow][c];
            newGrid[foundRow][c] = null;
          } else {
            // No tile found above. Spawn a new tile falling from the top (row 0)
            const roll = Math.random();
            let spawnedType: TileType = getRandomTileType();
            
            // Randomly spawn coins (10% chance) or valves (5% chance)
            if (roll < 0.12) {
              spawnedType = 'coin';
            } else if (roll < 0.18 && hasValves) {
              spawnedType = 'valve';
            }

            newGrid[r][c] = {
              id: generateUniqueId(),
              type: spawnedType,
              algae: false,
              isNew: true
            };
            spawnedCount++;
          }
        }
      }
    }

    // ----------------------------------------------------
    // 2. UPDATE WET ZONE (Rows waterLevelRow to 7)
    // Buoyancy pushes UP towards waterLevelRow
    // ----------------------------------------------------
    if (waterLevelRow < rows) {
      // Float logic: scan from waterLevelRow up to 7
      for (let r = waterLevelRow; r < rows; r++) {
        if (newGrid[r][c] === null) {
          // Find the first non-null tile BELOW r
          let foundRow = -1;
          for (let checkR = r + 1; checkR < rows; checkR++) {
            // Tiles locked by algae cannot float!
            if (newGrid[checkR][c] !== null && !newGrid[checkR][c]!.algae) {
              foundRow = checkR;
              break;
            }
          }

          if (foundRow !== -1) {
            // Float tile up
            newGrid[r][c] = newGrid[foundRow][c];
            newGrid[foundRow][c] = null;
          } else {
            // No tile found below. Spawn a new tile floating up from the bottom (row 7)
            const roll = Math.random();
            let spawnedType: TileType = getRandomTileType();

            if (roll < 0.12) {
              spawnedType = 'coin';
            } else if (roll < 0.18 && hasValves) {
              spawnedType = 'valve';
            }

            newGrid[r][c] = {
              id: generateUniqueId(),
              type: spawnedType,
              algae: false,
              isNew: true
            };
            spawnedCount++;
          }
        }
      }
    }
  }

  return { grid: newGrid, spawnedCount };
}

// Scan for automatic coin collection at outer boundaries
// Coins reaching top of grid (row 0) or bottom of grid (row 7) get automatically sucked out
export function collectBoundaryCoins(grid: GridState): { grid: GridState; collected: number; coords: { r: number; c: number }[] } {
  const cols = 8;
  const newGrid = grid.map(row => [...row]);
  let collected = 0;
  const coords: { r: number; c: number }[] = [];

  for (let c = 0; c < cols; c++) {
    // Check top boundary (row 0)
    if (newGrid[0][c]?.type === 'coin') {
      newGrid[0][c] = null;
      collected++;
      coords.push({ r: 0, c });
    }
    // Check bottom boundary (row 7)
    if (newGrid[7][c]?.type === 'coin') {
      newGrid[7][c] = null;
      collected++;
      coords.push({ r: 7, c });
    }
  }

  return { grid: newGrid, collected, coords };
}
