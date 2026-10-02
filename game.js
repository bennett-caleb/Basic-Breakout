const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const coinsElement = document.getElementById('coins');
const levelNumberElement = document.getElementById('levelNumber');
const levelSelect = document.getElementById('levelSelect');
const startButton = document.getElementById('startButton');
const shopButton = document.getElementById('shopButton');
const shopPanel = document.getElementById('shopPanel');
const closeShopButton = document.getElementById('closeShop');
const shopStatus = document.getElementById('shopStatus');
const creditsButton = document.getElementById('creditsButton');
const creditsDialog = document.getElementById('creditsDialog');

const PADDLE_MAX = 320;
const PADDLE_STEP = 32;
const MAX_LIVES = 9;
const MAX_BALLS = 5;
const levels = [
  { name: 'Level 1', rows: 4, columns: 8, speed: 5.2, paddle: 140, colors: ['#67c8bc', '#ed9b67', '#d9df70', '#b9a0e5'] },
  { name: 'Level 2', rows: 5, columns: 8, speed: 6.1, paddle: 120, colors: ['#ea846c', '#e8c365', '#8fc784', '#78c2d0'] },
  { name: 'Level 3', rows: 6, columns: 9, speed: 6.8, paddle: 110, colors: ['#e6bb61', '#e57972', '#83c3a0', '#a995d2'] },
  { name: 'Level 4', rows: 6, columns: 10, speed: 7.3, paddle: 100, colors: ['#d97a71', '#ddae5f', '#73b9a4', '#8cadda'] },
  { name: 'Level 5', rows: 7, columns: 10, speed: 7.8, paddle: 90, colors: ['#d3789a', '#dc9b5b', '#7bb5cf', '#b4c86b'] },
  { name: 'Level 6: Diamond', rows: 8, columns: 10, speed: 8.1, paddle: 100, pattern: 'diamond', colors: ['#e4bd61', '#e57c6c', '#8bc7aa', '#93b7db'] },
  { name: 'Level 7: Wave', rows: 8, columns: 10, speed: 8.4, paddle: 95, pattern: 'wave', colors: ['#d784a1', '#dda962', '#7dbebc', '#b4c87b'] },
  { name: 'Level 8: Crossfire', rows: 8, columns: 10, speed: 8.7, paddle: 90, pattern: 'cross', colors: ['#e28765', '#e3c05d', '#82b7da', '#ab97d2'] },
  { name: 'Level 9: Checkerboard', rows: 8, columns: 10, speed: 9, paddle: 85, pattern: 'checker', colors: ['#7ebc9d', '#e6b25d', '#d77f75', '#92aeda'] },
  { name: 'Level 10: Iron Warden', rows: 9, columns: 11, speed: 9.3, paddle: 80, boss: { name: 'Iron Warden', health: 30, width: 190, speed: 2.8, color: '#e27e62' }, colors: ['#d66e67', '#e5b653', '#72b8a9', '#938ec4'] },
  { name: 'Level 11: Switchback', rows: 9, columns: 11, speed: 9.4, paddle: 105, pattern: 'maze', colors: ['#d98268', '#d7b354', '#7fba9e', '#91add0'] },
  { name: 'Level 12: Twin Peaks', rows: 9, columns: 11, speed: 9.5, paddle: 100, pattern: 'peaks', colors: ['#b985c5', '#e29c5a', '#72bfc0', '#c5c56d'] },
  { name: 'Level 13: Starfall', rows: 9, columns: 11, speed: 9.6, paddle: 100, pattern: 'star', colors: ['#e2c05f', '#dd7a78', '#7eb7d0', '#8fc092'] },
  { name: 'Level 14: Orbit', rows: 9, columns: 11, speed: 9.7, paddle: 95, pattern: 'rings', colors: ['#d67d9c', '#d99f5f', '#75b5a3', '#9296cf'] },
  { name: 'Level 15: Undertow', rows: 9, columns: 11, speed: 9.8, paddle: 95, pattern: 'wave', colors: ['#df8c62', '#ddc15f', '#73b9bb', '#aa94ca'] },
  { name: 'Level 16: Shatter', rows: 9, columns: 11, speed: 9.9, paddle: 90, pattern: 'diamond', colors: ['#d86d6f', '#dba75b', '#7cbd87', '#879dce'] },
  { name: 'Level 17: Checkpoint', rows: 9, columns: 11, speed: 10, paddle: 90, pattern: 'checker', colors: ['#e0b85d', '#d77d91', '#70b8ad', '#a994cf'] },
  { name: 'Level 18: Crossroads', rows: 9, columns: 11, speed: 10.1, paddle: 85, pattern: 'cross', colors: ['#de8062', '#d6c064', '#78aeca', '#9dbb7b'] },
  { name: 'Level 19: Last Stand', rows: 10, columns: 12, speed: 10.2, paddle: 85, pattern: 'fortress', colors: ['#d86d67', '#dfa74f', '#71b29d', '#888fbe'] },
  { name: 'Level 20: The Breaker', rows: 10, columns: 12, speed: 10.5, paddle: 80, boss: { name: 'The Breaker', health: 65, width: 230, speed: 3.6, color: '#ce6282' }, colors: ['#d76f79', '#ddb255', '#70adbb', '#a68cca'] },
];
const upgrades = {
  life: { base: 20, growth: 1.5, count: 0 },
  speed: { base: 35, growth: 1.6, count: 0 },
  strength: { base: 45, growth: 1.65, count: 0 },
  paddle: { base: 30, growth: 1.55, count: 0 },
  multiball: { base: 50, growth: 1.7, count: 0 },
};
const game = {
  score: 0,
  lives: 3,
  coins: 0,
  level: 0,
  unlocked: 0,
  running: false,
  gameOver: false,
  won: false,
  nextLevel: false,
  shopOpen: false,
  resumeAfterShop: false,
  speedLevel: 0,
  strengthLevel: 0,
  paddleLevel: 0,
  multiballLevel: 0,
  bricks: [],
  balls: [],
  boss: null,
  keys: { left: false, right: false },
  paddle: { x: 0, y: 0, width: 140, height: 14, speed: 7 },
};

