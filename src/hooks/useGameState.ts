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
  // Load persistent progression from localStorage (up to level 30)
  const getSavedUnlockedLevel = (): number => {
    const saved = localStorage.getItem('royal_rescue_unlocked_level');
    return saved ? Math.min(30, Math.max(1, parseInt(saved))) : 1;
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
  const [firedPowerUps, setFiredPowerUps] = useState<{ id: string; r: number; c: number; type: 'blast_row' | 'blast_col' | 'bomb' | 'lightning' | 'chain_breaker' }[]>([]);
  const [firedValveDrain, setFiredValveDrain] = useState<string[]>([]);

  // All-algae-cleared bonus (L8 — The Vow Stone)
  const algaeBonusClaimedRef = useRef(false);

  // Keep references to prevent closure stale state in async intervals
  const gridRef = useRef<GridState>([]);
  gridRef.current = grid;
  const isBoardLockedRef = useRef(isBoardLocked);
  isBoardLockedRef.current = isBoardLocked;
  const waterLevelRef = useRef(waterLevel);
  waterLevelRef.current = waterLevel;

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

  // ── L8 all-algae-cleared bonus (+5 coins) ────────────────────
  useEffect(() => {
    if (levelConfig.id !== 8 || algaeBonusClaimedRef.current) return;
    if (gameState !== 'playing') return;
    if (!levelConfig.hasAlgae) return;
    const hasAnyAlgae = grid.some(row => row.some(cell => cell?.algae));
    if (!hasAnyAlgae && grid.length > 0) {
      algaeBonusClaimedRef.current = true;
      setCoinsCollected(prev => prev + 5);
      // Emit a special floating bonus coin at board centre
      const bonusId = `algae_bonus_${Date.now()}`;
      setFloatingCoins(prev => [...prev, { id: bonusId, r: 3, c: 3, value: 5 }]);
      setTimeout(() => {
        setFloatingCoins(prev => prev.filter(fc => fc.id !== bonusId));
      }, 1400);
    }
  }, [grid, gameState, levelConfig]);

  // Navigate to Level and Start It!
  const selectLevel = (levelId: number) => {
    algaeBonusClaimedRef.current = false; // reset per level
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

      // Unlock next level (up to level 30)
      const nextLevel = Math.min(30, currentLevelId + 1);
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
    let totalScoreThisTurn = 0;
    let totalWaterDrainThisTurn = 0;

    while (keepResolving) {
      const { 
        matches, 
        isValveActivated, 
        coinCountCollected,
        powerUpsToSpawn,
        crackedIceCoords,
        clearedAlgaeCoords,
        clearedCursedCoords,
        damagedShadowVaults
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
        } else if (!isValveActivated) {
          gameAudio.playMatch(combo);
        }

        if (isValveActivated) {
          gameAudio.playValve();
          // Trigger Drain Wave Sweep visual effect + sound
          gameAudio.playValveDrain();
          const drainId = `valve_drain_${Date.now()}_${Math.random()}`;
          setFiredValveDrain(prev => [...prev, drainId]);
          setTimeout(() => {
            setFiredValveDrain(prev => prev.filter(id => id !== drainId));
          }, 2200);
        }

        // Accumulate water drain and score — applied AFTER full cascade to avoid mid-cascade re-renders
        totalWaterDrainThisTurn += 3.0 * combo;
        if (isValveActivated) totalWaterDrainThisTurn += 15;
        totalScoreThisTurn += matches.length * 15 * combo;

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
          }, 800);
        }

        // Detect & fire power-up visual effects + sounds
        const fired = matches
          .filter(({ r, c }) => currentGrid[r][c]?.powerUp)
          .map(({ r, c }) => ({
            id: `pfx_${r}_${c}_${Date.now()}_${Math.random()}`,
            r, c,
            type: currentGrid[r][c]!.powerUp!
          }));
        if (fired.length > 0) {
          setFiredPowerUps(prev => [...prev, ...fired]);
          fired.forEach(f => {
            if (f.type === 'lightning' || f.type === 'chain_breaker')  gameAudio.playLightning();
            else if (f.type === 'blast_row') gameAudio.playBlastRow();
            else if (f.type === 'blast_col') gameAudio.playBlastCol();
            else if (f.type === 'bomb')  gameAudio.playBomb();
          });
          setTimeout(() => {
            setFiredPowerUps(prev => prev.filter(p => !fired.find(f => f.id === p.id)));
          }, 950);
        }

        let cursesTriggeredCount = 0;

        // Step 1: Clear matched tiles from the grid
        matches.forEach(({ r, c }) => {
          const cell = currentGrid[r][c];
          if (cell) {
            if (cell.cursed) {
              cursesTriggeredCount++;
              cell.cursed = false;
            }
            if (cell.frozen) {
              cell.frozen = false; // cracks ice block but keeps gem
            } else {
              currentGrid[r][c] = null;
            }
          }
        });

        crackedIceCoords.forEach(({ r, c }) => {
          if (currentGrid[r][c] && currentGrid[r][c]!.frozen) {
            currentGrid[r][c]!.frozen = false;
          }
        });

        clearedAlgaeCoords.forEach(({ r, c }) => {
          if (currentGrid[r][c] && currentGrid[r][c]!.algae) {
            currentGrid[r][c]!.algae = false;
            anyAlgaeClearedThisTurn = true;
          }
        });

        clearedCursedCoords.forEach(({ r, c }) => {
          if (currentGrid[r][c] && currentGrid[r][c]!.cursed) {
            currentGrid[r][c]!.cursed = false;
            cursesTriggeredCount++;
          }
        });

        // Resolve hits to Shadow Vaults
        const uniqueVaultHits = new Set<string>();
        damagedShadowVaults.forEach(({ r, c }) => {
          uniqueVaultHits.add(`${r}_${c}`);
        });

        uniqueVaultHits.forEach(coordStr => {
          const [r, c] = coordStr.split('_').map(Number);
          const cell = currentGrid[r][c];
          if (cell && cell.shadowVault && cell.shadowVault > 0) {
            cell.shadowVault -= 1;
            gameAudio.playClick();

            if (cell.shadowVault === 0) {
              currentGrid[r][c] = null;
              totalScoreThisTurn += 100;
              newBroken.push({
                id: `vault_break_${r}_${c}_${Date.now()}`,
                r,
                c,
                type: 'amethyst' // purple obsidian shard effect
              });
            }
          }
        });

        // Resolve triggered curses: freeze 2 random other active gems per curse
        if (cursesTriggeredCount > 0) {
          for (let i = 0; i < cursesTriggeredCount * 2; i++) {
            const candidates: { r: number; c: number }[] = [];
            for (let cr = 0; cr < 8; cr++) {
              for (let cc = 0; cc < 8; cc++) {
                const targetCell = currentGrid[cr][cc];
                if (
                  targetCell && 
                  !targetCell.algae && 
                  !targetCell.frozen && 
                  !targetCell.cursed && 
                  targetCell.type !== 'boulder' && 
                  targetCell.type !== 'valve' && 
                  targetCell.type !== 'coin'
                ) {
                  candidates.push({ r: cr, c: cc });
                }
              }
            }
            if (candidates.length > 0) {
              const choice = candidates[Math.floor(Math.random() * candidates.length)];
              currentGrid[choice.r][choice.c]!.frozen = true;
            }
          }
        }

        // Spawn newly formed blasters and bombs before gravity
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

        // Step 2: Apply gravity IMMEDIATELY (no setGrid with holes — this was the blink!)
        const currentWaterRow = getWaterLevelRow(waterLevelRef.current);
        const gravityResult = applyBuoyancyAndGravity(currentGrid, currentWaterRow, levelConfig);
        currentGrid = gravityResult.grid;

        // Step 3: Render the fully-filled grid in ONE shot — no flicker possible
        setGrid(currentGrid);

        // Wait for the tile slide animation to complete before checking next cascade
        await new Promise(res => setTimeout(res, 300));

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
    // Level 4 is the gentle intro to algae — spreading is disabled so players learn the mechanic first
    const algaeCanSpread = levelConfig.hasAlgae && levelConfig.id !== 4;
    if (hasMatchedAnythingOnFirstPass && algaeCanSpread && !anyAlgaeClearedThisTurn) {
      currentGrid = spreadAlgae(currentGrid);
      setGrid(currentGrid);
      await new Promise(res => setTimeout(res, 180));
    }

    // Apply all accumulated score and water drain in one batch after cascade
    if (totalScoreThisTurn > 0) setScore(prev => prev + totalScoreThisTurn);
    if (totalWaterDrainThisTurn > 0) setWaterLevel(prev => Math.max(0, prev - totalWaterDrainThisTurn));

    // Post-turn calculations
    if (hasMatchedAnythingOnFirstPass) {
      setMovesRemaining(prev => {
        const nextMoves = prev - 1;
        setCoinsCollected(prevCoins => {
          const nextCoins = prevCoins + coinsEarnedThisTurn;
          checkWinLoss(nextCoins, waterLevelRef.current, nextMoves);
          return nextCoins;
        });
        return nextMoves;
      });
    }

    // Strip isNew flags (spawn animations done) and unlock board
    currentGrid = currentGrid.map(row =>
      row.map(cell => cell && cell.isNew ? { ...cell, isNew: false } : cell)
    );
    setGrid(currentGrid);
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

    // Fire lightning visual effect
    const lightningFired = matchCoords
      .filter(({ r, c }) => currentGrid[r][c]?.powerUp === 'lightning')
      .map(({ r, c }) => ({ id: `pfx_l_${r}_${c}_${Date.now()}`, r, c, type: 'lightning' as const }));
    if (lightningFired.length > 0) {
      setFiredPowerUps(prev => [...prev, ...lightningFired]);
      setTimeout(() => setFiredPowerUps(prev => prev.filter(p => !lightningFired.find(f => f.id === p.id))), 950);
    }

    // Play electric/valve sounds
    gameAudio.playLightning();
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

    // Apply gravity IMMEDIATELY before rendering — no holes ever shown
    const currentWaterRow = getWaterLevelRow(waterLevelRef.current);
    const gravityResult = applyBuoyancyAndGravity(currentGrid, currentWaterRow, levelConfig);
    currentGrid = gravityResult.grid;
    setGrid(currentGrid);
    await new Promise(res => setTimeout(res, 320));

    // Deduct turn moves
    setMovesRemaining(prev => {
      const nextMoves = prev - 1;
      setCoinsCollected(prevCoins => {
        const nextCoins = prevCoins + coinsEarnedThisTurn;
        checkWinLoss(nextCoins, waterLevelRef.current, nextMoves);
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
    if (!cell || cell.algae || cell.frozen || cell.cursed || cell.shadowVault) return; // cannot select locked/ice/cursed/vault tiles

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
    firedPowerUps,
    firedValveDrain,
    resetProgress
  };
}
export type GameStateHook = ReturnType<typeof useGameState>;
