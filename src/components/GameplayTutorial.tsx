import React, { useEffect, useState, useRef } from 'react';
import './GameplayTutorial.css';

interface GameplayTutorialProps {
  levelId: number;
  tutorialText: string[];
  activeIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export const GameplayTutorial: React.FC<GameplayTutorialProps> = ({
  levelId,
  tutorialText,
  activeIndex,
  onNext,
  onPrev,
  onClose
}) => {
  const isLastStep = activeIndex === tutorialText.length - 1;
  const overlayRef = useRef<HTMLDivElement>(null);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({ opacity: 0 });

  // 1. Determine the highlight target name and bubble layout classes
  const getTutorialTarget = (): { name: string; positionClass: string; arrowClass: string } => {
    if (levelId === 1) {
      if (activeIndex === 0) {
        return { name: 'board', positionClass: 'pos-board', arrowClass: 'arrow-down' };
      }
      if (activeIndex === 1) {
        return { name: 'hud-coins', positionClass: 'pos-hud-coins', arrowClass: 'arrow-up' };
      }
      return { name: 'chamber', positionClass: 'pos-chamber', arrowClass: 'arrow-up' };
    }
    
    if (levelId === 2) {
      return { name: 'water-line', positionClass: 'pos-water-line', arrowClass: 'arrow-down' };
    }
    
    if (levelId === 3) {
      return { name: 'board', positionClass: 'pos-board-valve', arrowClass: 'arrow-down' };
    }

    if (levelId === 4) {
      return { name: 'board', positionClass: 'pos-board-algae', arrowClass: 'arrow-down' };
    }

    if (levelId === 9) {
      return { name: 'cursed-tile', positionClass: 'pos-board', arrowClass: 'arrow-down' };
    }

    if (levelId === 13) {
      return { name: 'chain-breaker', positionClass: 'pos-board', arrowClass: 'arrow-down' };
    }

    if (levelId === 17) {
      return { name: 'shadow-vault', positionClass: 'pos-board', arrowClass: 'arrow-down' };
    }

    if (levelId === 21) {
      return { name: 'dark-valve', positionClass: 'pos-board', arrowClass: 'arrow-down' };
    }

    // Default (Level 5+)
    return { name: 'chamber', positionClass: 'pos-chamber-danger', arrowClass: 'arrow-up' };
  };

  const target = getTutorialTarget();

  // 2. Map target names to DOM selectors
  const getSelector = (name: string): string => {
    switch (name) {
      case 'board':
        return '.board-container';
      case 'hud-coins':
        return '.coins-metric';
      case 'chamber':
        return '.dungeon-chamber';
      case 'water-line':
        return '.water-level-line';
      case 'cursed-tile':
        return '.cursed-skull-tile';
      case 'chain-breaker':
        return '.chain-breaker-icon';
      case 'shadow-vault':
        return '.shadow-vault-tile';
      case 'dark-valve':
        return '.dark-valve-tile';
      default:
        return '';
    }
  };

  // 3. Measure DOM boundaries dynamically on mount or when target shifts
  useEffect(() => {
    const selector = getSelector(target.name);
    const parentEl = overlayRef.current;
    const targetEl = selector ? document.querySelector(selector) : null;

    if (parentEl && targetEl) {
      const parentRect = parentEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      // Relative pixel offsets inside the overlay mask
      const top = targetRect.top - parentRect.top;
      const left = targetRect.left - parentRect.left;
      const width = targetRect.width;
      const height = targetRect.height;

      // Compensate slightly for high-z rings borders
      setHighlightStyle({
        top: `${top - 4}px`,
        left: `${left - 4}px`,
        width: `${width + 8}px`,
        height: `${height + 8}px`,
        opacity: 1
      });
    } else if (parentEl && (target.name === 'cursed-tile' || target.name === 'chain-breaker' || target.name === 'shadow-vault' || target.name === 'dark-valve')) {
      const boardEl = document.querySelector('.board-container');
      if (boardEl) {
        const parentRect = parentEl.getBoundingClientRect();
        const boardRect = boardEl.getBoundingClientRect();
        const top = boardRect.top - parentRect.top;
        const left = boardRect.left - parentRect.left;
        const width = boardRect.width;
        const height = boardRect.height;

        setHighlightStyle({
          top: `${top - 4}px`,
          left: `${left - 4}px`,
          width: `${width + 8}px`,
          height: `${height + 8}px`,
          opacity: 1
        });
      }
    } else if (parentEl && target.name === 'water-line') {
      // Fallback: if water-level-line is off-grid or not rendered, highlight lower rows of board
      const boardEl = document.querySelector('.board-container');
      if (boardEl) {
        const parentRect = parentEl.getBoundingClientRect();
        const boardRect = boardEl.getBoundingClientRect();
        
        // Target bottom 4 rows (bottom 50% of the grid)
        const top = boardRect.top - parentRect.top + (boardRect.height * 0.5);
        const left = boardRect.left - parentRect.left;
        const width = boardRect.width;
        const height = boardRect.height * 0.5;

        setHighlightStyle({
          top: `${top - 4}px`,
          left: `${left - 4}px`,
          width: `${width + 8}px`,
          height: `${height + 8}px`,
          opacity: 1
        });
      }
    } else {
      setHighlightStyle({ opacity: 0 });
    }
  }, [target.name, activeIndex, levelId]);

  return (
    <div ref={overlayRef} className={`tutorial-stencil-overlay target-${target.name}`}>
      {/* 1. Dynamic Glowing Highlight Ring wrapper */}
      <div 
        className="glowing-highlight-ring" 
        style={highlightStyle}
      />

      {/* 2. Floating Speech Bubble Tooltip */}
      <div className={`speech-bubble ${target.positionClass} ${target.arrowClass}`}>
        <div className="speech-body">
          <p>{tutorialText[activeIndex]}</p>
        </div>

        {/* Action controls inside speech bubble */}
        <div className="speech-actions">
          {activeIndex > 0 ? (
            <button className="bubble-btn sec-btn" onClick={onPrev}>
              ◀
            </button>
          ) : (
            <div />
          )}

          <div className="bubble-step-dots">
            {tutorialText.map((_, i) => (
              <span key={i} className={`bubble-dot ${i === activeIndex ? 'active' : ''}`} />
            ))}
          </div>

          {isLastStep ? (
            <button className="bubble-btn pri-btn play-glow" onClick={onClose}>
              PLAY!
            </button>
          ) : (
            <button className="bubble-btn pri-btn" onClick={onNext}>
              NEXT
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
