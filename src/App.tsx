import React, { useState, useCallback, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { audio } from './game/audio';
import { downloadSourceZip } from './game/sourceFiles';

type Screen = 'menu' | 'playing' | 'gameover';

interface GameResults {
  score: number;
  highScore: number;
  wave: number;
}

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [results, setResults] = useState<GameResults>({ score: 0, highScore: 0, wave: 0 });
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [gameKey, setGameKey] = useState(0);

  const handleStart = useCallback(() => {
    audio.init();
    audio.resume();
    setGameKey(k => k + 1);
    setScreen('playing');
  }, []);

  const handleGameOver = useCallback((score: number, highScore: number, wave: number) => {
    setResults({ score, highScore, wave });
    setScreen('gameover');
  }, []);

  const handleRestart = useCallback(() => {
    setGameKey(k => k + 1);
    setScreen('playing');
  }, []);

  const handleMenu = useCallback(() => {
    setScreen('menu');
  }, []);

  const toggleAudio = useCallback(() => {
    setAudioEnabled(prev => {
      audio.setEnabled(!prev);
      return !prev;
    });
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a0f]">
      {/* Background stars effect for menu/gameover */}
      {screen !== 'playing' && <BackgroundStars />}

      {/* Game canvas - always rendered when playing */}
      {screen === 'playing' && (
        <GameCanvas
          key={gameKey}
          onGameOver={handleGameOver}
          audioEnabled={audioEnabled}
        />
      )}

      {/* Menu Screen */}
      {screen === 'menu' && (
        <MenuScreen onStart={handleStart} audioEnabled={audioEnabled} onToggleAudio={toggleAudio} />
      )}

      {/* Game Over Screen */}
      {screen === 'gameover' && (
        <GameOverScreen
          results={results}
          onRestart={handleRestart}
          onMenu={handleMenu}
        />
      )}

      {/* Scanline overlay */}
      <div className="absolute inset-0 scanline pointer-events-none z-50" />
    </div>
  );
}

// Background Stars Component
function BackgroundStars() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white animate-pulse-slow"
          style={{
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0.3 + Math.random() * 0.5,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        />
      ))}
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-cyan-900/20" />
    </div>
  );
}

// Menu Screen Component
function MenuScreen({ onStart, audioEnabled, onToggleAudio }: {
  onStart: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
}) {
  const [showControls, setShowControls] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadSourceZip();
    } catch (e) {
      console.error('Download failed:', e);
    }
    setDownloading(false);
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-40">
      {/* Title */}
      <div className="text-center mb-12 animate-float">
        <h1 className="game-font text-6xl md:text-8xl font-black tracking-wider neon-text text-green-400 mb-2">
          NEON VOID
        </h1>
        <p className="game-font text-lg md:text-xl text-cyan-300 tracking-widest opacity-80">
          SPACE SHOOTER
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-4 items-center">
        <button onClick={onStart} className="btn-neon game-font">
          ▶ JOUER
        </button>
        
        <button
          onClick={() => setShowControls(!showControls)}
          className="btn-neon-pink game-font text-sm"
        >
          CONTRÔLES
        </button>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="game-font text-sm px-6 py-2 border border-green-500 text-green-400 hover:bg-green-500 hover:text-black transition-all duration-300 disabled:opacity-50"
        >
          {downloading ? '⏳ PRÉPARATION...' : '📦 TÉLÉCHARGER SOURCES (.zip)'}
        </button>

        <button
          onClick={onToggleAudio}
          className="game-font text-sm text-gray-400 hover:text-white transition-colors mt-2"
        >
          {audioEnabled ? '🔊 SON ACTIVÉ' : '🔇 SON DÉSACTIVÉ'}
        </button>
      </div>

      {/* Controls panel */}
      {showControls && (
        <div className="mt-8 p-6 neon-border rounded-lg bg-black/50 backdrop-blur-sm max-w-md">
          <h3 className="game-font text-cyan-400 text-lg mb-4 text-center">CONTRÔLES</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-gray-400">Déplacement</div>
            <div className="text-white">ZQSD / Flèches</div>
            <div className="text-gray-400">Tir</div>
            <div className="text-white">Espace</div>
            <div className="text-gray-400">Mobile</div>
            <div className="text-white">Toucher & Glisser</div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="game-font text-yellow-400 text-sm mb-2">POWER-UPS</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-orange-400">⚡ TIR+</div>
              <div className="text-gray-300">Tir multiple</div>
              <div className="text-blue-400">🛡 BOUCLIER</div>
              <div className="text-gray-300">Protection</div>
              <div className="text-pink-400">♥ VIE</div>
              <div className="text-gray-300">+1 vie</div>
              <div className="text-yellow-400">» VITESSE</div>
              <div className="text-gray-300">+Rapidité</div>
            </div>
          </div>
        </div>
      )}

      {/* High Score */}
      <div className="mt-8 text-center">
        <p className="game-font text-sm text-gray-500">
          MEILLEUR SCORE
        </p>
        <p className="game-font text-2xl text-yellow-400 neon-text-cyan">
          {parseInt(localStorage.getItem('neonvoid_highscore') || '0').toLocaleString()}
        </p>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-center text-gray-600 text-xs game-font">
        <p>APPUYEZ SUR JOUER POUR COMMENCER</p>
      </div>
    </div>
  );
}

// Game Over Screen Component
function GameOverScreen({ results, onRestart, onMenu }: {
  results: GameResults;
  onRestart: () => void;
  onMenu: () => void;
}) {
  const [showContent, setShowContent] = useState(false);
  const isNewHighScore = results.score >= results.highScore && results.score > 0;

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-black/70 backdrop-blur-sm">
      <div className={`text-center transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Game Over Title */}
        <h1 className="game-font text-5xl md:text-7xl font-black text-red-500 neon-text-pink mb-8">
          GAME OVER
        </h1>

        {/* New High Score */}
        {isNewHighScore && (
          <div className="mb-6 animate-pulse">
            <p className="game-font text-2xl text-yellow-400 neon-text">
              ★ NOUVEAU RECORD ★
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="mb-10 space-y-3">
          <div className="flex justify-between items-center gap-8">
            <span className="game-font text-gray-400 text-lg">SCORE</span>
            <span className="game-font text-2xl text-cyan-400">{results.score.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center gap-8">
            <span className="game-font text-gray-400 text-lg">VAGUE</span>
            <span className="game-font text-2xl text-yellow-400">{results.wave}</span>
          </div>
          <div className="flex justify-between items-center gap-8">
            <span className="game-font text-gray-400 text-lg">RECORD</span>
            <span className="game-font text-2xl text-green-400">{results.highScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Buttons */}
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

export default App;
