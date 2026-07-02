import React from 'react';
import { useGameState } from './hooks/useGameState';
import { DungeonChamber } from './components/DungeonChamber';
import { GameBoard } from './components/GameBoard';
import { LevelSelector } from './components/LevelSelector';
import { GameplayTutorial } from './components/GameplayTutorial';
import './App.css';

interface FloatingCoinItemProps {
  coin: {
    id: string;
    r: number;
    c: number;
    value: number;
  };
}

const FloatingCoinItem: React.FC<FloatingCoinItemProps> = ({ coin }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [style, setStyle] = React.useState<React.CSSProperties>({
    opacity: 0,
    '--col': coin.c,
    '--row': coin.r,
  } as React.CSSProperties);

  React.useEffect(() => {
    const targetElement = document.querySelector('.coin-gold-glow');
    if (targetElement && containerRef.current) {
      const targetRect = targetElement.getBoundingClientRect();
      const originRect = containerRef.current.getBoundingClientRect();

      // Calculate translation offset in pixels from starting cell center to HUD coin center
      const dx = targetRect.left - originRect.left + (targetRect.width / 2) - 16;
      const dy = targetRect.top - originRect.top + (targetRect.height / 2) - 16;

      setStyle({
        opacity: 1,
        '--col': coin.c,
        '--row': coin.r,
        '--dx': `${dx}px`,
        '--dy': `${dy}px`,
      } as React.CSSProperties);
    } else {
      // Safe fallback if target element is not loaded yet
      setStyle({
        opacity: 1,
        '--col': coin.c,
        '--row': coin.r,
        '--dx': '0px',
        '--dy': '-320px',
      } as React.CSSProperties);
    }
  }, [coin.c, coin.r]);

  return (
    <div ref={containerRef} className="floating-coin-container" style={style}>
      {/* Floating 3D Spinning Coin */}
      <div className="floating-coin">
        <svg viewBox="0 0 40 40" className="tile-svg gold-coin-svg">
          <defs>
            <linearGradient id="coin-grad-float" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffeb60" />
              <stop offset="60%" stopColor="#ffd200" />
              <stop offset="100%" stopColor="#b78600" />
            </linearGradient>
          </defs>
          <circle cx="20" cy="20" r="15" fill="url(#coin-grad-float)" stroke="#cc9900" strokeWidth="1.5" />
          <circle cx="20" cy="20" r="11" fill="none" stroke="#cc9900" strokeWidth="1" strokeDasharray="2,2" />
          <text x="20" y="24" fontSize="12" fontWeight="bold" fill="#7a5c00" textAnchor="middle">$</text>
        </svg>
      </div>
      
      {/* Floating +N Pop */}
      <div className="floating-plus-one">
        +{coin.value}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const {
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
    handleTileSwap,
    floatingCoins
  } = useGameState() as any; // Cast for simpler swap access

  // Manual wrapper for swaps from GameBoard
  const onSwapTiles = (r1: number, c1: number, r2: number, c2: number) => {
    handleTileSwap?.(r1, c1, r2, c2);
  };

  return (
    <div className="app-viewport">
      {/* Top Universal Header */}
      <header className="app-header">
        <div className="header-brand">
          <span className="crown-icon">👑</span>
          <span className="brand-title">AQUA MATCH</span>
        </div>

        <button className="sound-toggle-btn" onClick={toggleSound} aria-label="Toggle Sound">
          {isSoundEnabled ? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          )}
        </button>
      </header>

      {/* Main Screen Router */}
      <main className="app-main-content">
        {gameState === 'menu' ? (
          <LevelSelector
            highestLevelUnlocked={highestLevelUnlocked}
            onSelectLevel={selectLevel}
          />
        ) : (
          <div className="gameplay-screen">
            {/* Level Stats HUD */}
            <div className="stats-hud">
              <button 
                className="hud-btn back-btn" 
                onClick={() => setGameState('menu')}
                disabled={isBoardLocked}
              >
                ◀ Map
              </button>

              <div className="hud-metric coins-metric">
                <div className="metric-label">COINS</div>
                <div className="metric-value">
                  <span key={coinsCollected} className="coin-gold-glow coin-jiggle">🪙 {coinsCollected}</span>
                  <span className="metric-target"> / {levelConfig.targetCoins}</span>
                </div>
              </div>

              <div className="hud-metric moves-metric">
                <div className="metric-label">MOVES LEFT</div>
                <div className="metric-value">{movesRemaining}</div>
              </div>

              <div className="hud-metric score-metric">
                <div className="metric-label">SCORE</div>
                <div className="metric-value">{score}</div>
              </div>

              <button 
                className="hud-btn restart-btn" 
                onClick={resetLevel}
                disabled={isBoardLocked}
              >
                ↻ Reset
              </button>
            </div>

            {/* Split Screen Stack */}
            <div className="game-stack">
              <div className="stack-chamber">
                <DungeonChamber 
                  waterLevel={waterLevel} 
                  gameState={gameState} 
                />
              </div>

              <div className="stack-board" style={{ position: 'relative', overflow: 'visible' }}>
                <GameBoard
                  grid={grid}
                  selectedTile={selectedTile}
                  waterLevelRow={waterLevelRow}
                  isBoardLocked={isBoardLocked}
                  onSelectTile={handleSelectTile}
                  onSwapTiles={onSwapTiles}
                />

                {/* Floating Coins Overlay */}
                <div className="floating-coins-overlay">
                  {floatingCoins.map((coin: any) => (
                    <FloatingCoinItem key={coin.id} coin={coin} />
                  ))}
                </div>
              </div>
            </div>

            {/* Sub-Overlays */}

            {/* 1. Tutorial Step Popup */}
            {gameState === 'tutorial' && (
              <GameplayTutorial
                levelId={currentLevelId}
                tutorialText={levelConfig.tutorialText}
                activeIndex={activeTutorialIndex}
                onNext={() => setActiveTutorialIndex((prev: number) => prev + 1)}
                onPrev={() => setActiveTutorialIndex((prev: number) => Math.max(0, prev - 1))}
                onClose={startLevel}
              />
            )}

            {/* 2. Game Over Popup */}
            {gameState === 'gameover' && (
              <div className="modal-overlay">
                <div className="endgame-modal gameover-modal">
                  <h2 className="modal-title">THE KING DROWNED!</h2>
                  <p className="modal-reason">
                    {waterLevel >= 100 
                      ? "The water chamber filled to 100%." 
                      : "You ran out of moves to secure the hatch."}
                  </p>
                  <p className="modal-stats">Final Score: {score}</p>
                  <div className="modal-actions">
                    <button className="modal-btn primary" onClick={resetLevel}>
                      Retry Chamber
                    </button>
                    <button className="modal-btn secondary" onClick={() => setGameState('menu')}>
                      Exit to Map
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Victory Popup */}
            {gameState === 'victory' && (
              <div className="modal-overlay">
                <div className="endgame-modal victory-modal">
                  <h2 className="modal-title">CHAMBER SECURED!</h2>
                  <p className="modal-reason">You collected enough coins and saved the King!</p>
                  <p className="modal-stats">Score: {score} | Moves Remaining: {movesRemaining}</p>
                  <div className="modal-actions">
                    {currentLevelId < 5 ? (
                      <button 
                        className="modal-btn primary pulse" 
                        onClick={() => selectLevel(currentLevelId + 1)}
                      >
                        Next Chamber
                      </button>
                    ) : (
                      <button 
                        className="modal-btn primary pulse" 
                        onClick={() => setGameState('menu')}
                      >
                        Campaign Completed!
                      </button>
                    )}
                    <button className="modal-btn secondary" onClick={() => setGameState('menu')}>
                      Back to Map
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
