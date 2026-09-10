import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { audio } from '../game/audio3d';

interface Game3DProps {
  onGameOver: (score: number, distance: number, highScore: number) => void;
  audioEnabled: boolean;
}

// Game state
interface GameState {
  speed: number;
  distance: number;
  score: number;
  playerX: number;
  playerY: number;
  targetX: number;
  targetY: number;
  isGameOver: boolean;
  obstacles: Obstacle[];
  orbs: Orb[];
  tunnelRotation: number;
}

interface Obstacle {
  id: number;
  z: number;
  x: number;
  y: number;
  type: 'block' | 'ring' | 'wall';
  width: number;
  height: number;
  rotation: number;
}

interface Orb {
  id: number;
  z: number;
  x: number;
  y: number;
  collected: boolean;
}

const TUNNEL_RADIUS = 5;
const PLAYER_SIZE = 0.4;
const SPAWN_DISTANCE = 100;
const DESPAWN_DISTANCE = -10;

function Ship({ position, tilt }: { position: [number, number, number]; tilt: number }) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, tilt * 0.5, 0.1);
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Main body */}
      <mesh>
        <coneGeometry args={[PLAYER_SIZE, PLAYER_SIZE * 2, 4]} />
        <meshStandardMaterial color="#00ffaa" emissive="#00ff88" emissiveIntensity={0.5} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Wings */}
      <mesh position={[0, -0.1, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[PLAYER_SIZE * 2.5, 0.05, PLAYER_SIZE * 0.8]} />
        <meshStandardMaterial color="#00ddff" emissive="#00aaff" emissiveIntensity={0.3} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Engine glow */}
      <pointLight position={[0, -PLAYER_SIZE, 0]} color="#ff8800" intensity={2} distance={3} />
      <mesh position={[0, -PLAYER_SIZE * 0.8, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="#ff6600" />
      </mesh>
    </group>
  );
}

function Tunnel({ rotation }: { rotation: number }) {
  const segments = 20;
  const length = 120;

  const tunnelGeometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(TUNNEL_RADIUS, TUNNEL_RADIUS, length, 32, segments, true);
    return geo;
  }, []);

  return (
    <group rotation={[Math.PI / 2, 0, rotation]}>
      <mesh geometry={tunnelGeometry} position={[0, 0, -length / 2 + 20]}>
        <meshStandardMaterial
          color="#110022"
          emissive="#220044"
          emissiveIntensity={0.2}
          side={THREE.BackSide}
          wireframe={false}
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* Wireframe overlay */}
      <mesh geometry={tunnelGeometry} position={[0, 0, -length / 2 + 20]}>
        <meshBasicMaterial color="#6600ff" wireframe side={THREE.BackSide} transparent opacity={0.3} />
      </mesh>
      {/* Grid rings */}
      {Array.from({ length: 15 }).map((_, i) => (
        <mesh key={i} position={[0, 0, -i * 8 + 20]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[TUNNEL_RADIUS - 0.05, TUNNEL_RADIUS, 32]} />
          <meshBasicMaterial color="#00ffaa" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function ObstacleMesh({ obstacle }: { obstacle: Obstacle }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  if (obstacle.type === 'block') {
    return (
      <mesh ref={meshRef} position={[obstacle.x, obstacle.y, obstacle.z]}>
        <boxGeometry args={[obstacle.width, obstacle.height, 0.5]} />
        <meshStandardMaterial color="#ff0055" emissive="#ff0033" emissiveIntensity={0.5} metalness={0.7} roughness={0.3} />
      </mesh>
    );
  }

  if (obstacle.type === 'ring') {
    return (
      <mesh position={[obstacle.x, obstacle.y, obstacle.z]} rotation={[0, 0, obstacle.rotation]}>
        <torusGeometry args={[obstacle.width, 0.15, 8, 24]} />
        <meshStandardMaterial color="#ff8800" emissive="#ff4400" emissiveIntensity={0.5} metalness={0.8} roughness={0.2} />
      </mesh>
    );
  }

  // wall
  return (
    <mesh position={[obstacle.x, obstacle.y, obstacle.z]}>
      <boxGeometry args={[obstacle.width, obstacle.height, 0.3]} />
      <meshStandardMaterial color="#ff0088" emissive="#ff0066" emissiveIntensity={0.4} transparent opacity={0.7} />
    </mesh>
  );
}

function OrbMesh({ orb }: { orb: Orb }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current && !orb.collected) {
      meshRef.current.rotation.y += delta * 2;
      meshRef.current.position.y = orb.y + Math.sin(state.clock.elapsedTime * 3 + orb.id) * 0.2;
    }
  });

  if (orb.collected) return null;

  return (
    <mesh ref={meshRef} position={[orb.x, orb.y, orb.z]}>
      <octahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1} metalness={1} roughness={0} />
      <pointLight color="#00ffff" intensity={1} distance={3} />
    </mesh>
  );
}

