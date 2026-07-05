// ═══════════════════════════════════════════════════════
//  DreamWhisperOverlay — Step 5
//  The Queen's voice appears at half-moves remaining.
//  Fades in, lingers, fades out automatically.
// ═══════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import './DreamWhisperOverlay.css';

interface DreamWhisperOverlayProps {
  text: string;
  onDone: () => void;
}

export const DreamWhisperOverlay: React.FC<DreamWhisperOverlayProps> = ({ text, onDone }) => {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 50);
    const t2 = setTimeout(() => setPhase('out'), 3800);
    const t3 = setTimeout(() => onDone(), 4800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div className={`dream-whisper-overlay phase-${phase}`} onClick={onDone}>
      <div className="dream-whisper-inner">
        <span className="dream-whisper-queen">👸</span>
        <p className="dream-whisper-text">{text}</p>
        <span className="dream-whisper-tap">tap to dismiss</span>
      </div>
    </div>
  );
};
