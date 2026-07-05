import React, { useState, useEffect, useRef } from 'react';
import type { AmbientTheme } from '../services/storyData';
import './DungeonChamber.css';

interface DungeonChamberProps {
  waterLevel: number; // 0 to 100
  gameState: 'playing' | 'tutorial' | 'gameover' | 'victory' | 'menu' | 'escaping';
  ambientTheme?: AmbientTheme;
}

// Water palette per chapter theme
const WATER_PALETTE: Record<AmbientTheme, {
  overlay: [string, string];   // gradient top → bottom
  waveFront: string;
  waveBack: string;
  stream: [string, string];    // stream gradient left → right
  streamGlow: string;
}> = {
  warm:     {
    overlay:   ['rgba(160,120,50,0.52)', 'rgba(130,90,25,0.72)'],
    waveFront: 'rgba(190,150,60,0.65)',
    waveBack:  'rgba(150,110,35,0.38)',
    stream:    ['rgba(210,170,70,0.95)', 'rgba(180,130,40,0.95)'],
    streamGlow: 'rgba(200,155,50,0.75)',
  },
  rose:     {
    overlay:   ['rgba(225,90,140,0.48)', 'rgba(195,55,110,0.68)'],
    waveFront: 'rgba(240,110,160,0.62)',
    waveBack:  'rgba(200,65,120,0.36)',
    stream:    ['rgba(245,130,175,0.95)', 'rgba(210,75,130,0.95)'],
    streamGlow: 'rgba(235,100,150,0.75)',
  },
  cold:     {
    overlay:   ['rgba(0,212,255,0.55)', 'rgba(0,122,255,0.70)'],
    waveFront: 'rgba(0,212,255,0.60)',
    waveBack:  'rgba(0,122,255,0.35)',
    stream:    ['rgba(0,220,255,0.95)', 'rgba(0,130,255,0.95)'],
    streamGlow: 'rgba(0,212,255,0.80)',
  },
  dark:     {
    overlay:   ['rgba(110,65,190,0.52)', 'rgba(75,30,155,0.70)'],
    waveFront: 'rgba(130,80,210,0.62)',
    waveBack:  'rgba(90,40,170,0.36)',
    stream:    ['rgba(150,100,230,0.95)', 'rgba(100,50,190,0.95)'],
    streamGlow: 'rgba(130,80,210,0.75)',
  },
  battle:   {
    overlay:   ['rgba(185,45,45,0.50)', 'rgba(150,20,20,0.68)'],
    waveFront: 'rgba(210,60,60,0.62)',
    waveBack:  'rgba(165,25,25,0.36)',
    stream:    ['rgba(220,70,70,0.95)', 'rgba(175,30,30,0.95)'],
    streamGlow: 'rgba(205,50,50,0.75)',
  },
  ethereal: {
    overlay:   ['rgba(20,165,125,0.50)', 'rgba(10,130,100,0.68)'],
    waveFront: 'rgba(30,185,140,0.62)',
    waveBack:  'rgba(15,145,110,0.36)',
    stream:    ['rgba(45,200,155,0.95)', 'rgba(15,155,120,0.95)'],
    streamGlow: 'rgba(25,175,135,0.75)',
  },
};

