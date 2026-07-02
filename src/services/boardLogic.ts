// Board Logic & Physics Engine for Royal Rescue: Aqua Match

export type TileType = 
  | 'ruby'      // Red gem
  | 'sapphire'  // Blue gem
  | 'emerald'   // Green gem
  | 'amethyst'  // Purple gem
  | 'coin'      // Gold coin (ingredient/matchable)
  | 'valve'     // Valve (drains water)
  | 'boulder';  // Heavy iron boulder (obstacle, unmatchable)

export interface CellState {
  id: string;      // Unique key for CSS animations and list tracking
  type: TileType;  // Active tile type
  algae: boolean;  // Lock blocker (cannot swap tile, must match next to it)
  frozen?: boolean; // Ice blocker (cannot swap tile, match adjacent/directly to crack)
  powerUp?: 'blast_row' | 'blast_col' | 'bomb' | 'lightning'; // Special items
  isNew?: boolean; // Highlight flag
}

export type GridState = (CellState | null)[][]; // 8x8 grid: [row][col]

export interface LevelConfig {
  id: number;
  name: string;
  targetCoins: number;
  initialWaterLevel: number; // 0 to 8 (number of flooded rows from bottom)
  waterRiseRate: number;     // % water rise per second
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
    targetCoins: 15,
    initialWaterLevel: 1, 
    waterRiseRate: 2.2,   
    movesLimit: 25,
    hasAlgae: false,
    hasValves: false,
    algaeCount: 0,
    tutorialText: [
      "Let's save the King! Swap adjacent candies to match 3 or more of the same type.",
      "Earn 1 Coin for each Gold Coin matched directly or collected by matching adjacent candies!",
      "Watch out! Water pours constantly in real-time. Match any candies to drain it slightly!"
    ]
  },
  2: {
    id: 2,
    name: 'The Flooding Chamber',
    targetCoins: 20,
    initialWaterLevel: 2, 
    waterRiseRate: 2.8,
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
    targetCoins: 22,
    initialWaterLevel: 3,
    waterRiseRate: 3.2,
    movesLimit: 28,
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
    waterRiseRate: 3.2,
    movesLimit: 28,
    hasAlgae: true,
    hasValves: false,
    algaeCount: 10,
    tutorialText: [
      "Thick Algae locks candies! Match adjacent candies to clear it, or it will spread to other gems!"
    ]
  },
  5: {
    id: 5,
    name: 'The Frozen Vaults',
    targetCoins: 28,
    initialWaterLevel: 3,
    waterRiseRate: 3.5,
    movesLimit: 26,
    hasAlgae: false,
    hasValves: true,
    algaeCount: 0,
    tutorialText: [
      "Ice Blocks have frozen the vaults! Locked gems cannot be swapped until you match them or clear adjacent blocks!"
    ]
  },
  6: {
    id: 6,
    name: 'The Boulder Barrage',
    targetCoins: 30,
    initialWaterLevel: 4,
    waterRiseRate: 3.8,
    movesLimit: 28,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 8,
    tutorialText: [
      "Heavy Iron Boulders are sinking in! Unmatchable boulders block your path. Match adjacent candies to crush them!"
    ]
  },
  7: {
    id: 7,
    name: 'The Power Depths',
    targetCoins: 35,
    initialWaterLevel: 4,
    waterRiseRate: 4.2,
    movesLimit: 26,
    hasAlgae: false,
    hasValves: true,
    algaeCount: 0,
    tutorialText: [
      "Unleash Power-Ups! Match 4 in a line for Blasters, 5 in T/L for Bombs, or 5 in a line for Lightning!"
    ]
  },
  8: {
    id: 8,
    name: 'The Ultimate Escape',
    targetCoins: 45,
    initialWaterLevel: 4,
    waterRiseRate: 5.0, // Intense rise speed!
    movesLimit: 32,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 10,
    tutorialText: [
      "The final chamber is flooding rapidly! Spreading algae, ice blocks, and heavy boulders block your escape!"
    ]
  }
};

const TILE_TYPES: TileType[] = ['ruby', 'sapphire', 'emerald', 'amethyst'];

