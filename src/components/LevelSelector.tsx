import React, { useState } from 'react';
import { CHAPTERS, type AmbientTheme } from '../services/storyData';
import { LEVELS } from '../services/boardLogic';
import './LevelSelector.css';

interface LevelSelectorProps {
  highestLevelUnlocked: number;
  levelStars: Record<number, number>;
  onSelectLevel: (levelId: number) => void;
  onResetProgress: () => void;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

const CHAPTER_EMOJI: Record<AmbientTheme, string> = {
  warm: '🕯️', rose: '🌹', cold: '❄️', dark: '🌑', battle: '⚔️', ethereal: '✨',
};

interface ChapterTheme {
  accent: string;
  light: string;
  colBg: string;
  colBorder: string;
  nodeDone: string;
  nodeDoneBorder: string;
  glow: string;
  textDark: string;
}

const THEME: Record<AmbientTheme, ChapterTheme> = {
  warm:     { accent: '#c87808', light: '#fef3c7', colBg: 'rgba(254,243,199,0.55)', colBorder: 'rgba(200,120,8,0.2)',   nodeDone: 'radial-gradient(circle at 38% 32%, #fde68a, #b45309)', nodeDoneBorder: '#f59e0b', glow: 'rgba(245,158,11,0.5)',  textDark: '#78350f' },
  rose:     { accent: '#be185d', light: '#fce7f3', colBg: 'rgba(252,231,243,0.55)', colBorder: 'rgba(190,24,93,0.2)',   nodeDone: 'radial-gradient(circle at 38% 32%, #fbcfe8, #9d174d)',  nodeDoneBorder: '#ec4899', glow: 'rgba(236,72,153,0.5)',  textDark: '#831843' },
  cold:     { accent: '#1d4ed8', light: '#dbeafe', colBg: 'rgba(219,234,254,0.55)', colBorder: 'rgba(29,78,216,0.2)',   nodeDone: 'radial-gradient(circle at 38% 32%, #bfdbfe, #1e40af)',  nodeDoneBorder: '#3b82f6', glow: 'rgba(59,130,246,0.5)',  textDark: '#1e3a8a' },
  dark:     { accent: '#6d28d9', light: '#ede9fe', colBg: 'rgba(237,233,254,0.55)', colBorder: 'rgba(109,40,217,0.2)',  nodeDone: 'radial-gradient(circle at 38% 32%, #ddd6fe, #5b21b6)',  nodeDoneBorder: '#8b5cf6', glow: 'rgba(139,92,246,0.5)', textDark: '#4c1d95' },
  battle:   { accent: '#b91c1c', light: '#fee2e2', colBg: 'rgba(254,226,226,0.55)', colBorder: 'rgba(185,28,28,0.2)',   nodeDone: 'radial-gradient(circle at 38% 32%, #fca5a5, #991b1b)',  nodeDoneBorder: '#ef4444', glow: 'rgba(239,68,68,0.5)',   textDark: '#7f1d1d' },
  ethereal: { accent: '#065f46', light: '#d1fae5', colBg: 'rgba(209,250,229,0.55)', colBorder: 'rgba(6,95,70,0.2)',    nodeDone: 'radial-gradient(circle at 38% 32%, #6ee7b7, #064e3b)',  nodeDoneBorder: '#10b981', glow: 'rgba(16,185,129,0.5)', textDark: '#064e3b' },
};

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  highestLevelUnlocked,
  levelStars,
  onSelectLevel,
  onResetProgress,
}) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);

  const totalCompleted = Math.max(0, highestLevelUnlocked - 1);
  const currentChapter = CHAPTERS.find(ch =>
    ch.levels.some(l => l.levelNumber === highestLevelUnlocked)
  );

  return (
    <div className="sb-screen">

      {/* ── Light parchment header ─────────────────── */}
      <div className="sb-header">
        <div className="sb-header-left">
          {currentChapter && (
            <>
              <span className="sb-header-emoji">{CHAPTER_EMOJI[currentChapter.ambientTheme]}</span>
              <div className="sb-header-info">
                <span className="sb-header-chapter">
                  Ch. {ROMAN[currentChapter.chapterNumber - 1]} · {currentChapter.title}
                </span>
                <span className="sb-header-sub">{currentChapter.subtitle}</span>
              </div>
            </>
          )}
        </div>
        <div className="sb-header-right">
          <span className="sb-progress">{totalCompleted} / 30</span>
          <button className="sb-btn-outline" onClick={() => setIsGuideOpen(true)}>?</button>
          <button className="sb-btn-outline sb-btn-reset" onClick={onResetProgress}>↺ Reset</button>
        </div>
      </div>

      {/* ── 6 Chapter columns ─────────────────────── */}
      <div className="sb-columns">
        {CHAPTERS.map((ch, ci) => {
          const theme = THEME[ch.ambientTheme];
          const chapterFirstLevel = ch.levels[0].levelNumber;
          const chapterLastLevel  = ch.levels[ch.levels.length - 1].levelNumber;
          const isChapterUnlocked = highestLevelUnlocked >= chapterFirstLevel;
          const isChapterComplete = highestLevelUnlocked > chapterLastLevel;
          const isChapterCurrent  = !isChapterComplete && isChapterUnlocked;

          return (
            <div
              key={ch.chapterNumber}
              className={`sb-col ${isChapterUnlocked ? 'col-unlocked' : 'col-locked'} ${isChapterCurrent ? 'col-current' : ''}`}
              style={{
                '--col-bg': theme.colBg,
                '--col-border': theme.colBorder,
                '--col-accent': theme.accent,
                '--col-glow': theme.glow,
              } as React.CSSProperties}
            >
              {/* Chapter header card */}
              <div
                className="sb-chap-header"
                style={{
                  background: isChapterUnlocked ? theme.light : 'rgba(245,240,230,0.5)',
                  borderColor: isChapterUnlocked ? theme.colBorder : 'rgba(180,170,150,0.2)',
                  opacity: isChapterUnlocked ? 1 : 0.45,
                }}
              >
                <span className="sb-chap-emoji">{CHAPTER_EMOJI[ch.ambientTheme]}</span>
                <span className="sb-chap-roman" style={{ color: isChapterUnlocked ? theme.accent : '#b0a898' }}>
                  {ROMAN[ci]}
                </span>
                <span className="sb-chap-title" style={{ color: isChapterUnlocked ? theme.textDark : '#b0a898' }}>
                  {ch.title}
                </span>
                <span className="sb-chap-sub" style={{ color: isChapterUnlocked ? theme.accent : '#c0b8a8' }}>
                  {ch.subtitle}
                </span>
                {isChapterComplete && (
                  <span className="sb-chap-complete-badge" style={{ background: theme.light, color: theme.accent, borderColor: theme.colBorder }}>
                    ✓ Done
                  </span>
                )}
              </div>

              {/* Level nodes */}
              <div className="sb-nodes">
                {ch.levels.map((lv, li) => {
                  const id = lv.levelNumber;
                  const isCompleted = id < highestLevelUnlocked;
                  const isCurrent   = id === highestLevelUnlocked;
                  const isLocked    = id > highestLevelUnlocked;
                  const hasConfig   = !!LEVELS[id];
                  const isPlayable  = !isLocked && hasConfig;
                  const stars = levelStars[id] ?? 0;
                  const isHovered = hoveredLevel === id;

                  let nodeBg: string;
                  let nodeShadow: string;
                  let nodeBorder: string;

                  if (isCompleted) {
                    nodeBg = theme.nodeDone;
                    nodeShadow = `0 4px 12px ${theme.glow}, 0 2px 4px rgba(0,0,0,0.1)`;
                    nodeBorder = `2px solid ${theme.nodeDoneBorder}`;
                  } else if (isCurrent) {
                    nodeBg = `radial-gradient(circle at 38% 32%, #ffffff, #fef3c7)`;
                    nodeShadow = `0 0 0 3px ${theme.accent}, 0 0 20px ${theme.glow}, 0 4px 14px rgba(0,0,0,0.15)`;
                    nodeBorder = `2px solid #fff`;
                  } else {
                    nodeBg = 'radial-gradient(circle at 38% 32%, rgba(255,255,255,0.6), rgba(210,205,195,0.5))';
                    nodeShadow = 'none';
                    nodeBorder = '1.5px solid rgba(180,170,155,0.3)';
                  }

                  // Node size — staggered slightly per position for organic feel
                  const sizes = [44, 42, 46, 42, 44];
                  const baseSize = isCurrent ? 54 : isCompleted ? sizes[li] : 36;

                  return (
                    <div key={id} className="sb-node-wrapper">
                      {/* Connector dot between nodes */}
                      {li > 0 && (
                        <div
                          className="sb-connector"
                          style={{
                            background: isCompleted || (isCurrent && li <= (highestLevelUnlocked - chapterFirstLevel))
                              ? theme.accent
                              : 'rgba(180,165,140,0.25)',
                          }}
                        />
                      )}

                      <div className="sb-node-row">
                        {/* Star badge left */}
                        {isCompleted && stars > 0 && (
                          <div className="sb-stars">
                            {'★'.repeat(stars)}{'☆'.repeat(3 - stars)}
                          </div>
                        )}

                        {/* The node */}
                        <div
                          className={`sb-node ${isCurrent ? 'sb-node-current' : ''} ${isLocked ? 'sb-node-locked' : ''}`}
                          style={{
                            width: baseSize,
                            height: baseSize,
                            background: nodeBg,
                            boxShadow: nodeShadow,
                            border: nodeBorder,
                            opacity: isLocked ? 0.38 : 1,
                            cursor: isPlayable ? 'pointer' : isLocked ? 'not-allowed' : 'default',
                            transform: isHovered && isPlayable ? 'scale(1.15)' : 'scale(1)',
                          }}
                          onClick={() => isPlayable && onSelectLevel(id)}
                          onMouseEnter={() => setHoveredLevel(id)}
                          onMouseLeave={() => setHoveredLevel(null)}
                          role={isPlayable ? 'button' : undefined}
                          tabIndex={isPlayable ? 0 : undefined}
                          onKeyDown={e => e.key === 'Enter' && isPlayable && onSelectLevel(id)}
                        >
                          {/* Crown above current */}
                          {isCurrent && (
                            <div className="sb-crown">
                              <svg viewBox="0 0 24 18" width="28" height="21">
                                <defs>
                                  <linearGradient id={`cg-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#ffe082" />
                                    <stop offset="100%" stopColor="#b78600" />
                                  </linearGradient>
                                </defs>
                                <path d="M1,16 L23,16 L21,5 L17,10 L12,3 L7,10 L3,5 Z" fill={`url(#cg-${id})`} stroke="#9c6d00" strokeWidth="0.8" />
                                <circle cx="12" cy="3" r="1.2" fill="#ffe082" />
                                <circle cx="3"  cy="5" r="1.2" fill="#ffe082" />
                                <circle cx="21" cy="5" r="1.2" fill="#ffe082" />
                              </svg>
                            </div>
                          )}

                          {/* Level number */}
                          <span
                            className="sb-node-num"
                            style={{
                              color: isLocked ? 'rgba(120,110,95,0.4)'
                                : isCompleted ? 'rgba(255,255,255,0.95)'
                                : isCurrent ? theme.textDark
                                : 'rgba(120,110,95,0.4)',
                              fontSize: isCurrent ? 16 : 13,
                            }}
                          >
                            {isLocked ? '🔒' : id}
                          </span>
                        </div>

                        {/* Tooltip on hover */}
                        {!isLocked && isHovered && (
                          <div className={`sb-tooltip ${ch.chapterNumber >= 5 ? 'tooltip-left' : ''}`} style={{ borderColor: theme.colBorder }}>
                            <div className="sb-tooltip-title" style={{ color: theme.textDark }}>{lv.title}</div>
                            <div className="sb-tooltip-detail" style={{ color: theme.accent }}>
                              {isCurrent && isPlayable ? '▶ Tap to play'
                                : isCurrent ? 'Coming soon'
                                : isCompleted ? `✓ Complete${stars > 0 ? ' · ' + '★'.repeat(stars) : ''}`
                                : ''}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Guide modal ───────────────────────────── */}
      {isGuideOpen && (
        <div className="guide-modal-overlay" onClick={() => setIsGuideOpen(false)}>
          <div className="guide-modal-card animate-bounce-pop" onClick={e => e.stopPropagation()}>
            <div className="guide-modal-header">
              <h2>Survival Guide</h2>
              <button className="close-guide-btn" onClick={() => setIsGuideOpen(false)}>×</button>
            </div>
            <div className="guide-modal-body">
              <ul>
                <li><span className="guide-icon">⭐</span><div><strong>Match 4:</strong> Forms <strong>Row/Col Blasters</strong>. Clears entire lines.</div></li>
                <li><span className="guide-icon">💣</span><div><strong>Match 5 (T/L):</strong> Forms <strong>Dungeon Bombs</strong>. Explodes 3×3.</div></li>
                <li><span className="guide-icon">⚡</span><div><strong>Match 5 (Line):</strong> Forms <strong>Lightning Gems</strong>. Zaps all matching colours.</div></li>
                <li><span className="guide-icon">🧊</span><div><strong>Frozen Gems:</strong> Match adjacent to crack ice.</div></li>
                <li><span className="guide-icon">🪨</span><div><strong>Iron Boulders:</strong> Sink downward — destroy by matching adjacent.</div></li>
                <li><span className="guide-icon">🌿</span><div><strong>Spreading Algae:</strong> Spreads each turn without clearing it.</div></li>
                <li><span className="guide-icon">🌊</span><div><strong>Buoyancy Line:</strong> Wet zone floats <strong>UP</strong>; dry zone falls <strong>DOWN</strong>.</div></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