function StarField() {
  const starsRef = useRef<THREE.Points>(null);
  
  const [positions] = useMemo(() => {
    const pos = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = TUNNEL_RADIUS * 0.9;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.sin(angle) * radius;
      pos[i * 3 + 2] = Math.random() * 120 - 10;
    }
    return [pos];
  }, []);

  useFrame((_, delta) => {
    if (starsRef.current) {
      const posArray = starsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < 2000; i++) {
        posArray[i * 3 + 2] -= delta * 30;
        if (posArray[i * 3 + 2] < -10) {
          posArray[i * 3 + 2] = 110;
        }
      }
      starsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={2000}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.05} transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function GameScene({ onGameOver, audioEnabled }: { onGameOver: (score: number, distance: number, highScore: number) => void; audioEnabled: boolean }) {
  const { camera } = useThree();
  const gameState = useRef<GameState>({
    speed: 0.3,
    distance: 0,
    score: 0,
    playerX: 0,
    playerY: 0,
    targetX: 0,
    targetY: 0,
    isGameOver: false,
    obstacles: [],
    orbs: [],
    tunnelRotation: 0,
  });
  const keysRef = useRef<Set<string>>(new Set());
  const nextObstacleId = useRef(0);
  const nextOrbId = useRef(0);
  const spawnTimer = useRef(0);
  const gameOverCalled = useRef(false);
  const [renderState, setRenderState] = useState({
    playerPos: [0, 0, 0] as [number, number, number],
    tilt: 0,
    obstacles: [] as Obstacle[],
    orbs: [] as Orb[],
    tunnelRotation: 0,
    speed: 0.3,
    score: 0,
    distance: 0,
  });

  useEffect(() => {
    audio.setEnabled(audioEnabled);
    if (audioEnabled) audio.startEngine();
    return () => { audio.stopEngine(); };
  }, [audioEnabled]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      audio.resume();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Touch controls
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const x = (touch.clientX / window.innerWidth) * 2 - 1;
      const y = -(touch.clientY / window.innerHeight) * 2 + 1;
      gameState.current.targetX = x * 3;
      gameState.current.targetY = y * 2;
    };
    const handleTouchStart = (e: TouchEvent) => {
      audio.resume();
      handleTouchMove(e);
    };
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  const spawnObstacle = useCallback(() => {
    const state = gameState.current;
    const types: Array<'block' | 'ring' | 'wall'> = ['block', 'ring', 'wall'];
    const type = types[Math.floor(Math.random() * types.length)];
    const angle = Math.random() * Math.PI * 2;
    const radius = 1 + Math.random() * 2.5;

    const obstacle: Obstacle = {
      id: nextObstacleId.current++,
      z: -SPAWN_DISTANCE,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      type,
      width: type === 'ring' ? 1 + Math.random() : 0.8 + Math.random() * 1.5,
      height: type === 'ring' ? 0.3 : 0.5 + Math.random() * 1.5,
      rotation: Math.random() * Math.PI,
    };
    state.obstacles.push(obstacle);
  }, []);

  const spawnOrb = useCallback(() => {
    const state = gameState.current;
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.5 + Math.random() * 2;
    const orb: Orb = {
      id: nextOrbId.current++,
      z: -SPAWN_DISTANCE,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      collected: false,
    };
    state.orbs.push(orb);
  }, []);

  useFrame((_, delta) => {
    const state = gameState.current;
    if (state.isGameOver) return;

    // Clamp delta to prevent huge jumps
    const dt = Math.min(delta, 0.05);

    // Increase speed over time
    state.speed = Math.min(1.5, state.speed + dt * 0.005);
    state.distance += state.speed * dt * 60;

    // Keyboard input
    const moveSpeed = 5 * dt;
    if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a') || keysRef.current.has('A')) {
      state.targetX -= moveSpeed;
    }
    if (keysRef.current.has('ArrowRight') || keysRef.current.has('d') || keysRef.current.has('D')) {
      state.targetX += moveSpeed;
    }
    if (keysRef.current.has('ArrowUp') || keysRef.current.has('w') || keysRef.current.has('W')) {
      state.targetY += moveSpeed;
    }
    if (keysRef.current.has('ArrowDown') || keysRef.current.has('s') || keysRef.current.has('S')) {
      state.targetY -= moveSpeed;
    }

    // Clamp target within tunnel
    const maxRadius = TUNNEL_RADIUS - 1;
    const dist = Math.sqrt(state.targetX ** 2 + state.targetY ** 2);
    if (dist > maxRadius) {
      state.targetX = (state.targetX / dist) * maxRadius;
      state.targetY = (state.targetY / dist) * maxRadius;
    }

    // Smooth movement
    state.playerX += (state.targetX - state.playerX) * 5 * dt;
    state.playerY += (state.targetY - state.playerY) * 5 * dt;

    // Spawn obstacles and orbs
    spawnTimer.current += dt;
    const spawnRate = Math.max(0.3, 1.2 - state.speed * 0.5);
    if (spawnTimer.current > spawnRate) {
      spawnTimer.current = 0;
      spawnObstacle();
      if (Math.random() < 0.4) spawnOrb();
    }

    // Move obstacles and orbs toward player
    const moveZ = state.speed * dt * 60;
    state.obstacles.forEach(obs => { obs.z += moveZ; });
    state.orbs.forEach(orb => { orb.z += moveZ; });

    // Tunnel rotation
    state.tunnelRotation += dt * 0.1 * state.speed;

    // Update engine sound
    audio.updateEngine(state.speed);

    // Collision detection with obstacles
    for (const obs of state.obstacles) {
      if (obs.z > -2 && obs.z < 2) {
        const dx = state.playerX - obs.x;
        const dy = state.playerY - obs.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hitRadius = obs.type === 'ring' ? Math.abs(obs.width - dist) < 0.4 : dist < (obs.width / 2 + PLAYER_SIZE);
        
        if (hitRadius) {
          state.isGameOver = true;
          audio.crash();
          if (!gameOverCalled.current) {
            gameOverCalled.current = true;
            const highScore = parseInt(localStorage.getItem('voidrunner_highscore') || '0');
            const newHigh = Math.max(highScore, state.score);
            localStorage.setItem('voidrunner_highscore', newHigh.toString());
            setTimeout(() => {
              onGameOver(state.score, Math.floor(state.distance), newHigh);
            }, 1000);
          }
          break;
        }

        // Near miss detection
        if (dist < (obs.type === 'ring' ? obs.width + 0.8 : obs.width / 2 + PLAYER_SIZE + 0.5) && !hitRadius) {
          audio.nearMiss();
          state.score += 5;
        }
      }
    }

    // Orb collection
    for (const orb of state.orbs) {
      if (!orb.collected && orb.z > -2 && orb.z < 2) {
        const dx = state.playerX - orb.x;
        const dy = state.playerY - orb.y;
        if (Math.sqrt(dx * dx + dy * dy) < 0.8) {
          orb.collected = true;
          state.score += 50;
          audio.collect();
        }
      }
    }

    // Clean up passed objects
    state.obstacles = state.obstacles.filter(o => o.z < 10);
    state.orbs = state.orbs.filter(o => o.z < 10 && !o.collected);

    // Update camera
    camera.position.set(state.playerX * 0.3, state.playerY * 0.3, 5);
    camera.lookAt(state.playerX * 0.5, state.playerY * 0.5, -10);

    // Update render state
    setRenderState({
      playerPos: [state.playerX, state.playerY, 0],
      tilt: state.targetX - state.playerX,
      obstacles: [...state.obstacles],
      orbs: [...state.orbs],
      tunnelRotation: state.tunnelRotation,
      speed: state.speed,
      score: state.score,
      distance: Math.floor(state.distance),
    });
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <directionalLight position={[0, 5, 5]} intensity={0.5} color="#8888ff" />
      <pointLight position={[0, 0, -20]} color="#ff00ff" intensity={1} distance={50} />

      {/* Fog */}
      <fog attach="fog" color="#000011" near={5} far={80} />

      {/* Tunnel */}
      <Tunnel rotation={renderState.tunnelRotation} />

      {/* Stars */}
      <StarField />

      {/* Player ship */}
      <Ship position={renderState.playerPos} tilt={renderState.tilt} />

      {/* Obstacles */}
      {renderState.obstacles.map(obs => (
        <ObstacleMesh key={obs.id} obstacle={obs} />
      ))}

      {/* Orbs */}
      {renderState.orbs.map(orb => (
        <OrbMesh key={orb.id} orb={orb} />
      ))}

      {/* HUD rendered as HTML overlay */}
      <HUD score={renderState.score} distance={renderState.distance} speed={renderState.speed} isGameOver={gameState.current.isGameOver} />
    </>
  );
}

function HUD({ score, distance, speed, isGameOver }: { score: number; distance: number; speed: number; isGameOver: boolean }) {
  // This is rendered inside the Canvas but we use Html from drei
  return null; // HUD is rendered outside the Canvas
}

function Game3D({ onGameOver, audioEnabled }: Game3DProps) {
  const [hudData, setHudData] = useState({ score: 0, distance: 0, speed: 0.3 });

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#000011' }}
      >
        <GameSceneWithHUD onGameOver={onGameOver} audioEnabled={audioEnabled} onHudUpdate={setHudData} />
      </Canvas>

      {/* HUD Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none">
        <div className="flex justify-between items-start max-w-4xl mx-auto">
          <div>
            <div className="game-font text-cyan-400 text-sm">SCORE</div>
            <div className="game-font text-white text-3xl font-bold">{hudData.score.toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className="game-font text-purple-400 text-sm">DISTANCE</div>
            <div className="game-font text-white text-2xl">{hudData.distance}m</div>
          </div>
        </div>
        {/* Speed bar */}
        <div className="mt-4 max-w-xs mx-auto">
          <div className="game-font text-xs text-gray-400 mb-1 text-center">VITESSE</div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(hudData.speed / 1.5) * 100}%`,
                background: `linear-gradient(90deg, #00ffaa, ${hudData.speed > 1 ? '#ff0055' : '#00aaff'})`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
        <p className="game-font text-xs text-gray-500">ZQSD / FLÈCHES POUR SE DÉPLACER • MOBILE: TOUCHER & GLISSER</p>
      </div>
    </div>
  );
}

