import React, { useState, useRef, useEffect } from 'react';
import type { GridState, TileType } from '../services/boardLogic';
import type { AmbientTheme } from '../services/storyData';
import './GameBoard.css';

interface FiredPowerUp {
  id: string;
  r: number;
  c: number;
  type: 'blast_row' | 'blast_col' | 'bomb' | 'lightning';
}

interface GameBoardProps {
  grid: GridState;
  selectedTile: { r: number; c: number } | null;
  waterLevelRow: number;
  isBoardLocked: boolean;
  onSelectTile: (r: number, c: number) => void;
  onSwapTiles: (r1: number, c1: number, r2: number, c2: number) => void;
  brokenTiles: { id: string; r: number; c: number; type: TileType }[];
  firedPowerUps: FiredPowerUp[];
  firedValveDrain: string[];
  ambientTheme?: AmbientTheme;
  levelId?: number;
}

// Per-chapter gem colour palettes (5 gems: ruby, sapphire, emerald, amethyst + accent)
const THEME_GEMS: Record<AmbientTheme, {
  ruby: [string, string];
  sapphire: [string, string];
  emerald: [string, string];
  amethyst: [string, string];
  boardBg: string;
  boardBorder: string;
  cellBg: string;
  shardRuby: string;
  shardSapphire: string;
  shardEmerald: string;
  shardAmethyst: string;
}> = {
  warm: {
    ruby:     ['#f5a020', '#c05808'],  // amber → burnt orange
    sapphire: ['#e86020', '#a03010'],  // terracotta → deep red
    emerald:  ['#f0c840', '#b08010'],  // gold → dark gold
    amethyst: ['#e07820', '#803010'],  // amber-red → mahogany
    boardBg:    'rgba(255, 248, 235, 0.72)',
    boardBorder: 'rgba(200, 140, 40, 0.35)',
    cellBg:     'rgba(255, 235, 190, 0.35)',
    shardRuby: '#f5a020', shardSapphire: '#e86020', shardEmerald: '#f0c840', shardAmethyst: '#e07820',
  },
  rose: {
    ruby:     ['#f080b0', '#c02060'],  // blush → deep rose
    sapphire: ['#e04080', '#901040'],  // hot pink → crimson
    emerald:  ['#f8a0c8', '#d04080'],  // light pink → magenta
    amethyst: ['#c03060', '#800030'],  // rose → dark burgundy
    boardBg:    'rgba(255, 245, 250, 0.72)',
    boardBorder: 'rgba(200, 80, 120, 0.3)',
    cellBg:     'rgba(255, 220, 235, 0.3)',
    shardRuby: '#f080b0', shardSapphire: '#e04080', shardEmerald: '#f8a0c8', shardAmethyst: '#c03060',
  },
  cold: {
    ruby:     ['#60c8f8', '#0860b0'],  // ice blue → deep blue
    sapphire: ['#40a8e8', '#043880'],  // sky → navy
    emerald:  ['#a0e0f8', '#2080c0'],  // pale ice → cerulean
    amethyst: ['#80c0f0', '#1050a0'],  // powder blue → cobalt
    boardBg:    'rgba(240, 250, 255, 0.75)',
    boardBorder: 'rgba(40, 140, 210, 0.3)',
    cellBg:     'rgba(210, 235, 255, 0.3)',
    shardRuby: '#60c8f8', shardSapphire: '#40a8e8', shardEmerald: '#a0e0f8', shardAmethyst: '#80c0f0',
  },
  dark: {
    ruby:     ['#c090f8', '#6020c0'],  // lavender → deep purple
    sapphire: ['#9060e0', '#400890'],  // violet → indigo
    emerald:  ['#e0b0f8', '#8040d0'],  // pale violet → purple
    amethyst: ['#a070e8', '#501080'],  // amethyst → midnight
    boardBg:    'rgba(248, 244, 255, 0.72)',
    boardBorder: 'rgba(140, 80, 220, 0.3)',
    cellBg:     'rgba(230, 210, 255, 0.3)',
    shardRuby: '#c090f8', shardSapphire: '#9060e0', shardEmerald: '#e0b0f8', shardAmethyst: '#a070e8',
  },
  battle: {
    ruby:     ['#f87050', '#c01810'],  // flame → dark crimson
    sapphire: ['#e84030', '#901008'],  // red-orange → blood red
    emerald:  ['#fca080', '#d03010'],  // light flame → deep red
    amethyst: ['#d03020', '#800808'],  // crimson → dark red
    boardBg:    'rgba(255, 245, 242, 0.72)',
    boardBorder: 'rgba(200, 50, 30, 0.3)',
    cellBg:     'rgba(255, 220, 210, 0.3)',
    shardRuby: '#f87050', shardSapphire: '#e84030', shardEmerald: '#fca080', shardAmethyst: '#d03020',
  },
  ethereal: {
    ruby:     ['#50d8c8', '#088888'],  // teal → deep teal
    sapphire: ['#20b8c0', '#045868'],  // cyan → dark teal
    emerald:  ['#90e8e0', '#18a0a8'],  // pale cyan → teal
    amethyst: ['#40c8c0', '#066878'],  // seafoam → ocean
    boardBg:    'rgba(240, 254, 252, 0.75)',
    boardBorder: 'rgba(20, 170, 170, 0.3)',
    cellBg:     'rgba(200, 245, 245, 0.3)',
    shardRuby: '#50d8c8', shardSapphire: '#20b8c0', shardEmerald: '#90e8e0', shardAmethyst: '#40c8c0',
  },
};

