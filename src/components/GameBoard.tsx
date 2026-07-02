import React, { useState, useRef } from 'react';
import type { GridState, TileType } from '../services/boardLogic';
import './GameBoard.css';

interface GameBoardProps {
  grid: GridState;
  selectedTile: { r: number; c: number } | null;
  waterLevelRow: number; // 0 to 8 (where water starts)
  isBoardLocked: boolean;
  onSelectTile: (r: number, c: number) => void;
  onSwapTiles: (r1: number, c1: number, r2: number, c2: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  grid,
  selectedTile,
  waterLevelRow,
  isBoardLocked,
  onSelectTile,
  onSwapTiles
}) => {
  const [swipeStart, setSwipeStart] = useState<{ r: number; c: number; x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Render SVG Icon for different candies
  const renderTileIcon = (type: TileType) => {
    switch (type) {
      case 'ruby':
        return (
          <svg viewBox="0 0 40 40" className="tile-svg">
            <polygon points="20,4 34,14 28,34 12,34 6,14" fill="url(#ruby-grad)" stroke="#ff2d55" strokeWidth="1.5" />
            <polygon points="20,10 28,16 25,28 15,28 12,16" fill="rgba(255,255,255,0.25)" />
          </svg>
        );
      case 'sapphire':
        return (
          <svg viewBox="0 0 40 40" className="tile-svg">
            <path d="M20,4 C20,4 34,18 34,26 C34,32 28,36 20,36 C12,36 6,32 6,26 C6,18 20,4 20,4 Z" fill="url(#sapphire-grad)" stroke="#007aff" strokeWidth="1.5" />
            <path d="M20,10 C20,10 28,20 28,26 C28,29 25,32 20,32 Z" fill="rgba(255,255,255,0.2)" />
          </svg>
        );
      case 'emerald':
        return (
          <svg viewBox="0 0 40 40" className="tile-svg">
            <polygon points="20,4 34,20 20,36 6,20" fill="url(#emerald-grad)" stroke="#4cd964" strokeWidth="1.5" />
            <polygon points="20,10 28,20 20,30 12,20" fill="rgba(255,255,255,0.25)" />
          </svg>
        );
      case 'amethyst':
        return (
          <svg viewBox="0 0 40 40" className="tile-svg">
            <polygon points="20,4 34,12 34,28 20,36 6,28 6,12" fill="url(#amethyst-grad)" stroke="#5856d6" strokeWidth="1.5" />
            <polygon points="20,11 27,15 27,25 20,29 13,25 13,15" fill="rgba(255,255,255,0.25)" />
          </svg>
        );
      case 'coin':
        return (
          <svg viewBox="0 0 40 40" className="tile-svg gold-coin-svg">
            <circle cx="20" cy="20" r="15" fill="url(#coin-grad)" stroke="#cc9900" strokeWidth="1.5" />
            <circle cx="20" cy="20" r="11" fill="none" stroke="#cc9900" strokeWidth="1" strokeDasharray="2,2" />
            <text x="20" y="24" fontSize="12" fontWeight="bold" fill="#7a5c00" textAnchor="middle">$</text>
          </svg>
        );
      case 'valve':
        return (
          <svg viewBox="0 0 40 40" className="tile-svg valve-svg">
            <circle cx="20" cy="20" r="15" fill="url(#valve-wheel)" stroke="#444" strokeWidth="1.5" />
            <circle cx="20" cy="20" r="8" fill="none" stroke="#888" strokeWidth="2.5" />
            {/* Valve spokes */}
            <line x1="20" y1="5" x2="20" y2="35" stroke="#444" strokeWidth="3" />
            <line x1="5" y1="20" x2="35" y2="20" stroke="#444" strokeWidth="3" />
            <circle cx="20" cy="20" r="4" fill="#a0a0a0" stroke="#444" strokeWidth="1" />
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
        // Horizontal swipe
        targetC = dx > 0 ? swipeStart.c + 1 : swipeStart.c - 1;
      } else {
        // Vertical swipe
        targetR = dy > 0 ? swipeStart.r + 1 : swipeStart.r - 1;
      }

      // Check bounds
      if (targetR >= 0 && targetR < 8 && targetC >= 0 && targetC < 8) {
        onSwapTiles(swipeStart.r, swipeStart.c, targetR, targetC);
      }
      setSwipeStart(null); // Reset swipe to prevent multiple swaps
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
            <stop offset="0%" stopColor="#9e9e9e" />
            <stop offset="50%" stopColor="#757575" />
            <stop offset="100%" stopColor="#424242" />
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
                {/* Splattery mossy locking graphics */}
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
                  opacity: cell.algae ? 0.9 : 1
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
