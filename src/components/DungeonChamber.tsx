import React, { useState, useEffect, useRef } from 'react';
import './DungeonChamber.css';

interface DungeonChamberProps {
  waterLevel: number; // 0 to 100
  gameState: 'playing' | 'tutorial' | 'gameover' | 'victory' | 'menu';
}

export const DungeonChamber: React.FC<DungeonChamberProps> = ({ waterLevel, gameState }) => {
  // Determine King's visual state based on water level and game state
  let kingState: 'standing' | 'begging' | 'swimming' | 'drowned' | 'victory' = 'standing';

  if (gameState === 'victory') {
    kingState = 'victory';
  } else if (gameState === 'gameover' || waterLevel >= 100) {
    kingState = 'drowned';
  } else if (waterLevel > 65) {
    kingState = 'swimming';
  } else if (waterLevel > 0) {
    kingState = 'begging'; // Suspend/begging at the top
  } else {
    kingState = 'standing';
  }

  // Reactions state for drainage or rising flood
  const [reactionState, setReactionState] = useState<'normal' | 'relieved' | 'panicked'>('normal');
  const prevWaterRef = useRef(waterLevel);
  const [isShaking, setIsShaking] = useState(false);
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    if (gameState !== 'playing') {
      setReactionState('normal');
      return;
    }

    if (waterLevel > prevWaterRef.current) {
      // 1. Water went UP -> Panic!
      setIsShaking(true);
      setReactionState('panicked');
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setReactionState('normal');
        setIsShaking(false);
      }, 1800);
    } else if (waterLevel < prevWaterRef.current) {
      // 2. Water went DOWN -> Relieved & Happy!
      setReactionState('relieved');
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setReactionState('normal');
      }, 1800);
    }

    prevWaterRef.current = waterLevel;
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [waterLevel, gameState]);

  // Generate bubbles for drowned or swimming states
  const renderBubbles = () => {
    if (kingState !== 'swimming' && kingState !== 'drowned') return null;
    return (
      <div className="bubbles-container">
        <div className="bubble b1"></div>
        <div className="bubble b2"></div>
        <div className="bubble b3"></div>
        <div className="bubble b4"></div>
        <div className="bubble b5"></div>
      </div>
    );
  };

  // Determine vertical positioning styles:
  let topStyle = '8px';
  let bottomStyle = 'auto';

  if (kingState === 'swimming') {
    bottomStyle = `calc(${waterLevel}% - 45px)`;
    topStyle = 'auto';
  } else if (kingState === 'victory') {
    bottomStyle = '12px';
    topStyle = 'auto';
  }

  return (
    <div className={`dungeon-chamber ${isShaking ? 'rumble-shake' : ''}`}>
      {/* Background brick lines pattern */}
      <div className="dungeon-bricks"></div>

      {/* The Dungeon Cell Bars */}
      <div className="cell-bars">
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </div>

      {/* Floating Shackle Chain */}
      <div className="shackle-chain"></div>

      {/* Animated King Character */}
      <div 
        className={`king-character state-${kingState}`}
        style={{ top: topStyle, bottom: bottomStyle }}
      >
        <svg viewBox="0 0 120 150" className="king-svg">
          {/* Ceiling chains holding him by wrists (visible in suspension) */}
          {(kingState === 'standing' || kingState === 'begging' || kingState === 'drowned') && (
            <g className="hanging-ceiling-chains">
              <line x1="25" y1="0" x2="25" y2="120" stroke="#c5a059" strokeWidth="2.5" strokeDasharray="3,3" />
              <circle cx="25" cy="120" r="11" fill="none" stroke="#8b6508" strokeWidth="2" />
              
              <line x1="95" y1="0" x2="95" y2="120" stroke="#c5a059" strokeWidth="2.5" strokeDasharray="3,3" />
              <circle cx="95" cy="120" r="11" fill="none" stroke="#8b6508" strokeWidth="2" />
            </g>
          )}

          {/* Shadow (only when standing on the ground in victory) */}
          {kingState === 'victory' && (
            <ellipse cx="60" cy="140" rx="30" ry="6" fill="rgba(0,0,0,0.18)" />
          )}

          {/* King Body / Robe */}
          <path 
            className="king-robe" 
            d="M30,130 C30,90 90,90 90,130 Z" 
            fill="#d32f2f" 
            stroke="#5d0000" 
            strokeWidth="3" 
          />
          {/* Royal Cape collar */}
          <path d="M42,95 Q60,110 78,95 Q60,102 42,95 Z" fill="#ffffff" stroke="#ccc" strokeWidth="1.5" />
          <circle cx="50" cy="100" fill="#ffeb60" r="2.5" />
          <circle cx="70" cy="100" fill="#ffeb60" r="2.5" />

          {/* Worried slanted eyebrows */}
          {(kingState === 'begging' || kingState === 'swimming' || kingState === 'drowned') && (
            <g className="worried-eyebrows">
              {reactionState === 'panicked' ? (
                <>
                  {/* Extreme slanted brows */}
                  <path d="M38,55 Q48,51 52,61" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M82,55 Q72,51 68,61" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
                </>
              ) : reactionState === 'relieved' ? (
                <>
                  {/* Flat relaxed brows */}
                  <path d="M40,61 L52,61" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M80,61 L68,61" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
                </>
              ) : (
                <>
                  {/* Normal worried brows */}
                  <path d="M40,58 Q48,54 52,60" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <path d="M80,58 Q72,54 68,60" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </>
              )}
            </g>
          )}

          {/* Hands */}
          {kingState === 'victory' || reactionState === 'relieved' ? (
            <>
              {/* Hands raised in cheer / relief */}
              <circle cx="20" cy="60" r="10" fill="#ffcc80" stroke="#b28750" strokeWidth="2.5" className="hand-left-raised" />
              <circle cx="100" cy="60" r="10" fill="#ffcc80" stroke="#b28750" strokeWidth="2.5" className="hand-right-raised" />
            </>
          ) : kingState === 'swimming' ? (
            <>
              {/* Hands treading water */}
              <circle cx="15" cy="110" r="10" fill="#ffcc80" stroke="#b28750" strokeWidth="2.5" className="hand-tread-left" />
              <circle cx="105" cy="110" r="10" fill="#ffcc80" stroke="#b28750" strokeWidth="2.5" className="hand-tread-right" />
            </>
          ) : kingState === 'begging' ? (
            <>
              {/* Hands clasped together in pleading prayer */}
              <g className={`hand-begging-plead ${reactionState === 'panicked' ? 'fast-shake' : ''}`}>
                <circle cx="52" cy="108" r="9" fill="#ffcc80" stroke="#b28750" strokeWidth="2.5" />
                <circle cx="68" cy="108" r="9" fill="#ffcc80" stroke="#b28750" strokeWidth="2.5" />
              </g>
            </>
          ) : (
            <>
              {/* Hands chained up */}
              <circle cx="25" cy="120" r="10" fill="#ffcc80" stroke="#b28750" strokeWidth="2.5" />
              <circle cx="95" cy="120" r="10" fill="#ffcc80" stroke="#b28750" strokeWidth="2.5" />
            </>
          )}

          {/* King Head */}
          <circle 
            className="king-head" 
            cx="60" 
            cy="75" 
            r="25" 
            fill="#ffcc80" 
            stroke="#b28750" 
            strokeWidth="3" 
          />

          {/* Beard / Hair */}
          <path 
            className="king-beard" 
            d="M37,80 Q60,115 83,80 Q60,95 37,80 Z" 
            fill="#f5f5f5" 
            stroke="#d5d5d5" 
            strokeWidth="1.5" 
          />
          <path d="M35,70 Q25,75 35,80" fill="none" stroke="#f5f5f5" strokeWidth="6" strokeLinecap="round" />
          <path d="M85,70 Q95,75 85,80" fill="none" stroke="#f5f5f5" strokeWidth="6" strokeLinecap="round" />

          {/* Eyes looking DOWN at the water */}
          {kingState === 'drowned' ? (
            <>
              {/* Dead eyes (X X) */}
              <path d="M48,65 L56,73 M56,65 L48,73" stroke="#333" strokeWidth="3" strokeLinecap="round" />
              <path d="M64,65 L72,73 M72,65 L64,73" stroke="#333" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : reactionState === 'relieved' || kingState === 'victory' ? (
            <>
              {/* Happy smiling relieved eyes */}
              <path d="M45,68 Q50,62 55,68" stroke="#333" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M65,68 Q70,62 75,68" stroke="#333" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </>
          ) : reactionState === 'panicked' ? (
            <>
              {/* Screaming wide bloodshot/fear eyes */}
              <circle cx="50" cy="68" r="7" fill="#fff" stroke="#c53030" strokeWidth="2.2" />
              <circle cx="50" cy="68" r="4.2" fill="#000" />
              <circle cx="70" cy="68" r="7" fill="#fff" stroke="#c53030" strokeWidth="2.2" />
              <circle cx="70" cy="68" r="4.2" fill="#000" />
              <path d="M52,50 Q56,48 60,52" stroke="#00d4ff" strokeWidth="2" fill="none" />
            </>
          ) : kingState === 'swimming' ? (
            <>
              {/* Panicked wide eyes */}
              <circle cx="50" cy="68" r="6" fill="#fff" stroke="#333" strokeWidth="1.5" />
              <circle cx="50" cy="68" r="3" fill="#000" />
              <circle cx="70" cy="68" r="6" fill="#fff" stroke="#333" strokeWidth="1.5" />
              <circle cx="70" cy="68" r="3" fill="#000" />
              <path d="M52,50 Q56,48 60,52" stroke="#00d4ff" strokeWidth="2" fill="none" />
            </>
          ) : (
            <>
              {/* Normal nervous eyes looking down */}
              <circle cx="50" cy="68" r="5" fill="#fff" stroke="#333" strokeWidth="1.5" />
              <circle cx="50" cy="70" r="2.5" fill="#000" />
              <circle cx="70" cy="68" r="5" fill="#fff" stroke="#333" strokeWidth="1.5" />
              <circle cx="70" cy="70" r="2.5" fill="#000" />
            </>
          )}

          {/* Tears falling in begging state (disabled when relieved!) */}
          {kingState === 'begging' && reactionState !== 'relieved' && (
            <>
              <circle cx="46" cy="78" r="2.5" fill="#00d4ff" className={`tear-drop tear-left ${reactionState === 'panicked' ? 'fast-drip' : ''}`} />
              <circle cx="74" cy="78" r="2.5" fill="#00d4ff" className={`tear-drop tear-right ${reactionState === 'panicked' ? 'fast-drip' : ''}`} />
            </>
          )}

          {/* Mouth */}
          {kingState === 'victory' || reactionState === 'relieved' ? (
            <path d="M48,85 Q60,98 72,85 Z" fill="#d32f2f" stroke="#333" strokeWidth="1.5" /> // Big Smile
          ) : reactionState === 'panicked' ? (
            <ellipse cx="60" cy="90" rx="8" ry="11" fill="#801010" stroke="#333" strokeWidth="2.5" /> // Massive Scream
          ) : kingState === 'swimming' ? (
            <circle cx="60" cy="88" r="7" fill="#801010" stroke="#333" strokeWidth="2" />
          ) : kingState === 'begging' ? (
            <path d="M48,84 Q60,95 72,84 Q60,86 48,84 Z" fill="#801010" stroke="#333" strokeWidth="1.5" />
          ) : kingState === 'drowned' ? (
            <path d="M50,88 Q60,82 70,88" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M52,86 Q60,89 68,86" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          )}

          {/* Crown */}
          <path 
            className="king-crown" 
            d="M38,55 L42,32 L60,43 L78,32 L82,55 Z" 
            fill="#FFD700" 
            stroke="#8B6914" 
            strokeWidth="2.5" 
          />
          <circle cx="42" cy="32" r="3.5" fill="#ff2d55" className="sparkle-gem g1" />
          <circle cx="60" cy="43" r="3.5" fill="#007aff" className="sparkle-gem g2" />
          <circle cx="78" cy="32" r="3.5" fill="#ff2d55" className="sparkle-gem g3" />
          <polygon points="56,51 60,47 64,51 60,55" fill="#4cd964" />

          {/* Pleading speech bubble (relieved = green WHEW!, panicked = violent AAAH!, normal = red HELP!) */}
          {(kingState === 'begging' || kingState === 'swimming') && (
            <>
              {reactionState === 'relieved' ? (
                <g className="king-speech-bubble relieved">
                  <path d="M82,54 L92,44 L80,42 Z" fill="#ffffff" stroke="#c5a059" strokeWidth="1.5" />
                  <rect x="72" y="8" width="46" height="30" rx="8" fill="#ffffff" stroke="#c5a059" strokeWidth="2" />
                  <text x="95" y="27" fontSize="8.5" fontWeight="900" fill="#2ecc71" textAnchor="middle">WHEW!</text>
                </g>
              ) : reactionState === 'panicked' ? (
                <g className="king-speech-bubble panicked">
                  <path d="M82,54 L92,44 L80,42 Z" fill="#ffffff" stroke="#c5a059" strokeWidth="1.5" />
                  <rect x="74" y="8" width="44" height="30" rx="8" fill="#ffffff" stroke="#c5a059" strokeWidth="2" />
                  <text x="96" y="27" fontSize="8.5" fontWeight="900" fill="#d32f2f" textAnchor="middle">AAAH!</text>
                </g>
              ) : (
                <g className="king-speech-bubble">
                  <path d="M82,54 L92,44 L80,42 Z" fill="#ffffff" stroke="#c5a059" strokeWidth="1.5" />
                  <rect x="76" y="8" width="41" height="30" rx="8" fill="#ffffff" stroke="#c5a059" strokeWidth="2" />
                  <text x="96" y="27" fontSize="9" fontWeight="900" fill="#c53030" textAnchor="middle">HELP!</text>
                </g>
              )}
            </>
          )}
        </svg>
      </div>

      {/* Floating debris in water */}
      {waterLevel > 20 && (
        <div className="water-debris" style={{ bottom: `${waterLevel - 10}%` }}>
          <div className="wooden-plank"></div>
        </div>
      )}

      {/* Dynamic Water Overlay */}
      <div 
        className="water-overlay" 
        style={{ height: `${waterLevel}%` }}
      >
        <div className="water-wave wave-front">
          <svg viewBox="0 0 120 28" preserveAspectRatio="none" className="wave-svg">
            <path d="M0,15 C30,5 90,25 120,15 L120,28 L0,28 Z" fill="rgba(41, 128, 185, 0.7)" />
          </svg>
        </div>
        <div className="water-wave wave-back">
          <svg viewBox="0 0 120 28" preserveAspectRatio="none" className="wave-svg">
            <path d="M0,15 C30,25 90,5 120,15 L120,28 L0,28 Z" fill="rgba(52, 152, 219, 0.4)" />
          </svg>
        </div>

        {/* Bubble particles */}
        {renderBubbles()}
      </div>

      {/* Water level indicator lines */}
      <div className="water-markers">
        <span className="marker danger">DANGER (80%)</span>
        <span className="marker warning">WARNING (50%)</span>
      </div>
    </div>
  );
};
