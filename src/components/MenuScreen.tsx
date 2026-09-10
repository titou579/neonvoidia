import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function BackgroundScene() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Floating geometric shapes */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const radius = 4 + Math.random() * 3;
        const y = (Math.random() - 0.5) * 6;
        return (
          <mesh key={i} position={[Math.cos(angle) * radius, y, Math.sin(angle) * radius - 5]}>
            {i % 3 === 0 ? (
              <octahedronGeometry args={[0.2 + Math.random() * 0.3, 0]} />
            ) : i % 3 === 1 ? (
              <boxGeometry args={[0.3, 0.3, 0.3]} />
            ) : (
              <tetrahedronGeometry args={[0.25, 0]} />
            )}
            <meshStandardMaterial
              color={i % 2 === 0 ? '#00ffaa' : '#ff00aa'}
              emissive={i % 2 === 0 ? '#00ff88' : '#ff0088'}
              emissiveIntensity={0.5}
              wireframe={Math.random() > 0.5}
            />
          </mesh>
        );
      })}
      {/* Central ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -5]}>
        <torusGeometry args={[3, 0.02, 16, 100]} />
        <meshBasicMaterial color="#6600ff" />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -5]}>
        <torusGeometry args={[3.5, 0.01, 16, 100]} />
        <meshBasicMaterial color="#00ffaa" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

interface MenuScreenProps {
  onStart: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
}

function MenuScreen({ onStart, audioEnabled, onToggleAudio }: MenuScreenProps) {
  const [showControls, setShowControls] = useState(false);
  const highScore = parseInt(localStorage.getItem('voidrunner_highscore') || '0');

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-40">
      {/* 3D Background */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <ambientLight intensity={0.3} />
          <pointLight position={[5, 5, 5]} intensity={1} color="#00ffaa" />
          <pointLight position={[-5, -5, 5]} intensity={0.5} color="#ff00aa" />
          <BackgroundScene />
        </Canvas>
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 text-center">
        <div className="mb-8 animate-float">
          <h1 className="game-font text-5xl md:text-7xl font-black tracking-wider neon-text-cyan text-cyan-400 mb-2">
            VOID RUNNER
          </h1>
          <p className="game-font text-sm md:text-base text-purple-300 tracking-[0.3em] opacity-80">
            ESPACE INFINI • VITESSE LUMIÈRE
          </p>
        </div>

        <div className="flex flex-col gap-4 items-center">
          <button onClick={onStart} className="btn-neon game-font text-lg">
            ▶ DÉMARRER
          </button>

          <button
            onClick={() => setShowControls(!showControls)}
            className="btn-neon-pink game-font text-sm"
          >
            CONTRÔLES
          </button>

          <button
            onClick={onToggleAudio}
            className="game-font text-sm text-gray-400 hover:text-white transition-colors mt-2"
          >
            {audioEnabled ? '🔊 SON ACTIVÉ' : '🔇 SON DÉSACTIVÉ'}
          </button>
        </div>

        {showControls && (
          <div className="mt-8 p-6 neon-border rounded-lg bg-black/70 backdrop-blur-sm max-w-md mx-auto">
            <h3 className="game-font text-cyan-400 text-lg mb-4 text-center">CONTRÔLES</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-gray-400">Déplacement</div>
              <div className="text-white">ZQSD / Flèches</div>
              <div className="text-gray-400">Mobile</div>
              <div className="text-white">Toucher & Glisser</div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <h4 className="game-font text-yellow-400 text-sm mb-2">OBJECTIF</h4>
              <p className="text-gray-300 text-sm">
                Traversez le vide spatial ! Évitez les obstacles et collectez les orbes d'énergie.
                La vitesse augmente progressivement. Survivez le plus longtemps possible !
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700">
              <h4 className="game-font text-green-400 text-sm mb-2">OBSTACLES</h4>
              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                <div>
                  <div className="text-red-400">■ BLOC</div>
                  <div className="text-gray-400">Esquivez-le</div>
                </div>
                <div>
                  <div className="text-orange-400">◯ ANNEAU</div>
                  <div className="text-gray-400">Passez au centre</div>
                </div>
                <div>
                  <div className="text-pink-400">▬ MUR</div>
                  <div className="text-gray-400">Trouvez le passage</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="game-font text-sm text-gray-500">MEILLEUR SCORE</p>
          <p className="game-font text-2xl text-yellow-400 neon-text-cyan">
            {highScore.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default MenuScreen;
