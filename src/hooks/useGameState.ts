// Custom React Hook for Game State Management
import { useState, useRef, useEffect } from 'react';
import type { GridState, LevelConfig, TileType } from '../services/boardLogic';
import { 
  LEVELS, 
  createInitialBoard, 
  scanMatches, 
  swapTiles, 
  applyBuoyancyAndGravity, 
  isAdjacent,
  spreadAlgae,
  generateUniqueId
} from '../services/boardLogic';
import { gameAudio } from '../services/audio';

export function useGameState() {
  // Load persistent progression from localStorage
  const getSavedUnlockedLevel = (): number => {
    const saved = localStorage.getItem('royal_rescue_unlocked_level');
    return saved ? Math.min(8, Math.max(1, parseInt(saved))) : 1;
  };

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
  const [highestLevelUnlocked, setHighestLevelUnlocked] = useState<number>(getSavedUnlockedLevel());
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [floatingCoins, setFloatingCoins] = useState<{ id: string; r: number; c: number; value: number }[]>([]);
  const [brokenTiles, setBrokenTiles] = useState<{ id: string; r: number; c: number; type: TileType }[]>([]);

  // Keep references to prevent closure stale state in async intervals
  const gridRef = useRef<GridState>([]);
  gridRef.current = grid;
  const isBoardLockedRef = useRef(isBoardLocked);
  isBoardLockedRef.current = isBoardLocked;

  // Cache water level index for buoyancy calculations
  const getWaterLevelRow = (pct: number) => {
    return Math.max(0, 8 - Math.floor(pct / 12.5));
  };

  const waterLevelRow = getWaterLevelRow(waterLevel);

  // Set up constant real-time water rise
  useEffect(() => {
    if (gameState !== 'playing') return;

    // Water rises by (riseRate / 10) percent every 100ms
    const interval = setInterval(() => {
      setWaterLevel(prev => {
        const nextWater = Math.min(100, prev + (levelConfig.waterRiseRate / 10));
        
        // Critical audio warning triggers
        if (nextWater >= 80 && Math.floor(nextWater * 10) % 20 === 0) {
          gameAudio.playDangerAlarm?.();
        }

        if (nextWater >= 100) {
          setGameState('gameover');
          gameAudio.playDefeat();
          clearInterval(interval);
        }
        return nextWater;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gameState, levelConfig]);

  // Navigate to Level and Start It!
  const selectLevel = (levelId: number) => {
    const config = LEVELS[levelId] || LEVELS[1];
    setCurrentLevelId(levelId);
    setLevelConfig(config);
    setCoinsCollected(0);
    setWaterLevel(config.initialWaterLevel * 12.5); // Initialize water heights
    setMovesRemaining(config.movesLimit);
    setScore(0);
    setSelectedTile(null);
    setIsBoardLocked(false);

    const initialGrid = createInitialBoard(config);
    setGrid(initialGrid);

    if (config.tutorialText.length > 0) {
      setGameState('tutorial');
      setActiveTutorialIndex(0);
    } else {
      setGameState('playing');
    }
  };

  // Launch Active Level
  const startLevel = () => {
    setGameState('playing');
  };

  // Check Win/Loss states
  const checkWinLoss = (coins: number, water: number, moves: number): boolean => {
    if (coins >= levelConfig.targetCoins) {
      setGameState('escaping');
      gameAudio.playVictory();

      // Drain all remaining water visually
      const drainInterval = setInterval(() => {
        setWaterLevel(prev => {
          if (prev <= 0) {
            clearInterval(drainInterval);
            return 0;
          }
          return Math.max(0, prev - 15);
        });
      }, 80);

      // Star rating calculation based on moves remaining
      const starsEarned = moves >= Math.ceil(levelConfig.movesLimit * 0.35) 
        ? 3 
        : moves >= Math.ceil(levelConfig.movesLimit * 0.12) 
          ? 2 
          : 1;

      localStorage.setItem(`royal_rescue_stars_level_${currentLevelId}`, starsEarned.toString());

      // Unlock next level
      const nextLevel = Math.min(8, currentLevelId + 1);
      if (nextLevel > highestLevelUnlocked) {
        setHighestLevelUnlocked(nextLevel);
        localStorage.setItem('royal_rescue_unlocked_level', nextLevel.toString());
      }

      // Wait 2.5 seconds for walking escape animation to complete before showing victory modal
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
    let anyAlgaeClearedThisTurn = false;
    let hasMatchedAnythingOnFirstPass = false;

    while (keepResolving) {
      const { 
        matches, 
        isValveActivated, 
        coinCountCollected,
        powerUpsToSpawn,
        crackedIceCoords 
      } = scanMatches(currentGrid);

      if (matches.length > 0) {
        hasMatchedAnythingOnFirstPass = true;
        combo++;
        
        let coinsThisMatch = 0;
        const coinsToAnimate: { id: string; r: number; c: number; value: number }[] = [];

        matches.forEach(({ r, c }) => {
          const tile = currentGrid[r][c];
          if (tile) {
            if (tile.algae) anyAlgaeClearedThisTurn = true;
            if (tile.type === 'coin') {
              const val = 1;
              coinsThisMatch += val;
              coinsToAnimate.push({
                id: `coin_${r}_${c}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                r,
                c,
                value: val
              });
            }
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

        if (coinCountCollected > 0) {
          gameAudio.playCoin();
        } else if (isValveActivated) {
          gameAudio.playValve();
        } else {
          gameAudio.playMatch(combo);
        }

        // Apply water drainage: match combos drain water level
        const matchDrain = 3.0 * combo;
        setWaterLevel(prev => Math.max(0, prev - matchDrain));

        if (isValveActivated) {
          setWaterLevel(prev => Math.max(0, prev - 15));
        }

        // Push broken tiles coordinates to trigger visual shard explosions
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

        // Resolve matching and ice cracking wrappers
        matches.forEach(({ r, c }) => {
          const cell = currentGrid[r][c];
          if (cell) {
            if (cell.frozen) {
              cell.frozen = false; // cracks ice block but keeps gem
            } else {
              currentGrid[r][c] = null; // clears tile
            }
          }
        });

        crackedIceCoords.forEach(({ r, c }) => {
          if (currentGrid[r][c] && currentGrid[r][c]!.frozen) {
            currentGrid[r][c]!.frozen = false;
          }
        });

        // Spawn newly formed blasters and bombs
        powerUpsToSpawn.forEach(p => {
          if (currentGrid[p.r][p.c] === null) {
            currentGrid[p.r][p.c] = {
              id: generateUniqueId(),
              type: p.type,
              algae: false,
              powerUp: p.powerUp
            };
          }
        });

        setGrid(currentGrid);
        await new Promise(res => setTimeout(res, 180));

        // 2. Apply Buoyancy & Gravity
        const currentWaterRow = getWaterLevelRow(waterLevel);
        const gravityResult = applyBuoyancyAndGravity(currentGrid, currentWaterRow, levelConfig);
        currentGrid = gravityResult.grid;
        setGrid(currentGrid);
        
        await new Promise(res => setTimeout(res, 250));

        // Accumulate scores
        setScore(prev => prev + (matches.length * 15 * combo));
      } else {
        keepResolving = false;
      }
    }

    // Revert manual swap if no match was created
    if (wasManualSwap && !hasMatchedAnythingOnFirstPass && prevSwapCoords) {
      const { r1, c1, r2, c2 } = prevSwapCoords;
      const revertedGrid = swapTiles(currentGrid, r1, c1, r2, c2);
      if (revertedGrid) {
        setGrid(revertedGrid);
        gameAudio.playClick();
        await new Promise(res => setTimeout(res, 220));
      }
      setIsBoardLocked(false);
      return;
    }

    // Algae spreading check: spreads algae if none was cleared this turn
    if (hasMatchedAnythingOnFirstPass && levelConfig.hasAlgae && !anyAlgaeClearedThisTurn) {
      currentGrid = spreadAlgae(currentGrid);
      setGrid(currentGrid);
      await new Promise(res => setTimeout(res, 180));
    }

    // Post-turn calculations
    if (hasMatchedAnythingOnFirstPass) {
      setMovesRemaining(prev => {
        const nextMoves = prev - 1;
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

  // Detonate lightning zaps (clear all matching color tiles)
  const runLightningCascade = async (r1: number, c1: number, r2: number, c2: number, targetType: TileType) => {
    setIsBoardLocked(true);
    let currentGrid = gridRef.current.map(row => [...row]);
    let coinsEarnedThisTurn = 0;

    const l1 = currentGrid[r1][c1];
    const l2 = currentGrid[r2][c2];

    const matchCoords: { r: number; c: number }[] = [];

    // Log the lightning coordinates
    if (l1?.powerUp === 'lightning') matchCoords.push({ r: r1, c: c1 });
    if (l2?.powerUp === 'lightning') matchCoords.push({ r: r2, c: c2 });

    // Grab all cells matching the target color (excluding valves/boulders)
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const cell = currentGrid[r][c];
        if (cell && cell.type === targetType && cell.type !== 'valve' && cell.type !== 'boulder') {
          matchCoords.push({ r, c });
        }
      }
    }

    // Play electric/valve sounds
    gameAudio.playValve();

    // Trigger visual shard explosions
    const newBroken: { id: string; r: number; c: number; type: TileType }[] = [];
    matchCoords.forEach(({ r, c }) => {
      const tile = currentGrid[r][c];
      if (tile) {
        newBroken.push({
          id: `lightning_break_${r}_${c}_${Date.now()}`,
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

    // Resolve clears and coin collections
    let coinsThisMatch = 0;
    const coinsToAnimate: { id: string; r: number; c: number; value: number }[] = [];

    matchCoords.forEach(({ r, c }) => {
      const tile = currentGrid[r][c];
      if (tile) {
        if (tile.type === 'coin') {
          coinsThisMatch += 1;
          coinsToAnimate.push({
            id: `coin_${r}_${c}_${Date.now()}`,
            r,
            c,
            value: 1
          });
        }
        currentGrid[r][c] = null;
      }
    });

    coinsEarnedThisTurn += coinsThisMatch;
    if (coinsToAnimate.length > 0) {
      setFloatingCoins(prev => [...prev, ...coinsToAnimate]);
      setTimeout(() => {
        setFloatingCoins(prev => prev.filter(fc => !coinsToAnimate.includes(fc)));
      }, 850);
    }

    setGrid(currentGrid);
    await new Promise(res => setTimeout(res, 200));

    // Resolve physical sliding updates
    const currentWaterRow = getWaterLevelRow(waterLevel);
    const gravityResult = applyBuoyancyAndGravity(currentGrid, currentWaterRow, levelConfig);
    currentGrid = gravityResult.grid;
    setGrid(currentGrid);
    await new Promise(res => setTimeout(res, 250));

    // Deduct turn moves
    setMovesRemaining(prev => {
      const nextMoves = prev - 1;
      setCoinsCollected(prevCoins => {
        const nextCoins = prevCoins + coinsEarnedThisTurn;
        checkWinLoss(nextCoins, waterLevel, nextMoves);
        return nextCoins;
      });
      return nextMoves;
    });

    // Solve any subsequent cascade matches formed
    await runMatchCascade(false);
  };

  // Perform tile swap (bypasses to lightning resolver if zappers are matched)
  const handleTileSwap = async (r1: number, c1: number, r2: number, c2: number) => {
    if (isBoardLocked || gameState !== 'playing') return;

    const tile1 = grid[r1][c1];
    const tile2 = grid[r2][c2];

    const isL1 = tile1?.powerUp === 'lightning';
    const isL2 = tile2?.powerUp === 'lightning';

    if (isL1 || isL2) {
      const swappedGrid = swapTiles(grid, r1, c1, r2, c2);
      if (!swappedGrid) return;
      setGrid(swappedGrid);
      gameAudio.playClick();
      await new Promise(res => setTimeout(res, 200));

      const targetType = isL1 ? tile2?.type : tile1?.type;
      await runLightningCascade(r1, c1, r2, c2, targetType || 'ruby');
      return;
    }

    const swappedGrid = swapTiles(grid, r1, c1, r2, c2);
    if (!swappedGrid) return;

    setGrid(swappedGrid);
    gameAudio.playClick();
    
    await new Promise(res => setTimeout(res, 200));
    await runMatchCascade(true, { r1, c1, r2, c2 });
  };

  const handleSelectTile = (r: number, c: number) => {
    if (isBoardLocked || gameState !== 'playing') return;

    const cell = grid[r][c];
    if (!cell || cell.algae || cell.frozen) return; // cannot select locked/ice tiles

    if (selectedTile) {
      if (selectedTile.r === r && selectedTile.c === c) {
        setSelectedTile(null);
      } else if (isAdjacent(selectedTile.r, selectedTile.c, r, c)) {
        handleTileSwap(selectedTile.r, selectedTile.c, r, c);
        setSelectedTile(null);
      } else {
        setSelectedTile({ r, c });
        gameAudio.playClick();
      }
    } else {
      setSelectedTile({ r, c });
      gameAudio.playClick();
    }
  };

  const resetLevel = () => {
    selectLevel(currentLevelId);
  };

  const toggleSound = () => {
    setIsSoundEnabled(prev => {
      const nextVal = !prev;
      gameAudio.toggle(nextVal);
      return nextVal;
    });
  };

  const resetProgress = () => {
    if (window.confirm("Are you sure you want to reset all unlocked levels and stars progress?")) {
      localStorage.removeItem('royal_rescue_unlocked_level');
      for (let i = 1; i <= 8; i++) {
        localStorage.removeItem(`royal_rescue_stars_level_${i}`);
      }
      setHighestLevelUnlocked(1);
      setCurrentLevelId(1);
      setLevelConfig(LEVELS[1]);
    }
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
    brokenTiles,
    resetProgress
  };
}
export type GameStateHook = ReturnType<typeof useGameState>;
