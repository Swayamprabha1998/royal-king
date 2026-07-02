import React, { useState, useRef, useEffect } from 'react';
import type { GridState, TileType } from '../services/boardLogic';
import './GameBoard.css';

interface GameBoardProps {
  grid: GridState;
  selectedTile: { r: number; c: number } | null;
  waterLevelRow: number; // 0 to 8 (where water starts)
  isBoardLocked: boolean;
  onSelectTile: (r: number, c: number) => void;
  onSwapTiles: (r1: number, c1: number, r2: number, c2: number) => void;
  brokenTiles: { id: string; r: number; c: number; type: TileType }[];
}

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
  brokenTiles
}) => {
  const [swipeStart, setSwipeStart] = useState<{ r: number; c: number; x: number; y: number } | null>(null);
  const [shards, setShards] = useState<Shard[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const processedBrokenIdsRef = useRef<Set<string>>(new Set());

  // 1. Matched jewels breaking particles logic (fires on initial swaps & cascade matches)
  useEffect(() => {
    if (!brokenTiles || brokenTiles.length === 0) return;

    const processedIds = processedBrokenIdsRef.current;
    const newShards: Shard[] = [];
    const colorsMap: Record<TileType, string> = {
      ruby: '#ff2d55',
      sapphire: '#007aff',
      emerald: '#4cd964',
      amethyst: '#5856d6',
      coin: '#ffeb60',
      valve: '#8a9baf'
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
      // Remove shards after animation finishes
      setTimeout(() => {
        setShards(prev => prev.filter(s => !newShards.includes(s)));
      }, 850);
    }
  }, [brokenTiles]);

  // Render SVG Icon for 3D Gemstones
  const renderTileIcon = (type: TileType) => {
    switch (type) {
      case 'ruby':
        return (
          <svg viewBox="0 0 40 40" className="tile-svg gem-3d">
            <polygon points="20,4 34,14 28,34 12,34 6,14" fill="url(#ruby-grad)" stroke="#ff2d55" strokeWidth="1" />
            {/* 3D cut facets */}
            <polygon points="20,4 6,14 20,20" fill="rgba(255,255,255,0.22)" />
            <polygon points="20,4 34,14 20,20" fill="rgba(255,255,255,0.38)" />
            <polygon points="34,14 28,34 20,20" fill="rgba(0,0,0,0.12)" />
            <polygon points="28,34 12,34 20,20" fill="rgba(0,0,0,0.24)" />
            <polygon points="12,34 6,14 20,20" fill="rgba(0,0,0,0.06)" />
          </svg>
        );
      case 'sapphire':
        return (
          <svg viewBox="0 0 40 40" className="tile-svg gem-3d">
            <path d="M20,4 C20,4 34,18 34,26 C34,32 28,36 20,36 C12,36 6,32 6,26 C6,18 20,4 20,4 Z" fill="url(#sapphire-grad)" stroke="#007aff" strokeWidth="1" />
            {/* 3D cut facets */}
            <path d="M20,4 C20,4 20,26 20,36 C12,36 6,32 6,26 C6,18 20,4 20,4 Z" fill="rgba(255,255,255,0.22)" />
            <path d="M20,4 C20,4 34,18 34,26 C34,32 20,36 20,4 Z" fill="rgba(255,255,255,0.08)" />
            <path d="M20,8 C20,8 28,18 28,24 C28,26 26,28 20,28 Z" fill="rgba(255,255,255,0.25)" />
          </svg>
        );
      case 'emerald':
        return (
          <svg viewBox="0 0 40 40" className="tile-svg gem-3d">
            <polygon points="20,4 34,20 20,36 6,20" fill="url(#emerald-grad)" stroke="#4cd964" strokeWidth="1" />
            {/* 3D cut facets */}
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
            {/* 3D cut facets */}
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
            <circle cx="20" cy="20" r="15" fill="url(#valve-wheel)" stroke="#334155" strokeWidth="1.5" />
            <circle cx="20" cy="20" r="8" fill="none" stroke="#94a3b8" strokeWidth="2.5" />
            <line x1="20" y1="5" x2="20" y2="35" stroke="#334155" strokeWidth="3" />
            <line x1="5" y1="20" x2="35" y2="20" stroke="#334155" strokeWidth="3" />
            <circle cx="20" cy="20" r="4" fill="#cbd5e1" stroke="#334155" strokeWidth="1" />
          </svg>
        );
    }
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
    const threshold = 30; // 30px swipe threshold

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

  const handleTouchEnd = () => {
    setSwipeStart(null);
  };

  // Mouse handlers for desktop dragging compatibility
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

  return (
    <div 
      className="board-container" 
      ref={boardRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* SVG Definitions for tile gradients */}
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
          <linearGradient id="valve-wheel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="50%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#334155" />
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
                <div className="algae-vines"></div>
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
                <div className={`tile-icon-container ${cell.type}`}>
                  {renderTileIcon(cell.type)}
                </div>
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

      {/* Water grid overlay to give realistic submerged glass effect */}
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