// Wrapper to pass HUD updates
function GameSceneWithHUD({ onGameOver, audioEnabled, onHudUpdate }: {
  onGameOver: (score: number, distance: number, highScore: number) => void;
  audioEnabled: boolean;
  onHudUpdate: (data: { score: number; distance: number; speed: number }) => void;
}) {
  const { camera } = useThree();
  const gameState = useRef<GameState>({
    speed: 0.3,
    distance: 0,
    score: 0,
    playerX: 0,
    playerY: 0,
    targetX: 0,
    targetY: 0,
    isGameOver: false,
    obstacles: [],
    orbs: [],
    tunnelRotation: 0,
  });
  const keysRef = useRef<Set<string>>(new Set());
  const nextObstacleId = useRef(0);
  const nextOrbId = useRef(0);
  const spawnTimer = useRef(0);
  const gameOverCalled = useRef(false);
  const hudUpdateTimer = useRef(0);
  const [renderState, setRenderState] = useState({
    playerPos: [0, 0, 0] as [number, number, number],
    tilt: 0,
    obstacles: [] as Obstacle[],
    orbs: [] as Orb[],
    tunnelRotation: 0,
  });

  useEffect(() => {
    audio.setEnabled(audioEnabled);
    if (audioEnabled) audio.startEngine();
    return () => { audio.stopEngine(); };
  }, [audioEnabled]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      audio.resume();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const x = (touch.clientX / window.innerWidth) * 2 - 1;
      const y = -(touch.clientY / window.innerHeight) * 2 + 1;
      gameState.current.targetX = x * 3;
      gameState.current.targetY = y * 2;
    };
    const handleTouchStart = (e: TouchEvent) => {
      audio.resume();
      handleTouchMove(e);
    };
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  const spawnObstacle = useCallback(() => {
    const state = gameState.current;
    const types: Array<'block' | 'ring' | 'wall'> = ['block', 'ring', 'wall'];
    const type = types[Math.floor(Math.random() * types.length)];
    const angle = Math.random() * Math.PI * 2;
    const radius = 1 + Math.random() * 2.5;

    const obstacle: Obstacle = {
      id: nextObstacleId.current++,
      z: -SPAWN_DISTANCE,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      type,
      width: type === 'ring' ? 1 + Math.random() : 0.8 + Math.random() * 1.5,
      height: type === 'ring' ? 0.3 : 0.5 + Math.random() * 1.5,
      rotation: Math.random() * Math.PI,
    };
    state.obstacles.push(obstacle);
  }, []);

  const spawnOrb = useCallback(() => {
    const state = gameState.current;
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.5 + Math.random() * 2;
    const orb: Orb = {
      id: nextOrbId.current++,
      z: -SPAWN_DISTANCE,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      collected: false,
    };
    state.orbs.push(orb);
  }, []);

  useFrame((_, delta) => {
    const state = gameState.current;
    if (state.isGameOver) return;

    const dt = Math.min(delta, 0.05);

    state.speed = Math.min(1.5, state.speed + dt * 0.005);
    state.distance += state.speed * dt * 60;

    const moveSpeed = 5 * dt;
    if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a') || keysRef.current.has('A')) {
      state.targetX -= moveSpeed;
    }
    if (keysRef.current.has('ArrowRight') || keysRef.current.has('d') || keysRef.current.has('D')) {
      state.targetX += moveSpeed;
    }
    if (keysRef.current.has('ArrowUp') || keysRef.current.has('w') || keysRef.current.has('W')) {
      state.targetY += moveSpeed;
    }
    if (keysRef.current.has('ArrowDown') || keysRef.current.has('s') || keysRef.current.has('S')) {
      state.targetY -= moveSpeed;
    }

    const maxRadius = TUNNEL_RADIUS - 1;
    const dist = Math.sqrt(state.targetX ** 2 + state.targetY ** 2);
    if (dist > maxRadius) {
      state.targetX = (state.targetX / dist) * maxRadius;
      state.targetY = (state.targetY / dist) * maxRadius;
    }

    state.playerX += (state.targetX - state.playerX) * 5 * dt;
    state.playerY += (state.targetY - state.playerY) * 5 * dt;

    spawnTimer.current += dt;
    const spawnRate = Math.max(0.3, 1.2 - state.speed * 0.5);
    if (spawnTimer.current > spawnRate) {
      spawnTimer.current = 0;
      spawnObstacle();
      if (Math.random() < 0.4) spawnOrb();
    }

    const moveZ = state.speed * dt * 60;
    state.obstacles.forEach(obs => { obs.z += moveZ; });
    state.orbs.forEach(orb => { orb.z += moveZ; });

    state.tunnelRotation += dt * 0.1 * state.speed;

    audio.updateEngine(state.speed);

    // Collision detection
    for (const obs of state.obstacles) {
      if (obs.z > -2 && obs.z < 2) {
        const dx = state.playerX - obs.x;
        const dy = state.playerY - obs.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        let hit = false;
        
        if (obs.type === 'ring') {
          hit = Math.abs(d - obs.width) < 0.4;
        } else {
          hit = d < (obs.width / 2 + PLAYER_SIZE);
        }
        
        if (hit) {
          state.isGameOver = true;
          audio.crash();
          if (!gameOverCalled.current) {
            gameOverCalled.current = true;
            const highScore = parseInt(localStorage.getItem('voidrunner_highscore') || '0');
            const newHigh = Math.max(highScore, state.score);
            localStorage.setItem('voidrunner_highscore', newHigh.toString());
            setTimeout(() => {
              onGameOver(state.score, Math.floor(state.distance), newHigh);
            }, 1000);
          }
          break;
        }

        // Near miss
        const nearDist = obs.type === 'ring' ? obs.width + 0.8 : obs.width / 2 + PLAYER_SIZE + 0.5;
        if (d < nearDist && !hit) {
          state.score += 5;
        }
      }
    }

    // Orb collection
    for (const orb of state.orbs) {
      if (!orb.collected && orb.z > -2 && orb.z < 2) {
        const dx = state.playerX - orb.x;
        const dy = state.playerY - orb.y;
        if (Math.sqrt(dx * dx + dy * dy) < 0.8) {
          orb.collected = true;
          state.score += 50;
          audio.collect();
        }
      }
    }

    state.obstacles = state.obstacles.filter(o => o.z < 10);
    state.orbs = state.orbs.filter(o => o.z < 10 && !o.collected);

    camera.position.set(state.playerX * 0.3, state.playerY * 0.3, 5);
    camera.lookAt(state.playerX * 0.5, state.playerY * 0.5, -10);

    setRenderState({
      playerPos: [state.playerX, state.playerY, 0],
      tilt: state.targetX - state.playerX,
      obstacles: [...state.obstacles],
      orbs: [...state.orbs],
      tunnelRotation: state.tunnelRotation,
    });

    // Update HUD less frequently
    hudUpdateTimer.current += dt;
    if (hudUpdateTimer.current > 0.1) {
      hudUpdateTimer.current = 0;
      onHudUpdate({ score: state.score, distance: Math.floor(state.distance), speed: state.speed });
    }
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[0, 5, 5]} intensity={0.5} color="#8888ff" />
      <pointLight position={[0, 0, -20]} color="#ff00ff" intensity={1} distance={50} />
      <fog attach="fog" color="#000011" near={5} far={80} />

      <Tunnel rotation={renderState.tunnelRotation} />
      <StarField />
      <Ship position={renderState.playerPos} tilt={renderState.tilt} />

      {renderState.obstacles.map(obs => (
        <ObstacleMesh key={obs.id} obstacle={obs} />
      ))}
      {renderState.orbs.map(orb => (
        <OrbMesh key={orb.id} orb={orb} />
      ))}
    </>
  );
}

export default Game3D;
