import { GameState } from './engine';
import { EnemyType, PowerUpType, Enemy, Player, PowerUp } from './entities';

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState) {
  const { width, height } = state;

  // Apply screen shake
  ctx.save();
  if (state.screenShake > 0) {
    const shakeX = (Math.random() - 0.5) * state.screenShake;
    const shakeY = (Math.random() - 0.5) * state.screenShake;
    ctx.translate(shakeX, shakeY);
  }

  // Clear
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(-10, -10, width + 20, height + 20);

  // Draw stars
  state.stars.forEach(star => {
    ctx.globalAlpha = star.brightness;
    ctx.fillStyle = '#fff';
    ctx.fillRect(star.x, star.y, star.size, star.size);
  });
  ctx.globalAlpha = 1;

  // Draw grid lines (subtle)
  ctx.strokeStyle = 'rgba(0, 255, 170, 0.03)';
  ctx.lineWidth = 1;
  const gridSize = 60;
  const offsetY = (Date.now() * 0.02) % gridSize;
  for (let y = -gridSize + offsetY; y < height + gridSize; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Draw particles
  state.particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 5;
    ctx.shadowColor = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  });
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // Draw power-ups
  state.powerUps.forEach(pu => {
    drawPowerUp(ctx, pu);
  });

  // Draw bullets
  state.bullets.forEach(bullet => {
    ctx.shadowBlur = 8;
    ctx.shadowColor = bullet.color;
    ctx.fillStyle = bullet.color;
    
    if (bullet.isPlayer) {
      // Player bullet - elongated
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      ctx.fillStyle = '#fff';
      ctx.fillRect(bullet.x + 1, bullet.y + 2, bullet.width - 2, bullet.height - 4);
    } else {
      // Enemy bullet - round
      ctx.beginPath();
      ctx.arc(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, bullet.width / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.shadowBlur = 0;

  // Draw enemies
  state.enemies.forEach(enemy => {
    drawEnemy(ctx, enemy);
  });

  // Draw player
  if (!state.gameOver) {
    drawPlayer(ctx, state.player);
  }

  // Draw HUD
  drawHUD(ctx, state);

  ctx.restore();
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player) {
  const { x, y, width, height } = player;
  const cx = x + width / 2;

  // Blink when invincible
  if (player.invincible > 0 && Math.floor(player.invincible / 4) % 2 === 0) {
    return;
  }

  // Shield effect
  if (player.shield > 0) {
    ctx.strokeStyle = `rgba(0, 170, 255, ${0.3 + Math.sin(Date.now() * 0.01) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#0af';
    ctx.beginPath();
    ctx.arc(cx, y + height / 2, width * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Ship body
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#0fa';
  
  // Main body
  ctx.fillStyle = '#0fa';
  ctx.beginPath();
  ctx.moveTo(cx, y);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(cx, y + height - 8);
  ctx.lineTo(x, y + height);
  ctx.closePath();
  ctx.fill();

  // Inner detail
  ctx.fillStyle = '#0a5';
  ctx.beginPath();
  ctx.moveTo(cx, y + 8);
  ctx.lineTo(x + width - 10, y + height - 5);
  ctx.lineTo(cx, y + height - 14);
  ctx.lineTo(x + 10, y + height - 5);
  ctx.closePath();
  ctx.fill();

  // Engine glow
  ctx.fillStyle = '#f80';
  ctx.shadowColor = '#f80';
  ctx.shadowBlur = 15;
  const engineFlicker = Math.random() * 5;
  ctx.beginPath();
  ctx.moveTo(cx - 5, y + height - 5);
  ctx.lineTo(cx, y + height + 8 + engineFlicker);
  ctx.lineTo(cx + 5, y + height - 5);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
  const { x, y, width, height, type } = enemy;
  const cx = x + width / 2;
  const cy = y + height / 2;

  ctx.shadowBlur = 8;

  switch (type) {
    case EnemyType.BASIC:
      ctx.shadowColor = '#f55';
      ctx.fillStyle = '#f55';
      ctx.beginPath();
      ctx.moveTo(cx, y + height);
      ctx.lineTo(x + width, y);
      ctx.lineTo(cx, y + 8);
      ctx.lineTo(x, y);
      ctx.closePath();
      ctx.fill();
      break;

    case EnemyType.FAST:
      ctx.shadowColor = '#ff0';
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.moveTo(cx, y + height);
      ctx.lineTo(x + width, y + height * 0.3);
      ctx.lineTo(cx, y);
      ctx.lineTo(x, y + height * 0.3);
      ctx.closePath();
      ctx.fill();
      break;

    case EnemyType.TANK:
      ctx.shadowColor = '#f80';
      ctx.fillStyle = '#f80';
      ctx.fillRect(x + 4, y + 4, width - 8, height - 8);
      ctx.fillStyle = '#a50';
      ctx.fillRect(x + 8, y + 8, width - 16, height - 16);
      // HP bar
      const hpRatio = enemy.hp / enemy.maxHp;
      ctx.fillStyle = '#300';
      ctx.fillRect(x, y - 6, width, 3);
      ctx.fillStyle = hpRatio > 0.5 ? '#0f0' : hpRatio > 0.25 ? '#ff0' : '#f00';
      ctx.fillRect(x, y - 6, width * hpRatio, 3);
      break;

    case EnemyType.SHOOTER:
      ctx.shadowColor = '#f0f';
      ctx.fillStyle = '#f0f';
      ctx.beginPath();
      ctx.arc(cx, cy, width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#808';
      ctx.beginPath();
      ctx.arc(cx, cy, width / 4, 0, Math.PI * 2);
      ctx.fill();
      // Cannon
      ctx.fillStyle = '#f0f';
      ctx.fillRect(cx - 2, cy + width / 4, 4, height / 2);
      break;

    case EnemyType.ZIGZAG:
      ctx.shadowColor = '#0ff';
      ctx.fillStyle = '#0ff';
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(enemy.behaviorTimer * 0.05);
      ctx.fillRect(-width / 2, -height / 2, width, height);
      ctx.restore();
      break;

    case EnemyType.BOSS:
      ctx.shadowColor = '#f00';
      // Main body
      ctx.fillStyle = '#800';
      ctx.fillRect(x + 5, y + 5, width - 10, height - 10);
      ctx.fillStyle = '#f00';
      ctx.fillRect(x + 10, y + 10, width - 20, height - 20);
      // Details
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
      // Wings
      ctx.fillStyle = '#a00';
      ctx.beginPath();
      ctx.moveTo(x, y + height / 2);
      ctx.lineTo(x - 15, y + height);
      ctx.lineTo(x + 10, y + height - 10);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + width, y + height / 2);
      ctx.lineTo(x + width + 15, y + height);
      ctx.lineTo(x + width - 10, y + height - 10);
      ctx.closePath();
      ctx.fill();
      // HP bar
      const bossHp = enemy.hp / enemy.maxHp;
      ctx.fillStyle = '#300';
      ctx.fillRect(x, y - 10, width, 5);
      ctx.fillStyle = bossHp > 0.5 ? '#0f0' : bossHp > 0.25 ? '#ff0' : '#f00';
      ctx.fillRect(x, y - 10, width * bossHp, 5);
      break;
  }

  ctx.shadowBlur = 0;
}

function drawPowerUp(ctx: CanvasRenderingContext2D, pu: PowerUp) {
  const cx = pu.x + pu.width / 2;
  const cy = pu.y + pu.height / 2;

  let color = '#0f0';
  let symbol = 'P';
  
  switch (pu.type) {
    case PowerUpType.POWER: color = '#f80'; symbol = '⚡'; break;
    case PowerUpType.SHIELD: color = '#0af'; symbol = '🛡'; break;
    case PowerUpType.LIFE: color = '#f0f'; symbol = '♥'; break;
    case PowerUpType.SPEED: color = '#ff0'; symbol = '»'; break;
  }

  // Glow
  ctx.shadowBlur = 15;
  ctx.shadowColor = color;
  
  // Background circle
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.3 + Math.sin(pu.angle * 3) * 0.1;
  ctx.beginPath();
  ctx.arc(cx, cy, pu.width / 2 + 4, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, pu.width / 2, 0, Math.PI * 2);
  ctx.stroke();

  // Symbol
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px Orbitron';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol, cx, cy);

  ctx.shadowBlur = 0;
}

function drawHUD(ctx: CanvasRenderingContext2D, state: GameState) {
  const { player, score, wave, combo, highScore } = state;

  // Score
  ctx.shadowBlur = 5;
  ctx.shadowColor = '#0fa';
  ctx.fillStyle = '#0fa';
  ctx.font = 'bold 18px Orbitron';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE: ${score.toLocaleString()}`, 15, 30);

  // High score
  ctx.fillStyle = '#888';
  ctx.font = '12px Orbitron';
  ctx.fillText(`HI: ${highScore.toLocaleString()}`, 15, 50);

  // Wave
  ctx.fillStyle = '#ff0';
  ctx.shadowColor = '#ff0';
  ctx.font = 'bold 16px Orbitron';
  ctx.textAlign = 'right';
  ctx.fillText(`WAVE ${wave}`, state.width - 15, 30);

  // Combo
  if (combo > 1) {
    ctx.fillStyle = '#f80';
    ctx.shadowColor = '#f80';
    ctx.font = 'bold 14px Orbitron';
    ctx.fillText(`x${combo} COMBO`, state.width - 15, 50);
  }

  // Lives
  ctx.shadowBlur = 5;
  ctx.shadowColor = '#f0f';
  ctx.fillStyle = '#f0f';
  ctx.font = '16px Orbitron';
  ctx.textAlign = 'left';
  for (let i = 0; i < player.lives; i++) {
    ctx.fillText('♥', 15 + i * 22, state.height - 20);
  }

  // Shield bar
  if (player.shield > 0) {
    const barWidth = 100;
    const barHeight = 8;
    const barX = 15;
    const barY = state.height - 45;
    
    ctx.fillStyle = '#113';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = '#0af';
    ctx.shadowColor = '#0af';
    ctx.fillRect(barX, barY, barWidth * (player.shield / player.shieldMax), barHeight);
    
    ctx.fillStyle = '#0af';
    ctx.font = '10px Orbitron';
    ctx.fillText('SHIELD', barX, barY - 4);
  }

  // Power level
  ctx.fillStyle = '#f80';
  ctx.shadowColor = '#f80';
  ctx.font = '12px Orbitron';
  ctx.textAlign = 'left';
  const powerText = '▮'.repeat(player.powerLevel) + '▯'.repeat(3 - player.powerLevel);
  ctx.fillText(`PWR ${powerText}`, 15, state.height - 60);

  // Wave incoming text
  if (state.enemies.length === 0 && state.enemiesSpawned >= state.enemiesInWave && state.waveTimer < state.waveDelay) {
    const alpha = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ff0';
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 10;
    ctx.font = 'bold 24px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(`WAVE ${state.wave + 1} INCOMING`, state.width / 2, state.height / 2);
    ctx.globalAlpha = 1;
  }

  ctx.shadowBlur = 0;
}
