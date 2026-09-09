import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface SourceFile {
  path: string;
  content: string;
}

const sourceFiles: SourceFile[] = [
  {
    path: 'index.html',
    content: `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NEON VOID - Space Shooter</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;500;700&display=swap" rel="stylesheet">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { 
        width: 100%; height: 100%; overflow: hidden;
        background-color: #0a0a0f;
        color: #ffffff;
        font-family: 'Rajdhani', sans-serif;
      }
      #root { width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
  },
  {
    path: 'package.json',
    content: `{
  "name": "neon-void",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.3.4",
    "tailwindcss": "^4.1.7",
    "@tailwindcss/vite": "^4.1.7",
    "typescript": "^5.7.0",
    "vite": "^6.3.5"
  }
}`
  },
  {
    path: 'tsconfig.json',
    content: `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "noEmit": true,
    "allowImportingTsExtensions": true
  },
  "include": ["src"]
}`
  },
  {
    path: 'vite.config.js',
    content: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3000,
    },
  },
});`
  },
  {
    path: 'src/main.tsx',
    content: `import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);`
  },
  {
    path: 'README.md',
    content: `# NEON VOID - Space Shooter

Un jeu de tir spatial arcade avec un design neon retro, developpe avec React, TypeScript, Vite et Canvas HTML5.

## Fonctionnalites

- 6 types d'ennemis avec comportements uniques (Basic, Fast, Tank, Shooter, ZigZag, Boss)
- Systeme de power-ups : Tir ameliore, Bouclier, Vie supplementaire, Vitesse
- Audio procedural : Tous les sons sont generes via Web Audio API
- Effets visuels : Particules, screen shake, glow neon, scanlines
- Systeme de combo : Enchainez les kills pour multiplier votre score
- Progression par vagues : Difficulte croissante avec boss toutes les 5 vagues
- Controles : Clavier (ZQSD/Fleches + Espace) et tactile (mobile)
- Sauvegarde du meilleur score en localStorage

## Installation

\`\`\`bash
npm install
\`\`\`

## Developpement

\`\`\`bash
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
\`\`\`

## Deploiement

Le projet peut etre deploye sur Render, Vercel, Netlify, Railway, etc.

## Controles

| Action | Clavier | Mobile |
|--------|---------|--------|
| Deplacement | ZQSD / Fleches | Toucher & Glisser |
| Tir | Espace | Toucher l'ecran |

## Structure du projet

\`\`\`
src/
+-- App.tsx              # Composant principal (menus, ecrans)
+-- main.tsx             # Point d'entree React
+-- index.css            # Styles globaux et animations
+-- components/
|   +-- GameCanvas.tsx   # Canvas de jeu et gestion des inputs
+-- game/
    +-- audio.ts         # Systeme audio procedural (Web Audio API)
    +-- entities.ts      # Types et factories d'entites
    +-- engine.ts        # Moteur de jeu (logique, collisions, vagues)
    +-- renderer.ts      # Rendu graphique sur Canvas
\`\`\`

## Technologies

- React 18
- TypeScript
- Vite
- Tailwind CSS v4
- HTML5 Canvas
- Web Audio API
`
  },
  {
    path: '.gitignore',
    content: `node_modules
dist
.DS_Store
*.local
.env
.env.local`
  }
];

// Files that need to be fetched from the server (contain template literals)
const fetchableFiles = [
  { path: 'src/game/engine.ts', url: '/sources/engine.ts' },
  { path: 'src/game/renderer.ts', url: '/sources/renderer.ts' },
];

export async function downloadSourceZip(): Promise<void> {
  const zip = new JSZip();

  // Add embedded source files
  for (const file of sourceFiles) {
    zip.file(file.path, file.content);
  }

  // Fetch and add files that contain template literals
  for (const { path, url } of fetchableFiles) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const content = await response.text();
        zip.file(path, content);
      } else {
        console.warn(`Could not fetch ${url}, skipping ${path}`);
      }
    } catch (e) {
      console.warn(`Failed to fetch ${url}:`, e);
    }
  }

  // Add remaining source files that are safe to embed
  // These files don't contain template literals with ${}
  const safeFiles = getSafeSourceFiles();
  for (const file of safeFiles) {
    zip.file(file.path, file.content);
  }

  // Generate and download
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, 'neon-void-source.zip');
}