export const DungeonChamber: React.FC<DungeonChamberProps> = ({ waterLevel, gameState, ambientTheme = 'warm' }) => {
  const pal = WATER_PALETTE[ambientTheme];
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
          style={{
            height: `calc(100% - ${waterLevel}% - 32px)`,
            background: `linear-gradient(to right, ${pal.stream[0]}, ${pal.stream[1]})`,
            boxShadow: `0 0 8px ${pal.streamGlow}`,
          }}
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
          {/* Shadow */}
          {(kingState === 'standing' || kingState === 'victory' || kingState === 'drowned') && (
            <ellipse cx="60" cy="154" rx="28" ry="5" fill="rgba(0,0,0,0.18)" />
          )}

          {/* 1. LEGS & BOOTS */}
          {kingState !== 'drowned' && (
            <g className="king-legs-group">
              <g className={`king-leg leg-left ${(kingState === 'swimming' || kingState === 'begging') ? 'kicking-left' : ''}`}>
                <rect x="43" y="122" width="11" height="22" rx="3" fill="#4e342e" stroke="#2d1a10" strokeWidth="1.5" />
                <path d="M42,138 L33,143 L33,150 L48,150 L48,138Z" fill="#1a0a05" stroke="#000" strokeWidth="1.5" />
              </g>
              <g className={`king-leg leg-right ${(kingState === 'swimming' || kingState === 'begging') ? 'kicking-right' : ''}`}>
                <rect x="66" y="122" width="11" height="22" rx="3" fill="#4e342e" stroke="#2d1a10" strokeWidth="1.5" />
                <path d="M68,138 L68,150 L83,150 L83,143 L72,138Z" fill="#1a0a05" stroke="#000" strokeWidth="1.5" />
              </g>
            </g>
          )}

          {/* 2. BODY — chubby round robe */}
          <ellipse cx="60" cy="112" rx="30" ry="26" fill="#c62828" stroke="#5d0000" strokeWidth="2" />
          <ellipse cx="60" cy="112" rx="22" ry="19" fill="#e53935" />
          {/* Ermine trim at bottom */}
          <ellipse cx="60" cy="134" rx="30" ry="6" fill="#fff" stroke="#ddd" strokeWidth="1" />
          <circle cx="46" cy="134" r="3.5" fill="#ddd" />
          <circle cx="60" cy="135" r="3.5" fill="#ddd" />
          <circle cx="74" cy="134" r="3.5" fill="#ddd" />
          {/* Belt */}
          <rect x="33" y="122" width="54" height="7" rx="3" fill="#8B6914" />
          <rect x="55" y="121" width="10" height="9" rx="2" fill="#FFD700" stroke="#8B6914" strokeWidth="1" />
          {/* Collar */}
          <path d="M40,94 Q60,108 80,94 Q60,102 40,94Z" fill="#fff" stroke="#ddd" strokeWidth="1.5" />
          <circle cx="50" cy="100" r="2.5" fill="#FFD700" />
          <circle cx="70" cy="100" r="2.5" fill="#FFD700" />

          {/* Worried eyebrows */}
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
          {(kingState === 'victory' || reactionState === 'relieved') ? (
            <g className="arms-cheering">
              <path d="M32,106 Q14,78 18,58" fill="none" stroke="#c62828" strokeWidth="13" strokeLinecap="round" />
              <circle cx="18" cy="52" r="10" fill="#ffcc80" stroke="#b28750" strokeWidth="2.5" className="hand-left-raised" />
              <path d="M88,106 Q106,78 102,58" fill="none" stroke="#c62828" strokeWidth="13" strokeLinecap="round" />
              <circle cx="102" cy="52" r="10" fill="#ffcc80" stroke="#b28750" strokeWidth="2.5" className="hand-right-raised" />
            </g>
          ) : (kingState === 'swimming' || kingState === 'begging' || kingState === 'drowned') ? (
            /* HANDS UP — panic/drowning/begging all raise arms */
            <g className={`arms-hands-up ${reactionState === 'panicked' ? 'fast-shake' : ''}`}>
              <path d="M32,106 Q10,88 14,62" fill="none" stroke="#c62828" strokeWidth="13" strokeLinecap="round" />
              <circle cx="14" cy="56" r="10" fill="#ffcc80" stroke="#b28750" strokeWidth="2.5" />
              <path d="M88,106 Q110,88 106,62" fill="none" stroke="#c62828" strokeWidth="13" strokeLinecap="round" />
              <circle cx="106" cy="56" r="10" fill="#ffcc80" stroke="#b28750" strokeWidth="2.5" />
            </g>
          ) : (
            <g className="arms-normal">
              <path d="M32,108 Q20,122 25,132" fill="none" stroke="#c62828" strokeWidth="13" strokeLinecap="round" />
              <circle cx="25" cy="134" r="10" fill="#ffcc80" stroke="#b28750" strokeWidth="2.5" />
              <path d="M88,108 Q100,122 95,132" fill="none" stroke="#c62828" strokeWidth="13" strokeLinecap="round" />
              <circle cx="95" cy="134" r="10" fill="#ffcc80" stroke="#b28750" strokeWidth="2.5" />
            </g>
          )}

          {/* 4. HEAD — big & round (chubby) */}
          <circle className="king-head" cx="60" cy="73" r="28" fill="#ffcc80" stroke="#b28750" strokeWidth="2.5" />
          {/* Rosy cheeks */}
          <ellipse cx="44" cy="79" rx="6" ry="4" fill="rgba(255,100,100,0.22)" />
          <ellipse cx="76" cy="79" rx="6" ry="4" fill="rgba(255,100,100,0.22)" />

          {/* Beard */}
          <path className="king-beard" d="M34,80 Q60,122 86,80 Q60,104 34,80Z" fill="#f5f5f5" stroke="#d5d5d5" strokeWidth="1.5" />
          <path d="M32,70 Q22,76 34,82" fill="none" stroke="#f5f5f5" strokeWidth="7" strokeLinecap="round" />
          <path d="M88,70 Q98,76 86,82" fill="none" stroke="#f5f5f5" strokeWidth="7" strokeLinecap="round" />

          {/* Eyes */}
          {kingState === 'drowned' ? (
            <>
              <path d="M47,65 L55,73 M55,65 L47,73" stroke="#333" strokeWidth="3" strokeLinecap="round" />
              <path d="M65,65 L73,73 M73,65 L65,73" stroke="#333" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : reactionState === 'relieved' || kingState === 'victory' ? (
            <>
              <path d="M44,68 Q50,62 56,68" stroke="#333" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M64,68 Q70,62 76,68" stroke="#333" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </>
          ) : reactionState === 'panicked' ? (
            <>
              <circle cx="50" cy="68" r="7.5" fill="#fff" stroke="#c53030" strokeWidth="2.2" />
              <circle cx="50" cy="68" r="4.5" fill="#000" />
              <circle cx="52" cy="66" r="1.5" fill="#fff" />
              <circle cx="70" cy="68" r="7.5" fill="#fff" stroke="#c53030" strokeWidth="2.2" />
              <circle cx="70" cy="68" r="4.5" fill="#000" />
              <circle cx="72" cy="66" r="1.5" fill="#fff" />
            </>
          ) : (
            <>
              <circle cx="50" cy="68" r="6" fill="#fff" stroke="#333" strokeWidth="1.5" />
              <circle cx="50" cy="69" r="3.5" fill="#4a2800" />
              <circle cx="51.5" cy="67.5" r="1.2" fill="#fff" />
              <circle cx="70" cy="68" r="6" fill="#fff" stroke="#333" strokeWidth="1.5" />
              <circle cx="70" cy="69" r="3.5" fill="#4a2800" />
              <circle cx="71.5" cy="67.5" r="1.2" fill="#fff" />
            </>
          )}

          {/* Nose */}
          <ellipse cx="60" cy="77" rx="3" ry="2" fill="rgba(0,0,0,0.08)" />

          {/* Tears */}
          {kingState === 'begging' && reactionState !== 'relieved' && (
            <>
              <circle cx="46" cy="80" r="2.5" fill="#00d4ff" className={`tear-drop tear-left ${reactionState === 'panicked' ? 'fast-drip' : ''}`} />
              <circle cx="74" cy="80" r="2.5" fill="#00d4ff" className={`tear-drop tear-right ${reactionState === 'panicked' ? 'fast-drip' : ''}`} />
            </>
          )}

          {/* Mouth */}
          {kingState === 'victory' || reactionState === 'relieved' ? (
            <path d="M48,87 Q60,100 72,87 Z" fill="#d32f2f" stroke="#333" strokeWidth="1.5" />
          ) : reactionState === 'panicked' ? (
            <ellipse cx="60" cy="91" rx="8" ry="11" fill="#801010" stroke="#333" strokeWidth="2.5" />
          ) : kingState === 'swimming' ? (
            <circle cx="60" cy="89" r="7" fill="#801010" stroke="#333" strokeWidth="2" />
          ) : kingState === 'begging' ? (
            <path d="M48,86 Q60,97 72,86 Q60,88 48,86Z" fill="#801010" stroke="#333" strokeWidth="1.5" />
          ) : kingState === 'drowned' ? (
            <path d="M50,89 Q60,83 70,89" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
          ) : (
            <path d="M52,87 Q60,91 68,87" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          )}

          {/* 5. CROWN — richer with inner detail */}
          <path className="king-crown" d="M36,56 L40,30 L60,42 L80,30 L84,56Z" fill="#FFD700" stroke="#8B6914" strokeWidth="2.5" />
          <path d="M36,56 L84,56" stroke="#8B6914" strokeWidth="2" />
          <path d="M38,56 Q42,44 46,50 Q52,40 60,42 Q68,40 74,50 Q78,44 82,56Z" fill="#FFC107" />
          <circle cx="40" cy="30" r="4.5" fill="#ff2d55" className="sparkle-gem g1" />
          <circle cx="60" cy="42" r="4.5" fill="#007aff" className="sparkle-gem g2" />
          <circle cx="80" cy="30" r="4.5" fill="#ff2d55" className="sparkle-gem g3" />
          <polygon points="56,53 60,48 64,53 60,57" fill="#4cd964" />

          {/* Speech bubble */}
          {(kingState === 'begging' || kingState === 'swimming') && (
            <>
              {reactionState === 'relieved' ? (
                <g className="king-speech-bubble relieved">
                  <path d="M82,54 L92,44 L80,42Z" fill="#fff" stroke="#c5a059" strokeWidth="1.5" />
                  <rect x="72" y="8" width="46" height="30" rx="8" fill="#fff" stroke="#c5a059" strokeWidth="2" />
                  <text x="95" y="27" fontSize="8.5" fontWeight="900" fill="#2ecc71" textAnchor="middle">WHEW!</text>
                </g>
              ) : reactionState === 'panicked' ? (
                <g className="king-speech-bubble panicked">
                  <path d="M82,54 L92,44 L80,42Z" fill="#fff" stroke="#c5a059" strokeWidth="1.5" />
                  <rect x="74" y="8" width="44" height="30" rx="8" fill="#fff" stroke="#c5a059" strokeWidth="2" />
                  <text x="96" y="27" fontSize="8.5" fontWeight="900" fill="#d32f2f" textAnchor="middle">AAAH!</text>
                </g>
              ) : (
                <g className="king-speech-bubble">
                  <path d="M82,54 L92,44 L80,42Z" fill="#fff" stroke="#c5a059" strokeWidth="1.5" />
                  <rect x="76" y="8" width="41" height="30" rx="8" fill="#fff" stroke="#c5a059" strokeWidth="2" />
                  <text x="96" y="27" fontSize="9" fontWeight="900" fill="#c53030" textAnchor="middle">HELP!</text>
                </g>
              )}
            </>
          )}

          {(gameState === 'escaping' || gameState === 'victory') && (
            <g className="king-speech-bubble relieved animate-pulse">
              <path d="M82,54 L92,44 L80,42Z" fill="#fff" stroke="#c5a059" strokeWidth="1.5" />
              <rect x="70" y="8" width="48" height="30" rx="8" fill="#fff" stroke="#c5a059" strokeWidth="2" />
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
        style={{
          height: `${waterLevel}%`,
          background: `linear-gradient(to bottom, ${pal.overlay[0]}, ${pal.overlay[1]})`,
        }}
      >
        <div className="water-wave wave-front">
          <svg viewBox="0 0 120 28" preserveAspectRatio="none" className="wave-svg">
            <path d="M0,15 C30,5 90,25 120,15 L120,28 L0,28 Z" fill={pal.waveFront} />
          </svg>
        </div>
        <div className="water-wave wave-back">
          <svg viewBox="0 0 120 28" preserveAspectRatio="none" className="wave-svg">
            <path d="M0,15 C30,25 90,5 120,15 L120,28 L0,28 Z" fill={pal.waveBack} />
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
