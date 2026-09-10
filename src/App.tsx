import React, { useState, useCallback } from 'react';
import Game3D from './components/Game3D';
import MenuScreen from './components/MenuScreen';
import GameOverScreen from './components/GameOverScreen';
import { audio } from './game/audio3d';

type Screen = 'menu' | 'playing' | 'gameover';

interface GameResults {
  score: number;
  distance: number;
  highScore: number;
}

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [results, setResults] = useState<GameResults>({ score: 0, distance: 0, highScore: 0 });
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [gameKey, setGameKey] = useState(0);

  const handleStart = useCallback(() => {
    audio.init();
    audio.resume();
    setGameKey(k => k + 1);
    setScreen('playing');
  }, []);

  const handleGameOver = useCallback((score: number, distance: number, highScore: number) => {
    setResults({ score, distance, highScore });
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
    <div className="relative w-full h-full overflow-hidden bg-black">
      {screen === 'playing' && (
        <Game3D
          key={gameKey}
          onGameOver={handleGameOver}
          audioEnabled={audioEnabled}
        />
      )}

      {screen === 'menu' && (
        <MenuScreen
          onStart={handleStart}
          audioEnabled={audioEnabled}
          onToggleAudio={toggleAudio}
        />
      )}

      {screen === 'gameover' && (
        <GameOverScreen
          results={results}
          onRestart={handleRestart}
          onMenu={handleMenu}
        />
      )}
    </div>
  );
}

export default App;