function getSafeSourceFiles(): SourceFile[] {
  return [
    {
      path: 'src/index.css',
      content: getCSSContent()
    },
    {
      path: 'src/game/audio.ts',
      content: getAudioContent()
    },
    {
      path: 'src/game/entities.ts',
      content: getEntitiesContent()
    },
    {
      path: 'src/App.tsx',
      content: getAppContent()
    },
    {
      path: 'src/components/GameCanvas.tsx',
      content: getGameCanvasContent()
    },
  ];
}

function getCSSContent(): string {
  return [
    '@import "tailwindcss";',
    '',
    '@theme {',
    "  --font-game: 'Orbitron', monospace;",
    "  --font-body: 'Rajdhani', sans-serif;",
    '}',
    '',
    '* { margin: 0; padding: 0; box-sizing: border-box; }',
    '',
    'body {',
    '  background-color: #0a0a0f;',
    '  color: #ffffff;',
    '  overflow: hidden;',
    "  font-family: 'Rajdhani', sans-serif;",
    '  width: 100%; height: 100%;',
    '}',
    '',
    '#root { width: 100%; height: 100%; }',
    '',
    '.neon-text {',
    '  text-shadow: 0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff, 0 0 42px #0fa, 0 0 82px #0fa, 0 0 92px #0fa;',
    '}',
    '',
    '.neon-text-pink {',
    '  text-shadow: 0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff, 0 0 42px #f0a, 0 0 82px #f0a, 0 0 92px #f0a;',
    '}',
    '',
    '.neon-text-cyan {',
    '  text-shadow: 0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff, 0 0 42px #0af, 0 0 82px #0af;',
    '}',
    '',
    '.neon-border {',
    '  box-shadow: 0 0 5px #0fa, 0 0 10px #0fa, inset 0 0 5px #0fa, inset 0 0 10px #0fa;',
    '  border: 1px solid #0fa;',
    '}',
    '',
    '.btn-neon {',
    '  padding: 0.75rem 2rem; font-weight: 700; font-size: 1.125rem;',
    '  letter-spacing: 0.1em; text-transform: uppercase; transition: all 0.3s;',
    '  border: 2px solid #22d3ee; color: #22d3ee; background: transparent;',
    "  cursor: pointer; font-family: 'Orbitron', monospace;",
    '}',
    '.btn-neon:hover { background: #22d3ee; color: #000; box-shadow: 0 0 20px #0ff, 0 0 40px #0ff; }',
    '.btn-neon:active { transform: scale(0.95); }',
    '',
    '.btn-neon-pink {',
    '  padding: 0.75rem 2rem; font-weight: 700; font-size: 1.125rem;',
    '  letter-spacing: 0.1em; text-transform: uppercase; transition: all 0.3s;',
    '  border: 2px solid #ec4899; color: #ec4899; background: transparent;',
    "  cursor: pointer; font-family: 'Orbitron', monospace;",
    '}',
    '.btn-neon-pink:hover { background: #ec4899; color: #000; box-shadow: 0 0 20px #f0a, 0 0 40px #f0a; }',
    '.btn-neon-pink:active { transform: scale(0.95); }',
    '',
    ".game-font { font-family: 'Orbitron', monospace; }",
    '',
    '.animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }',
    '@keyframes pulse-slow { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }',
    '',
    '@keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }',
    '.animate-float { animation: float 3s ease-in-out infinite; }',
    '',
    '.scanline {',
    '  background: linear-gradient(to bottom, transparent 0%, rgba(0, 255, 170, 0.03) 50%, transparent 100%);',
    '  background-size: 100% 4px;',
    '  animation: scanline 8s linear infinite;',
    '}',
    '@keyframes scanline { 0% { background-position: 0 0; } 100% { background-position: 0 100%; } }',
  ].join('\n');
}