function limit(value, low, high) {
  return Math.max(low, Math.min(value, high));
}

function costOf(key) {
  const item = upgrades[key];
  return key === 'life' ? item.base : Math.round(item.base * item.growth ** item.count);
}

function updateShop() {
  for (const button of shopPanel.querySelectorAll('[data-upgrade]')) {
    const key = button.dataset.upgrade;
    const price = costOf(key);
    document.getElementById(`${key}Price`).textContent = `${price} coins`;
    button.disabled = game.coins < price || (key === 'life' && game.lives >= MAX_LIVES) || (key === 'multiball' && game.multiballLevel >= MAX_BALLS - 1) || (key === 'paddle' && game.paddle.width >= PADDLE_MAX);
  }
}

function updateHud() {
  scoreElement.textContent = String(game.score);
  livesElement.textContent = String(game.lives);
  coinsElement.textContent = String(game.coins);
  levelNumberElement.textContent = String(game.level + 1);
  updateShop();
}

function updateLevelPicker() {
  levelSelect.replaceChildren();
  levels.forEach((level, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = level.name;
    option.disabled = index > game.unlocked;
    levelSelect.append(option);
  });
  levelSelect.value = String(game.level);
  levelSelect.disabled = game.running || game.nextLevel || game.shopOpen;
}

function setStatus(message) {
  shopStatus.textContent = message;
}

function setStartLabel(label) {
  startButton.textContent = label;
}

function createBall(offset = 0) {
  return {
    x: game.paddle.x + game.paddle.width / 2 + offset,
    y: game.paddle.y - 11,
    radius: 9,
    vx: 0,
    vy: 0,
    speed: levels[game.level].speed + game.speedLevel * 0.65,
    damage: game.strengthLevel + 1,
  };
}

function placeBallsOnPaddle() {
  const count = Math.min(MAX_BALLS, 1 + game.multiballLevel);
  game.balls = Array.from({ length: count }, (_, index) => createBall((index - (count - 1) / 2) * 22));
}

