import React, { useEffect, useRef, useState } from 'react';
import { LEVELS } from '../services/boardLogic';
import './LevelSelector.css';

interface LevelSelectorProps {
  highestLevelUnlocked: number;
  onSelectLevel: (levelId: number) => void;
  onResetProgress: () => void;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  highestLevelUnlocked,
  onSelectLevel,
  onResetProgress
}) => {
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const activeNodeRef = useRef<HTMLButtonElement>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [scrollX, setScrollX] = useState(0);

  // Scroll handler to capture horizontal offsets for parallax calculations
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollX(e.currentTarget.scrollLeft);
  };

  // Auto-scroll focus on the highest unlocked active node when map loads
  useEffect(() => {
    if (activeNodeRef.current) {
      setTimeout(() => {
        activeNodeRef.current?.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest'
        });
      }, 350);
    }
  }, [highestLevelUnlocked]);

  return (
    <div className="level-selector-screen">
      {/* Top Floating Header */}
      <div className="map-floating-header">
        <h1 className="map-title-large">ROYAL DUNGEON</h1>
        <p className="map-subtitle-large">Scroll left/right to explore & rescue the King</p>
      </div>

      {/* Full-Screen Scrollable Track Viewport */}
      <div className="map-scroll-container" ref={scrollTrackRef} onScroll={handleScroll}>
        <div className="map-scroll-track">
          
          {/* Parallax Background Layer (Slow scroll speed) */}
          <div className="map-parallax-bg" style={{ transform: `translateX(${scrollX * 0.45}px)` }}>
            <div className="bg-decor bg-torch-post-1">🏺</div>
            <div className="bg-decor bg-shield">🛡️</div>
            <div className="bg-decor bg-key">🗝️</div>
            <div className="bg-decor bg-torch-post-2">🕯️</div>
            <div className="bg-decor bg-gem">💎</div>
            <div className="bg-decor bg-crown-decor">👑</div>
          </div>

          {/* Chapter 1: The Guardhouse (Levels 1-2) */}
          <div className="map-region region-guardhouse" />

          {/* Chapter 2: The Flooded Vaults (Levels 3-5) */}
          <div className="map-region region-vaults" />

          {/* Chapter 3: The Frozen Crypts (Levels 6-8) */}
          <div className="map-region region-crypts" />

          {/* Frosted Glass Divider Panels at Chapter Boundaries */}
          <div className="glass-divider-panel" style={{ left: '442px' }}>
            <span className="divider-label">SEWER VAULTS</span>
          </div>
          <div className="glass-divider-panel" style={{ left: '1042px' }}>
            <span className="divider-label">FROZEN CRYPTS</span>
          </div>

          {/* Golden Spline Path Line */}
          <svg className="saga-map-road-svg" viewBox="0 0 1700 460" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="road-grad-h" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffd700" />
                <stop offset="35%" stopColor="#ffa500" />
                <stop offset="70%" stopColor="#ff8c00" />
                <stop offset="100%" stopColor="#ff5e00" />
              </linearGradient>
            </defs>
            <path 
              d="M 126,246 
                 C 226,136 226,136 326,136 
                 C 426,306 426,306 526,306 
                 C 626,146 626,146 726,146 
                 C 826,316 826,316 926,316 
                 C 1026,136 1026,136 1126,136 
                 C 1226,306 1226,306 1326,306 
                 C 1426,206 1426,206 1526,206" 
              stroke="url(#road-grad-h)" 
              strokeWidth="7" 
              strokeLinecap="round" 
              strokeDasharray="10,8"
              className="crawling-road-line"
            />
          </svg>

          {/* Level Nodes */}
          {Object.values(LEVELS).map((level) => {
            const isUnlocked = level.id <= highestLevelUnlocked;
            const isCompleted = level.id < highestLevelUnlocked;
            const isActive = level.id === highestLevelUnlocked;

            // Coordinates mapping matching the SVG path centers exactly
            const nodeOffsets: Record<number, { left: number; top: number }> = {
              1: { left: 100, top: 220 },
              2: { left: 300, top: 110 },
              3: { left: 500, top: 280 },
              4: { left: 700, top: 120 },
              5: { left: 900, top: 290 },
              6: { left: 1100, top: 110 },
              7: { left: 1300, top: 280 },
              8: { left: 1500, top: 180 }
            };

            const pos = nodeOffsets[level.id] || { left: 100, top: 220 };
            const stars = parseInt(localStorage.getItem(`royal_rescue_stars_level_${level.id}`) || '0');

            return (
              <button
                key={level.id}
                ref={isActive ? activeNodeRef : null}
                className={`level-node node-${level.id} ${isUnlocked ? 'unlocked' : 'locked'} ${isCompleted ? 'completed' : ''} ${isActive ? 'active-pulse' : ''}`}
                style={{
                  left: `${pos.left}px`,
                  top: `${pos.top}px`
                }}
                onClick={() => isUnlocked && onSelectLevel(level.id)}
                disabled={!isUnlocked}
              >
                {/* 1. Floating 3D Gold Crown Marker above Active Level */}
                {isActive && (
                  <div className="active-crown-marker">
                    <svg viewBox="0 0 24 24" className="crown-svg">
                      <defs>
                        <linearGradient id="crown-gold-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#ffe082" />
                          <stop offset="60%" stopColor="#ffb300" />
                          <stop offset="100%" stopColor="#b78600" />
                        </linearGradient>
                      </defs>
                      <path d="M2,18 L22,18 L20,7 L16,12 L12,5 L8,12 L4,7 Z" fill="url(#crown-gold-grad)" stroke="#9c6d00" strokeWidth="1" />
                      <circle cx="12" cy="5" r="1.3" fill="#ffe082" />
                      <circle cx="4" cy="7" r="1.3" fill="#ffe082" />
                      <circle cx="20" cy="7" r="1.3" fill="#ffe082" />
                      <line x1="4" y1="18" x2="20" y2="18" stroke="#ffe082" strokeWidth="1" />
                    </svg>
                  </div>
                )}

                {/* 2. Overlapping chains overlay on Locked Levels */}
                {!isUnlocked && (
                  <div className="node-chains-overlay">
                    <div className="chain-arc h-chain"></div>
                    <div className="chain-arc v-chain"></div>
                    <span className="padlock-badge">🔒</span>
                  </div>
                )}

                {/* Floating Gold Stars Rating */}
                {isUnlocked && stars > 0 && (
                  <div className="node-stars">
                    {Array(stars).fill(null).map((_, i) => (
                      <span key={i} className="star-gold">★</span>
                    ))}
                  </div>
                )}

                <div className="node-number">
                  {isUnlocked ? (
                    level.id
                  ) : (
                    '' // Hide number when locked, showing padlock instead
                  )}
                </div>

                <div className="node-tooltip">
                  <div className="tooltip-name">{level.name}</div>
                  <div className="tooltip-details">Target: {level.targetCoins} Coins</div>
                  {level.hasAlgae && <span className="badge algae-badge">Algae</span>}
                  {level.hasValves && <span className="badge valve-badge">Valves</span>}
                  {level.id === 5 && <span className="badge ice-badge">Ice</span>}
                  {level.id === 6 && <span className="badge boulder-badge">Boulders</span>}
                  {level.id === 8 && <span className="badge boss-badge">Boss</span>}
                </div>
              </button>
            );
          })}

          {/* Parallax Foreground Layer (Fast scroll speed in opposite direction) */}
          <div className="map-parallax-fg" style={{ transform: `translateX(${-scrollX * 0.18}px)` }}>
            <div className="fg-bubble fb1">🫧</div>
            <div className="fg-bubble fb2">🫧</div>
            <div className="fg-bubble fb3">🫧</div>
            <div className="fg-bubble fb4">🫧</div>
          </div>

        </div>
      </div>

      {/* Floating Bottom Navigation */}
      <div className="map-bottom-controls" style={{ display: 'flex', gap: '10px' }}>
        <button 
          className="map-control-btn help-btn" 
          onClick={() => setIsGuideOpen(true)}
        >
          📖 Survival Guide
        </button>
        <button 
          className="map-control-btn reset-btn" 
          onClick={onResetProgress}
          style={{ borderColor: '#ef4444', color: '#ef4444' }}
        >
          🗑️ Reset Progress
        </button>
      </div>

      {/* Toggleable Glassmorphic Help Drawer */}
      {isGuideOpen && (
        <div className="guide-modal-overlay" onClick={() => setIsGuideOpen(false)}>
          <div className="guide-modal-card animate-bounce-pop" onClick={e => e.stopPropagation()}>
            <div className="guide-modal-header">
              <h2>Dungeon Survival Guide</h2>
              <button className="close-guide-btn" onClick={() => setIsGuideOpen(false)}>×</button>
            </div>
            <div className="guide-modal-body">
              <ul>
                <li>
                  <span className="guide-icon">⭐</span>
                  <div>
                    <strong>Match 4:</strong> Forms <strong>Row/Col Blasters</strong>. Clears entire lines to drain 10% water.
                  </div>
                </li>
                <li>
                  <span className="guide-icon">💣</span>
                  <div>
                    <strong>Match 5 (T/L):</strong> Forms <strong>Dungeon Bombs</strong>. Explodes a 3x3 area to drain 15% water.
                  </div>
                </li>
                <li>
                  <span className="guide-icon">⚡</span>
                  <div>
                    <strong>Match 5 (Line):</strong> Forms <strong>Lightning Gems</strong>. Swapping zaps all matching color gems.
                  </div>
                </li>
                <li>
                  <span className="guide-icon">🧊</span>
                  <div>
                    <strong>Frozen Gems:</strong> Wrapped in ice. Crack them by matching directly or adjacent to free them.
                  </div>
                </li>
                <li>
                  <span className="guide-icon">🪨</span>
                  <div>
                    <strong>Iron Boulders:</strong> Heavy tiles that sink down. Destroy them by matching adjacent candies.
                  </div>
                </li>
                <li>
                  <span className="guide-icon">🌿</span>
                  <div>
                    <strong>Spreading Algae:</strong> Spreads to adjacent tiles if you end a turn without clearing any algae blocks.
                  </div>
                </li>
                <li>
                  <span className="guide-icon">🌊</span>
                  <div>
                    <strong>Buoyancy Line:</strong> Submerged wet zone floats tiles <strong>UP</strong>; dry zone falls <strong>DOWN</strong>.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
