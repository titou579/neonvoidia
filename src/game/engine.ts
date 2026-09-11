import {
  Player, Enemy, Bullet, Particle, PowerUp, Star,
  EnemyType, PowerUpType,
  createPlayer, createEnemy, createExplosion,
  createPowerUp, createStar,
} from './entities';
import { audio } from './audio';

export interface GameState {
  player: Player;
  bullets: Bullet[];
  enemies: Enemy[];
  particles: Particle[];
  powerUps: PowerUp[];
  stars: Star[];
  score: number;
  highScore: number;
  wave: number;
  waveTimer: number;
  waveDelay: number;
  enemiesInWave: number;
  enemiesSpawned: number;
  spawnTimer: number;
  gameOver: boolean;
  paused: boolean;
  screenShake: number;
  combo: number;
  comboTimer: number;
  width: number;
  height: number;
}

function createBullet(
  x: number, y: number, vx: number, vy: number,
  isPlayer: boolean, damage = 1, color = '#0ff'
): Bullet {
  return {
    x, y, width: isPlayer ? 4 : 6, height: isPlayer ? 12 : 6,
    active: true, vx, vy, damage, isPlayer, color,
  };
}

export function createGameState(width: number, height: number): GameState {
  const stars: Star[] = [];
  for (let i = 0; i < 100; i++) {
    stars.push(createStar(width, height));
  }

  const highScore = parseInt(localStorage.getItem('neonvoid_highscore') || '0');

  return {
    player: createPlayer(width, height),
    bullets: [],
    enemies: [],
    particles: [],
    powerUps: [],
    stars,
    score: 0,
    highScore,
    wave: 0,
    waveTimer: 0,
    waveDelay: 180,
    enemiesInWave: 0,
    enemiesSpawned: 0,
    spawnTimer: 0,
    gameOver: false,
    paused: false,
    screenShake: 0,
    combo: 0,
    comboTimer: 0,
    width,
    height,
  };
}

export function startWave(state: GameState) {
  state.wave++;
  state.waveTimer = 0;
  state.enemiesInWave = 5 + state.wave * 3;
  state.enemiesSpawned = 0;
  state.spawnTimer = 0;
  audio.waveStart();
}

function spawnEnemy(state: GameState) {
  const { wave, width } = state;
  const x = 40 + Math.random() * (width - 80);
  
  let type: EnemyType;
  const rand = Math.random();
  
  if (wave % 5 === 0 && state.enemiesSpawned === state.enemiesInWave - 1) {
    type = EnemyType.BOSS;
  } else if (rand < 0.3) {
    type = EnemyType.BASIC;
  } else if (rand < 0.5) {
    type = EnemyType.FAST;
  } else if (rand < 0.65) {
    type = EnemyType.TANK;
  } else if (rand < 0.8) {
    type = EnemyType.SHOOTER;
  } else {
    type = EnemyType.ZIGZAG;
  }

  const enemy = createEnemy(type, x, -50, wave);
  if (type === EnemyType.BOSS) {
    enemy.x = width / 2 - enemy.width / 2;
  }
  state.enemies.push(enemy);
  state.enemiesSpawned++;
}

function playerShoot(state: GameState) {
  const { player } = state;
  if (player.shootCooldown > 0) return;

  const cx = player.x + player.width / 2;
  const cy = player.y;

  if (player.powerLevel >= 3) {
    state.bullets.push(createBullet(cx - 2, cy, 0, -10, true, 1, '#0ff'));
    state.bullets.push(createBullet(cx - 15, cy + 5, -1.5, -9, true, 1, '#0af'));
    state.bullets.push(createBullet(cx + 11, cy + 5, 1.5, -9, true, 1, '#0af'));
    player.shootCooldown = 8;
  } else if (player.powerLevel >= 2) {
    state.bullets.push(createBullet(cx - 10, cy, 0, -10, true, 1, '#0ff'));
    state.bullets.push(createBullet(cx + 6, cy, 0, -10, true, 1, '#0ff'));
    player.shootCooldown = 10;
  } else {
    state.bullets.push(createBullet(cx - 2, cy, 0, -10, true, 1, '#0ff'));
    player.shootCooldown = 12;
  }

  audio.shoot();
}