function hasBrick(config, row, column) {
  const centerColumn = (config.columns - 1) / 2;
  const centerRow = (config.rows - 1) / 2;
  if (config.pattern === 'diamond') {
    return Math.abs(column - centerColumn) / (config.columns / 2) + Math.abs(row - centerRow) / (config.rows / 2) <= 1.25;
  }
  if (config.pattern === 'wave') {
    return Math.abs(column - (centerColumn + Math.sin(row * 1.1) * 2.5)) <= 2.2;
  }
  if (config.pattern === 'cross') {
    return Math.abs(column - centerColumn) <= 1 || Math.abs(row - centerRow) <= 1;
  }
  if (config.pattern === 'checker') return (row + column) % 2 === 0;
  if (config.pattern === 'fortress') {
    return row === 0 || row === config.rows - 1 || column === 0 || column === config.columns - 1 || (row === Math.floor(centerRow) && column % 2 === 0);
  }
  if (config.pattern === 'maze') {
    return row === 0 || row === config.rows - 1 || column === 0 || column === config.columns - 1 || (row % 2 === 0 ? column % 4 !== 2 : column % 4 !== 0);
  }
  if (config.pattern === 'peaks') {
    const leftPeak = config.columns * 0.28;
    const rightPeak = config.columns * 0.72;
    const height = (config.rows - row) * 0.65;
    return Math.abs(column - leftPeak) <= height || Math.abs(column - rightPeak) <= height;
  }
  if (config.pattern === 'star') {
    const rowDistance = Math.abs(row - centerRow);
    const columnDistance = Math.abs(column - centerColumn);
    return rowDistance <= 1 || columnDistance <= 1 || Math.abs(rowDistance - columnDistance * 0.8) <= 0.8;
  }
  if (config.pattern === 'rings') {
    const radius = Math.hypot((column - centerColumn) / (config.columns / 2), (row - centerRow) / (config.rows / 2));
    return (radius >= 0.48 && radius <= 0.72) || radius <= 0.2;
  }
  return true;
}

function buildLevel(index) {
  const config = levels[index];
  const gap = 10;
  const margin = 38;
  const brickHeight = 22;
  const brickWidth = (canvas.width - margin * 2 - gap * (config.columns - 1)) / config.columns;
  game.level = index;
  game.paddle.width = Math.min(PADDLE_MAX, config.paddle + game.paddleLevel * PADDLE_STEP);
  game.paddle.y = canvas.height - 34;
  game.paddle.x = (canvas.width - game.paddle.width) / 2;
  game.bricks = [];
  game.boss = config.boss ? {
    ...config.boss,
    x: (canvas.width - config.boss.width) / 2,
    y: 112,
    height: 54,
    direction: 1,
    maxHealth: config.boss.health,
  } : null;

  for (let row = 0; !config.boss && row < config.rows; row += 1) {
    for (let column = 0; column < config.columns; column += 1) {
      if (!hasBrick(config, row, column)) continue;
      game.bricks.push({
        x: margin + column * (brickWidth + gap),
        y: 68 + row * (brickHeight + gap),
        width: brickWidth,
        height: brickHeight,
        health: Math.min(4, 1 + Math.max(0, index - 2)),
        alive: true,
        color: config.colors[row % config.colors.length],
      });
    }
  }

  placeBallsOnPaddle();
  game.running = false;
  game.gameOver = false;
  game.won = false;
  game.nextLevel = false;
  setStartLabel(index === 0 ? 'Start game' : 'Start level');
  updateHud();
  updateLevelPicker();
}

function resetGame() {
  game.score = 0;
  game.lives = 3;
  game.coins = 0;
  game.level = 0;
  game.unlocked = 0;
  game.speedLevel = 0;
  game.strengthLevel = 0;
  game.paddleLevel = 0;
  game.multiballLevel = 0;
  for (const item of Object.values(upgrades)) item.count = 0;
  buildLevel(0);
  setStatus('Earn coins by breaking bricks.');
}

