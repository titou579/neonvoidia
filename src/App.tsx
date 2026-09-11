import React, { useState, useCallback, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import Game3D from './components/Game3D';
import GameOverScreen3D from './components/GameOverScreen3D';
import { audio } from './game/audio';
import { audio3d } from './game/audio3d';

type Screen = 'menu' | 'gameSelect' | 'playing2d' | 'playing3d' | 'gameover2d' | 'gameover3d';

interface GameResults2D {
  score: number;
  highScore: number;
  wave: number;
}

interface GameResults3D {
  score: number;
  distance: number;
  highScore: number;
}

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [results2D, setResults2D] = useState<GameResults2D>({ score: 0, highScore: 0, wave: 0 });
  const [results3D, setResults3D] = useState<GameResults3D>({ score: 0, distance: 0, highScore: 0 });
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [gameKey, setGameKey] = useState(0);

  const handleStart2D = useCallback(() => {
    audio.init();
    audio.resume();
    setGameKey(k => k + 1);
    setScreen('playing2d');
  }, []);

  const handleStart3D = useCallback(() => {
    audio3d.init();
    audio3d.resume();
    setGameKey(k => k + 1);
    setScreen('playing3d');
  }, []);

  const handleGameOver2D = useCallback((score: number, highScore: number, wave: number) => {
    setResults2D({ score, highScore, wave });
    setScreen('gameover2d');
  }, []);

  const handleGameOver3D = useCallback((score: number, distance: number, highScore: number) => {
    setResults3D({ score, distance, highScore });
    setScreen('gameover3d');
  }, []);

  const handleRestart2D = useCallback(() => {
    setGameKey(k => k + 1);
    setScreen('playing2d');
  }, []);

  const handleRestart3D = useCallback(() => {
    setGameKey(k => k + 1);
    setScreen('playing3d');
  }, []);

  const handleMenu = useCallback(() => {
    setScreen('menu');
  }, []);

  const handleGameSelect = useCallback(() => {
    setScreen('gameSelect');
  }, []);

  const toggleAudio = useCallback(() => {
    setAudioEnabled(prev => {
      audio.setEnabled(!prev);
      audio3d.setEnabled(!prev);
      return !prev;
    });
  }, []);

  const isPlaying = screen === 'playing2d' || screen === 'playing3d';

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a0f]">
      {/* Background for non-playing screens */}
      {!isPlaying && <BackgroundStars />}

      {/* Game 2D */}
      {screen === 'playing2d' && (
        <GameCanvas
          key={gameKey}
          onGameOver={handleGameOver2D}
          audioEnabled={audioEnabled}
        />
      )}

      {/* Game 3D */}
      {screen === 'playing3d' && (
        <Game3D
          key={gameKey}
          onGameOver={handleGameOver3D}
          audioEnabled={audioEnabled}
        />
      )}

      {/* Main Menu */}
      {screen === 'menu' && (
        <MainMenu
          onPlay={handleGameSelect}
          audioEnabled={audioEnabled}
          onToggleAudio={toggleAudio}
        />
      )}

      {/* Game Selection */}
      {screen === 'gameSelect' && (
        <GameSelect
          onSelect2D={handleStart2D}
          onSelect3D={handleStart3D}
          onBack={handleMenu}
        />
      )}

      {/* Game Over 2D */}
      {screen === 'gameover2d' && (
        <GameOverScreen2D
          results={results2D}
          onRestart={handleRestart2D}
          onMenu={handleMenu}
        />
      )}

      {/* Game Over 3D */}
      {screen === 'gameover3d' && (
        <GameOverScreen3D
          results={results3D}
          onRestart={handleRestart3D}
          onMenu={handleMenu}
        />
      )}

      {/* Scanline overlay */}
      <div className="absolute inset-0 scanline pointer-events-none z-50" />
    </div>
  );
}

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
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-cyan-900/20" />
    </div>
  );
}