interface Shard {
  id: string;
  x: number;
  y: number;
  color: string;
  dx: number;
  dy: number;
  rot: number;
  delay: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  grid,
  selectedTile,
  waterLevelRow,
  isBoardLocked,
  onSelectTile,
  onSwapTiles,
  brokenTiles,
  firedPowerUps,
  firedValveDrain,
  ambientTheme = 'warm',
  levelId,
}) => {
  const t = THEME_GEMS[ambientTheme];
  const [swipeStart, setSwipeStart] = useState<{ r: number; c: number; x: number; y: number } | null>(null);
  const [shards, setShards] = useState<Shard[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const processedBrokenIdsRef = useRef<Set<string>>(new Set());

  // ── L2 waterline hint — one-time callout ──────────────────────
  const hintKey = 'royal_rescue_waterline_hint_seen';
  const [showWaterlineHint, setShowWaterlineHint] = useState<boolean>(
    () => levelId === 2 && !localStorage.getItem(hintKey)
  );
  useEffect(() => {
    if (!showWaterlineHint) return;
    const t = setTimeout(() => {
      setShowWaterlineHint(false);
      localStorage.setItem(hintKey, '1');
    }, 5000);
    return () => clearTimeout(t);
  }, [showWaterlineHint]);
  const dismissHint = () => {
    setShowWaterlineHint(false);
    localStorage.setItem(hintKey, '1');
  };

  // ── L3 valve hint — contextual tooltip on first valve tile ───
  const valveHintKey = 'royal_rescue_valve_hint_seen';
  const [showValveHint, setShowValveHint] = useState<boolean>(
    () => levelId === 3 && !localStorage.getItem(valveHintKey)
  );
  useEffect(() => {
    if (!showValveHint) return;
    const timer = setTimeout(() => {
      setShowValveHint(false);
      localStorage.setItem(valveHintKey, '1');
    }, 5000);
    return () => clearTimeout(timer);
  }, [showValveHint]);
  const dismissValveHint = () => {
    setShowValveHint(false);
    localStorage.setItem(valveHintKey, '1');
  };

  // Find first valve position in the grid
  let firstValve: { r: number; c: number } | null = null;
  if (showValveHint) {
    outer: for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c]?.type === 'valve') { firstValve = { r, c }; break outer; }
      }
    }
  }

  // 1. Matched jewels breaking particles logic (fires on initial swaps & cascade matches)
  useEffect(() => {
    if (!brokenTiles || brokenTiles.length === 0) return;

    const processedIds = processedBrokenIdsRef.current;
    const newShards: Shard[] = [];
    const colorsMap: Record<TileType, string> = {
      ruby:     '#ff2d55',
      sapphire: '#007aff',
      emerald:  '#4cd964',
      amethyst: '#5856d6',
      coin:     '#ffeb60',
      valve:    '#8a9baf',
      boulder:  '#475569'
    };

    brokenTiles.forEach(tile => {
      if (processedIds.has(tile.id)) return;
      processedIds.add(tile.id);

      const color = colorsMap[tile.type] || '#ffffff';
      const cellCenterX = tile.c * 12.5 + 6.25;
      const cellCenterY = tile.r * 12.5 + 6.25;

      // Generate 8 shards blowing outwards
      for (let i = 0; i < 8; i++) {
        const angle = (i * 45 * Math.PI) / 180 + (Math.random() * 0.4 - 0.2);
        const speed = Math.random() * 22 + 18;
        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed;
        const rot = Math.random() * 720 - 360;
        const delay = Math.random() * 0.08;

        newShards.push({
          id: `shard_${tile.id}_${i}`,
          x: cellCenterX,
          y: cellCenterY,
          color,
          dx,
          dy,
          rot,
          delay
        });
      }
    });

    if (newShards.length > 0) {
      setShards(prev => [...prev, ...newShards]);
      // Remove shards after animation finishes (850ms)
      setTimeout(() => {
        setShards(prev => prev.filter(s => !newShards.includes(s)));
      }, 850);
    }
  }, [brokenTiles]);

  // Render full-size SVG icon for power-up tiles
  const renderPowerUpIcon = (powerUp: 'blast_row' | 'blast_col' | 'bomb' | 'lightning' | 'chain_breaker') => {
    switch (powerUp) {
      case 'chain_breaker':
        return (
          <svg viewBox="0 0 40 40" className="tile-svg powerup-icon-svg chain-breaker-icon">
            <defs>
              <linearGradient id="chain-breaker-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e0f2fe" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              <filter id="ice-glow">
                <feGaussianBlur stdDeviation="1" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {/* Shimmer backing */}
            <circle cx="20" cy="20" r="15" fill="rgba(56,189,248,0.22)" />
            {/* Ice crystal star shape */}
            <path
              d="M20,4 L23,15 L34,12 L26,20 L34,28 L23,25 L20,36 L17,25 L6,28 L14,20 L6,12 L17,15 Z"
              fill="url(#chain-breaker-grad)"
              stroke="#0369a1"
              strokeWidth="1.2"
              filter="url(#ice-glow)"
            />
            {/* Inner lightning/spark center */}
            <polygon points="21,11 15,22 20,22 19,29 25,18 20,18" fill="#ffffff" />
          </svg>
        );
      case 'lightning':
        return (
          <svg viewBox="0 0 40 40" className="tile-svg powerup-icon-svg">
            <defs>
              <linearGradient id="lightning-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff176" />
                <stop offset="100%" stopColor="#f9a825" />
              </linearGradient>
              <filter id="lightning-glow">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {/* Glow halo */}
            <ellipse cx="20" cy="20" rx="14" ry="14" fill="rgba(255,235,59,0.18)" />
            {/* Lightning bolt */}
            <polygon
              points="23,4 10,22 19,22 17,36 30,18 21,18"
              fill="url(#lightning-grad)"
              stroke="#f57f17"
              strokeWidth="1.2"
              filter="url(#lightning-glow)"
            />
            {/* Highlight */}
            <polygon points="23,4 19,13 23,13" fill="rgba(255,255,255,0.55)" />
          </svg>
        );
      case 'blast_row':
        return (
          <svg viewBox="0 0 40 40" className="tile-svg powerup-icon-svg">
            <defs>
              <linearGradient id="blast-row-grad" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#00e5ff" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#00e5ff" />
              </linearGradient>
            </defs>
            {/* Beam glow */}
            <rect x="2" y="17" width="36" height="6" rx="3" fill="rgba(0,229,255,0.25)" />
            {/* Beam core */}
            <rect x="2" y="18.5" width="36" height="3" rx="1.5" fill="url(#blast-row-grad)" />
            {/* Left arrow */}
            <polygon points="8,20 15,14 15,26" fill="#00e5ff" stroke="#006064" strokeWidth="0.8" />
            {/* Right arrow */}
            <polygon points="32,20 25,14 25,26" fill="#00e5ff" stroke="#006064" strokeWidth="0.8" />
            {/* Center star */}
            <circle cx="20" cy="20" r="3.5" fill="#ffffff" stroke="#00acc1" strokeWidth="1" />
            <circle cx="20" cy="20" r="1.8" fill="#00e5ff" />
          </svg>
        );
      case 'blast_col':
        return (
          <svg viewBox="0 0 40 40" className="tile-svg powerup-icon-svg">
            <defs>
              <linearGradient id="blast-col-grad" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#40c4ff" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#40c4ff" />
              </linearGradient>
            </defs>
            {/* Beam glow */}
            <rect x="17" y="2" width="6" height="36" rx="3" fill="rgba(64,196,255,0.25)" />
            {/* Beam core */}
            <rect x="18.5" y="2" width="3" height="36" rx="1.5" fill="url(#blast-col-grad)" />
            {/* Top arrow */}
            <polygon points="20,8 14,15 26,15" fill="#40c4ff" stroke="#01579b" strokeWidth="0.8" />
            {/* Bottom arrow */}
            <polygon points="20,32 14,25 26,25" fill="#40c4ff" stroke="#01579b" strokeWidth="0.8" />
            {/* Center star */}
            <circle cx="20" cy="20" r="3.5" fill="#ffffff" stroke="#0288d1" strokeWidth="1" />
            <circle cx="20" cy="20" r="1.8" fill="#40c4ff" />
          </svg>
        );
      case 'bomb':
        return (
          <svg viewBox="0 0 40 40" className="tile-svg powerup-icon-svg">
            <defs>
              <radialGradient id="bomb-body-grad" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#616161" />
                <stop offset="100%" stopColor="#1a1a1a" />
              </radialGradient>
              <radialGradient id="bomb-shine" cx="35%" cy="30%" r="45%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
            </defs>
            {/* Fuse spark */}
            <circle cx="27" cy="9" r="2.5" fill="#ffeb3b" opacity="0.9">
              <animate attributeName="r" values="2.5;3.5;2.5" dur="0.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0.5;0.9" dur="0.6s" repeatCount="indefinite" />
            </circle>
            {/* Fuse */}
            <path d="M23,14 Q26,10 27,9" stroke="#795548" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            {/* Bomb body */}
            <circle cx="20" cy="23" r="13" fill="url(#bomb-body-grad)" stroke="#111" strokeWidth="1" />
            <circle cx="20" cy="23" r="13" fill="url(#bomb-shine)" />
            {/* Band stripes */}
            <path d="M8,19 Q20,16 32,19" stroke="#444" strokeWidth="1.5" fill="none" />
            <path d="M9,26 Q20,28 31,26" stroke="#444" strokeWidth="1.5" fill="none" />
          </svg>
        );
    }
  };

  // Render SVG Icon for 3D Gemstones / Blockers
  const renderTileIcon = (type: TileType) => {
    switch (type) {
      case 'ruby':
        return (
          <svg viewBox="0 0 40 40" className="tile-svg gem-3d">
            <polygon points="20,4 34,14 28,34 12,34 6,14" fill="url(#ruby-grad)" stroke="#ff2d55" strokeWidth="1" />
            <polygon points="20,4 6,14 20,20" fill="rgba(255,255,255,0.22)" />
            <polygon points="20,4 34,14 20,20" fill="rgba(255,255,255,0.38)" />
            <polygon points="34,14 28,34 20,20" fill="rgba(0,0,0,0.12)" />
            <polygon points="28,34 12,34 20,20" fill="rgba(0,0,0,0.24)" />
            <polygon points="12,34 6,14 20,20" fill="rgba(0,0,0,0.06)" />
            {/* Rose chapter: tiny petal highlight at top-right of gem */}
            {ambientTheme === 'rose' && (
              <>
                <ellipse cx="29" cy="10" rx="3.5" ry="2.2" fill="rgba(255,200,220,0.82)" transform="rotate(-35,29,10)" />
                <ellipse cx="32" cy="13" rx="3"   ry="1.8" fill="rgba(255,180,210,0.65)" transform="rotate(20,32,13)"  />
                <ellipse cx="29" cy="7"  rx="2.5" ry="1.5" fill="rgba(255,220,235,0.55)" transform="rotate(-10,29,7)"  />
              </>
            )}
          </svg>
        );
      case 'sapphire':
        return (
          <svg viewBox="0 0 40 40" className="tile-svg gem-3d">
            <path d="M20,4 C20,4 34,18 34,26 C34,32 28,36 20,36 C12,36 6,32 6,26 C6,18 20,4 20,4 Z" fill="url(#sapphire-grad)" stroke="#007aff" strokeWidth="1" />
            <path d="M20,4 C20,4 20,26 20,36 C12,36 6,32 6,26 C6,18 20,4 20,4 Z" fill="rgba(255,255,255,0.22)" />
            <path d="M20,4 C20,4 34,18 34,26 C34,32 20,36 20,4 Z" fill="rgba(255,255,255,0.08)" />
            <path d="M20,8 C20,8 28,18 28,24 C28,26 26,28 20,28 Z" fill="rgba(255,255,255,0.25)" />
          </svg>
        );
      case 'emerald':
        return (
          <svg viewBox="0 0 40 40" className="tile-svg gem-3d">
            <polygon points="20,4 34,20 20,36 6,20" fill="url(#emerald-grad)" stroke="#4cd964" strokeWidth="1" />
            <polygon points="20,4 6,20 20,20" fill="rgba(255,255,255,0.22)" />
            <polygon points="20,4 34,20 20,20" fill="rgba(255,255,255,0.38)" />
            <polygon points="34,20 20,36 20,20" fill="rgba(0,0,0,0.16)" />
            <polygon points="6,20 20,36 20,20" fill="rgba(0,0,0,0.08)" />
          </svg>
        );
      case 'amethyst':
        return (
          <svg viewBox="0 0 40 40" className="tile-svg gem-3d">
            <polygon points="20,4 34,12 34,28 20,36 6,28 6,12" fill="url(#amethyst-grad)" stroke="#5856d6" strokeWidth="1" />
            <polygon points="20,4 6,12 20,20" fill="rgba(255,255,255,0.22)" />
            <polygon points="20,4 34,12 20,20" fill="rgba(255,255,255,0.38)" />
            <polygon points="34,12 34,28 20,20" fill="rgba(0,0,0,0.1)" />
            <polygon points="34,28 20,36 20,20" fill="rgba(0,0,0,0.24)" />
            <polygon points="20,36 6,28 20,20" fill="rgba(0,0,0,0.18)" />
            <polygon points="6,28 6,12 20,20" fill="rgba(0,0,0,0.06)" />
          </svg>
        );
      case 'coin':
        return (
          <svg viewBox="0 0 40 40" className="tile-svg gold-coin-svg gem-3d">
            <circle cx="20" cy="20" r="16" fill="url(#coin-grad)" stroke="#b78600" strokeWidth="1.5" />
            <circle cx="20" cy="20" r="13" fill="none" stroke="#ffe57f" strokeWidth="1" strokeDasharray="3,1" />
            <circle cx="20" cy="20" r="11" fill="none" stroke="#b78600" strokeWidth="1" />
            <text x="20" y="24" fontSize="13" fontWeight="900" fill="#7a5c00" textAnchor="middle">$</text>
            <path d="M7,15 A16,16 0 0,1 33,15 Z" fill="rgba(255,255,255,0.25)" />
          </svg>
        );
      case 'valve':
        return (
          <svg viewBox="0 0 40 40" className="tile-svg valve-svg gem-3d">
            {/* Outer gold ring */}
            <circle cx="20" cy="20" r="18" fill="url(#valve-gold-ring)" stroke="#7a5800" strokeWidth="1.5"/>
            <circle cx="20" cy="20" r="15.5" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8"/>
            {/* 8 spokes */}
            <line x1="20" y1="3" x2="20" y2="37" stroke="#7a5800" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="3" y1="20" x2="37" y2="20" stroke="#7a5800" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="7.2" y1="7.2" x2="32.8" y2="32.8" stroke="#7a5800" strokeWidth="2" strokeLinecap="round"/>
            <line x1="32.8" y1="7.2" x2="7.2" y2="32.8" stroke="#7a5800" strokeWidth="2" strokeLinecap="round"/>
            {/* Gold sheen on vertical/horizontal spokes */}
            <line x1="20" y1="3" x2="20" y2="37" stroke="rgba(255,240,100,0.38)" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="3" y1="20" x2="37" y2="20" stroke="rgba(255,240,100,0.38)" strokeWidth="1.2" strokeLinecap="round"/>
            {/* 8 notch studs on ring edge */}
            <circle cx="20" cy="2.2" r="2.2" fill="#7a5800"/>
            <circle cx="32.7" cy="7.3" r="2.2" fill="#7a5800"/>
            <circle cx="37.8" cy="20" r="2.2" fill="#7a5800"/>
            <circle cx="32.7" cy="32.7" r="2.2" fill="#7a5800"/>
            <circle cx="20" cy="37.8" r="2.2" fill="#7a5800"/>
            <circle cx="7.3" cy="32.7" r="2.2" fill="#7a5800"/>
            <circle cx="2.2" cy="20" r="2.2" fill="#7a5800"/>
            <circle cx="7.3" cy="7.3" r="2.2" fill="#7a5800"/>
            {/* Hub */}
            <circle cx="20" cy="20" r="7.5" fill="url(#valve-gold-hub)" stroke="#7a5800" strokeWidth="1.2"/>
            <circle cx="20" cy="20" r="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
            <circle cx="20" cy="20" r="3" fill="#7a5800"/>
            {/* Sheen highlight */}
            <ellipse cx="13" cy="12" rx="7" ry="4" fill="rgba(255,255,255,0.22)" transform="rotate(-25,13,12)"/>
          </svg>
        );
      case 'boulder':
        return (
          <svg viewBox="0 0 40 40" className="tile-svg boulder-svg gem-3d">
            <circle cx="20" cy="20" r="16" fill="url(#boulder-grad)" stroke="#1e293b" strokeWidth="2" />
            <path d="M12,12 L16,18 L24,18 L28,12" stroke="#0f172a" strokeWidth="1.5" fill="none" />
            <path d="M9,22 L17,26 L23,24 L31,21" stroke="#0f172a" strokeWidth="1.5" fill="none" />
            <circle cx="15" cy="14" r="1.5" fill="#94a3b8" />
            <circle cx="25" cy="14" r="1.5" fill="#94a3b8" />
            <circle cx="20" cy="29" r="1.5" fill="#94a3b8" />
            <path d="M7,15 A16,16 0 0,1 33,15 Z" fill="rgba(255,255,255,0.15)" />
          </svg>
        );
    }
  };

  const renderCursedSkullIcon = () => {
    return (
      <svg viewBox="0 0 40 40" className="tile-svg cursed-skull-svg gem-3d">
        <defs>
          <linearGradient id="cursed-skull-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e9d5ff" />
            <stop offset="60%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#7e22ce" />
          </linearGradient>
        </defs>
        {/* Skull head */}
        <path d="M12,18 C12,10 16,6 20,6 C24,6 28,10 28,18 C28,24 25,26 25,29 L15,29 C15,26 12,24 12,18 Z" fill="url(#cursed-skull-grad)" stroke="#581c87" strokeWidth="1.5" />
        {/* Jaw/teeth block */}
        <rect x="16" y="28" width="8" height="6" rx="1" fill="url(#cursed-skull-grad)" stroke="#581c87" strokeWidth="1.5" />
        <line x1="18.5" y1="28" x2="18.5" y2="34" stroke="#581c87" strokeWidth="1.2" />
        <line x1="20" y1="28" x2="20" y2="34" stroke="#581c87" strokeWidth="1.2" />
        <line x1="21.5" y1="28" x2="21.5" y2="34" stroke="#581c87" strokeWidth="1.2" />
        {/* Eyes (dark hollows) */}
        <ellipse cx="16.5" cy="17" rx="2.5" ry="3.5" fill="#3b0764" />
        <ellipse cx="23.5" cy="17" rx="2.5" ry="3.5" fill="#3b0764" />
        {/* Eyebrow frown lines */}
        <path d="M13.5,13 L17.5,15" stroke="#581c87" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M26.5,13 L22.5,15" stroke="#581c87" strokeWidth="1.2" strokeLinecap="round" />
        {/* Nose cavity */}
        <polygon points="20,20 18.5,23 21.5,23" fill="#3b0764" />
        {/* Cheekbones shading */}
        <path d="M11.5,21 C13.5,21 14.5,23 14.5,25" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
        <path d="M28.5,21 C26.5,21 25.5,23 25.5,25" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
        {/* 3D highlight sheen */}
        <path d="M14,13 A10,10 0 0,1 26,13 Z" fill="rgba(255,255,255,0.25)" />
      </svg>
    );
  };

  const renderShadowVaultIcon = (health: number) => {
    return (
      <svg viewBox="0 0 40 40" className={`tile-svg shadow-vault-svg gem-3d ${health === 1 ? 'vault-cracked' : ''}`}>
        <defs>
          <linearGradient id="vault-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4c1d95" />
            <stop offset="50%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#030712" />
          </linearGradient>
        </defs>
        {/* Main Vault Block */}
        <rect x="5" y="5" width="30" height="30" rx="4" fill="url(#vault-grad)" stroke="#312e81" strokeWidth="1.8" />
        {/* Inner panel */}
        <rect x="9" y="9" width="22" height="22" rx="2" fill="none" stroke="#4f46e5" strokeWidth="1.2" strokeDasharray="3,1" />
        {/* Core glowing eye/seal */}
        <circle cx="20" cy="20" r="5" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1" />
        <circle cx="20" cy="20" r="2.5" fill="#a855f7" />
        {/* Shading/3D lighting */}
        <path d="M5,5 L35,5 L31,9 L9,9 Z" fill="rgba(255,255,255,0.12)" />
        <path d="M5,5 L5,35 L9,31 L9,9 Z" fill="rgba(255,255,255,0.06)" />
        <path d="M5,35 L35,35 L31,31 L9,31 Z" fill="rgba(0,0,0,0.3)" />
        <path d="M35,5 L35,35 L31,31 L31,9 Z" fill="rgba(0,0,0,0.15)" />

        {/* Crack lines overlays if health is 1 */}
        {health === 1 && (
          <g stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" fill="none">
            <path d="M8,10 L15,18 L13,24" />
            <path d="M32,30 L25,22 L27,15" />
            <path d="M12,28 L21,23 L22,32" />
          </g>
        )}
      </svg>
    );
  };

  // Touch handlers for mobile swiping
  const handleTouchStart = (e: React.TouchEvent, r: number, c: number) => {
    if (isBoardLocked) return;
    const touch = e.touches[0];
    setSwipeStart({ r, c, x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeStart || isBoardLocked) return;
    const touch = e.touches[0];
    const dx = touch.clientX - swipeStart.x;
    const dy = touch.clientY - swipeStart.y;
    const threshold = 30;

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      let targetR = swipeStart.r;
      let targetC = swipeStart.c;

      if (Math.abs(dx) > Math.abs(dy)) {
        targetC = dx > 0 ? swipeStart.c + 1 : swipeStart.c - 1;
      } else {
        targetR = dy > 0 ? swipeStart.r + 1 : swipeStart.r - 1;
      }

      if (targetR >= 0 && targetR < 8 && targetC >= 0 && targetC < 8) {
        if (showWaterlineHint) dismissHint();
        if (showValveHint) dismissValveHint();
        onSwapTiles(swipeStart.r, swipeStart.c, targetR, targetC);
      }
      setSwipeStart(null);
    }
  };

  const handleTouchEnd = () => {
    setSwipeStart(null);
  };

  // Mouse handlers for desktop dragging
  const handleMouseDown = (e: React.MouseEvent, r: number, c: number) => {
    if (isBoardLocked) return;
    setSwipeStart({ r, c, x: e.clientX, y: e.clientY });
    onSelectTile(r, c);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!swipeStart || isBoardLocked) return;
    const dx = e.clientX - swipeStart.x;
    const dy = e.clientY - swipeStart.y;
    const threshold = 30;

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      let targetR = swipeStart.r;
      let targetC = swipeStart.c;

      if (Math.abs(dx) > Math.abs(dy)) {
        targetC = dx > 0 ? swipeStart.c + 1 : swipeStart.c - 1;
      } else {
        targetR = dy > 0 ? swipeStart.r + 1 : swipeStart.r - 1;
      }

      if (targetR >= 0 && targetR < 8 && targetC >= 0 && targetC < 8) {
        onSwapTiles(swipeStart.r, swipeStart.c, targetR, targetC);
      }
      setSwipeStart(null);
    }
  };

  const handleMouseUp = () => {
    setSwipeStart(null);
  };

  // Reactive algae presence — drives green board border tint
  const hasActiveAlgae = grid.some(row => row.some(cell => cell?.algae));

  return (
    <div
      className={`board-container theme-${ambientTheme}${hasActiveAlgae ? ' board-has-algae' : ''}`}
      ref={boardRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        '--board-bg': t.boardBg,
        '--board-border': t.boardBorder,
        '--cell-bg': t.cellBg,
      } as React.CSSProperties}
    >
      {/* L8 carved vow-stone heart — barely visible under algae, glows on reveal */}
      {levelId === 8 && (
        <div className={`vow-stone-heart${!hasActiveAlgae ? ' vow-heart-revealed' : ''}`} aria-hidden="true">
          ♥
        </div>
      )}

      {/* L5 mirror-gate glow — silver shimmer at board top */}
      {levelId === 5 && (
        <div className="mirror-gate-glow" aria-hidden="true">
          <div className="mirror-gate-beam mirror-gate-beam--left"  />
          <div className="mirror-gate-beam mirror-gate-beam--right" />
        </div>
      )}

      {/* L7 ceremony aisle — faint gold runner down board centre */}
      {levelId === 7 && (
        <div className="ceremony-aisle-runner" aria-hidden="true" />
      )}

      {/* Rose petals floating UPWARD in the wet zone — Chapter 2 only */}
      {ambientTheme === 'rose' && (
        <div className="rose-petals-upward-overlay" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="rose-petal-up"
              style={{
                '--petal-delay':   `${-(i * 0.7)}s`,
                '--petal-x-start': `${(i * 23 + 11) % 88}%`,
                '--petal-drift-x': `${(i % 2 === 0 ? -1 : 1) * (8 + (i % 3) * 6)}px`,
                '--petal-rot':     `${(i * 57) % 360}deg`,
                '--petal-dur':     `${5.5 + (i % 4) * 0.7}s`,
                '--petal-size':    `${8 + (i % 3) * 2}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Rose petal overlay — Chapter 2 Rose Garden only */}
      {ambientTheme === 'rose' && (
        <div className="rose-petals-overlay" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="rose-petal"
              style={{
                '--petal-delay':   `${-(i * 0.55)}s`,
                '--petal-x-start': `${(i * 17 + 5) % 92}%`,
                '--petal-drift-x': `${(i % 2 === 0 ? 1 : -1) * (10 + (i % 4) * 7)}px`,
                '--petal-rot':     `${(i * 43) % 360}deg`,
                '--petal-dur':     `${4.8 + (i % 5) * 0.6}s`,
                '--petal-size':    `${10 + (i % 3) * 3}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Cold Theme: Falling Snowflakes Overlay */}
      {ambientTheme === 'cold' && (
        <div className="cold-snow-overlay" aria-hidden="true">
          {Array.from({ length: 15 }, (_, i) => (
            <div
              key={i}
              className="snowflake"
              style={{
                '--snow-delay':   `${-(i * 0.4)}s`,
                '--snow-x-start': `${(i * 19 + 7) % 95}%`,
                '--snow-drift-x': `${(i % 2 === 0 ? 1 : -1) * (12 + (i % 3) * 8)}px`,
                '--snow-dur':     `${5.0 + (i % 4) * 0.8}s`,
                '--snow-size':    `${4 + (i % 3) * 3}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Dark Theme: Shadow Bubbles Rising Overlay */}
      {ambientTheme === 'dark' && (
        <div className="dark-shadow-overlay" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className="shadow-bubble"
              style={{
                '--shadow-delay':   `${-(i * 0.6)}s`,
                '--shadow-x-start': `${(i * 27 + 13) % 90}%`,
                '--shadow-drift-x': `${(i % 2 === 0 ? -1 : 1) * (6 + (i % 3) * 5)}px`,
                '--shadow-dur':     `${6.0 + (i % 3) * 1.0}s`,
                '--shadow-size':    `${8 + (i % 3) * 4}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Battle Theme: Fire Spark Embers Rising Overlay */}
      {ambientTheme === 'battle' && (
        <div className="battle-ember-overlay" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="battle-ember"
              style={{
                '--ember-delay':   `${-(i * 0.45)}s`,
                '--ember-x-start': `${(i * 23 + 9) % 92}%`,
                '--ember-drift-x': `${(i % 2 === 0 ? 1 : -1) * (15 + (i % 4) * 6)}px`,
                '--ember-dur':     `${4.2 + (i % 3) * 0.7}s`,
                '--ember-size':    `${3 + (i % 3) * 2}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Ethereal Theme: Stardust Particles Floating Overlay */}
      {ambientTheme === 'ethereal' && (
        <div className="ethereal-stardust-overlay" aria-hidden="true">
          {Array.from({ length: 16 }, (_, i) => (
            <div
              key={i}
              className="stardust-sparkle"
              style={{
                '--sparkle-delay':   `${-(i * 0.5)}s`,
                '--sparkle-x-start': `${(i * 17 + 11) % 94}%`,
                '--sparkle-drift-x': `${(i % 2 === 0 ? -1 : 1) * (10 + (i % 3) * 7)}px`,
                '--sparkle-dur':     `${5.5 + (i % 4) * 0.8}s`,
                '--sparkle-size':    `${4 + (i % 3) * 2}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* Warm Theme: Subtle Golden Embers Overlay */}
      {ambientTheme === 'warm' && (
        <div className="warm-ember-overlay" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="warm-ember"
              style={{
                '--warm-delay':   `${-(i * 0.8)}s`,
                '--warm-x-start': `${(i * 31 + 5) % 88}%`,
                '--warm-drift-x': `${(i % 2 === 0 ? 1 : -1) * (8 + (i % 3) * 4)}px`,
                '--warm-dur':     `${7.0 + (i % 3) * 1.2}s`,
                '--warm-size':    `${3 + (i % 3) * 2}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* SVG Definitions for tile gradients — swapped per theme */}
      <svg className="svg-defs-hidden">
        <defs>
          <linearGradient id="ruby-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff5e7e" />
            <stop offset="100%" stopColor="#d31238" />
          </linearGradient>
          <linearGradient id="sapphire-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5ea6ff" />
            <stop offset="100%" stopColor="#004cd9" />
          </linearGradient>
          <linearGradient id="emerald-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#75f088" />
            <stop offset="100%" stopColor="#0b9a24" />
          </linearGradient>
          <linearGradient id="amethyst-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9a85ff" />
            <stop offset="100%" stopColor="#4322d6" />
          </linearGradient>
          <linearGradient id="coin-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffeb60" />
            <stop offset="60%" stopColor="#ffd200" />
            <stop offset="100%" stopColor="#b78600" />
          </linearGradient>
          <radialGradient id="valve-gold-ring" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#ffe87a" />
            <stop offset="60%" stopColor="#d4a000" />
            <stop offset="100%" stopColor="#7a5800" />
          </radialGradient>
          <radialGradient id="valve-gold-hub" cx="38%" cy="32%" r="60%">
            <stop offset="0%" stopColor="#fff0a0" />
            <stop offset="100%" stopColor="#b78600" />
          </radialGradient>
          <linearGradient id="boulder-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="50%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
        </defs>
      </svg>

      {/* Grid cells (background layer) */}
      <div className="grid-cells-bg">
        {Array(8).fill(null).map((_, r) => 
          Array(8).fill(null).map((_, c) => {
            const isSubmerged = r >= waterLevelRow;
            return (
              <div 
                key={`bg_${r}_${c}`} 
                className={`grid-cell-bg ${isSubmerged ? 'submerged-cell' : 'dry-cell'}`}
                style={{
                  top: `${r * 12.5}%`,
                  left: `${c * 12.5}%`
                }}
              >
                {/* Visual marker for water boundary */}
                {r === waterLevelRow && <div className="water-level-line"></div>}
              </div>
            );
          })
        )}
      </div>

      {/* L2 one-time waterline hint callout */}
      {showWaterlineHint && waterLevelRow > 0 && waterLevelRow < 8 && (
        <div
          className="waterline-hint"
          style={{ top: `${waterLevelRow * 12.5 - 1}%` }}
          onClick={dismissHint}
        >
          <span className="waterline-hint-arrow">▼</span>
          <span className="waterline-hint-text">Gems below float up · match from both sides</span>
          <span className="waterline-hint-dismiss">✕</span>
        </div>
      )}

      {/* L3 contextual valve tooltip */}
      {showValveHint && firstValve && (
        <div
          className="valve-hint"
          style={{
            top:  `${firstValve.r * 12.5}%`,
            left: `${Math.min(firstValve.c * 12.5 + 14, 55)}%`,
          }}
          onClick={dismissValveHint}
        >
          <span className="valve-hint-arrow">←</span>
          <span className="valve-hint-text">Match beside to drain the flood</span>
          <span className="valve-hint-dismiss">✕</span>
        </div>
      )}

      {/* Grid Algae locks (middle layer) */}
      <div className="algae-layer">
        {grid.map((row, r) => 
          row.map((cell, c) => {
            if (!cell || !cell.algae) return null;
            return (
              <div
                key={`algae_${r}_${c}`}
                className="algae-lock"
                style={{
                  top: `${r * 12.5}%`,
                  left: `${c * 12.5}%`
                }}
              >
                <svg viewBox="0 0 60 60" className="algae-ivy-svg" xmlns="http://www.w3.org/2000/svg">
                  {/* Main crossing vines */}
                  <path d="M4,4 Q16,18 30,30 Q44,42 56,56" stroke="#2e7d32" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
                  <path d="M56,4 Q44,18 30,30 Q16,42 4,56" stroke="#388e3c" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
                  <path d="M4,30 Q16,20 30,30 Q44,40 56,30" stroke="#43a047" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
                  {/* Leaf cluster — top-left */}
                  <ellipse cx="14" cy="13" rx="8.5" ry="5.5" fill="rgba(67,160,71,0.88)" transform="rotate(-38,14,13)"/>
                  <line x1="8" y1="12" x2="20" y2="14" stroke="rgba(27,94,32,0.65)" strokeWidth="0.9"/>
                  <ellipse cx="14" cy="13" rx="5" ry="3" fill="rgba(102,187,106,0.5)" transform="rotate(-38,14,13)"/>
                  {/* Leaf — top-right */}
                  <ellipse cx="46" cy="13" rx="8" ry="5" fill="rgba(56,142,60,0.88)" transform="rotate(32,46,13)"/>
                  <line x1="41" y1="15" x2="51" y2="11" stroke="rgba(27,94,32,0.65)" strokeWidth="0.9"/>
                  <ellipse cx="46" cy="13" rx="4.5" ry="2.8" fill="rgba(129,199,132,0.45)" transform="rotate(32,46,13)"/>
                  {/* Leaf — mid-left */}
                  <ellipse cx="11" cy="34" rx="7.5" ry="4.8" fill="rgba(76,175,80,0.88)" transform="rotate(52,11,34)"/>
                  <line x1="7" y1="31" x2="15" y2="37" stroke="rgba(27,94,32,0.65)" strokeWidth="0.9"/>
                  {/* Leaf — mid-right */}
                  <ellipse cx="49" cy="36" rx="7.5" ry="4.8" fill="rgba(46,125,50,0.88)" transform="rotate(-48,49,36)"/>
                  <line x1="53" y1="33" x2="45" y2="39" stroke="rgba(27,94,32,0.65)" strokeWidth="0.9"/>
                  {/* Leaf — bottom-left */}
                  <ellipse cx="14" cy="50" rx="8" ry="5.2" fill="rgba(67,160,71,0.88)" transform="rotate(-22,14,50)"/>
                  <line x1="7" y1="50" x2="21" y2="50" stroke="rgba(27,94,32,0.65)" strokeWidth="0.9"/>
                  <ellipse cx="14" cy="50" rx="4.5" ry="3" fill="rgba(102,187,106,0.45)" transform="rotate(-22,14,50)"/>
                  {/* Leaf — bottom-right */}
                  <ellipse cx="46" cy="50" rx="7.5" ry="5" fill="rgba(56,142,60,0.88)" transform="rotate(26,46,50)"/>
                  <line x1="40" y1="52" x2="52" y2="48" stroke="rgba(27,94,32,0.65)" strokeWidth="0.9"/>
                  {/* Small center leaves */}
                  <ellipse cx="30" cy="19" rx="5.5" ry="3.5" fill="rgba(102,187,106,0.85)" transform="rotate(8,30,19)"/>
                  <ellipse cx="30" cy="43" rx="5.5" ry="3.5" fill="rgba(46,125,50,0.85)" transform="rotate(-12,30,43)"/>
                  {/* Curling tendrils */}
                  <path d="M30,30 Q36,21 39,14" stroke="rgba(129,199,132,0.85)" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
                  <path d="M30,30 Q23,39 21,47" stroke="rgba(129,199,132,0.85)" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
                  <path d="M20,20 Q15,14 18,8" stroke="rgba(129,199,132,0.7)" strokeWidth="1" fill="none" strokeLinecap="round"/>
                  <path d="M40,40 Q45,46 42,52" stroke="rgba(129,199,132,0.7)" strokeWidth="1" fill="none" strokeLinecap="round"/>
                  <path d="M8,22 Q4,18 6,12" stroke="rgba(129,199,132,0.6)" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
                  <path d="M52,42 Q56,46 54,52" stroke="rgba(129,199,132,0.6)" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
                </svg>
              </div>
            );
          })
        )}
      </div>

      {/* Floating/falling tiles (top layer) */}
      <div className="tiles-layer">
        {grid.map((row, r) => 
          row.map((cell, c) => {
            if (!cell) return null;
            
            const isSelected = selectedTile?.r === r && selectedTile?.c === c;
            const isSubmerged = r >= waterLevelRow;
            
            return (
              <div
                key={cell.id}
                className={`tile-wrapper ${isSelected ? 'selected' : ''} ${cell.isNew ? 'spawned' : ''} ${isSubmerged ? 'wet' : 'dry'}`}
                style={{
                  top: `${r * 12.5}%`,
                  left: `${c * 12.5}%`,
                  opacity: cell.algae ? 0.8 : 1
                }}
                onMouseDown={(e) => handleMouseDown(e, r, c)}
                onTouchStart={(e) => handleTouchStart(e, r, c)}
              >
                <div className={cell.shadowVault ? 'tile-icon-container shadow-vault-tile' : cell.cursed ? 'tile-icon-container cursed-skull-tile' : cell.powerUp ? `tile-icon-container powerup-tile powerup-tile--${cell.powerUp}` : `tile-icon-container ${cell.type}`}>
                  {cell.shadowVault ? renderShadowVaultIcon(cell.shadowVault) : cell.cursed ? renderCursedSkullIcon() : cell.powerUp ? renderPowerUpIcon(cell.powerUp) : renderTileIcon(cell.type)}
                </div>

                {/* Ice wrapper blocks — Icicle Drip style */}
                {cell.frozen && (
                  <div className="tile-frozen-ice">
                    <svg viewBox="0 0 52 52" className="icicle-svg" xmlns="http://www.w3.org/2000/svg" overflow="visible">
                      <defs>
                        <linearGradient id="frost-cap-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgba(220,245,255,0.92)"/>
                          <stop offset="100%" stopColor="rgba(160,215,255,0.55)"/>
                        </linearGradient>
                        <linearGradient id="icicle-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgba(200,240,255,0.9)"/>
                          <stop offset="80%" stopColor="rgba(100,190,255,0.55)"/>
                          <stop offset="100%" stopColor="rgba(80,170,240,0.2)"/>
                        </linearGradient>
                      </defs>
                      {/* Frost cap */}
                      <rect x="1" y="1" width="50" height="16" rx="6" fill="url(#frost-cap-grad)" stroke="rgba(130,210,255,0.75)" strokeWidth="1.5"/>
                      <ellipse cx="16" cy="6" rx="9" ry="4" fill="rgba(255,255,255,0.32)" transform="rotate(-8,16,6)"/>
                      {/* Icicles */}
                      <polygon points="6,16 11,16 8.5,33" fill="url(#icicle-grad)" stroke="rgba(130,210,255,0.65)" strokeWidth="0.9"/>
                      <polygon points="14,16 20,16 17,40" fill="url(#icicle-grad)" stroke="rgba(130,210,255,0.65)" strokeWidth="0.9"/>
                      <polygon points="23,16 28,16 25.5,35" fill="url(#icicle-grad)" stroke="rgba(130,210,255,0.65)" strokeWidth="0.9"/>
                      <polygon points="32,16 38,16 35,42" fill="url(#icicle-grad)" stroke="rgba(130,210,255,0.65)" strokeWidth="0.9"/>
                      <polygon points="41,16 46,16 43.5,31" fill="url(#icicle-grad)" stroke="rgba(130,210,255,0.65)" strokeWidth="0.9"/>
                      {/* Drip drops */}
                      <circle cx="8.5" cy="34" r="2.2" fill="rgba(130,210,255,0.78)"/>
                      <circle cx="17" cy="41" r="2.5" fill="rgba(130,210,255,0.78)"/>
                      <circle cx="25.5" cy="36" r="2.2" fill="rgba(130,210,255,0.78)"/>
                      <circle cx="35" cy="43" r="2.6" fill="rgba(130,210,255,0.78)"/>
                      <circle cx="43.5" cy="32" r="2" fill="rgba(130,210,255,0.78)"/>
                      {/* Inner highlight on cap */}
                      <rect x="4" y="4" width="44" height="4" rx="2" fill="rgba(255,255,255,0.28)"/>
                    </svg>
                  </div>
                )}

                {/* Cursed wrapper block — dark crackle overlay */}
                {cell.cursed && (
                  <div className="tile-cursed-crackle" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Jewel Shards Explosion Particles Layer */}
      <div className="shards-explosion-layer">
        {shards.map(shard => (
          <div
            key={shard.id}
            className="jewel-shard"
            style={{
              left: `${shard.x}%`,
              top: `${shard.y}%`,
              backgroundColor: shard.color,
              '--dx': `${shard.dx}px`,
              '--dy': `${shard.dy}px`,
              '--rot': `${shard.rot}deg`,
              animationDelay: `${shard.delay}s`
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Power-Up Visual Effects Layer */}
      <div className="powerup-effects-layer">
        {firedPowerUps.map(fp => {
          const cx = fp.c * 12.5 + 6.25; // tile center x %
          const cy = fp.r * 12.5 + 6.25; // tile center y %

          /* ⚡ Lightning B — expanding electric rings */
          if (fp.type === 'lightning') {
            return (
              <div key={fp.id} className="pfx-lightning" style={{ left: `${cx}%`, top: `${cy}%` }}>
                <div className="lightning-ring lr1" />
                <div className="lightning-ring lr2" />
                <div className="lightning-ring lr3" />
                <svg className="lightning-arcs-svg" viewBox="0 0 200 200">
                  {[0,45,90,135,180,225,270,315].map((angle, i) => {
                    const rad = (angle * Math.PI) / 180;
                    const mid = 100 + Math.cos(rad) * 40 + (Math.random() - 0.5) * 20;
                    const midy = 100 + Math.sin(rad) * 40 + (Math.random() - 0.5) * 20;
                    const ex = 100 + Math.cos(rad) * 90;
                    const ey = 100 + Math.sin(rad) * 90;
                    return (
                      <polyline
                        key={i}
                        points={`100,100 ${mid},${midy} ${ex},${ey}`}
                        stroke={i % 2 === 0 ? '#fff9' : '#ffeb3b'}
                        strokeWidth={i % 3 === 0 ? 2.5 : 1.5}
                        fill="none"
                        className={`arc-line arc-${i}`}
                      />
                    );
                  })}
                </svg>
                <div className="lightning-flash" />
              </div>
            );
          }

          /* ↔ Blast Row C — domino sequential flash */
          if (fp.type === 'blast_row') {
            return (
              <div key={fp.id} className="pfx-blast-row" style={{ top: `${fp.r * 12.5}%` }}>
                {Array.from({ length: 8 }, (_, c) => {
                  const dist = Math.abs(c - fp.c);
                  return (
                    <div
                      key={c}
                      className="domino-cell"
                      style={{
                        left: `${c * 12.5}%`,
                        animationDelay: `${dist * 60}ms`,
                        '--domino-color': c % 2 === 0 ? 'rgba(0,229,255,0.85)' : 'rgba(255,255,255,0.75)'
                      } as React.CSSProperties}
                    />
                  );
                })}
              </div>
            );
          }

          /* ↕ Blast Col A — vertical laser */
          if (fp.type === 'blast_col') {
            return (
              <div key={fp.id} className="pfx-blast-col" style={{ left: `${fp.c * 12.5}%` }}>
                <div className="laser-glow" />
                <div className="laser-core" />
                {/* Sparks shooting left & right */}
                {[-1, 1].map(dir => (
                  Array.from({ length: 5 }, (_, i) => (
                    <div
                      key={`${dir}_${i}`}
                      className="laser-spark"
                      style={{
                        top: `${15 + i * 16}%`,
                        '--spark-dir': `${dir * (18 + i * 8)}px`,
                        animationDelay: `${i * 40}ms`
                      } as React.CSSProperties}
                    />
                  ))
                ))}
              </div>
            );
          }

          /* 💣 Bomb A — shockwave rings + debris */
          if (fp.type === 'bomb') {
            const angles = Array.from({ length: 12 }, (_, i) => (i * 30 * Math.PI) / 180);
            return (
              <div key={fp.id} className="pfx-bomb" style={{ left: `${cx}%`, top: `${cy}%` }}>
                <div className="shockwave sw1" />
                <div className="shockwave sw2" />
                <div className="shockwave sw3" />
                <div className="bomb-flash" />
                {angles.map((rad, i) => (
                  <div
                    key={i}
                    className="bomb-debris"
                    style={{
                      '--dbx': `${Math.cos(rad) * (45 + (i % 3) * 15)}px`,
                      '--dby': `${Math.sin(rad) * (45 + (i % 3) * 15)}px`,
                      '--dbr': `${i * 40}deg`,
                      animationDelay: `${i % 4 * 30}ms`,
                      backgroundColor: ['#ff6b35','#ff4500','#ffd700','#ff8c00'][i % 4]
                    } as React.CSSProperties}
                  />
                ))}
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Drain Wave Sweep Effect — triggered when valve tiles are matched */}
      {firedValveDrain.length > 0 && (
        <div className="drain-wave-sweep">
          {/* 4 staggered wave bands sweeping top → bottom */}
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="drain-wave-band"
              style={{ animationDelay: `${i * 180}ms` }}
            />
          ))}
          {/* Water particles rushing downward, converging slightly to center */}
          {Array.from({ length: 18 }, (_, i) => {
            const leftPct = 4 + i * 5.4;
            const convergence = ((leftPct - 50) * 0.08).toFixed(1);
            return (
              <div
                key={`dp${i}`}
                className="drain-wave-particle"
                style={{
                  left: `${leftPct}%`,
                  top: `${8 + (i % 5) * 7}%`,
                  '--pwx': `${convergence}%`,
                  animationDelay: `${(i % 6) * 110}ms`,
                } as React.CSSProperties}
              />
            );
          })}
          {/* Bottom drain vortex */}
          <div className="drain-vortex-fx" />
          {/* "−WATER" label flash */}
          <div className="drain-label">−WATER</div>
        </div>
      )}

      {/* Ambient sub-surface God Rays effect */}
      <div className="god-rays-overlay" />

      {/* Water grid overlay */}
      <div 
        className="grid-water-overlay" 
        style={{
          top: `${waterLevelRow * 12.5}%`,
          height: `${(8 - waterLevelRow) * 12.5}%`
        }}
      />
    </div>
  );
};
