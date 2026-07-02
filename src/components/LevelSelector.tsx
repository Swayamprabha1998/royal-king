import React from 'react';
import { LEVELS } from '../services/boardLogic';
import './LevelSelector.css';

interface LevelSelectorProps {
  highestLevelUnlocked: number;
  onSelectLevel: (levelId: number) => void;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  highestLevelUnlocked,
  onSelectLevel
}) => {
  return (
    <div className="level-selector-screen">
      <div className="scroll-container">
        <h1 className="map-title">ROYAL MAP</h1>
        <p className="map-subtitle">Select a Dungeon Chamber to Rescue the King</p>

        {/* Level Map Pathway */}
        <div className="map-pathway">
          {/* Connector lines behind nodes */}
          <div className="connector-line"></div>

          {Object.values(LEVELS).map((level) => {
            const isUnlocked = level.id <= highestLevelUnlocked;
            const isCompleted = level.id < highestLevelUnlocked;

            return (
              <button
                key={level.id}
                className={`level-node node-${level.id} ${isUnlocked ? 'unlocked' : 'locked'} ${isCompleted ? 'completed' : ''}`}
                onClick={() => isUnlocked && onSelectLevel(level.id)}
                disabled={!isUnlocked}
              >
                <div className="node-number">
                  {isUnlocked ? (
                    isCompleted ? '✓' : level.id
                  ) : (
                    <svg viewBox="0 0 24 24" className="lock-icon" width="16" height="16">
                      <path d="M12 2C9.24 2 7 4.24 7 7v3H6c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2h-1V7c0-2.76-2.24-5-5-5zm-3 5c0-1.66 1.34-3 3-3s3 1.34 3 3v3H9V7zm3 9c-.83 0-1.5-.67-1.5-1.5S11.17 13 12 13s1.5.67 1.5 1.5S12.83 16 12 16z" fill="#888" />
                    </svg>
                  )}
                </div>
                <div className="node-tooltip">
                  <div className="tooltip-name">{level.name}</div>
                  <div className="tooltip-details">Target: {level.targetCoins} Coins</div>
                  {level.hasAlgae && <span className="badge algae-badge">Algae</span>}
                  {level.hasValves && <span className="badge valve-badge">Valves</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Instructions list */}
        <div className="quick-help-panel">
          <h3>Dungeon Survival Guide</h3>
          <ul>
            <li>Swipe adjacent candies to make matches of 3 or more.</li>
            <li>Earn <strong>1 Coin</strong> for each Gold Coin matched directly or collected by matching adjacent candies!</li>
            <li>Watch out! Water rises after every move. If it fills the cell (100%), the King drowns.</li>
            <li>In flooded rows, candies float <strong>UP</strong>. In dry rows, they fall <strong>DOWN</strong>.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