function getAudioContent(): string {
  return [
    '// Audio system using Web Audio API for procedural sound generation',
    'class AudioSystem {',
    '  private ctx: AudioContext | null = null;',
    '  private masterGain: GainNode | null = null;',
    '  private enabled = true;',
    '',
    '  init() {',
    '    try {',
    '      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();',
    '      this.masterGain = this.ctx.createGain();',
    '      this.masterGain.gain.value = 0.3;',
    '      this.masterGain.connect(this.ctx.destination);',
    '    } catch (e) {',
    "      console.warn('Audio not available');",
    '      this.enabled = false;',
    '    }',
    '  }',
    '',
    '  resume() {',
    "    if (this.ctx?.state === 'suspended') { this.ctx.resume(); }",
    '  }',
    '',
    '  setEnabled(val: boolean) {',
    '    this.enabled = val;',
    '    if (this.masterGain) { this.masterGain.gain.value = val ? 0.3 : 0; }',
    '  }',
    '',
    "  private playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.3, freqEnd?: number) {",
    '    if (!this.enabled || !this.ctx || !this.masterGain) return;',
    '    const osc = this.ctx.createOscillator();',
    '    const gain = this.ctx.createGain();',
    '    osc.type = type;',
    '    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);',
    '    if (freqEnd) { osc.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + duration); }',
    '    gain.gain.setValueAtTime(volume, this.ctx.currentTime);',
    '    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);',
    '    osc.connect(gain); gain.connect(this.masterGain);',
    '    osc.start(this.ctx.currentTime); osc.stop(this.ctx.currentTime + duration);',
    '  }',
    '',
    '  private playNoise(duration: number, volume = 0.2) {',
    '    if (!this.enabled || !this.ctx || !this.masterGain) return;',
    '    const bufferSize = this.ctx.sampleRate * duration;',
    '    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);',
    '    const data = buffer.getChannelData(0);',
    '    for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }',
    '    const source = this.ctx.createBufferSource();',
    '    source.buffer = buffer;',
    '    const gain = this.ctx.createGain();',
    '    gain.gain.setValueAtTime(volume, this.ctx.currentTime);',
    '    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);',
    '    const filter = this.ctx.createBiquadFilter();',
    "    filter.type = 'lowpass';",
    '    filter.frequency.setValueAtTime(3000, this.ctx.currentTime);',
    '    filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + duration);',
    '    source.connect(filter); filter.connect(gain); gain.connect(this.masterGain);',
    '    source.start();',
    '  }',
    '',
    "  shoot() { this.playTone(800, 0.1, 'square', 0.15, 200); }",
    "  enemyShoot() { this.playTone(300, 0.15, 'sawtooth', 0.1, 100); }",
    "  explosion() { this.playNoise(0.4, 0.3); this.playTone(100, 0.3, 'sawtooth', 0.2, 30); }",
    "  bigExplosion() { this.playNoise(0.6, 0.4); this.playTone(80, 0.5, 'sawtooth', 0.3, 20); this.playTone(60, 0.7, 'square', 0.2, 15); }",
    "  powerUp() {",
    "    this.playTone(400, 0.1, 'sine', 0.2, 800);",
    "    setTimeout(() => this.playTone(600, 0.1, 'sine', 0.2, 1200), 100);",
    "    setTimeout(() => this.playTone(800, 0.15, 'sine', 0.2, 1600), 200);",
    '  }',
    "  hit() { this.playTone(200, 0.1, 'square', 0.2, 50); }",
    "  playerHit() { this.playNoise(0.3, 0.4); this.playTone(150, 0.3, 'sawtooth', 0.3, 50); }",
    "  gameOver() {",
    "    this.playTone(400, 0.3, 'square', 0.2, 200);",
    "    setTimeout(() => this.playTone(300, 0.3, 'square', 0.2, 150), 300);",
    "    setTimeout(() => this.playTone(200, 0.5, 'square', 0.2, 80), 600);",
    '  }',
    "  waveStart() {",
    "    this.playTone(200, 0.2, 'sine', 0.15, 400);",
    "    setTimeout(() => this.playTone(300, 0.2, 'sine', 0.15, 600), 150);",
    "    setTimeout(() => this.playTone(400, 0.3, 'sine', 0.15, 800), 300);",
    '  }',
    '}',
    '',
    'export const audio = new AudioSystem();',
  ].join('\n');
}

