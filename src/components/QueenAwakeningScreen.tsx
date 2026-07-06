import React, { useState, useEffect } from 'react';
import './QueenAwakeningScreen.css';

interface QueenAwakeningScreenProps {
  score: number;
  movesRemaining: number;
  coinsCollected: number;
  onRestartGame: () => void;
  onRevisitMap: () => void;
}

export const QueenAwakeningScreen: React.FC<QueenAwakeningScreenProps> = ({
  score,
  movesRemaining,
  coinsCollected,
  onRestartGame,
  onRevisitMap,
}) => {
  const [phase, setPhase] = useState<'ritual' | 'burst' | 'awakened' | 'stats'>('ritual');
  const [visibleLines, setVisibleLines] = useState(0);

  // Calculate total stars collected across all 30 levels
  const [totalStars, setTotalStars] = useState(0);
  useEffect(() => {
    let starsSum = 0;
    for (let id = 1; id <= 30; id++) {
      const stars = parseInt(localStorage.getItem(`royal_rescue_stars_level_${id}`) || '0');
      starsSum += stars;
    }
    setTotalStars(starsSum);
  }, []);

  // Trigger epilogue poetry lines staggered delay in 'awakened' phase
  useEffect(() => {
    if (phase !== 'awakened') return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    [0, 1, 2, 3].forEach(i => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), 600 + i * 850));
    });
    // Auto-advance to stats after verse is done
    timers.push(setTimeout(() => setPhase('stats'), 4600));
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  const handleBreakFinalSeal = () => {
    setPhase('burst');
    // Visual flash timeout
    setTimeout(() => {
      setPhase('awakened');
    }, 1200);
  };

  // Determine Master Title based on total stars
  const getMasterTitle = (stars: number) => {
    if (stars >= 80) return { title: 'Supreme Dreamwalker', rank: 'S', color: '#f59e0b' };
    if (stars >= 60) return { title: 'Royal Guardian', rank: 'A', color: '#a855f7' };
    if (stars >= 40) return { title: 'Aqua Knight', rank: 'B', color: '#3b82f6' };
    return { title: 'Dreamer Apprentice', rank: 'C', color: '#10b981' };
  };

  const master = getMasterTitle(totalStars);

  return (
    <div className={`awakening-screen-overlay phase-${phase}`}>
      {/* ── PHASE 1: THE RITUAL OF SEALS ── */}
      {phase === 'ritual' && (
        <div className="ritual-container">
          <div className="ritual-header">
            <h1 className="ritual-title animate-glow">The Final Lock</h1>
            <p className="ritual-desc">Six seals bound her consciousness. Five are broken. Only the Ethereal Seal remains.</p>
          </div>

          <div className="seals-circle-container">
            {/* The Sleeping Queen consciousness node in center */}
            <div className="queen-sleeping-core">
              <div className="queen-sleeping-avatar" />
              <div className="pulse-ring" />
              <div className="pulse-ring ring-2" />
            </div>

            {/* The 6 Chapter Seals */}
            <div className="seal-node seal-warm broken"><span>🕯️</span><div className="seal-label">Warm</div></div>
            <div className="seal-node seal-rose broken"><span>🌹</span><div className="seal-label">Rose</div></div>
            <div className="seal-node seal-cold broken"><span>❄️</span><div className="seal-label">Frost</div></div>
            <div className="seal-node seal-dark broken"><span>🌑</span><div className="seal-label">Nightmare</div></div>
            <div className="seal-node seal-battle broken"><span>⚔️</span><div className="seal-label">Battle</div></div>
            <div className="seal-node seal-ethereal pulse-interactive" onClick={handleBreakFinalSeal}>
              <span>✨</span>
              <div className="seal-label glow-text">Ethereal</div>
              <div className="seal-glow-ring" />
            </div>
          </div>

          <div className="ritual-prompt bounce">
            <span className="sparkle-icon">✨</span> Tap the Ethereal Seal to awaken Queen Elara <span className="sparkle-icon">✨</span>
          </div>
        </div>
      )}

      {/* ── PHASE 2: BURST TRANSITION ── */}
      {phase === 'burst' && (
        <div className="burst-transition-container">
          <div className="white-flash-layer" />
          <div className="expanding-circle-layer" />
          <div className="floating-stardust-shards" />
        </div>
      )}

      {/* ── PHASE 3: THE AWAKENING ── */}
      {phase === 'awakened' && (
        <div className="awakened-cinematic-container">
          <div className="queen-awakening-profile animate-fade-in" />
          <div className="awakened-epilogue">
            <p className={`verse-line ${visibleLines > 0 ? 'show' : ''}`}>"The flood recedes. The shadow falls."</p>
            <p className={`verse-line ${visibleLines > 1 ? 'show' : ''}`}>"The sunlight returns to castle walls."</p>
            <p className={`verse-line ${visibleLines > 2 ? 'show' : ''}`}>"Through chambers deep, through lock and key,"</p>
            <p className={`verse-line ${visibleLines > 3 ? 'show' : ''}`}>"You walked the dream, and set me free."</p>
          </div>
          <div className="whisper-ending">"Thank you, my King..."</div>
        </div>
      )}

      {/* ── PHASE 4: THE ROYAL RECORD (FINAL STATS) ── */}
      {phase === 'stats' && (
        <div className="royal-record-container animate-slide-up">
          <div className="record-card">
            <div className="record-header">
              <div className="royal-crown-badge">👑</div>
              <h2 className="record-title">Royal Archives</h2>
              <p className="record-subtitle">Queen Elara has awakened. Peace is restored to the dreaming keep.</p>
            </div>

            <div className="master-rank-display" style={{ borderColor: master.color }}>
              <div className="rank-badge" style={{ backgroundColor: master.color }}>{master.rank}</div>
              <div className="rank-details">
                <span className="rank-label">Master Rating</span>
                <span className="rank-name" style={{ color: master.color }}>{master.title}</span>
              </div>
            </div>

            <div className="record-grid">
              <div className="record-stat">
                <span className="stat-num">{totalStars} / 90</span>
                <span className="stat-label">★ Total Stars</span>
              </div>
              <div className="record-stat">
                <span className="stat-num">{score.toLocaleString()}</span>
                <span className="stat-label">Final Chamber Score</span>
              </div>
              <div className="record-stat">
                <span className="stat-num">+{coinsCollected}</span>
                <span className="stat-label">Coins Retrieved</span>
              </div>
              <div className="record-stat">
                <span className="stat-num">{movesRemaining}</span>
                <span className="stat-label">Moves Conserved</span>
              </div>
            </div>

            <div className="record-actions">
              <button className="record-btn btn-primary" onClick={onRevisitMap}>
                ✦ Revisit Chambers
              </button>
              <button className="record-btn btn-secondary" onClick={onRestartGame}>
                Reset Adventure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
