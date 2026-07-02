// Custom React Hook for Game State Management
import { useState, useRef, useEffect } from 'react';
import type { GridState, LevelConfig, TileType } from '../services/boardLogic';
import { 
  LEVELS, 
  createInitialBoard, 
  scanMatches, 
  swapTiles, 
  applyBuoyancyAndGravity, 
  isAdjacent
} from '../services/boardLogic';
import { gameAudio } from '../services/audio';

export function useGameState() {
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [levelConfig, setLevelConfig] = useState<LevelConfig>(LEVELS[1]);
  const [grid, setGrid] = useState<GridState>([]);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [waterLevel, setWaterLevel] = useState(0); // 0 to 100 %
  const [movesRemaining, setMovesRemaining] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'tutorial' | 'gameover' | 'escaping' | 'victory'>('menu');
  const [activeTutorialIndex, setActiveTutorialIndex] = useState(0);
  const [selectedTile, setSelectedTile] = useState<{ r: number; c: number } | null>(null);
  const [isBoardLocked, setIsBoardLocked] = useState(false);
  const [highestLevelUnlocked, setHighestLevelUnlocked] = useState(1);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [floatingCoins, setFloatingCoins] = useState<{ id: string; r: number; c: number; value: number }[]>([]);
  const [brokenTiles, setBrokenTiles] = useState<{ id: string; r: number; c: number; type: TileType }[]>([]);

  // Keep references to prevent closure stale state in async intervals
  const gridRef = useRef<GridState>([]);
  gridRef.current = grid;
  const isBoardLockedRef = useRef(isBoardLocked);
  isBoardLockedRef.current = isBoardLocked;

  // Cache water level index for buoyancy calculations
  // 0% water = row 8 (none), 100% water = row 0 (all)
  const getWaterLevelRow = (pct: number) => {
    return Math.max(0, 8 - Math.floor(pct / 12.5));
  };

  const waterLevelRow = getWaterLevelRow(waterLevel);

  // Set up constant real-time water rise
  useEffect(() => {
    if (gameState !== 'playing') return;

    const riseInterval = setInterval(() => {
      setWaterLevel(prevWater => {
        // Constantly pour water based on levelConfig rise rate
        const riseAmt = levelConfig.waterRiseRate / 2.5; // percent per second
        const nextWater = Math.min(100, prevWater + riseAmt);

        if (nextWater >= 80 && nextWater < 100 && prevWater < 80) {
          gameAudio.playDangerAlarm();
        }

        if (nextWater >= 100) {
          setGameState('gameover');
          gameAudio.playDefeat();
          clearInterval(riseInterval);
        }

        return nextWater;
      });
    }, 1000);

    return () => clearInterval(riseInterval);
  }, [gameState, levelConfig]);

  // Initialize level selection
  const selectLevel = (levelId: number) => {
    if (levelId > highestLevelUnlocked) return;
    const config = LEVELS[levelId];
    setCurrentLevelId(levelId);
    setLevelConfig(config);
    setCoinsCollected(0);
    setWaterLevel(config.initialWaterLevel * 12.5); // Convert rows to percentage
    setMovesRemaining(config.movesLimit);
    setScore(0);
    setSelectedTile(null);
    setIsBoardLocked(false);
    
    const initialGrid = createInitialBoard(config);
    setGrid(initialGrid);

    // Enter tutorial mode
    setGameState('tutorial');
    setActiveTutorialIndex(0);
  };

  // Toggle sound
  const toggleSound = () => {
    const nextState = gameAudio.toggle();
    setIsSoundEnabled(nextState);
  };

  // Start the level after tutorial
  const startLevel = () => {
    setGameState('playing');
  };

  // Check game over conditions
  const checkWinLoss = (coins: number, water: number, moves: number) => {
    if (coins >= levelConfig.targetCoins) {
      setGameState('escaping'); // Transition to escaping animation first!
      gameAudio.playVictory();
      
      // Smoothly drain water down to 0% so it flows out of the escape door!
      const drainInterval = setInterval(() => {
        setWaterLevel(prev => {
          if (prev <= 0) {
            clearInterval(drainInterval);
            return 0;
          }
          return Math.max(0, prev - 6);
        });
      }, 35);

      if (currentLevelId === highestLevelUnlocked && currentLevelId < 5) {
        setHighestLevelUnlocked(prev => prev + 1);
      }

      // Wait 2.5 seconds for the escape animation to finish before showing the victory card popup
      setTimeout(() => {
        setGameState('victory');
      }, 2500);

      return true;
    }

    if (water >= 100 || moves <= 0) {
      setGameState('gameover');
      gameAudio.playDefeat();
      return true;
    }

    return false;
  };

  // Cascade match resolution logic
  const runMatchCascade = async (wasManualSwap = false, prevSwapCoords?: { r1: number; c1: number; r2: number; c2: number }) => {
    setIsBoardLocked(true);
    let currentGrid = gridRef.current.map(row => [...row]);
    let combo = 0;
    let keepResolving = true;
    let coinsEarnedThisTurn = 0;

    // We store whether we should swap back if no matches occur on the initial manual swap
    let hasMatchedAnythingOnFirstPass = false;

    while (keepResolving) {
      // 1. Scan for matches
      const { matches, isValveActivated, coinCountCollected } = scanMatches(currentGrid);

      if (matches.length > 0) {
        hasMatchedAnythingOnFirstPass = true;
        combo++;
        
        // Accumulate coins: only Gold Coin tiles award coins!
        let coinsThisMatch = 0;
        const coinsToAnimate: { id: string; r: number; c: number; value: number }[] = [];
        matches.forEach(({ r, c }) => {
          const tile = currentGrid[r][c];
          if (tile && tile.type === 'coin') {
            const val = 1; // 1 coin per matched gold coin tile
            coinsThisMatch += val;
            coinsToAnimate.push({
              id: `coin_${r}_${c}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              r,
              c,
              value: val
            });
          }
        });
        coinsEarnedThisTurn += coinsThisMatch;

        if (coinsToAnimate.length > 0) {
          setFloatingCoins(prev => [...prev, ...coinsToAnimate]);
          coinsToAnimate.forEach(c => {
            setTimeout(() => {
              setFloatingCoins(prev => prev.filter(fc => fc.id !== c.id));
            }, 850);
          });
        }

        // Play matching sound
        if (coinCountCollected > 0) {
          gameAudio.playCoin();
        } else if (isValveActivated) {
          gameAudio.playValve();
        } else {
          gameAudio.playMatch(combo);
        }

        // Apply candy match water drainage: match combo drains water slightly!
        const matchDrain = 3.0 * combo;
        setWaterLevel(prev => Math.max(0, prev - matchDrain));

        // Apply Valve water drainage
        if (isValveActivated) {
          setWaterLevel(prev => Math.max(0, prev - 15));
        }

        // Track broken tiles for cascade match shard explosions!
        const newBroken: { id: string; r: number; c: number; type: TileType }[] = [];
        matches.forEach(({ r, c }) => {
          const tile = currentGrid[r][c];
          if (tile) {
            newBroken.push({
              id: `break_${r}_${c}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              r,
              c,
              type: tile.type
            });
          }
        });
        
        if (newBroken.length > 0) {
          setBrokenTiles(prev => [...prev, ...newBroken]);
          setTimeout(() => {
            setBrokenTiles(prev => prev.filter(t => !newBroken.includes(t)));
          }, 1000);
        }

        // Clear matched coordinates in grid
        matches.forEach(({ r, c }) => {
          // Clear algae if it's there
          if (currentGrid[r][c]) {
            currentGrid[r][c] = null;
          }
        });

        // Set state to trigger visual clear
        setGrid(currentGrid);
        // Wait for visual pop effect (150ms)
        await new Promise(res => setTimeout(res, 150));

        // 2. Apply Buoyancy & Gravity
        const currentWaterRow = getWaterLevelRow(waterLevel);
        const gravityResult = applyBuoyancyAndGravity(currentGrid, currentWaterRow, levelConfig.hasValves);
        currentGrid = gravityResult.grid;
        setGrid(currentGrid);
        
        // Wait for sliding tiles (250ms)
        await new Promise(res => setTimeout(res, 250));

        // Add score
        setScore(prev => prev + (matches.length * 10 * combo));
      } else {
        // No matches found in this scan iteration
        keepResolving = false;
      }
    }

    // Handle swap back if manual swap failed to match anything
    if (wasManualSwap && !hasMatchedAnythingOnFirstPass && prevSwapCoords) {
      // Revert the swap visually
      const { r1, c1, r2, c2 } = prevSwapCoords;
      const revertedGrid = swapTiles(currentGrid, r1, c1, r2, c2);
      if (revertedGrid) {
        setGrid(revertedGrid);
        gameAudio.playClick(); // generic sound
        await new Promise(res => setTimeout(res, 250));
      }
      setIsBoardLocked(false);
      return;
    }

    // Apply outcomes after turn finishes
    if (hasMatchedAnythingOnFirstPass) {
      // Deduct move
      setMovesRemaining(prev => {
        const nextMoves = prev - 1;
        
        // Check win/loss state with current values
        setCoinsCollected(prevCoins => {
          const nextCoins = prevCoins + coinsEarnedThisTurn;
          checkWinLoss(nextCoins, waterLevel, nextMoves);
          return nextCoins;
        });

        return nextMoves;
      });
    }

    setIsBoardLocked(false);
  };

  // Perform tile swap
  const handleTileSwap = async (r1: number, c1: number, r2: number, c2: number) => {
    if (isBoardLocked || gameState !== 'playing') return;

    const swappedGrid = swapTiles(grid, r1, c1, r2, c2);
    if (!swappedGrid) return;

    // Set swapped state immediately for smooth animation trigger
    setGrid(swappedGrid);
    gameAudio.playClick();
    
    // Wait for swap animation (200ms)
    await new Promise(res => setTimeout(res, 200));

    // Resolve cascades, checking if we need to swap back on zero matches
    await runMatchCascade(true, { r1, c1, r2, c2 });
  };

  // Handle player tile selection
  const handleSelectTile = (r: number, c: number) => {
    if (isBoardLocked || gameState !== 'playing') return;

    const tile = grid[r][c];
    if (!tile || tile.algae) {
      // Cannot select empty tiles or locked algae tiles
      return;
    }

    if (selectedTile) {
      if (selectedTile.r === r && selectedTile.c === c) {
        // Deselect
        setSelectedTile(null);
      } else if (isAdjacent(selectedTile.r, selectedTile.c, r, c)) {
        // Swap adjacent tiles
        handleTileSwap(selectedTile.r, selectedTile.c, r, c);
        setSelectedTile(null);
      } else {
        // Switch selection to new tile if not adjacent
        setSelectedTile({ r, c });
        gameAudio.playClick();
      }
    } else {
      setSelectedTile({ r, c });
      gameAudio.playClick();
    }
  };

  // Quick reset for current level
  const resetLevel = () => {
    selectLevel(currentLevelId);
  };

  return {
    currentLevelId,
    levelConfig,
    grid,
    coinsCollected,
    waterLevel,
    waterLevelRow,
    movesRemaining,
    score,
    gameState,
    activeTutorialIndex,
    selectedTile,
    isBoardLocked,
    highestLevelUnlocked,
    isSoundEnabled,
    selectLevel,
    startLevel,
    handleSelectTile,
    resetLevel,
    setActiveTutorialIndex,
    toggleSound,
    setGameState,
    floatingCoins,
    brokenTiles
  };
}
export type GameStateHook = ReturnType<typeof useGameState>;