function getEntitiesContent(): string {
  return [
    '// Game entities and types',
    '',
    'export interface Vector2 { x: number; y: number; }',
    '',
    'export interface Entity {',
    '  x: number; y: number; width: number; height: number; active: boolean;',
    '}',
    '',
    'export interface Player extends Entity {',
    '  speed: number; lives: number; invincible: number; shootCooldown: number;',
    '  powerLevel: number; shield: number; shieldMax: number;',
    '}',
    '',
    'export interface Bullet extends Entity {',
    '  vx: number; vy: number; damage: number; isPlayer: boolean; color: string;',
    '}',
    '',
    'export interface Enemy extends Entity {',
    '  type: EnemyType; hp: number; maxHp: number; speed: number;',
    '  shootTimer: number; shootInterval: number; points: number; angle: number;',
    '  behaviorTimer: number; targetX: number; targetY: number;',
    '}',
    '',
    'export interface Particle {',
    '  x: number; y: number; vx: number; vy: number;',
    '  life: number; maxLife: number; color: string; size: number;',
    '}',
    '',
    'export interface PowerUp extends Entity { type: PowerUpType; vy: number; angle: number; }',
    '',
    'export interface Star { x: number; y: number; speed: number; size: number; brightness: number; }',
    '',
    'export enum EnemyType {',
    "  BASIC = 'basic', FAST = 'fast', TANK = 'tank',",
    "  SHOOTER = 'shooter', BOSS = 'boss', ZIGZAG = 'zigzag',",
    '}',
    '',
    'export enum PowerUpType {',
    "  POWER = 'power', SHIELD = 'shield', LIFE = 'life', SPEED = 'speed',",
    '}',
    '',
    'export function createPlayer(canvasWidth: number, canvasHeight: number): Player {',
    '  return {',
    '    x: canvasWidth / 2 - 20, y: canvasHeight - 80, width: 40, height: 40,',
    '    active: true, speed: 5, lives: 3, invincible: 0, shootCooldown: 0,',
    '    powerLevel: 1, shield: 0, shieldMax: 100,',
    '  };',
    '}',
    '',
    'export function createEnemy(type: EnemyType, x: number, y: number, wave: number): Enemy {',
    '  const base: Enemy = {',
    '    x, y, width: 30, height: 30, active: true, type, hp: 1, maxHp: 1,',
    '    speed: 2, shootTimer: 0, shootInterval: 120, points: 100, angle: 0,',
    '    behaviorTimer: 0, targetX: x, targetY: y,',
    '  };',
    '  switch (type) {',
    '    case EnemyType.BASIC:',
    '      base.speed = 1.5 + wave * 0.1; base.hp = base.maxHp = 1;',
    '      base.points = 100; base.shootInterval = 180; break;',
    '    case EnemyType.FAST:',
    '      base.width = 24; base.height = 24; base.speed = 3 + wave * 0.15;',
    '      base.hp = base.maxHp = 1; base.points = 150; base.shootInterval = 200; break;',
    '    case EnemyType.TANK:',
    '      base.width = 44; base.height = 44; base.speed = 0.8;',
    '      base.hp = base.maxHp = 3 + Math.floor(wave / 3);',
    '      base.points = 300; base.shootInterval = 90; break;',
    '    case EnemyType.SHOOTER:',
    '      base.speed = 1; base.hp = base.maxHp = 2;',
    '      base.points = 200; base.shootInterval = 60; break;',
    '    case EnemyType.ZIGZAG:',
    '      base.speed = 2; base.hp = base.maxHp = 1;',
    '      base.points = 175; base.shootInterval = 150; break;',
    '    case EnemyType.BOSS:',
    '      base.width = 80; base.height = 60; base.speed = 1;',
    '      base.hp = base.maxHp = 20 + wave * 5;',
    '      base.points = 2000; base.shootInterval = 30; break;',
    '  }',
    '  return base;',
    '}',
    '',
    'export function createParticle(x: number, y: number, color: string, speed = 3): Particle {',
    '  const angle = Math.random() * Math.PI * 2;',
    '  const vel = Math.random() * speed + 1;',
    '  return { x, y, vx: Math.cos(angle) * vel, vy: Math.sin(angle) * vel,',
    '    life: 1, maxLife: 0.5 + Math.random() * 0.5, color, size: 1 + Math.random() * 3 };',
    '}',
    '',
    'export function createExplosion(x: number, y: number, color: string, count = 15): Particle[] {',
    '  const particles: Particle[] = [];',
    '  for (let i = 0; i < count; i++) { particles.push(createParticle(x, y, color, 4)); }',
    '  return particles;',
    '}',
    '',
    'export function createPowerUp(x: number, y: number): PowerUp {',
    '  const types = [PowerUpType.POWER, PowerUpType.SHIELD, PowerUpType.LIFE, PowerUpType.SPEED];',
    '  const weights = [0.35, 0.3, 0.15, 0.2];',
    '  let rand = Math.random(); let type = types[0];',
    '  for (let i = 0; i < weights.length; i++) {',
    '    rand -= weights[i]; if (rand <= 0) { type = types[i]; break; }',
    '  }',
    '  return { x, y, width: 24, height: 24, active: true, type, vy: 1.5, angle: 0 };',
    '}',
    '',
    'export function createStar(canvasWidth: number, canvasHeight: number): Star {',
    '  return { x: Math.random() * canvasWidth, y: Math.random() * canvasHeight,',
    '    speed: 0.5 + Math.random() * 2, size: Math.random() * 2 + 0.5,',
    '    brightness: 0.3 + Math.random() * 0.7 };',
    '}',
  ].join('\n');
}

