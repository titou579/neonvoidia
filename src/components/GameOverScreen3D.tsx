import React, { useState, useEffect } from 'react';

interface GameResults3D {
  score: number;
  distance: number;
  highScore: number;
}

interface GameOverScreen3DProps {
  results: GameResults3D;
  onRestart: () => void;
  onMenu: () => void;
}

function GameOverScreen3D({ results, onRestart, onMenu }: GameOverScreen3DProps) {
  const [showContent, setShowContent] = useState(false);
  const isNewHighScore = results.score >= results.highScore && results.score > 0;

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-black/80 backdrop-blur-sm">
      <div className={`text-center transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <h1 className="game-font text-5xl md:text-7xl font-black text-red-500 neon-text-pink mb-4">
          GAME OVER
        </h1>

        {isNewHighScore && (
          <div className="mb-6 animate-pulse">
            <p className="game-font text-2xl text-yellow-400 neon-text">
              ★ NOUVEAU RECORD ★
            </p>
          </div>
        )}

        <div className="mb-10 space-y-4 max-w-sm mx-auto">
          <div className="flex justify-between items-center border-b border-gray-700 pb-2">
            <span className="game-font text-gray-400 text-lg">SCORE</span>
            <span className="game-font text-2xl text-cyan-400">{results.score.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-700 pb-2">
            <span className="game-font text-gray-400 text-lg">DISTANCE</span>
            <span className="game-font text-2xl text-purple-400">{results.distance}m</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="game-font text-gray-400 text-lg">RECORD</span>
            <span className="game-font text-2xl text-green-400">{results.highScore.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={onRestart} className="btn-neon game-font">
            ↻ REJOUER
          </button>
          <button onClick={onMenu} className="btn-neon-pink game-font">
            ◀ MENU
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameOverScreen3D;
