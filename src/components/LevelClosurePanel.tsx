// ═══════════════════════════════════════════════════════
//  LevelClosurePanel — Step 3: Victory closure screen
//  Shows closure verse + prose sentence + stats
//  Replaces the generic victory modal
// ═══════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { getLevelStory, getChapterForLevel, isLastLevelOfChapter } from '../services/storyData';
import './LevelClosurePanel.css';

interface LevelClosurePanelProps {
  levelId: number;
  score: number;
  movesRemaining: number;
  coinsCollected: number;
  targetCoins: number;
  onNextLevel: () => void;
  onBackToMap: () => void;
}

export const LevelClosurePanel: React.FC<LevelClosurePanelProps> = ({
  levelId,
  score,
  movesRemaining,
  coinsCollected,
  targetCoins,
  onNextLevel,
  onBackToMap,
}) => {
  const story = getLevelStory(levelId);
  const chapter = getChapterForLevel(levelId);
  const isChapterEnd = isLastLevelOfChapter(levelId);
  const isGameEnd = levelId >= 30;

  // Staggered line reveal
  const [visibleLines, setVisibleLines] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showSealBurst, setShowSealBurst] = useState(false);

  useEffect(() => {
    if (!story) {
      setVisibleLines(4);
      setShowStats(true);
      setShowActions(true);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    [0, 1, 2, 3].forEach(i => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), 400 + i * 500));
    });
    timers.push(setTimeout(() => setShowStats(true), 400 + 4 * 500 + 200));
    timers.push(setTimeout(() => setShowActions(true), 400 + 4 * 500 + 700));
    // Seal burst fires on chapter-end levels after a short delay
    if (isChapterEnd) {
      timers.push(setTimeout(() => setShowSealBurst(true), 300));
      timers.push(setTimeout(() => setShowSealBurst(false), 1800));
    }
    return () => timers.forEach(clearTimeout);
  }, [story, isChapterEnd]);

  const theme = chapter?.ambientTheme ?? 'warm';

  // 16 burst particles radiating outward
  const sealParticles = Array.from({ length: 16 }, (_, i) => ({
    angle: (i / 16) * 360,
    delay: i * 40,
    size: 6 + (i % 3) * 3,
  }));

  return (
    <div className={`closure-overlay closure-theme-${theme}`}>
      {/* Seal-break particle burst — chapter finale only */}
      {showSealBurst && (
        <div className="seal-burst-container">
          {sealParticles.map((p, i) => (
            <div
              key={i}
              className="seal-burst-particle"
              style={{
                '--angle': `${p.angle}deg`,
                '--size': `${p.size}px`,
                animationDelay: `${p.delay}ms`,
              } as React.CSSProperties}
            />
          ))}
          <div className="seal-burst-ring" />
          <div className="seal-burst-ring seal-burst-ring-2" />
        </div>
      )}
      <div className="closure-card">

        {/* Chapter badge */}
        <div className="closure-chapter-badge">
          {chapter ? `${chapter.title}` : 'Chamber Clear'}
          {isChapterEnd && !isGameEnd && (
            <span className="closure-chapter-end-tag">Chapter Complete</span>
          )}
        </div>

        {/* Level title */}
        {story && (
          <h2 className="closure-level-title">{story.title}</h2>
        )}

        {/* Verse lines — staggered reveal */}
        {story && (
          <div className="closure-verse">
            {story.closureVerse.map((line, i) => (
              <p
                key={i}
                className={`closure-verse-line ${visibleLines > i ? 'visible' : ''}`}
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                {line}
              </p>
            ))}
          </div>
        )}

        {/* Prose closure sentence */}
        {story && (
          <p className={`closure-sentence ${showStats ? 'visible' : ''}`}>
            {story.closureSentence}
          </p>
        )}

        {/* Divider */}
        <div className={`closure-divider ${showStats ? 'visible' : ''}`} />

        {/* Stats row */}
        <div className={`closure-stats ${showStats ? 'visible' : ''}`}>
          <div className="closure-stat">
            <span className="closure-stat-label">Score</span>
            <span className="closure-stat-value">{score.toLocaleString()}</span>
          </div>
          <div className="closure-stat">
            <span className="closure-stat-label">Coins</span>
            <span className="closure-stat-value">{coinsCollected} / {targetCoins}</span>
          </div>
          <div className="closure-stat">
            <span className="closure-stat-label">Moves Left</span>
            <span className="closure-stat-value">{movesRemaining}</span>
          </div>
        </div>

        {/* Actions */}
        <div className={`closure-actions ${showActions ? 'visible' : ''}`}>
          {isGameEnd ? (
            <button className="closure-btn primary" onClick={onBackToMap}>
              ✦ Return to the Kingdom
            </button>
          ) : (
            <button className="closure-btn primary" onClick={onNextLevel}>
              {isChapterEnd ? '✦ Enter Next Chapter' : '✦ Next Chamber'}
            </button>
          )}
          <button className="closure-btn secondary" onClick={onBackToMap}>
            Back to Map
          </button>
        </div>

      </div>
    </div>
  );
};
