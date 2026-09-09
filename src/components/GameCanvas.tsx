import React, { useRef, useEffect, useCallback, useState } from 'react';
import { createGameState, updateGame, startWave, GameState } from '../game/engine';
import { renderGame } from '../game/renderer';
import { audio } from '../game/audio';

interface GameCanvasProps {
  onGameOver: (score: number, highScore: number, wave: number) => void;
  audioEnabled: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ onGameOver, audioEnabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const animFrameRef = useRef<number>(0);
  const gameOverCalledRef = useRef(false);

  useEffect(() => {
    audio.init();
  }, []);

  useEffect(() => {
    audio.setEnabled(audioEnabled);
  }, [audioEnabled]);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!gameStateRef.current) {
      gameStateRef.current = createGameState(canvas.width, canvas.height);
      startWave(gameStateRef.current);
    }

    const state = gameStateRef.current;
    
    // Update
    updateGame(state, keysRef.current, 1);

    // Render
    renderGame(ctx, state);

    // Check game over
    if (state.gameOver && !gameOverCalledRef.current) {
      gameOverCalledRef.current = true;
      setTimeout(() => {
        onGameOver(state.score, state.highScore, state.wave);
      }, 1500);
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [onGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (gameStateRef.current) {
        gameStateRef.current.width = canvas.width;
        gameStateRef.current.height = canvas.height;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // Start game loop
    animFrameRef.current = requestAnimationFrame(gameLoop);

    // Input handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      audio.resume();
      if (e.key === ' ') e.preventDefault();
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameLoop]);

  // Touch controls
  const touchRef = useRef<{ x: number; y: number; shooting: boolean }>({ x: 0, y: 0, shooting: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      audio.resume();
      const touch = e.touches[0];
      touchRef.current = { x: touch.clientX, y: touch.clientY, shooting: true };
      keysRef.current.add(' ');
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const state = gameStateRef.current;
      if (!state) return;

      const dx = touch.clientX - touchRef.current.x;
      const dy = touch.clientY - touchRef.current.y;
      
      if (Math.abs(dx) > 5) {
        if (dx > 0) {
          keysRef.current.add('ArrowRight');
          keysRef.current.delete('ArrowLeft');
        } else {
          keysRef.current.add('ArrowLeft');
          keysRef.current.delete('ArrowRight');
        }
      }
      if (Math.abs(dy) > 5) {
        if (dy > 0) {
          keysRef.current.add('ArrowDown');
          keysRef.current.delete('ArrowUp');
        } else {
          keysRef.current.add('ArrowUp');
          keysRef.current.delete('ArrowDown');
        }
      }

      touchRef.current.x = touch.clientX;
      touchRef.current.y = touch.clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      keysRef.current.delete(' ');
      keysRef.current.delete('ArrowLeft');
      keysRef.current.delete('ArrowRight');
      keysRef.current.delete('ArrowUp');
      keysRef.current.delete('ArrowDown');
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ touchAction: 'none' }}
    />
  );
};