function startOrPause() {
  if (game.shopOpen) return;
  if (game.gameOver || game.won) {
    resetGame();
  } else if (game.nextLevel) {
    buildLevel(game.level + 1);
  }

  if (!game.running) {
    if (game.balls.every((ball) => ball.vx === 0 && ball.vy === 0)) {
      game.balls.forEach((ball, index) => {
        const angle = (index - (game.balls.length - 1) / 2) * 0.22;
        ball.vx = Math.sin(angle) * ball.speed;
        ball.vy = -Math.cos(angle) * ball.speed;
      });
    }
    game.running = true;
    setStartLabel('Pause');
  } else {
    game.running = false;
    setStartLabel('Resume');
  }
  updateLevelPicker();
}

function toggleShop(force) {
  const open = force ?? !game.shopOpen;
  if (open === game.shopOpen) return;
  game.shopOpen = open;
  shopPanel.hidden = !open;
  shopButton.setAttribute('aria-expanded', String(open));
  startButton.disabled = open;

  if (open) {
    game.resumeAfterShop = game.running;
    game.running = false;
    if (game.resumeAfterShop) setStartLabel('Resume');
    setStatus('Lives stay 20 coins. Other upgrades get pricier with each purchase.');
  } else if (game.resumeAfterShop) {
    game.running = true;
    game.resumeAfterShop = false;
    setStartLabel('Pause');
  }
  updateLevelPicker();
}

function buyUpgrade(key) {
  const item = upgrades[key];
  const price = costOf(key);
  if (game.coins < price || (key === 'life' && game.lives >= MAX_LIVES) || (key === 'multiball' && game.multiballLevel >= MAX_BALLS - 1)) return;
  game.coins -= price;
  item.count += 1;

  if (key === 'life') game.lives += 1;
  if (key === 'speed') {
    game.speedLevel += 1;
    for (const ball of game.balls) {
      ball.speed += 0.65;
      const velocity = Math.hypot(ball.vx, ball.vy);
      if (velocity > 0) {
        ball.vx *= ball.speed / velocity;
        ball.vy *= ball.speed / velocity;
      }
    }
  }
  if (key === 'strength') {
    game.strengthLevel += 1;
    for (const ball of game.balls) ball.damage += 1;
  }
  if (key === 'paddle') {
    game.paddleLevel += 1;
    game.paddle.width = Math.min(PADDLE_MAX, game.paddle.width + PADDLE_STEP);
    game.paddle.x = limit(game.paddle.x, 0, canvas.width - game.paddle.width);
  }
  if (key === 'multiball') {
    game.multiballLevel += 1;
    if (game.balls.every((ball) => ball.vx === 0 && ball.vy === 0)) {
      placeBallsOnPaddle();
    } else {
      const source = game.balls[0];
      const angle = game.balls.length % 2 === 0 ? 0.38 : -0.38;
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      game.balls.push({
        ...source,
        x: limit(source.x + angle * 24, source.radius, canvas.width - source.radius),
        vx: source.vx * cosine - source.vy * sine,
        vy: source.vx * sine + source.vy * cosine,
      });
    }
  }

  updateHud();
  const nextPrice = costOf(key);
  setStatus(key === 'life' ? `Extra life added. Lives cost ${nextPrice} coins each.` : `${key[0].toUpperCase()}${key.slice(1)} upgraded. Next cost: ${nextPrice} coins.`);
}

function chooseLevel() {
  const index = Number(levelSelect.value);
  if (game.running || game.shopOpen || index > game.unlocked) return;
  buildLevel(index);
}

function finishLevel() {
  const reward = 50 + game.level * 25;
  game.coins += reward;
  game.running = false;
  if (game.level < levels.length - 1) {
    game.unlocked = Math.max(game.unlocked, game.level + 1);
    game.nextLevel = true;
    setStartLabel('Next level');
    setStatus(`Level clear. +${reward} coins. Shop or continue when ready.`);
  } else {
    game.won = true;
    setStartLabel('Play again');
    setStatus(`All levels clear. Final reward: ${reward} coins.`);
  }
  updateHud();
  updateLevelPicker();
}

