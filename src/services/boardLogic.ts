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
  cursed?: boolean; // Cursed blocker (cannot swap tile, match adjacent, clear freezes 2 random gems)
  powerUp?: 'blast_row' | 'blast_col' | 'bomb' | 'lightning' | 'chain_breaker'; // Special items
  shadowVault?: number; // Shadow Vault block health (2 = full, 1 = cracked)
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
  frozenCount?: number;      // Number of frozen gem tiles to inject
  hasCursed?: boolean;       // Support for cursed tiles
  cursedCount?: number;      // Number of cursed tiles to inject
  hasChainBreaker?: boolean; // Support for chain breaker powerups
  hasShadowVault?: boolean;  // Support for shadow vaults
  shadowVaultCount?: number; // Number of shadow vaults to inject
  tutorialText: string[];
}

export const LEVELS: Record<number, LevelConfig> = {
  1: {
    id: 1,
    name: "The King's Discovery",
    targetCoins: 12,
    initialWaterLevel: 1,
    waterRiseRate: 1.8,
    movesLimit: 30,
    hasAlgae: false,
    hasValves: false,
    algaeCount: 0,
    tutorialText: [
      "The castle is flooding. Swap adjacent gems to match 3 or more of the same type — each match slows the water.",
      "Gold coins drift in the flood. Match them directly, or match gems beside them to collect coins.",
      "Collect enough coins before the water reaches the King. Watch the chamber — every move counts."
    ]
  },
  2: {
    id: 2,
    name: 'The First Step',
    targetCoins: 16,
    initialWaterLevel: 2,
    waterRiseRate: 2.2,
    movesLimit: 28,
    hasAlgae: false,
    hasValves: false,
    algaeCount: 0,
    tutorialText: [
      "The flood has split the chamber. Watch the glowing waterline — gems above it fall DOWN, gems below it float UP.",
      "Use the buoyancy to your advantage. Coins drift upward through the water — catch them before they sink back down."
    ]
  },
  3: {
    id: 3,
    name: 'What the Cellars Remember',
    targetCoins: 20,
    initialWaterLevel: 3,
    waterRiseRate: 2.6,
    movesLimit: 28,
    hasAlgae: false,
    hasValves: true,
    algaeCount: 0,
    tutorialText: [
      "The cellar has valves — golden wheels buried in the flood. Match any gem beside a valve to spin it and drain water.",
      "Each valve drains 15% of the water. Find them, match next to them, and keep the memory golden."
    ]
  },
  4: {
    id: 4,
    name: "The Guard's Old Post",
    targetCoins: 22,
    initialWaterLevel: 3,
    waterRiseRate: 2.8,
    movesLimit: 28,
    hasAlgae: true,
    hasValves: false,
    algaeCount: 6,
    tutorialText: [
      "Algae has crept into the cellar — green vines that lock gems in place. You cannot swap a locked gem.",
      "Match any gem beside the algae to clear it. Keep the old post golden — don't let the green take over."
    ]
  },
  5: {
    id: 5,
    name: 'The Mirror Gate',
    targetCoins: 26,
    initialWaterLevel: 3,
    waterRiseRate: 3.2,
    movesLimit: 26,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 8,
    frozenCount: 6,
    tutorialText: [
      "Ice has sealed some gems — a frozen lock you cannot swap through. Match any gem beside the ice to crack it open.",
      "The first dream seal glows ahead. Clear the algae, spin the valves, and shatter the ice. The gate is close."
    ]
  },
  6: {
    id: 6,
    name: 'The Garden Gate',
    targetCoins: 28,
    initialWaterLevel: 3,
    waterRiseRate: 3.0,
    movesLimit: 28,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 6,
    tutorialText: [
      "You step through the first seal into the King's dearest memory — the rose garden where they were wed. Dark algae creeps in from the edges, threatening to consume it.",
      "Match gems beside the algae to clear it. Spin the golden valves to hold back the flood. Keep the garden bright."
    ]
  },
  7: {
    id: 7,
    name: 'The Ceremony Aisle',
    targetCoins: 30,
    initialWaterLevel: 3,
    waterRiseRate: 3.3,
    movesLimit: 26,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 8,
    tutorialText: [
      "The ceremony aisle is thick with rose thorns — algae that has twisted into briars. Clear them by matching adjacent gems.",
      "Bigger matches forge power-ups: match 4 in a line for a Blaster, an L or T shape for a Bomb, 5 in a line for Lightning. Use them to clear the aisle fast."
    ]
  },
  8: {
    id: 8,
    name: 'The Vow Stone',
    targetCoins: 32,
    initialWaterLevel: 3,
    waterRiseRate: 3.6,
    movesLimit: 26,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 10,
    frozenCount: 4,
    tutorialText: [
      "The vow stone is buried — algae and ice have sealed the carved words. You cannot swap a frozen gem; match beside it to crack the stone.",
      "Clear the algae, shatter the ice, and read the vows again before the water swallows them."
    ]
  },
  9: {
    id: 9,
    name: 'The First Dance Gazebo',
    targetCoins: 36,
    initialWaterLevel: 3,
    waterRiseRate: 3.8,
    movesLimit: 25,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 11,
    hasCursed: true,
    cursedCount: 6,
    tutorialText: [
      "The ivy has gone dark — it spreads with each move you don't clear it. Watch it grow and cut it back before it fills the gazebo.",
      "Cursed Tiles are active! Marked with dark energy, you cannot swap them. Match beside to clear them, but beware: clearing a cursed tile instantly freezes two other gems on the board!"
    ]
  },

  // ── Chapter 2 Finale ──────────────────────────────────────
  10: {
    id: 10,
    name: 'The Wedding Seal',
    targetCoins: 40,
    initialWaterLevel: 3,
    waterRiseRate: 4.2,
    movesLimit: 24,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 10,
    frozenCount: 6,
    hasCursed: true,
    cursedCount: 5,
    tutorialText: [
      "The second dream seal pulses at the heart of the garden — guarded by algae, ice, cursed skulls, and rising water all at once.",
      "This is the Chapter 2 Finale. Every obstacle you have encountered is present here. Move carefully, break the curse, and shatter the seal!"
    ]
  },

  // ── Chapter 3 — The Honeymoon Ship (cold theme) ───────────
  11: {
    id: 11,
    name: 'The Harbour Departure',
    targetCoins: 34,
    initialWaterLevel: 2,
    waterRiseRate: 3.2,
    movesLimit: 27,
    hasAlgae: false,
    hasValves: true,
    algaeCount: 0,
    frozenCount: 9,
    tutorialText: [
      "The harbour cobblestones are glazing over. Ice crystals are locking gems in place — you cannot swap a frozen gem; match beside it to crack the ice.",
      "The cold is spreading through the dream. Keep clearing and keep the harbour alive."
    ]
  },
  12: {
    id: 12,
    name: 'Open Waters',
    targetCoins: 38,
    initialWaterLevel: 2,
    waterRiseRate: 3.5,
    movesLimit: 26,
    hasAlgae: false,
    hasValves: true,
    algaeCount: 0,
    frozenCount: 10,
    hasCursed: true,
    cursedCount: 2,
    tutorialText: [
      "The open ocean is freezing over mid-drift, and cursed skull tiles drift in the cold waters.",
      "Work quickly — neither frozen nor cursed tiles can be swapped. Match beside them to crack the ice and lift the curse!"
    ]
  },
  13: {
    id: 13,
    name: 'The Ice Storm',
    targetCoins: 42,
    initialWaterLevel: 3,
    waterRiseRate: 3.8,
    movesLimit: 25,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 5,
    frozenCount: 12,
    hasChainBreaker: true,
    tutorialText: [
      "The storm hits! Cracking 3 or more ice blocks in a single move spawns a Chain Breaker power-up.",
      "Activate the Chain Breaker to instantly shatter ALL frozen blocks on the board! Use it to survive the flood."
    ]
  },
  14: {
    id: 14,
    name: 'Frozen Decks',
    targetCoins: 46,
    initialWaterLevel: 3,
    waterRiseRate: 4.0,
    movesLimit: 24,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 7,
    frozenCount: 14,
    hasCursed: true,
    cursedCount: 3,
    hasChainBreaker: true,
    tutorialText: [
      "The decks are glazed solid. Ice, dark algae, and cursed skulls lock almost every gem in place.",
      "Work strategically — use matches to trigger Chain Breakers, clear the locks, but watch out for the skull curses!"
    ]
  },
  15: {
    id: 15,
    name: 'The Helm Seal',
    targetCoins: 50,
    initialWaterLevel: 3,
    waterRiseRate: 4.4,
    movesLimit: 23,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 8,
    frozenCount: 14,
    hasCursed: true,
    cursedCount: 4,
    hasChainBreaker: true,
    tutorialText: [
      "The third seal is locked in ice at the ship's helm. Ice, algae, cursed skulls, and fast-rising water all stand in your way.",
      "This is the Chapter 3 Finale. Match quickly, unlock the Chain Breakers, clear the curses, and shatter the Helm Seal before you drown!"
    ]
  },

  // ── Chapter 4 — The Nightmare (dark theme) ────────────────
  16: {
    id: 16,
    name: 'The First Shadow',
    targetCoins: 44,
    initialWaterLevel: 3,
    waterRiseRate: 3.9,
    movesLimit: 25,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 10,
    frozenCount: 6,
    hasCursed: true,
    cursedCount: 3,
    tutorialText: [
      "The dream has turned dark. The sorcerer's influence is everywhere — algae grows faster and the light is failing.",
      "Stay calm. The rules have not changed. Watch out for ice, dark algae, and cursed skulls in the shadows!"
    ]
  },
  17: {
    id: 17,
    name: "The Sorcerer's Mark",
    targetCoins: 48,
    initialWaterLevel: 3,
    waterRiseRate: 4.1,
    movesLimit: 25,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 8,
    frozenCount: 6,
    hasShadowVault: true,
    shadowVaultCount: 4,
    tutorialText: [
      "The Sorcerer's Mark has materialized as dark Shadow Vaults. These immovable obsidian blocks absorb matches.",
      "It takes two adjacent matches (or power-up hits) to shatter them. Shattering them opens the board and awards score bonuses!"
    ]
  },
  18: {
    id: 18,
    name: 'Shattered Palace',
    targetCoins: 52,
    initialWaterLevel: 3,
    waterRiseRate: 4.3,
    movesLimit: 24,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 8,
    frozenCount: 10,
    hasCursed: true,
    cursedCount: 4,
    hasShadowVault: true,
    shadowVaultCount: 6,
    tutorialText: [
      "The palace is collapsing. Clustered Shadow Vaults and cursed skull tiles block the bottom of the board where gems fall.",
      "Clear these obstacles quickly to keep the board sliding, or you will run out of matches!"
    ]
  },
  19: {
    id: 19,
    name: 'The Dark Mirror',
    targetCoins: 56,
    initialWaterLevel: 3,
    waterRiseRate: 4.5,
    movesLimit: 24,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 10,
    frozenCount: 12,
    hasCursed: true,
    cursedCount: 4,
    hasShadowVault: true,
    shadowVaultCount: 4,
    tutorialText: [
      "In the dark mirror, the flood rises rapidly. Dark algae, ice, cursed skulls, and shadow vaults lock the board down.",
      "The false king blocks every path. Match special items and combine power-ups to sweep the board clean!"
    ]
  },
  20: {
    id: 20,
    name: 'The Nightmare Seal',
    targetCoins: 60,
    initialWaterLevel: 3,
    waterRiseRate: 4.8,
    movesLimit: 21,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 12,
    frozenCount: 14,
    hasCursed: true,
    cursedCount: 4,
    hasShadowVault: true,
    shadowVaultCount: 5,
    hasChainBreaker: true,
    tutorialText: [
      "The fourth seal is locked deep in the Nightmare. Fast-rising water, shadow vaults, ice, algae, and cursed skulls block all paths.",
      "This is the Chapter 4 Climax. Unlock the Chain Breakers, clear the curses, shatter the vaults, and shatter the Nightmare Seal!"
    ]
  },

  // ── Chapter 5 — The First Battle (battle theme) ───────────
  21: {
    id: 21,
    name: 'Before the Battle',
    targetCoins: 38,
    initialWaterLevel: 2,
    waterRiseRate: 4.2,
    movesLimit: 27,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 8,
    frozenCount: 6,
    tutorialText: [
      "The battle memory blazes with energy — heavy obstacles block the board like a fortress wall.",
      "Bigger matches pay off here. Match 4 in a row for a Blaster, an L or T for a Bomb. Save them for tight spots."
    ]
  },
  22: {
    id: 22,
    name: 'The Siege',
    targetCoins: 42,
    initialWaterLevel: 3,
    waterRiseRate: 4.4,
    movesLimit: 26,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 10,
    frozenCount: 8,
    tutorialText: [
      "The siege is relentless. Explosions chain across the board — use Bomb and Blaster power-ups together to clear wide.",
      "The water rises fast here. Don't save power-ups — use them as soon as you have them."
    ]
  },
  23: {
    id: 23,
    name: 'Side by Side',
    targetCoins: 45,
    initialWaterLevel: 3,
    waterRiseRate: 4.6,
    movesLimit: 25,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 10,
    frozenCount: 10,
    tutorialText: [
      "Lightning flashed that day — and it flashes now. A 5-in-a-row match creates Lightning that clears an entire row and column.",
      "Build toward Lightning matches to cut through the ice and algae at once."
    ]
  },
  24: {
    id: 24,
    name: 'The Victory Feast',
    targetCoins: 52,
    initialWaterLevel: 2,
    waterRiseRate: 4.2,
    movesLimit: 28,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 6,
    frozenCount: 6,
    tutorialText: [
      "The victory feast — coins tumble across the board in abundance. This is a moment of triumph.",
      "The water still rises, but the board is rich. Match coins directly and match gems beside them to sweep them all in."
    ]
  },
  25: {
    id: 25,
    name: 'The Battle Seal',
    targetCoins: 50,
    initialWaterLevel: 3,
    waterRiseRate: 5.0,
    movesLimit: 24,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 12,
    frozenCount: 14,
    tutorialText: [
      "The fifth seal hides behind a wall of boulders and ice — the sorcerer's last defensive line in the battle memory.",
      "Bring everything down with power-ups. Only one seal remains after this one."
    ]
  },

  // ── Chapter 6 — The Awakening (ethereal theme) ────────────
  26: {
    id: 26,
    name: 'The Deep Dream',
    targetCoins: 44,
    initialWaterLevel: 3,
    waterRiseRate: 4.8,
    movesLimit: 26,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 12,
    frozenCount: 12,
    tutorialText: [
      "You are deeper inside the dream than anyone has ever gone. Everything glows — even the obstacles are beautiful here.",
      "The rules are the same. The stakes are higher. She is close."
    ]
  },
  27: {
    id: 27,
    name: 'Her Voice Returns',
    targetCoins: 48,
    initialWaterLevel: 3,
    waterRiseRate: 5.0,
    movesLimit: 25,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 12,
    frozenCount: 14,
    tutorialText: [
      "Her voice is clear for the first time — not a whisper, but certain and close. The board shakes with the weight of her presence.",
      "Keep matching. Keep draining. She is waiting at the final door."
    ]
  },
  28: {
    id: 28,
    name: 'The Weaving of Memories',
    targetCoins: 52,
    initialWaterLevel: 3,
    waterRiseRate: 5.2,
    movesLimit: 25,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 14,
    frozenCount: 14,
    tutorialText: [
      "All her memories converge here — rose garden, frozen ship, battle, golden cellars — woven into one vast, flooding board.",
      "Every obstacle you have faced returns. Honour each one. This is her entire life."
    ]
  },
  29: {
    id: 29,
    name: "The Sorcerer's Last Hold",
    targetCoins: 56,
    initialWaterLevel: 3,
    waterRiseRate: 5.5,
    movesLimit: 24,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 16,
    frozenCount: 16,
    tutorialText: [
      "The sorcerer's final trap — every obstacle at maximum, water rising faster than it ever has. He built this to stop you.",
      "You have walked through every room in his hell. Break the last block. The final seal is waiting."
    ]
  },
  30: {
    id: 30,
    name: 'The Awakening',
    targetCoins: 60,
    initialWaterLevel: 2,
    waterRiseRate: 5.8,
    movesLimit: 26,
    hasAlgae: true,
    hasValves: true,
    algaeCount: 16,
    frozenCount: 16,
    tutorialText: [
      "One board. One seal. Every level, every memory, every whispered word has led to this.",
      "Drain the last of the water. Place your hand on the seal. Open her eyes."
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
        algae: false,
        cursed: false
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

  // Step 3: Inject Frozen Ice wrappers (driven by frozenCount field)
  if (level.frozenCount && level.frozenCount > 0) {
    let icePlaced = 0;
    while (icePlaced < level.frozenCount) {
      const r = Math.floor(Math.random() * 4) + 2;
      const c = Math.floor(Math.random() * 6) + 1;
      if (grid[r][c] && !grid[r][c]!.algae && !grid[r][c]!.frozen) {
        grid[r][c]!.frozen = true;
        icePlaced++;
      }
    }
  }

  // Step 3.5: Inject Cursed tiles (driven by cursedCount field)
  if (level.hasCursed && level.cursedCount && level.cursedCount > 0) {
    let cursedPlaced = 0;
    while (cursedPlaced < level.cursedCount) {
      const r = Math.floor(Math.random() * 4) + 2;
      const c = Math.floor(Math.random() * 8);
      if (grid[r][c] && !grid[r][c]!.algae && !grid[r][c]!.frozen && !grid[r][c]!.cursed) {
        grid[r][c]!.cursed = true;
        cursedPlaced++;
      }
    }
  }

  // Step 3.8: Inject Shadow Vaults (driven by shadowVaultCount field)
  if (level.hasShadowVault && level.shadowVaultCount && level.shadowVaultCount > 0) {
    let vaultsPlaced = 0;
    while (vaultsPlaced < level.shadowVaultCount) {
      const r = Math.floor(Math.random() * 4) + 2;
      const c = Math.floor(Math.random() * 8);
      const cell = grid[r][c];
      if (cell && !cell.algae && !cell.frozen && !cell.cursed && !cell.shadowVault) {
        cell.shadowVault = 2; // Full health (2 hits)
        vaultsPlaced++;
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

  // Step 6: Inject initial Chain Breaker powerups
  if (level.hasChainBreaker) {
    let placed = 0;
    while (placed < 2) {
      const r = Math.floor(Math.random() * 4) + 2;
      const c = Math.floor(Math.random() * 8);
      const cell = grid[r][c];
      if (cell && !cell.algae && !cell.frozen && cell.type !== 'boulder' && cell.type !== 'valve' && cell.type !== 'coin' && !cell.powerUp) {
        cell.powerUp = 'chain_breaker';
        placed++;
      }
    }
  }

  return grid;
}

export interface PowerUpSpawn {
  r: number;
  c: number;
  type: TileType;
  powerUp: 'blast_row' | 'blast_col' | 'bomb' | 'lightning' | 'chain_breaker';
}

// Scans grid for match-3s and handles blaster/bomb special creations, adjacent collections, and algae clears.
export function scanMatches(grid: GridState): { 
  matches: { r: number; c: number }[]; 
  isValveActivated: boolean; 
  coinCountCollected: number;
  powerUpsToSpawn: PowerUpSpawn[];
  crackedIceCoords: { r: number; c: number }[];
  clearedAlgaeCoords: { r: number; c: number }[];
  clearedCursedCoords: { r: number; c: number }[];
  damagedShadowVaults: { r: number; c: number }[];
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
  const clearedAlgaeCoords: { r: number; c: number }[] = [];
  const clearedCursedCoords: { r: number; c: number }[] = [];
  const damagedShadowVaults: { r: number; c: number }[] = [];

  // Helper to check if tile is matchable (boulders are not matchable!)
  const isMatchable = (r: number, c: number) => {
    const cell = grid[r][c];
    return cell && cell.type !== 'boulder' && cell.type !== 'valve' && !cell.shadowVault;
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

  // 3.5 Adjacent power-up activation: a match next to a power-up tile (any direction) triggers it
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (cell?.powerUp && !matchMask[r][c]) {
        const dirs: [number, number][] = [[-1,0],[1,0],[0,-1],[0,1]];
        const isNextToMatch = dirs.some(([dr, dc]) => {
          const nr = r + dr;
          const nc = c + dc;
          return nr >= 0 && nr < rows && nc >= 0 && nc < cols && matchMask[nr][nc];
        });
        if (isNextToMatch) {
          matchMask[r][c] = true;
        }
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
          } else if (power === 'chain_breaker') {
            // Shatter ALL frozen tiles on the board instantly!
            for (let ir = 0; ir < rows; ir++) {
              for (let ic = 0; ic < cols; ic++) {
                if (grid[ir][ic]?.frozen) {
                  matchMask[ir][ic] = true;
                  crackedIceCoords.push({ r: ir, c: ic });
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

      // Match next to or on Algae clears the algae lock
      if (cell.algae && (matchMask[r][c] || adjacentToMatch(r, c))) {
        clearedAlgaeCoords.push({ r, c });
      }

      // Match next to or on Cursed Gem clears the curse
      if (cell.cursed && (matchMask[r][c] || adjacentToMatch(r, c))) {
        clearedCursedCoords.push({ r, c });
      }

      // Match next to or on Shadow Vault damages it
      if (cell.shadowVault && (matchMask[r][c] || adjacentToMatch(r, c))) {
        damagedShadowVaults.push({ r, c });
      }
    }
  }

  if (crackedIceCoords.length >= 3) {
    const firstIce = crackedIceCoords[0];
    const alreadySpawning = powerUpsToSpawn.some(p => p.r === firstIce.r && p.c === firstIce.c);
    if (!alreadySpawning) {
      powerUpsToSpawn.push({
        r: firstIce.r,
        c: firstIce.c,
        type: grid[firstIce.r][firstIce.c]?.type || 'ruby',
        powerUp: 'chain_breaker'
      });
    }
  }

  return {
    matches: matchedCoords,
    isValveActivated,
    coinCountCollected,
    powerUpsToSpawn,
    crackedIceCoords,
    clearedAlgaeCoords,
    clearedCursedCoords,
    damagedShadowVaults
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
  if (cell1.algae || cell2.algae || cell1.frozen || cell2.frozen || cell1.cursed || cell2.cursed || cell1.shadowVault || cell2.shadowVault) return null;

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
        if (cell && (cell.algae || cell.cursed || cell.shadowVault)) {
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
        if (cell && (cell.algae || cell.cursed || cell.shadowVault)) {
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