export function getRandomTileType(exclude: TileType[] = []): TileType {
  const available = TILE_TYPES.filter(t => !exclude.includes(t));
  return available[Math.floor(Math.random() * available.length)];
}

let idCounter = 0;
export function generateUniqueId(): string {
  idCounter++;
  return `tile_${idCounter}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate starting board based on level config
export function createInitialBoard(level: LevelConfig): GridState {
  const rows = 8;
  const cols = 8;
  const grid: GridState = Array(rows).fill(null).map(() => Array(cols).fill(null));

  // Step 1: Populate grid with random gems, ensuring no matches on start
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const excluded: TileType[] = [];
      if (c >= 2 && grid[r][c-1] && grid[r][c-2] && grid[r][c-1]!.type === grid[r][c-2]!.type) {
        excluded.push(grid[r][c-1]!.type);
      }
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
    while (algaePlaced < level.algaeCount) {
      const r = Math.floor(Math.random() * 5) + 2; // Rows 2 to 6
      const c = Math.floor(Math.random() * 8);
      if (grid[r][c] && !grid[r][c]!.algae) {
        grid[r][c]!.algae = true;
        algaePlaced++;
      }
    }
  }

  // Step 3: Inject Frozen Ice wrappers (Levels 5, 8)
  if (level.id === 5 || level.id === 8) {
    let icePlaced = 0;
    const targetIce = level.id === 8 ? 8 : 10;
    while (icePlaced < targetIce) {
      const r = Math.floor(Math.random() * 4) + 2;
      const c = Math.floor(Math.random() * 6) + 1;
      if (grid[r][c] && !grid[r][c]!.algae && !grid[r][c]!.frozen) {
        grid[r][c]!.frozen = true;
        icePlaced++;
      }
    }
  }

  // Step 4: Inject Heavy Iron Boulders (Levels 6, 8)
  if (level.id === 6 || level.id === 8) {
    let bouldersPlaced = 0;
    const targetBoulders = level.id === 8 ? 4 : 6;
    while (bouldersPlaced < targetBoulders) {
      const r = Math.floor(Math.random() * 3) + 4; // Bottom rows mostly
      const c = Math.floor(Math.random() * 8);
      if (grid[r][c] && !grid[r][c]!.algae && !grid[r][c]!.frozen && grid[r][c]!.type !== 'boulder') {
        grid[r][c]!.type = 'boulder';
        bouldersPlaced++;
      }
    }
  }

  // Step 5: Inject initial special items (Valves and Coins)
  if (level.hasValves) {
    for (let i = 0; i < 2; i++) {
      const r = Math.floor(Math.random() * 4) + 2;
      const c = Math.floor(Math.random() * 8);
      const cell = grid[r][c];
      if (cell && !cell.algae && !cell.frozen && cell.type !== 'boulder' && cell.type !== 'valve') {
        cell.type = 'valve';
      }
    }
  }

  // Inject initial coins
  for (let i = 0; i < 3; i++) {
    const r = Math.floor(Math.random() * 4) + 2;
    const c = Math.floor(Math.random() * 8);
    const cell = grid[r][c];
    if (cell && !cell.algae && !cell.frozen && cell.type !== 'boulder' && cell.type !== 'valve' && cell.type !== 'coin') {
      cell.type = 'coin';
    }
  }

  return grid;
}

export interface PowerUpSpawn {
  r: number;
  c: number;
  type: TileType;
  powerUp: 'blast_row' | 'blast_col' | 'bomb' | 'lightning';
}

// Scans grid for match-3s and handles blaster/bomb special creations, adjacent collections, and algae clears.
export function scanMatches(grid: GridState): { 
  matches: { r: number; c: number }[]; 
  isValveActivated: boolean; 
  coinCountCollected: number;
  powerUpsToSpawn: PowerUpSpawn[];
  crackedIceCoords: { r: number; c: number }[];
} {
  const rows = 8;
  const cols = 8;
  const matchMask = Array(rows).fill(null).map(() => Array(cols).fill(false));
  const horizontalMatchMask = Array(rows).fill(null).map(() => Array(cols).fill(false));
  const verticalMatchMask = Array(rows).fill(null).map(() => Array(cols).fill(false));
  
  let isValveActivated = false;
  let coinCountCollected = 0;
  const powerUpsToSpawn: PowerUpSpawn[] = [];
  const crackedIceCoords: { r: number; c: number }[] = [];

  // Helper to check if tile is matchable (boulders are not matchable!)
  const isMatchable = (r: number, c: number) => {
    const cell = grid[r][c];
    return cell && cell.type !== 'boulder' && cell.type !== 'valve';
  };

  // 1. Horizontal scans
  for (let r = 0; r < rows; r++) {
    let matchLen = 1;
    for (let c = 0; c < cols; c++) {
      const current = grid[r][c];
      const next = c < cols - 1 ? grid[r][c+1] : null;

      if (current && next && current.type === next.type && isMatchable(r, c) && isMatchable(r, c+1)) {
        matchLen++;
      } else {
        if (matchLen >= 3 && current) {
          const startCol = c - matchLen + 1;
          for (let i = startCol; i <= c; i++) {
            matchMask[r][i] = true;
            horizontalMatchMask[r][i] = true;
          }

          // Spawning powerups
          if (matchLen === 4) {
            powerUpsToSpawn.push({
              r,
              c: startCol + 1,
              type: current.type,
              powerUp: 'blast_col' // Horizontal line of 4 creates Column Laser
            });
          } else if (matchLen >= 5) {
            powerUpsToSpawn.push({
              r,
              c: startCol + 2,
              type: current.type,
              powerUp: 'lightning' // Line of 5 creates Lightning
            });
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

      if (current && next && current.type === next.type && isMatchable(r, c) && isMatchable(r+1, c)) {
        matchLen++;
      } else {
        if (matchLen >= 3 && current) {
          const startRow = r - matchLen + 1;
          for (let i = startRow; i <= r; i++) {
            matchMask[i][c] = true;
            verticalMatchMask[i][c] = true;
          }

          // Spawning powerups
          if (matchLen === 4) {
            powerUpsToSpawn.push({
              r: startRow + 1,
              c,
              type: current.type,
              powerUp: 'blast_row' // Vertical line of 4 creates Row Laser
            });
          } else if (matchLen >= 5) {
            powerUpsToSpawn.push({
              r: startRow + 2,
              c,
              type: current.type,
              powerUp: 'lightning'
            });
          }
        }
        matchLen = 1;
      }
    }
  }

  // 3. T/L intersect detections for Dungeon Bombs
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (horizontalMatchMask[r][c] && verticalMatchMask[r][c] && grid[r][c]) {
        // Intersect cell gets turned into a Bomb!
        powerUpsToSpawn.push({
          r,
          c,
          type: grid[r][c]!.type,
          powerUp: 'bomb'
        });
      }
    }
  }

  // 4. POWER-UP EXPLOSIONS (Iterative blast solver)
  const explodedCoords = new Set<string>();
  let newExplosions = true;

  while (newExplosions) {
    newExplosions = false;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const key = `${r}_${c}`;
        if (matchMask[r][c] && grid[r][c]?.powerUp && !explodedCoords.has(key)) {
          explodedCoords.add(key);
          newExplosions = true;
          const power = grid[r][c]!.powerUp;

          if (power === 'blast_row') {
            // Blow entire row r
            for (let i = 0; i < cols; i++) {
              matchMask[r][i] = true;
            }
          } else if (power === 'blast_col') {
            // Blow entire col c
            for (let i = 0; i < rows; i++) {
              matchMask[i][c] = true;
            }
          } else if (power === 'bomb') {
            // Blow 3x3 surrounding zone
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                  matchMask[nr][nc] = true;
                }
              }
            }
          }
        }
      }
    }
  }

  // Compile matched coordinate list
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

  // 5. Adjacent clears (Valves, Boulders, Algae, Ice cracking)
  const adjacentToMatch = (r: number, c: number): boolean => {
    const dirs = [[-1,0], [1,0], [0,-1], [0,1]];
    return dirs.some(([dr, dc]) => {
      const nr = r + dr;
      const nc = c + dc;
      return nr >= 0 && nr < rows && nc >= 0 && nc < cols && matchMask[nr][nc];
    });
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (!cell) continue;

      // Swap locked Algae tiles do not clear directly, but matches adjacent clear them
      // Adjacent matching also clears Algae wrapper blocks
      // We handle Algae clearing in hook resolving.

      // Match next to Valve wheel spins it
      if (cell.type === 'valve' && !matchMask[r][c] && adjacentToMatch(r, c)) {
        isValveActivated = true;
        matchedCoords.push({ r, c });
      }

      // Match next to Coin collects it
      if (cell.type === 'coin' && !matchMask[r][c] && adjacentToMatch(r, c)) {
        coinCountCollected++;
        matchMask[r][c] = true;
        matchedCoords.push({ r, c });
      }

      // Match next to Iron Boulder crushes it
      if (cell.type === 'boulder' && !matchMask[r][c] && adjacentToMatch(r, c)) {
        matchMask[r][c] = true;
        matchedCoords.push({ r, c });
      }

      // Match next to or on Frozen Gem cracks the ice wrapper!
      if (cell.frozen && (matchMask[r][c] || adjacentToMatch(r, c))) {
        crackedIceCoords.push({ r, c });
      }
    }
  }

  return {
    matches: matchedCoords,
    isValveActivated,
    coinCountCollected,
    powerUpsToSpawn,
    crackedIceCoords
  };
}

export function isAdjacent(r1: number, c1: number, r2: number, c2: number): boolean {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

export function swapTiles(grid: GridState, r1: number, c1: number, r2: number, c2: number): GridState | null {
  if (!isAdjacent(r1, c1, r2, c2)) return null;

  const cell1 = grid[r1][c1];
  const cell2 = grid[r2][c2];

  if (!cell1 || !cell2) return null;

  // Locked blocks cannot be manually swapped!
  if (cell1.algae || cell2.algae || cell1.frozen || cell2.frozen) return null;

  const newGrid = grid.map(row => [...row]);
  newGrid[r1][c1] = cell2;
  newGrid[r2][c2] = cell1;

  return newGrid;
}

// Buoyancy and Gravity update loop
// - Wet zone: gravity goes UP (submerged floats up towards water line)
// - Dry zone: gravity goes DOWN (dry drops down towards water line)
// - Iron Boulders: heavy blocks always sink DOWN (defying buoyancy)
export function applyBuoyancyAndGravity(grid: GridState, waterLevelRow: number, config: LevelConfig): { grid: GridState; spawnedCount: number } {
  const rows = 8;
  const cols = 8;
  const newGrid = grid.map(row => [...row]);
  let spawnedCount = 0;

  const spawnNewTile = (): CellState => {
    const roll = Math.random();
    let spawnedType: TileType = getRandomTileType();

    if (roll < 0.12) {
      spawnedType = 'coin';
    } else if (roll < 0.18 && config.hasValves) {
      spawnedType = 'valve';
    } else if (roll < 0.22 && config.id >= 6) {
      spawnedType = 'boulder'; // spawn boulders in high levels
    }

    return {
      id: generateUniqueId(),
      type: spawnedType,
      algae: false,
      isNew: true
    };
  };

  // GRAVITY ENGINE: Column-compaction with algae as fixed blockers
  // Algae cells never move — only free (non-algae) slots compact and refill.
  // Dry zone free slots: pack tiles towards bottom (water line)
  // Wet zone free slots: pack tiles towards top (water line), boulders to bottom

  for (let c = 0; c < cols; c++) {
    // ---- DRY ZONE ----
    if (waterLevelRow > 0) {
      // Identify which rows are locked by algae
      const algaeRows = new Set<number>();
      const freeTiles: CellState[] = [];

      for (let r = 0; r < waterLevelRow; r++) {
        const cell = newGrid[r][c];
        if (cell && cell.algae) {
          algaeRows.add(r); // fixed — never moved
        } else if (cell) {
          freeTiles.push(cell); // moveable tile
        }
        // null = empty free slot (no tile to collect)
      }

      const freeSlotCount = waterLevelRow - algaeRows.size;

      // Spawn new tiles to fill any missing free slots
      while (freeTiles.length < freeSlotCount) {
        freeTiles.unshift(spawnNewTile()); // new tiles enter from the top
        spawnedCount++;
      }

      // Write back: algae stays, free slots get compacted tiles (packed to bottom)
      let tileIdx = 0;
      for (let r = 0; r < waterLevelRow; r++) {
        if (!algaeRows.has(r)) {
          newGrid[r][c] = freeTiles[tileIdx++];
        }
        // algae rows: newGrid[r][c] unchanged
      }
    }

    // ---- WET ZONE ----
    const wetRows = rows - waterLevelRow;
    if (wetRows > 0) {
      const algaeRows = new Set<number>();
      const wetFloaters: CellState[] = [];
      const wetBoulders: CellState[] = [];

      for (let r = waterLevelRow; r < rows; r++) {
        const cell = newGrid[r][c];
        if (cell && cell.algae) {
          algaeRows.add(r); // fixed
        } else if (cell) {
          if (cell.type === 'boulder') {
            wetBoulders.push(cell);
          } else {
            wetFloaters.push(cell);
          }
        }
      }

      const freeSlotCount = wetRows - algaeRows.size;

      // Spawn new floaters to fill missing free slots
      while (wetFloaters.length + wetBoulders.length < freeSlotCount) {
        wetFloaters.unshift(spawnNewTile());
        spawnedCount++;
      }

      // Layout: floaters packed at top of wet zone, boulders sink to bottom
      const wetFree = [...wetFloaters, ...wetBoulders];
      let tileIdx = 0;
      for (let r = waterLevelRow; r < rows; r++) {
        if (!algaeRows.has(r)) {
          newGrid[r][c] = wetFree[tileIdx++];
        }
        // algae rows: newGrid[r][c] unchanged
      }
    }
  }

  return { grid: newGrid, spawnedCount };
}

// Collect boundary coins (same)
export function collectBoundaryCoins(grid: GridState): { grid: GridState; collected: number; coords: { r: number; c: number }[] } {
  const cols = 8;
  const newGrid = grid.map(row => [...row]);
  let collected = 0;
  const coords: { r: number; c: number }[] = [];

  for (let c = 0; c < cols; c++) {
    if (newGrid[0][c]?.type === 'coin') {
      newGrid[0][c] = null;
      collected++;
      coords.push({ r: 0, c });
    }
    if (newGrid[7][c]?.type === 'coin') {
      newGrid[7][c] = null;
      collected++;
      coords.push({ r: 7, c });
    }
  }

  return { grid: newGrid, collected, coords };
}

// Spreads Algae blocker to random neighboring cell
export function spreadAlgae(grid: GridState): GridState {
  const rows = 8;
  const cols = 8;
  const algaeCells: { r: number; c: number }[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (cell && cell.algae) {
        algaeCells.push({ r, c });
      }
    }
  }

  if (algaeCells.length === 0) return grid;

  // Find random neighbors that can be blocked
  const candidates: { r: number; c: number }[] = [];
  const dr = [-1, 1, 0, 0];
  const dc = [0, 0, -1, 1];

  algaeCells.forEach(src => {
    for (let i = 0; i < 4; i++) {
      const nr = src.r + dr[i];
      const nc = src.c + dc[i];
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        const neighbor = grid[nr][nc];
        if (neighbor && !neighbor.algae && neighbor.type !== 'valve' && neighbor.type !== 'boulder' && neighbor.type !== 'coin') {
          candidates.push({ r: nr, c: nc });
        }
      }
    }
  });

  if (candidates.length === 0) return grid;

  const choice = candidates[Math.floor(Math.random() * candidates.length)];
  const newGrid = grid.map(row => [...row]);
  if (newGrid[choice.r][choice.c]) {
    newGrid[choice.r][choice.c] = {
      ...newGrid[choice.r][choice.c]!,
      algae: true
    };
  }

  return newGrid;
}
