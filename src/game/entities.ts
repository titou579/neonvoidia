// Game entities and types

export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
}

export interface Player extends Entity {
  speed: number;
  lives: number;
  invincible: number;
  shootCooldown: number;
  powerLevel: number;
  shield: number;
  shieldMax: number;
}

export interface Bullet extends Entity {
  vx: number;
  vy: number;
  damage: number;
  isPlayer: boolean;
  color: string;
}

export interface Enemy extends Entity {
  type: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  shootTimer: number;
  shootInterval: number;
  points: number;
  angle: number;
  behaviorTimer: number;
  targetX: number;
  targetY: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface PowerUp extends Entity {
  type: PowerUpType;
  vy: number;
  angle: number;
}

export interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  brightness: number;
}

export enum EnemyType {
  BASIC = 'basic',
  FAST = 'fast',
  TANK = 'tank',
  SHOOTER = 'shooter',
  BOSS = 'boss',
  ZIGZAG = 'zigzag',
}

export enum PowerUpType {
  POWER = 'power',
  SHIELD = 'shield',
  LIFE = 'life',
  SPEED = 'speed',
}

export function createPlayer(canvasWidth: number, canvasHeight: number): Player {
  return {
    x: canvasWidth / 2 - 20,
    y: canvasHeight - 80,
    width: 40,
    height: 40,
    active: true,
    speed: 5,
    lives: 3,
    invincible: 0,
    shootCooldown: 0,
    powerLevel: 1,
    shield: 0,
    shieldMax: 100,
  };
}

export function createEnemy(type: EnemyType, x: number, y: number, wave: number): Enemy {
  const base: Enemy = {
    x, y, width: 30, height: 30, active: true,
    type, hp: 1, maxHp: 1, speed: 2, shootTimer: 0,
    shootInterval: 120, points: 100, angle: 0,
    behaviorTimer: 0, targetX: x, targetY: y,
  };

  switch (type) {
    case EnemyType.BASIC:
      base.speed = 1.5 + wave * 0.1;
      base.hp = base.maxHp = 1;
      base.points = 100;
      base.shootInterval = 180;
      break;
    case EnemyType.FAST:
      base.width = 24;
      base.height = 24;
      base.speed = 3 + wave * 0.15;
      base.hp = base.maxHp = 1;
      base.points = 150;
      base.shootInterval = 200;
      break;
    case EnemyType.TANK:
      base.width = 44;
      base.height = 44;
      base.speed = 0.8;
      base.hp = base.maxHp = 3 + Math.floor(wave / 3);
      base.points = 300;
      base.shootInterval = 90;
      break;
    case EnemyType.SHOOTER:
      base.speed = 1;
      base.hp = base.maxHp = 2;
      base.points = 200;
      base.shootInterval = 60;
      break;
    case EnemyType.ZIGZAG:
      base.speed = 2;
      base.hp = base.maxHp = 1;
      base.points = 175;
      base.shootInterval = 150;
      break;
    case EnemyType.BOSS:
      base.width = 80;
      base.height = 60;
      base.speed = 1;
      base.hp = base.maxHp = 20 + wave * 5;
      base.points = 2000;
      base.shootInterval = 30;
      break;
  }

  return base;
}

export function createParticle(x: number, y: number, color: string, speed = 3): Particle {
  const angle = Math.random() * Math.PI * 2;
  const vel = Math.random() * speed + 1;
  return {
    x, y,
    vx: Math.cos(angle) * vel,
    vy: Math.sin(angle) * vel,
    life: 1,
    maxLife: 0.5 + Math.random() * 0.5,
    color,
    size: 1 + Math.random() * 3,
  };
}

export function createExplosion(x: number, y: number, color: string, count = 15): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push(createParticle(x, y, color, 4));
  }
  return particles;
}

export function createPowerUp(x: number, y: number): PowerUp {
  const types = [PowerUpType.POWER, PowerUpType.SHIELD, PowerUpType.LIFE, PowerUpType.SPEED];
  const weights = [0.35, 0.3, 0.15, 0.2];
  let rand = Math.random();
  let type = types[0];
  
  for (let i = 0; i < weights.length; i++) {
    rand -= weights[i];
    if (rand <= 0) {
      type = types[i];
      break;
    }
  }

  return {
    x, y, width: 24, height: 24, active: true,
    type, vy: 1.5, angle: 0,
  };
}

export function createStar(canvasWidth: number, canvasHeight: number): Star {
  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    speed: 0.5 + Math.random() * 2,
    size: Math.random() * 2 + 0.5,
    brightness: 0.3 + Math.random() * 0.7,
  };
}