function enemyShoot(state: GameState, enemy: Enemy) {
  const cx = enemy.x + enemy.width / 2;
  const cy = enemy.y + enemy.height;
  const px = state.player.x + state.player.width / 2;
  const py = state.player.y + state.player.height / 2;
  
  const angle = Math.atan2(py - cy, px - cx);
  const speed = enemy.type === EnemyType.BOSS ? 5 : 3.5;

  if (enemy.type === EnemyType.BOSS) {
    for (let i = -2; i <= 2; i++) {
      const a = angle + i * 0.2;
      state.bullets.push(createBullet(cx, cy, Math.cos(a) * speed, Math.sin(a) * speed, false, 1, '#f55'));
    }
  } else {
    state.bullets.push(createBullet(cx, cy, Math.cos(angle) * speed, Math.sin(angle) * speed, false, 1, '#f55'));
  }
  
  audio.enemyShoot();
}

function checkCollision(a: { x: number; y: number; width: number; height: number },
                         b: { x: number; y: number; width: number; height: number }): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
         a.y < b.y + b.height && a.y + a.height > b.y;
}

export function updateGame(state: GameState, keys: Set<string>, dt: number): GameState {
  if (state.gameOver || state.paused) return state;

  const { player } = state;

  state.stars.forEach(star => {
    star.y += star.speed;
    if (star.y > state.height) {
      star.y = 0;
      star.x = Math.random() * state.width;
    }
  });

  if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) {
    player.x -= player.speed;
  }
  if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) {
    player.x += player.speed;
  }
  if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) {
    player.y -= player.speed;
  }
  if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) {
    player.y += player.speed;
  }

  player.x = Math.max(0, Math.min(state.width - player.width, player.x));
  player.y = Math.max(state.height * 0.3, Math.min(state.height - player.height - 10, player.y));

  if (keys.has(' ') || keys.has('Space')) {
    playerShoot(state);
  }
  if (player.shootCooldown > 0) player.shootCooldown--;
  if (player.invincible > 0) player.invincible--;

  if (state.screenShake > 0) state.screenShake *= 0.9;
  if (state.screenShake < 0.5) state.screenShake = 0;

  if (state.comboTimer > 0) {
    state.comboTimer--;
    if (state.comboTimer <= 0) state.combo = 0;
  }

  if (state.enemies.length === 0 && state.enemiesSpawned >= state.enemiesInWave) {
    state.waveTimer++;
    if (state.waveTimer >= state.waveDelay) {
      startWave(state);
    }
  }

  if (state.enemiesSpawned < state.enemiesInWave) {
    state.spawnTimer++;
    const spawnRate = Math.max(20, 60 - state.wave * 3);
    if (state.spawnTimer >= spawnRate) {
      spawnEnemy(state);
      state.spawnTimer = 0;
    }
  }

  state.bullets.forEach(bullet => {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    if (bullet.y < -20 || bullet.y > state.height + 20 ||
        bullet.x < -20 || bullet.x > state.width + 20) {
      bullet.active = false;
    }
  });

  state.enemies.forEach(enemy => {
    enemy.behaviorTimer++;

    switch (enemy.type) {
      case EnemyType.BASIC:
        enemy.y += enemy.speed;
        break;
      case EnemyType.FAST:
        enemy.y += enemy.speed;
        enemy.x += Math.sin(enemy.behaviorTimer * 0.05) * 2;
        break;
      case EnemyType.TANK:
        enemy.y += enemy.speed;
        break;
      case EnemyType.SHOOTER:
        if (enemy.y < 100) {
          enemy.y += enemy.speed;
        } else {
          enemy.x += Math.sin(enemy.behaviorTimer * 0.02) * 1.5;
        }
        break;
      case EnemyType.ZIGZAG:
        enemy.y += enemy.speed * 0.7;
        enemy.x += Math.sin(enemy.behaviorTimer * 0.08) * 4;
        break;
      case EnemyType.BOSS:
        if (enemy.y < 60) {
          enemy.y += enemy.speed;
        } else {
          enemy.x += Math.sin(enemy.behaviorTimer * 0.015) * 2;
          enemy.x = Math.max(10, Math.min(state.width - enemy.width - 10, enemy.x));
        }
        break;
    }

    enemy.shootTimer++;
    if (enemy.shootTimer >= enemy.shootInterval && enemy.y > 0) {
      enemyShoot(state, enemy);
      enemy.shootTimer = 0;
    }

    if (enemy.y > state.height + 60) {
      enemy.active = false;
    }
  });

  state.particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.life -= 1 / (60 * p.maxLife);
  });

  state.powerUps.forEach(pu => {
    pu.y += pu.vy;
    pu.angle += 0.05;
    if (pu.y > state.height + 30) pu.active = false;
  });

  state.bullets.forEach(bullet => {
    if (!bullet.isPlayer || !bullet.active) return;
    state.enemies.forEach(enemy => {
      if (!enemy.active) return;
      if (checkCollision(bullet, enemy)) {
        bullet.active = false;
        enemy.hp -= bullet.damage;
        
        state.particles.push(...createExplosion(bullet.x, bullet.y, '#0ff', 3));
        
        if (enemy.hp <= 0) {
          enemy.active = false;
          state.combo++;
          state.comboTimer = 120;
          const comboMultiplier = Math.min(state.combo, 10);
          state.score += enemy.points * comboMultiplier;
          
          const color = enemy.type === EnemyType.BOSS ? '#ff0' : '#f80';
          const count = enemy.type === EnemyType.BOSS ? 40 : 15;
          state.particles.push(...createExplosion(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2,
            color, count
          ));
          
          if (enemy.type === EnemyType.BOSS) {
            state.screenShake = 15;
            audio.bigExplosion();
          } else {
            state.screenShake = 3;
            audio.explosion();
          }

          if (Math.random() < (enemy.type === EnemyType.BOSS ? 1 : 0.15)) {
            state.powerUps.push(createPowerUp(
              enemy.x + enemy.width / 2 - 12,
              enemy.y + enemy.height / 2
            ));
          }
        } else {
          audio.hit();
        }
      }
    });
  });

  if (player.invincible <= 0) {
    state.bullets.forEach(bullet => {
      if (bullet.isPlayer || !bullet.active) return;
      if (checkCollision(bullet, player)) {
        bullet.active = false;
        
        if (player.shield > 0) {
          player.shield -= 20;
          state.particles.push(...createExplosion(bullet.x, bullet.y, '#0af', 5));
          audio.hit();
        } else {
          player.lives--;
          player.invincible = 120;
          player.powerLevel = Math.max(1, player.powerLevel - 1);
          state.screenShake = 10;
          state.combo = 0;
          state.particles.push(...createExplosion(
            player.x + player.width / 2,
            player.y + player.height / 2,
            '#f0f', 20
          ));
          audio.playerHit();
          
          if (player.lives <= 0) {
            state.gameOver = true;
            if (state.score > state.highScore) {
              state.highScore = state.score;
              localStorage.setItem('neonvoid_highscore', state.score.toString());
            }
            audio.gameOver();
          }
        }
      }
    });
  }

  if (player.invincible <= 0) {
    state.enemies.forEach(enemy => {
      if (!enemy.active) return;
      if (checkCollision(enemy, player)) {
        if (player.shield > 0) {
          player.shield -= 40;
          enemy.hp -= 2;
          if (enemy.hp <= 0) {
            enemy.active = false;
            state.score += enemy.points;
            state.particles.push(...createExplosion(
              enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#f80', 15
            ));
            audio.explosion();
          }
        } else {
          player.lives--;
          player.invincible = 120;
          state.screenShake = 10;
          state.combo = 0;
          audio.playerHit();
          
          if (player.lives <= 0) {
            state.gameOver = true;
            if (state.score > state.highScore) {
              state.highScore = state.score;
              localStorage.setItem('neonvoid_highscore', state.score.toString());
            }
            audio.gameOver();
          }
        }
      }
    });
  }

  state.powerUps.forEach(pu => {
    if (!pu.active) return;
    if (checkCollision(pu, player)) {
      pu.active = false;
      audio.powerUp();
      state.particles.push(...createExplosion(pu.x + 12, pu.y + 12, '#0f0', 10));
      
      switch (pu.type) {
        case PowerUpType.POWER:
          player.powerLevel = Math.min(3, player.powerLevel + 1);
          break;
        case PowerUpType.SHIELD:
          player.shield = Math.min(player.shieldMax, player.shield + 50);
          break;
        case PowerUpType.LIFE:
          player.lives = Math.min(5, player.lives + 1);
          break;
        case PowerUpType.SPEED:
          player.speed = Math.min(8, player.speed + 0.5);
          break;
      }
    }
  });

  state.bullets = state.bullets.filter(b => b.active);
  state.enemies = state.enemies.filter(e => e.active);
  state.particles = state.particles.filter(p => p.life > 0);
  state.powerUps = state.powerUps.filter(p => p.active);

  if (state.particles.length > 500) {
    state.particles = state.particles.slice(-500);
  }

  return state;
}