function MainMenu({ onPlay, audioEnabled, onToggleAudio }: {
  onPlay: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-40">
      <div className="text-center mb-12 animate-float">
        <h1 className="game-font text-5xl md:text-7xl font-black tracking-wider neon-text text-green-400 mb-2">
          ARCADE
        </h1>
        <p className="game-font text-lg md:text-xl text-cyan-300 tracking-widest opacity-80">
          COLLECTION
        </p>
      </div>

      <div className="flex flex-col gap-4 items-center">
        <button onClick={onPlay} className="btn-neon game-font text-lg">
          ▶ JOUER
        </button>

        <button
          onClick={onToggleAudio}
          className="game-font text-sm text-gray-400 hover:text-white transition-colors mt-2"
        >
          {audioEnabled ? '🔊 SON ACTIVÉ' : '🔇 SON DÉSACTIVÉ'}
        </button>
      </div>

      <div className="absolute bottom-4 text-center text-gray-600 text-xs game-font">
        <p>2 JEUX DISPONIBLES</p>
      </div>
    </div>
  );
}

function GameSelect({ onSelect2D, onSelect3D, onBack }: {
  onSelect2D: () => void;
  onSelect3D: () => void;
  onBack: () => void;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-40 p-4">
      <h2 className="game-font text-3xl md:text-4xl font-bold text-cyan-400 neon-text-cyan mb-8 text-center">
        CHOISIS TON JEU
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        {/* Game 2D Card */}
        <button
          onClick={onSelect2D}
          className="group relative p-6 bg-gradient-to-br from-green-900/30 to-cyan-900/30 border-2 border-green-500/50 rounded-lg hover:border-green-400 hover:shadow-[0_0_30px_rgba(0,255,170,0.5)] transition-all duration-300 text-left"
        >
          <div className="mb-4">
            <div className="game-font text-4xl mb-2">🚀</div>
            <h3 className="game-font text-2xl font-bold text-green-400 mb-1">NEON VOID</h3>
            <p className="game-font text-xs text-cyan-300">SPACE SHOOTER 2D</p>
          </div>
          <p className="text-sm text-gray-300 mb-4">
            Shoot 'em up classique avec vagues d'ennemis, power-ups et boss.
            Détruis tout sur ton passage !
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded">6 ennemis</span>
            <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded">Power-ups</span>
            <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">Boss</span>
          </div>
          <div className="absolute inset-0 border-2 border-green-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </button>

        {/* Game 3D Card */}
        <button
          onClick={onSelect3D}
          className="group relative p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50 rounded-lg hover:border-purple-400 hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-300 text-left"
        >
          <div className="mb-4">
            <div className="game-font text-4xl mb-2">🌌</div>
            <h3 className="game-font text-2xl font-bold text-purple-400 mb-1">VOID RUNNER</h3>
            <p className="game-font text-xs text-pink-300">SPACE RUNNER 3D</p>
          </div>
          <p className="text-sm text-gray-300 mb-4">
            Course infinie en 3D dans un tunnel spatial. Évite les obstacles
            et collecte les orbes d'énergie !
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">3D temps réel</span>
            <span className="text-xs px-2 py-1 bg-pink-500/20 text-pink-300 rounded">Infini</span>
            <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded">Orbes</span>
          </div>
          <div className="absolute inset-0 border-2 border-purple-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </button>
      </div>

      <button
        onClick={onBack}
        className="mt-8 game-font text-sm text-gray-400 hover:text-white transition-colors"
      >
        ◀ RETOUR AU MENU
      </button>
    </div>
  );
}

function GameOverScreen2D({ results, onRestart, onMenu }: {
  results: GameResults2D;
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
        <h1 className="game-font text-5xl md:text-7xl font-black text-red-500 neon-text-pink mb-8">
          GAME OVER
        </h1>

        {isNewHighScore && (
          <div className="mb-6 animate-pulse">
            <p className="game-font text-2xl text-yellow-400 neon-text">
              ★ NOUVEAU RECORD ★
            </p>
          </div>
        )}

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