function moveBoss() {
  if (!game.boss) return;
  game.boss.x += game.boss.speed * game.boss.direction;
  if (game.boss.x <= 18 || game.boss.x + game.boss.width >= canvas.width - 18) {
    game.boss.direction *= -1;
    game.boss.x = limit(game.boss.x, 18, canvas.width - game.boss.width - 18);
  }
}

function hitBoss(ball, oldX, oldY) {
  const boss = game.boss;
  if (!boss || ball.x + ball.radius < boss.x || ball.x - ball.radius > boss.x + boss.width || ball.y + ball.radius < boss.y || ball.y - ball.radius > boss.y + boss.height) return false;

  boss.health -= ball.damage;
  game.score += 15;
  updateHud();
  if (oldY >= boss.y + boss.height / 2) {
    ball.y = boss.y + boss.height + ball.radius;
    ball.vy = Math.abs(ball.vy);
  } else {
    ball.y = boss.y - ball.radius;
    ball.vy = -Math.abs(ball.vy);
  }
  if (boss.health <= 0) {
    game.coins += 100 + game.level * 10;
    game.score += 250;
    game.boss = null;
    finishLevel();
  }
  return true;
}

function loseBall(ball) {
  game.balls = game.balls.filter((activeBall) => activeBall !== ball);
  if (game.balls.length > 0) return;

  game.lives -= 1;
  game.running = false;
  updateHud();
  if (game.lives <= 0) {
    game.gameOver = true;
    setStartLabel('Restart game');
  } else {
    placeBallsOnPaddle();
    setStartLabel('Continue');
  }
}

function movePaddle() {
  if (game.keys.left) game.paddle.x -= game.paddle.speed;
  if (game.keys.right) game.paddle.x += game.paddle.speed;
  game.paddle.x = limit(game.paddle.x, 0, canvas.width - game.paddle.width);
}

function moveBall(ball) {
  const oldX = ball.x;
  const oldY = ball.y;
  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
    ball.vx *= -1;
    ball.x = limit(ball.x, ball.radius, canvas.width - ball.radius);
  }
  if (ball.y - ball.radius < 0) {
    ball.vy = Math.abs(ball.vy);
    ball.y = ball.radius;
  }
  if (ball.vy > 0 && ball.y + ball.radius >= game.paddle.y && ball.y - ball.radius <= game.paddle.y + game.paddle.height && ball.x >= game.paddle.x && ball.x <= game.paddle.x + game.paddle.width) {
    ball.y = game.paddle.y - ball.radius;
    const impact = (ball.x - (game.paddle.x + game.paddle.width / 2)) / (game.paddle.width / 2);
    const velocity = Math.hypot(ball.vx, ball.vy);
    ball.vx = impact * velocity * 0.9;
    ball.vy = -Math.sqrt(Math.max(1, velocity ** 2 - ball.vx ** 2));
  }
  if (ball.y - ball.radius > canvas.height) {
    loseBall(ball);
    return;
  }

  if (hitBoss(ball, oldX, oldY)) return;

  for (const brick of game.bricks) {
    if (!brick.alive || ball.x + ball.radius < brick.x || ball.x - ball.radius > brick.x + brick.width || ball.y + ball.radius < brick.y || ball.y - ball.radius > brick.y + brick.height) continue;
    brick.health -= ball.damage;
    if (brick.health <= 0) {
      brick.alive = false;
      game.score += 10;
      game.coins += 6 + game.level * 2;
      updateHud();
      if (game.bricks.every((piece) => !piece.alive)) finishLevel();
    }
    if (oldY + ball.radius <= brick.y || oldY - ball.radius >= brick.y + brick.height) ball.vy *= -1;
    else if (oldX + ball.radius <= brick.x || oldX - ball.radius >= brick.x + brick.width) ball.vx *= -1;
    else ball.vy *= -1;
    break;
  }
}

