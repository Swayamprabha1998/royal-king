import React, { useState, useEffect } from 'react';
import { CHAPTERS } from '../services/storyData';
import './ChapterSealScreen.css';

interface ChapterSealScreenProps {
  completedChapterNumber: number; // 1–5 (chapter 6 uses QueenAwakeningScreen)
  score: number;
  movesRemaining: number;
  coinsCollected: number;
  targetCoins: number;
  onNextLevel: () => void;
  onBackToMap: () => void;
}

const SEAL_DEFS = [
  { emoji: '🕯️', label: 'Warmth',    theme: 'warm',     chapterNum: 1 },
  { emoji: '🌹', label: 'Rose',      theme: 'rose',     chapterNum: 2 },
  { emoji: '❄️', label: 'Frost',     theme: 'cold',     chapterNum: 3 },
  { emoji: '🌑', label: 'Nightmare', theme: 'dark',     chapterNum: 4 },
  { emoji: '⚔️', label: 'Battle',    theme: 'battle',   chapterNum: 5 },
  { emoji: '✨', label: 'Ethereal',  theme: 'ethereal', chapterNum: 6 },
];

// Positions around circle (6 nodes equally spaced, starting from top)
const SEAL_POSITIONS = SEAL_DEFS.map((_, i) => {
  const angle = (i * 60 - 90) * (Math.PI / 180);
  return {
    left: 130 + 108 * Math.cos(angle),
    top:  130 + 108 * Math.sin(angle),
  };
});

export const ChapterSealScreen: React.FC<ChapterSealScreenProps> = ({
  completedChapterNumber,
  score,
  movesRemaining,
  coinsCollected,
  targetCoins,
  onNextLevel,
  onBackToMap,
}) => {
  const [phase, setPhase] = useState<'ritual' | 'burst' | 'verse' | 'complete'>('ritual');
  const [visibleVerseLines, setVisibleVerseLines] = useState(0);

  const chapter = CHAPTERS[completedChapterNumber - 1];
  const verse = chapter?.chapterVerse ?? ['', '', '', ''];

  // After burst, show verse lines then auto-advance to complete
  useEffect(() => {
    if (phase !== 'verse') return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    [0, 1, 2, 3].forEach(i => {
      timers.push(setTimeout(() => setVisibleVerseLines(i + 1), 400 + i * 750));
    });
    timers.push(setTimeout(() => setPhase('complete'), 4000));
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  const handleSealClick = () => {
    if (phase !== 'ritual') return;
    setPhase('burst');
    setTimeout(() => {
      setVisibleVerseLines(0);
      setPhase('verse');
    }, 1000);
  };

  return (
    <div className={`chs-overlay chs-phase-${phase}`}>

      {/* ── PHASE 1: RITUAL — seal circle ── */}
      {phase === 'ritual' && (
        <div className="chs-ritual-wrap">
          <div className="chs-header">
            <h1 className="chs-title">Chapter {completedChapterNumber} Complete</h1>
            <p className="chs-subtitle">
              {chapter?.title} — seal the memory to move forward.
            </p>
          </div>

          {/* Seals circle */}
          <div className="chs-circle-container">
            {/* Centre queen core */}
            <div className="chs-queen-core">
              <div className="chs-queen-avatar" />
              <div className="chs-pulse-ring" />
              <div className="chs-pulse-ring chs-ring-2" />
            </div>

            {SEAL_DEFS.map((seal, i) => {
              const pos = SEAL_POSITIONS[i];
              const isCompleted  = seal.chapterNum < completedChapterNumber;
              const isCurrent    = seal.chapterNum === completedChapterNumber;
              const isLocked     = seal.chapterNum > completedChapterNumber;

              return (
                <div
                  key={seal.chapterNum}
                  className={[
                    'chs-seal',
                    `chs-seal--${seal.theme}`,
                    isCompleted  ? 'chs-seal--broken'      : '',
                    isCurrent    ? 'chs-seal--active'      : '',
                    isLocked     ? 'chs-seal--locked'      : '',
                  ].filter(Boolean).join(' ')}
                  style={{ left: pos.left, top: pos.top }}
                  onClick={isCurrent ? handleSealClick : undefined}
                >
                  <span className="chs-seal-emoji">{seal.emoji}</span>
                  <div className="chs-seal-label">{seal.label}</div>
                  {isCurrent && <div className="chs-seal-glow-ring" />}
                </div>
              );
            })}
          </div>

          <p className="chs-prompt bounce">
            Tap the <strong>{SEAL_DEFS[completedChapterNumber - 1].label}</strong> seal to seal this chapter
          </p>
        </div>
      )}

      {/* ── PHASE 2: BURST ── */}
      {phase === 'burst' && (
        <div className="chs-burst-wrap">
          <div className="chs-white-flash" />
          <div className="chs-expanding-ring" />
        </div>
      )}

      {/* ── PHASE 3: VERSE ── */}
      {phase === 'verse' && (
        <div className="chs-verse-wrap">
          <div className="chs-verse-emoji">{SEAL_DEFS[completedChapterNumber - 1].emoji}</div>
          <div className="chs-verse-lines">
            {verse.map((line, i) => (
              <p key={i} className={`chs-verse-line ${visibleVerseLines > i ? 'chs-line-show' : ''}`}>
                {line}
              </p>
            ))}
          </div>
          <p className="chs-verse-subtitle">— {chapter?.title} —</p>
        </div>
      )}

      {/* ── PHASE 4: COMPLETE ── */}
      {phase === 'complete' && (
        <div className="chs-complete-wrap animate-slide-up">
          <div className="chs-complete-card">
            <div className="chs-complete-header">
              <div className="chs-complete-badge">{SEAL_DEFS[completedChapterNumber - 1].emoji}</div>
              <h2 className="chs-complete-title">{chapter?.title}</h2>
              <p className="chs-complete-sub">{chapter?.subtitle}</p>
            </div>

            {/* Stars earned */}
            <div className="chs-stars-row">
              {[1, 2, 3].map(n => {
                const stars = parseInt(
                  localStorage.getItem(`royal_rescue_stars_level_${completedChapterNumber * 5}`) || '0'
                );
                return (
                  <span key={n} className={`chs-star ${stars >= n ? 'chs-star--lit' : ''}`}>★</span>
                );
              })}
            </div>

            <div className="chs-stats-grid">
              <div className="chs-stat">
                <span className="chs-stat-val">{coinsCollected} / {targetCoins}</span>
                <span className="chs-stat-lbl">Coins</span>
              </div>
              <div className="chs-stat">
                <span className="chs-stat-val">{score.toLocaleString()}</span>
                <span className="chs-stat-lbl">Score</span>
              </div>
              <div className="chs-stat">
                <span className="chs-stat-val">{movesRemaining}</span>
                <span className="chs-stat-lbl">Moves Left</span>
              </div>
            </div>

            <div className="chs-actions">
              <button className="chs-btn chs-btn--primary" onClick={onNextLevel}>
                ✦ Next Chapter
              </button>
              <button className="chs-btn chs-btn--secondary" onClick={onBackToMap}>
                ◀ Return to Map
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
