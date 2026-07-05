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

  useEffect(() => {
    if (!story) {
      setVisibleLines(4);
      setShowStats(true);
      setShowActions(true);
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Reveal each verse line with a delay
    [0, 1, 2, 3].forEach(i => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), 400 + i * 500));
    });
    // Prose sentence after last verse line
    timers.push(setTimeout(() => setShowStats(true), 400 + 4 * 500 + 200));
    timers.push(setTimeout(() => setShowActions(true), 400 + 4 * 500 + 700));
    return () => timers.forEach(clearTimeout);
  }, [story]);

  const theme = chapter?.ambientTheme ?? 'warm';

  return (
    <div className={`closure-overlay closure-theme-${theme}`}>
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