function draw() {
  ctx.fillStyle = '#101b1c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const brick of game.bricks) {
    if (!brick.alive) continue;
    ctx.fillStyle = brick.color;
    ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    ctx.fillStyle = 'rgba(16, 27, 28, 0.24)';
    ctx.fillRect(brick.x, brick.y + brick.height - 4, brick.width, 4);
    if (brick.health > 1) {
      ctx.fillStyle = '#17211d';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(brick.health), brick.x + brick.width / 2, brick.y + 15);
    }
  }

  if (game.boss) {
    const boss = game.boss;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(38, 24, canvas.width - 76, 18);
    ctx.fillStyle = boss.color;
    ctx.fillRect(40, 26, (canvas.width - 80) * (boss.health / boss.maxHealth), 14);
    ctx.fillStyle = '#f1f0e8';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${boss.name}  ${boss.health} / ${boss.maxHealth}`, canvas.width / 2, 19);
    ctx.fillStyle = boss.color;
    ctx.fillRect(boss.x + 16, boss.y + 12, boss.width - 32, boss.height - 12);
    ctx.fillRect(boss.x + 32, boss.y, boss.width - 64, 18);
    ctx.fillStyle = '#f1f0e8';
    ctx.fillRect(boss.x + boss.width * 0.32, boss.y + 28, 10, 10);
    ctx.fillRect(boss.x + boss.width * 0.62, boss.y + 28, 10, 10);
    ctx.fillStyle = '#15201d';
    ctx.fillRect(boss.x + boss.width * 0.32 + 3, boss.y + 31, 4, 4);
    ctx.fillRect(boss.x + boss.width * 0.62 + 3, boss.y + 31, 4, 4);
  }

  ctx.fillStyle = '#d7f36a';
  ctx.fillRect(game.paddle.x, game.paddle.y, game.paddle.width, game.paddle.height);
  ctx.fillStyle = '#f2f0df';
  for (const ball of game.balls) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  if (!game.running) {
    ctx.fillStyle = 'rgba(8, 15, 14, 0.58)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = game.gameOver ? '#f28b6b' : '#f1f0e8';
    ctx.font = 'bold 38px sans-serif';
    const title = game.gameOver ? 'Run over' : game.won ? 'You cleared it!' : game.nextLevel ? 'Level clear' : game.boss ? `Boss fight: ${game.boss.name}` : 'Breakout';
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillStyle = '#d7f36a';
    ctx.font = '16px sans-serif';
    ctx.fillText('Press Space or use the button below', canvas.width / 2, canvas.height / 2 + 24);
  }
}

function frame() {
  if (game.running) {
    movePaddle();
    moveBoss();
    for (const ball of [...game.balls]) {
      if (!game.running) break;
      moveBall(ball);
    }
  }
  draw();
  window.requestAnimationFrame(frame);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'arrowleft' || key === 'a') { game.keys.left = true; event.preventDefault(); }
  if (key === 'arrowright' || key === 'd') { game.keys.right = true; event.preventDefault(); }
  if (event.code === 'Space') { event.preventDefault(); if (!game.shopOpen && !event.repeat) startOrPause(); }
  if (key === 'f' && !event.repeat) { event.preventDefault(); toggleShop(); }
  if (key === 'escape' && game.shopOpen) toggleShop(false);
});
window.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'arrowleft' || key === 'a') game.keys.left = false;
  if (key === 'arrowright' || key === 'd') game.keys.right = false;
});
window.addEventListener('blur', () => { game.keys.left = false; game.keys.right = false; });

canvas.addEventListener('pointermove', (event) => {
  const bounds = canvas.getBoundingClientRect();
  const pointerX = (event.clientX - bounds.left) / bounds.width * canvas.width;
  game.paddle.x = limit(pointerX - game.paddle.width / 2, 0, canvas.width - game.paddle.width);
});
startButton.addEventListener('click', startOrPause);
creditsButton.addEventListener('click', () => creditsDialog.showModal());
shopButton.addEventListener('click', () => toggleShop());
closeShopButton.addEventListener('click', () => toggleShop(false));
shopPanel.querySelectorAll('[data-upgrade]').forEach((button) => {
  button.addEventListener('click', () => buyUpgrade(button.dataset.upgrade));
});
levelSelect.addEventListener('change', chooseLevel);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.running) {
    game.running = false;
    setStartLabel('Resume');
    updateLevelPicker();
  }
});

resetGame();
window.requestAnimationFrame(frame);