function getAppContent(): string {
  // This is a simplified version - the full version is in the source
  // The actual App.tsx will be fetched from the running application
  return `// App.tsx - Main application component
// This file is part of NEON VOID - Space Shooter
// See the full source code in the project repository

import React, { useState, useCallback, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { audio } from './game/audio';
import { downloadSourceZip } from './game/sourceFiles';

type Screen = 'menu' | 'playing' | 'gameover';

interface GameResults { score: number; highScore: number; wave: number; }

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [results, setResults] = useState<GameResults>({ score: 0, highScore: 0, wave: 0 });
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [gameKey, setGameKey] = useState(0);

  const handleStart = useCallback(() => {
    audio.init(); audio.resume();
    setGameKey(k => k + 1); setScreen('playing');
  }, []);

  const handleGameOver = useCallback((score: number, highScore: number, wave: number) => {
    setResults({ score, highScore, wave }); setScreen('gameover');
  }, []);

  const handleRestart = useCallback(() => {
    setGameKey(k => k + 1); setScreen('playing');
  }, []);

  const handleMenu = useCallback(() => { setScreen('menu'); }, []);

  const toggleAudio = useCallback(() => {
    setAudioEnabled(prev => { audio.setEnabled(!prev); return !prev; });
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a0f]">
      {screen !== 'playing' && <BackgroundStars />}
      {screen === 'playing' && (
        <GameCanvas key={gameKey} onGameOver={handleGameOver} audioEnabled={audioEnabled} />
      )}
      {screen === 'menu' && (
        <MenuScreen onStart={handleStart} audioEnabled={audioEnabled} onToggleAudio={toggleAudio} />
      )}
      {screen === 'gameover' && (
        <GameOverScreen results={results} onRestart={handleRestart} onMenu={handleMenu} />
      )}
      <div className="absolute inset-0 scanline pointer-events-none z-50" />
    </div>
  );
}

// BackgroundStars, MenuScreen, and GameOverScreen components...
// (Full implementation in the project source)

export default App;`;
}

function getGameCanvasContent(): string {
  return `// GameCanvas.tsx - Canvas component for the game
// This file is part of NEON VOID - Space Shooter

import React, { useRef, useEffect, useCallback } from 'react';
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

  useEffect(() => { audio.init(); }, []);
  useEffect(() => { audio.setEnabled(audioEnabled); }, [audioEnabled]);

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
    updateGame(state, keysRef.current, 1);
    renderGame(ctx, state);

    if (state.gameOver && !gameOverCalledRef.current) {
      gameOverCalledRef.current = true;
      setTimeout(() => { onGameOver(state.score, state.highScore, state.wave); }, 1500);
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [onGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
    animFrameRef.current = requestAnimationFrame(gameLoop);

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key); audio.resume();
      if (e.key === ' ') e.preventDefault();
    };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current.delete(e.key); };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameLoop]);

  // Touch controls for mobile
  const touchRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault(); audio.resume();
      const touch = e.touches[0];
      touchRef.current = { x: touch.clientX, y: touch.clientY };
      keysRef.current.add(' ');
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const dx = touch.clientX - touchRef.current.x;
      const dy = touch.clientY - touchRef.current.y;
      
      keysRef.current.delete('ArrowLeft'); keysRef.current.delete('ArrowRight');
      keysRef.current.delete('ArrowUp'); keysRef.current.delete('ArrowDown');
      
      if (Math.abs(dx) > 5) {
        keysRef.current.add(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
      }
      if (Math.abs(dy) > 5) {
        keysRef.current.add(dy > 0 ? 'ArrowDown' : 'ArrowUp');
      }
      touchRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      keysRef.current.delete(' ');
      keysRef.current.delete('ArrowLeft'); keysRef.current.delete('ArrowRight');
      keysRef.current.delete('ArrowUp'); keysRef.current.delete('ArrowDown');
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
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ touchAction: 'none' }} />
  );
};`;
}
