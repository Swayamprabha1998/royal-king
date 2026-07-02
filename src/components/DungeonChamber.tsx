import React, { useState, useEffect, useRef } from 'react';
import './DungeonChamber.css';

interface DungeonChamberProps {
  waterLevel: number; // 0 to 100
  gameState: 'playing' | 'tutorial' | 'gameover' | 'victory' | 'menu' | 'escaping';
}

export const DungeonChamber: React.FC<DungeonChamberProps> = ({ waterLevel, gameState }) => {
  // Determine King's visual state based on water level and game state
  let kingState: 'standing' | 'begging' | 'swimming' | 'drowned' | 'victory' = 'standing';

  if (gameState === 'victory' || gameState === 'escaping') {
    kingState = 'victory';
  } else if (gameState === 'gameover' || waterLevel >= 100) {
    kingState = 'drowned';
  } else if (waterLevel > 60) {
    kingState = 'swimming';
  } else if (waterLevel > 15) {
    kingState = 'begging'; // Panicked begging state
  } else {
    kingState = 'standing'; // Normal standing
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
      setIsShaking(true);
      setReactionState('panicked');
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setReactionState('normal');
        setIsShaking(false);
      }, 1800);
    } else if (waterLevel < prevWaterRef.current) {
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
  // The King starts standing on the floor. As water rises above 15%, he floats dynamically on the surface!
  let topStyle = 'auto';
  let bottomStyle = '12px'; // ground floor

  if (kingState === 'swimming') {
    bottomStyle = `calc(${waterLevel}% - 48px)`;
  } else if (kingState === 'begging') {
    bottomStyle = `calc(${waterLevel}% - 36px)`;
  } else if (kingState === 'drowned') {
    bottomStyle = '12px'; // Drowned sinks to floor
  } else if (kingState === 'victory') {
    bottomStyle = '12px'; // Celebrates on floor once water drains
  }

  return (
    <div className={`dungeon-chamber ${isShaking ? 'rumble-shake' : ''}`}>
      {/* Background brick lines pattern */}
      <div className="dungeon-bricks"></div>

      {/* Sewer Leakage Pipe Nozzle (Water Source) */}
      <div className="water-pipe-nozzle">
        <div className="pipe-base"></div>
        <div className="pipe-rim"></div>
      </div>

      {/* Pouring stream is a direct child of the chamber, positioned relative to nozzle */}
      {waterLevel < 100 && (
        <div 
          className="water-pour-stream animate-stream"
          style={{ height: `calc(100% - ${waterLevel}% - 32px)` }}
        />
      )}

      {/* Stream splash effect at water surface */}
      {waterLevel < 100 && (
        <div 
          className="water-stream-splash"
          style={{ bottom: `calc(${waterLevel}% - 6px)` }}
        >
          <div className="splash-drop d1"></div>
          <div className="splash-drop d2"></div>
          <div className="splash-drop d3"></div>
          <div className="splash-ring"></div>
        </div>
      )}

      {/* Arched Dungeon Escape Door (Right Wall) */}
      <div className={`escape-door ${gameState === 'victory' || gameState === 'escaping' ? 'door-open' : ''}`}>
        <div className="door-arch-frame"></div>
        <div className="door-wood-plank">
          <div className="door-hinge h-top"></div>
          <div className="door-hinge h-bottom"></div>
          <div className="door-ring-handle"></div>
        </div>
      </div>

      {/* The Dungeon Cell Bars */}
      <div className="cell-bars">
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </div>

      {/* Animated King Character */}
      <div 
        className={`king-character state-${kingState} ${gameState === 'victory' || gameState === 'escaping' ? 'victory-escape' : ''}`}
        style={{ top: topStyle, bottom: bottomStyle }}
      >
        <svg viewBox="0 0 120 160" className="king-svg">
          {/* Shadow (only when standing on ground) */}
          {(kingState === 'standing' || kingState === 'victory' || kingState === 'drowned') && (
            <ellipse cx="60" cy="152" rx="28" ry="5" fill="rgba(0,0,0,0.18)" />
          )}

          {/* 1. KING LEGS AND BOOTS */}
          {kingState !== 'drowned' && (
            <g className="king-legs-group">
              {/* Left Leg */}
              <g className={`king-leg leg-left ${(kingState === 'swimming' || kingState === 'begging') ? 'kicking-left' : ''}`}>
                {/* Trousers */}
                <rect x="42" y="124" width="9" height="18" fill="#4e342e" stroke="#2d1a10" strokeWidth="1.5" />
                {/* Boot */}
                <path d="M42,138 L34,142 L34,148 L46,148 L47,138 Z" fill="#271510" stroke="#000" strokeWidth="1.5" />
              </g>
              
              {/* Right Leg */}
              <g className={`king-leg leg-right ${(kingState === 'swimming' || kingState === 'begging') ? 'kicking-right' : ''}`}>
                {/* Trousers */}
                <rect x="69" y="124" width="9" height="18" fill="#4e342e" stroke="#2d1a10" strokeWidth="1.5" />
                {/* Boot */}
                <path d="M69,138 L68,138 L69,148 L81,148 L81,142 Z" fill="#271510" stroke="#000" strokeWidth="1.5" />
              </g>
            </g>
          )}

          {/* 2. KING BODY & ROBE */}
          <path 
            className="king-robe" 
            d="M30,130 C30,90 90,90 90,130 Z" 
            fill="#d32f2f" 
            stroke="#5d0000" 
            strokeWidth="3" 
          />
          {/* Cape Collar details */}
          <path d="M42,95 Q60,110 78,95 Q60,102 42,95 Z" fill="#ffffff" stroke="#ccc" strokeWidth="1.5" />
          <circle cx="50" cy="102" fill="#ffeb60" r="2.5" />
          <circle cx="70" cy="102" fill="#ffeb60" r="2.5" />

          {/* Worried Eyebrows */}
          {(kingState === 'begging' || kingState === 'swimming' || kingState === 'drowned') && (
            <g className="worried-eyebrows">
              {reactionState === 'panicked' ? (
                <>
                  <path d="M38,55 Q48,51 52,61" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M82,55 Q72,51 68,61" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
                </>
              ) : reactionState === 'relieved' ? (
                <>
                  <path d="M40,61 L52,61" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M80,61 L68,61" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <path d="M40,58 Q48,54 52,60" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <path d="M80,58 Q72,54 68,60" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </>
              )}
            </g>
          )}

          {/* 3. ARMS & HANDS */}
          {kingState === 'victory' || reactionState === 'relieved' ? (
            <g className="arms-cheering">
              {/* Left Arm raised */}
              <path d="M30,105 Q12,75 16,58" fill="none" stroke="#d32f2f" strokeWidth="12" strokeLinecap="round" />
              <circle cx="16" cy="52" r="9" fill="#ffcc80" stroke="#b28750" strokeWidth="2.5" className="hand-left-raised" />
              
              {/* Right Arm raised */}
              <path d="M90,105 Q108,75 104,58" fill="none" stroke="#d32f2f" strokeWidth="12" strokeLinecap="round" />
              <circle cx="104" cy="52" r="9" fill="#ffcc80" stroke="#b28750" strokeWidth="2.5" className="hand-right-raised" />
            </g>
          ) : kingState === 'swimming' ? (
            <g className="arms-swimming">
              {/* Left Arm treading */}
              <path d="M32,108 Q10,112 18,122" fill="none" stroke="#d32f2f" strokeWidth="11" strokeLinecap="round" />
              <circle cx="18" cy="125" r="9" fill="#ffcc80" stroke="#b28750" strokeWidth="2.5" className="hand-tread-left" />
              
              {/* Right Arm treading */}
              <path d="M88,108 Q110,112 102,122" fill="none" stroke="#d32f2f" strokeWidth="11" strokeLinecap="round" />
              <circle cx="102" cy="125" r="9" fill="#ffcc80" stroke="#b28750" strokeWidth="2.5" className="hand-tread-right" />
            </g>
          ) : kingState === 'begging' ? (
            <g className="arms-begging">
              {/* Pleading folded arms */}
              <path d="M32,108 Q52,118 52,108" fill="none" stroke="#d32f2f" strokeWidth="10" strokeLinecap="round" />
              <path d="M88,108 Q68,118 68,108" fill="none" stroke="#d32f2f" strokeWidth="10" strokeLinecap="round" />
              <g className={`hand-begging-plead ${reactionState === 'panicked' ? 'fast-shake' : ''}`}>
                <circle cx="52" cy="108" r="9" fill="#ffcc80" stroke="#b28750" strokeWidth="2.5" />
                <circle cx="68" cy="108" r="9" fill="#ffcc80" stroke="#b28750" strokeWidth="2.5" />
              </g>
            </g>
          ) : (
            <g className="arms-normal">
              {/* Normal arms resting */}
              <path d="M32,108 Q20,122 25,130" fill="none" stroke="#d32f2f" strokeWidth="10" strokeLinecap="round" />
              <circle cx="25" cy="132" r="9" fill="#ffcc80" stroke="#b28750" strokeWidth="2.5" />
              
              <path d="M88,108 Q100,122 95,130" fill="none" stroke="#d32f2f" strokeWidth="10" strokeLinecap="round" />
              <circle cx="95" cy="132" r="9" fill="#ffcc80" stroke="#b28750" strokeWidth="2.5" />
            </g>
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

          {/* Eyes looking DOWN at the creeping flood water */}
          {kingState === 'drowned' ? (
            <>
              <path d="M48,65 L56,73 M56,65 L48,73" stroke="#333" strokeWidth="3" strokeLinecap="round" />
              <path d="M64,65 L72,73 M72,65 L64,73" stroke="#333" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : reactionState === 'relieved' || kingState === 'victory' ? (
            <>
              <path d="M45,68 Q50,62 55,68" stroke="#333" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M65,68 Q70,62 75,68" stroke="#333" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </>
          ) : reactionState === 'panicked' ? (
            <>
              <circle cx="50" cy="68" r="7" fill="#fff" stroke="#c53030" strokeWidth="2.2" />
              <circle cx="50" cy="68" r="4.2" fill="#000" />
              <circle cx="70" cy="68" r="7" fill="#fff" stroke="#c53030" strokeWidth="2.2" />
              <circle cx="70" cy="68" r="4.2" fill="#000" />
              <path d="M52,50 Q56,48 60,52" stroke="#00d4ff" strokeWidth="2" fill="none" />
            </>
          ) : kingState === 'swimming' ? (
            <>
              <circle cx="50" cy="68" r="6" fill="#fff" stroke="#333" strokeWidth="1.5" />
              <circle cx="50" cy="68" r="3" fill="#000" />
              <circle cx="70" cy="68" r="6" fill="#fff" stroke="#333" strokeWidth="1.5" />
              <circle cx="70" cy="68" r="3" fill="#000" />
              <path d="M52,50 Q56,48 60,52" stroke="#00d4ff" strokeWidth="2" fill="none" />
            </>
          ) : (
            <>
              <circle cx="50" cy="68" r="5" fill="#fff" stroke="#333" strokeWidth="1.5" />
              <circle cx="50" cy="70" r="2.5" fill="#000" />
              <circle cx="70" cy="68" r="5" fill="#fff" stroke="#333" strokeWidth="1.5" />
              <circle cx="70" cy="70" r="2.5" fill="#000" />
            </>
          )}

          {/* Tears falling in begging state */}
          {kingState === 'begging' && reactionState !== 'relieved' && (
            <>
              <circle cx="46" cy="78" r="2.5" fill="#00d4ff" className={`tear-drop tear-left ${reactionState === 'panicked' ? 'fast-drip' : ''}`} />
              <circle cx="74" cy="78" r="2.5" fill="#00d4ff" className={`tear-drop tear-right ${reactionState === 'panicked' ? 'fast-drip' : ''}`} />
            </>
          )}

          {/* Mouth */}
          {kingState === 'victory' || reactionState === 'relieved' ? (
            <path d="M48,85 Q60,98 72,85 Z" fill="#d32f2f" stroke="#333" strokeWidth="1.5" />
          ) : reactionState === 'panicked' ? (
            <ellipse cx="60" cy="90" rx="8" ry="11" fill="#801010" stroke="#333" strokeWidth="2.5" />
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

          {/* Pleading speech bubble */}
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

          {/* Cheering YAY speech bubble on escape */}
          {(gameState === 'escaping' || gameState === 'victory') && (
            <g className="king-speech-bubble relieved animate-pulse">
              <path d="M82,54 L92,44 L80,42 Z" fill="#ffffff" stroke="#c5a059" strokeWidth="1.5" />
              <rect x="70" y="8" width="48" height="30" rx="8" fill="#ffffff" stroke="#c5a059" strokeWidth="2" />
              <text x="94" y="27" fontSize="8.5" fontWeight="900" fill="#daa520" textAnchor="middle">YAY!!!</text>
            </g>
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
