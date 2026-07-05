// ═══════════════════════════════════════════════════════
//  ChapterIntroScreen — Step 6
//  Cinematic full-screen shown when entering a new chapter
// ═══════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import type { ChapterData } from '../services/storyData';
import './ChapterIntroScreen.css';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

interface ChapterIntroScreenProps {
  chapter: ChapterData;
  onDone: () => void;
}

export const ChapterIntroScreen: React.FC<ChapterIntroScreenProps> = ({ chapter, onDone }) => {
  // Reveal phases: 0=nothing, 1=roman+subtitle, 2=title, 3=verse, 4=description, 5=cta
  const [phase, setPhase] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t: ReturnType<typeof setTimeout>[] = [];
    t.push(setTimeout(() => setPhase(1), 200));
    t.push(setTimeout(() => setPhase(2), 800));
    t.push(setTimeout(() => setPhase(3), 1500));
    t.push(setTimeout(() => setPhase(4), 2600));
    t.push(setTimeout(() => setPhase(5), 3400));
    return () => t.forEach(clearTimeout);
  }, []);

  const handleContinue = () => {
    setLeaving(true);
    setTimeout(onDone, 700);
  };

  const roman = ROMAN[(chapter.chapterNumber - 1) % ROMAN.length];

  return (
    <div
      className={`chapter-intro-screen theme-${chapter.ambientTheme} ${leaving ? 'leaving' : ''}`}
      onClick={phase >= 5 ? handleContinue : undefined}
    >
      {/* Ambient particles */}
      <div className="chapter-intro-particles">
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="chapter-intro-particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 4}s`,
            animationDuration: `${4 + Math.random() * 4}s`,
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
          }} />
        ))}
      </div>

      <div className="chapter-intro-content">

        {/* Roman numeral + subtitle */}
        <div className={`chapter-intro-eyebrow ${phase >= 1 ? 'visible' : ''}`}>
          <span className="chapter-intro-roman">Chapter {roman}</span>
          <span className="chapter-intro-dot">·</span>
          <span className="chapter-intro-subtitle">{chapter.subtitle}</span>
        </div>

        {/* Title */}
        <h1 className={`chapter-intro-title ${phase >= 2 ? 'visible' : ''}`}>
          {chapter.title}
        </h1>

        {/* Verse */}
        <div className={`chapter-intro-verse ${phase >= 3 ? 'visible' : ''}`}>
          {chapter.chapterVerse.map((line, i) => (
            <p
              key={i}
              className="chapter-intro-verse-line"
              style={{ transitionDelay: `${i * 0.12}s` }}
            >
              {line}
            </p>
          ))}
        </div>

        {/* Description */}
        <p className={`chapter-intro-description ${phase >= 4 ? 'visible' : ''}`}>
          {chapter.description}
        </p>

        {/* CTA */}
        <div className={`chapter-intro-cta ${phase >= 5 ? 'visible' : ''}`}>
          <button className="chapter-intro-btn" onClick={handleContinue}>
            Enter the Dream
          </button>
          <span className="chapter-intro-tap">or tap anywhere</span>
        </div>

      </div>
    </div>
  );
};
