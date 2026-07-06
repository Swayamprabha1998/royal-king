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
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const [bubbleStyle, setBubbleStyle] = useState<React.CSSProperties>({});
  const [dynamicArrowClass, setDynamicArrowClass] = useState<string>('');

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
      if (activeIndex === 1) {
        return { name: 'cursed-tile', positionClass: 'pos-board', arrowClass: 'arrow-down' };
      }
      return { name: 'none', positionClass: 'pos-center', arrowClass: 'arrow-none' };
    }

    if (levelId === 13) {
      if (activeIndex === 1) {
        return { name: 'chain-breaker', positionClass: 'pos-board', arrowClass: 'arrow-down' };
      }
      return { name: 'none', positionClass: 'pos-center', arrowClass: 'arrow-none' };
    }

    if (levelId === 17) {
      if (activeIndex === 0) {
        return { name: 'shadow-vault', positionClass: 'pos-board', arrowClass: 'arrow-down' };
      }
      return { name: 'none', positionClass: 'pos-center', arrowClass: 'arrow-none' };
    }

    if (levelId === 21) {
      if (activeIndex === 0) {
        return { name: 'dark-valve', positionClass: 'pos-board', arrowClass: 'arrow-down' };
      }
      return { name: 'none', positionClass: 'pos-center', arrowClass: 'arrow-none' };
    }

    // Default (Level 5+)
    return { name: 'none', positionClass: 'pos-center', arrowClass: 'arrow-none' };
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
    let active = true;
    const timer = setTimeout(() => {
      if (!active) return;

      const selector = getSelector(target.name);
      const parentEl = overlayRef.current;
      const targetEl = selector ? document.querySelector(selector) : null;
      const bubbleEl = bubbleRef.current;

      const isDynamicTileTarget = target.name === 'cursed-tile' || target.name === 'chain-breaker' || target.name === 'shadow-vault' || target.name === 'dark-valve';

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

        if (isDynamicTileTarget) {
          const bubbleRect = bubbleEl ? bubbleEl.getBoundingClientRect() : { width: 280, height: 110 };
          let bubbleLeft = left + (width / 2) - (bubbleRect.width / 2);
          let bubbleTop = top - bubbleRect.height - 18;
          let arrowClass = 'arrow-down';

          if (bubbleTop < 10) {
            bubbleTop = top + height + 18;
            arrowClass = 'arrow-up';
          }

          if (bubbleLeft < 10) {
            bubbleLeft = 10;
          } else if (bubbleLeft + bubbleRect.width > parentRect.width - 10) {
            bubbleLeft = parentRect.width - bubbleRect.width - 10;
          }

          setBubbleStyle({
            top: `${bubbleTop}px`,
            left: `${bubbleLeft}px`,
            transform: 'none',
            opacity: 1
          });
          setDynamicArrowClass(arrowClass);
        } else {
          setBubbleStyle({});
          setDynamicArrowClass('');
        }
      } else if (parentEl && isDynamicTileTarget) {
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
        setBubbleStyle({});
        setDynamicArrowClass('');
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
        setBubbleStyle({});
        setDynamicArrowClass('');
      } else {
        setHighlightStyle({ opacity: 0 });
        setBubbleStyle({});
        setDynamicArrowClass('');
      }
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [target.name, activeIndex, levelId]);

  return (
    <div ref={overlayRef} className={`tutorial-stencil-overlay target-${target.name}`}>
      {/* 1. Dynamic Glowing Highlight Ring wrapper */}
      <div 
        className="glowing-highlight-ring" 
        style={highlightStyle}
      />

      {/* 2. Floating Speech Bubble Tooltip */}
      <div 
        ref={bubbleRef}
        className={`speech-bubble ${target.positionClass} ${dynamicArrowClass || target.arrowClass}`}
        style={bubbleStyle}
      >
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
