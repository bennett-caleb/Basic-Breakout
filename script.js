const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const coinsEl = document.getElementById('coins');
const startButton = document.getElementById('startButton');
const levelSelect = document.getElementById('levelSelect');
const buyBallButton = document.getElementById('buyBallButton');
const shopStatus = document.getElementById('shopStatus');

const MAX_LIVES = 9;
const BALL_COST = 25;

const LEVELS = [
  {
    name: 'Level 1',
    rows: 4,
    cols: 8,
    ballSpeed: 5.2,
    paddleWidth: 140,
    palette: ['#60a5fa', '#7dd3fc', '#a78bfa', '#f472b6'],
  },
  {
    name: 'Level 2',
    rows: 5,
    cols: 8,
    ballSpeed: 6.1,
    paddleWidth: 120,
    palette: ['#34d399', '#2dd4bf', '#fbbf24', '#f97316'],
  },
  {
    name: 'Level 3',
    rows: 6,
    cols: 9,
    ballSpeed: 6.8,
    paddleWidth: 110,
    palette: ['#facc15', '#fb7185', '#c084fc', '#38bdf8'],
  },
];

const state = {
  score: 0,
  lives: 3,
  coins: 0,
  currentLevel: 0,
  selectedLevel: 0,
  unlockedLevel: 0,
  running: false,
  isGameOver: false,
  isWin: false,
  levelQueued: false,
  bricks: [],
  paddle: {
    width: 140,
    height: 14,
    x: 0,
    y: canvas.height - 30,
    speed: 7,
  },
  ball: {
    x: canvas.width / 2,
    y: canvas.height - 40,
    radius: 10,
    vx: 0,
    vy: 0,
    speed: 5,
  },
  keys: {
    left: false,
    right: false,
  },
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateHud() {
  scoreEl.textContent = String(state.score);
  livesEl.textContent = String(state.lives);
  coinsEl.textContent = String(state.coins);
  buyBallButton.disabled = state.coins < BALL_COST || state.lives >= MAX_LIVES;
}

function updateLevelOptions() {
  levelSelect.replaceChildren();

  LEVELS.forEach((level, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `${level.name} - ${level.rows} rows`;
    option.disabled = index > state.unlockedLevel;
    levelSelect.append(option);
  });

  levelSelect.value = String(state.selectedLevel);
  levelSelect.disabled = state.running || state.levelQueued;
}

function setShopStatus(message) {
  shopStatus.textContent = message;
}

function setButtonLabel(label) {
  startButton.textContent = label;
}

function resetBall() {
  const direction = Math.random() > 0.5 ? 1 : -1;
  state.ball.x = state.paddle.x + state.paddle.width / 2;
  state.ball.y = state.paddle.y - state.ball.radius - 2;
  state.ball.vx = direction * state.ball.speed;
  state.ball.vy = -state.ball.speed;
}

function buildLevel(levelIndex) {
  const config = LEVELS[levelIndex];
  const rows = config.rows;
  const cols = config.cols;
  const gap = 12;
  const topOffset = 72;
  const leftOffset = 40;
  const availableWidth = canvas.width - leftOffset * 2;
  const brickWidth = (availableWidth - gap * (cols - 1)) / cols;
  const brickHeight = 24;

  state.currentLevel = levelIndex;
  state.paddle.width = config.paddleWidth;
  state.paddle.x = (canvas.width - state.paddle.width) / 2;
  state.ball.speed = config.ballSpeed;
  state.bricks = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      state.bricks.push({
        x: leftOffset + col * (brickWidth + gap),
        y: topOffset + row * (brickHeight + gap),
        width: brickWidth,
        height: brickHeight,
        alive: true,
        color: config.palette[row % config.palette.length],
      });
    }
  }

  state.ball.vx = 0;
  state.ball.vy = 0;
  state.ball.x = state.paddle.x + state.paddle.width / 2;
  state.ball.y = state.paddle.y - state.ball.radius - 2;
  state.running = false;
  state.isGameOver = false;
  state.isWin = false;
  state.levelQueued = false;
  setButtonLabel(levelIndex === 0 ? 'Start Game' : 'Start Level');
  updateLevelOptions();
  updateHud();
  setShopStatus('Buy extra balls between runs or after clearing a level.');
}

function resetGame() {
  state.score = 0;
  state.lives = 3;
  state.coins = 0;
  state.currentLevel = 0;
  state.selectedLevel = 0;
  state.isGameOver = false;
  state.isWin = false;
  state.levelQueued = false;
  buildLevel(0);
}

function toggleRunning() {
  if (state.isGameOver) {
    resetGame();
    return;
  }

  if (state.isWin) {
    resetGame();
    return;
  }

  if (state.levelQueued) {
    state.currentLevel += 1;
    buildLevel(state.currentLevel);
    return;
  }

  if (!state.running) {
    if (state.ball.vx === 0 && state.ball.vy === 0) {
      resetBall();
    }
    state.running = true;
    setButtonLabel('Pause');
    return;
  }

  state.running = false;
  setButtonLabel('Resume');
}

function buyExtraBall() {
  if (state.lives >= MAX_LIVES) {
    setShopStatus(`You can carry up to ${MAX_LIVES} balls.`);
    return;
  }

  if (state.coins < BALL_COST) {
    setShopStatus(`You need ${BALL_COST - state.coins} more coins.`);
    return;
  }

  state.coins -= BALL_COST;
  state.lives += 1;
  updateHud();
  setShopStatus('Extra ball added.');
}

function selectLevel() {
  const selectedLevel = Number(levelSelect.value);
  if (selectedLevel > state.unlockedLevel || state.running) {
    return;
  }

  state.selectedLevel = selectedLevel;
  buildLevel(selectedLevel);
}

function advanceToNextLevel() {
  const reward = 50 + state.currentLevel * 25;
  state.coins += reward;

  if (state.currentLevel < LEVELS.length - 1) {
    state.unlockedLevel = Math.max(state.unlockedLevel, state.currentLevel + 1);
    state.levelQueued = true;
    state.running = false;
    setButtonLabel('Next Level');
    setShopStatus(`Level reward: +${reward} coins. Spend them before the next level.`);
  } else {
    state.running = false;
    state.isWin = true;
    setButtonLabel('Play Again');
    setShopStatus(`Final level reward: +${reward} coins.`);
  }
  updateLevelOptions();
  updateHud();
}

function handleMiss() {
  state.lives -= 1;
  updateHud();

  if (state.lives <= 0) {
    state.running = false;
    state.isGameOver = true;
    setButtonLabel('Restart Game');
    return;
  }

  state.running = false;
  resetBall();
  setButtonLabel('Continue');
  updateLevelOptions();
}

function updatePaddle() {
  if (state.keys.left) {
    state.paddle.x -= state.paddle.speed;
  }

  if (state.keys.right) {
    state.paddle.x += state.paddle.speed;
  }

  state.paddle.x = clamp(state.paddle.x, 0, canvas.width - state.paddle.width);
}

function updateBall() {
  const ball = state.ball;
  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= canvas.width) {
    ball.vx *= -1;
    ball.x = clamp(ball.x, ball.radius, canvas.width - ball.radius);
  }

  if (ball.y - ball.radius <= 0) {
    ball.vy *= -1;
    ball.y = ball.radius;
  }

  if (
    ball.y + ball.radius >= state.paddle.y &&
    ball.y - ball.radius <= state.paddle.y + state.paddle.height &&
    ball.x >= state.paddle.x &&
    ball.x <= state.paddle.x + state.paddle.width &&
    ball.vy > 0
  ) {
    ball.y = state.paddle.y - ball.radius;
    const impact = (ball.x - (state.paddle.x + state.paddle.width / 2)) / (state.paddle.width / 2);
    const speed = Math.hypot(ball.vx, ball.vy) || ball.speed;
    ball.vx = impact * speed;
    ball.vy = -Math.abs(ball.vy);
  }

  if (ball.y - ball.radius > canvas.height) {
    handleMiss();
    return;
  }

  for (const brick of state.bricks) {
    if (!brick.alive) {
      continue;
    }

    const touchingBrick =
      ball.x + ball.radius >= brick.x &&
      ball.x - ball.radius <= brick.x + brick.width &&
      ball.y + ball.radius >= brick.y &&
      ball.y - ball.radius <= brick.y + brick.height;

    if (!touchingBrick) {
      continue;
    }

    brick.alive = false;
    state.score += 10;
    state.coins += 2 + state.currentLevel * 2;
    updateHud();

    const overlapLeft = ball.x + ball.radius - brick.x;
    const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
    const overlapTop = ball.y + ball.radius - brick.y;
    const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);
    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

    if (minOverlap === overlapLeft || minOverlap === overlapRight) {
      ball.vx *= -1;
    } else {
      ball.vy *= -1;
    }

    const allBricksCleared = state.bricks.every((item) => !item.alive);
    if (allBricksCleared) {
      advanceToNextLevel();
    }
    break;
  }
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const backgroundGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  backgroundGradient.addColorStop(0, '#0b1728');
  backgroundGradient.addColorStop(1, '#12263f');
  ctx.fillStyle = backgroundGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(125, 211, 252, 0.12)';
  for (let i = 0; i < 60; i += 1) {
    const x = (i * 53) % canvas.width;
    const y = (i * 41) % canvas.height;
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawPaddle() {
  ctx.fillStyle = '#5eead4';
  ctx.shadowColor = 'rgba(94, 234, 212, 0.7)';
  ctx.shadowBlur = 14;
  ctx.fillRect(state.paddle.x, state.paddle.y, state.paddle.width, state.paddle.height);
  ctx.shadowBlur = 0;
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#f8fafc';
  ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.closePath();
}

function drawBricks() {
  for (const brick of state.bricks) {
    if (!brick.alive) {
      continue;
    }

    ctx.fillStyle = brick.color;
    ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
  }
}

function drawOverlay() {
  const showDefault = !state.running && !state.isGameOver && !state.isWin && !state.levelQueued;
  if (showDefault) {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'center';
    ctx.font = '700 42px Segoe UI';
    ctx.fillText('Breakout', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '600 18px Segoe UI';
    ctx.fillText('Press Start or Space', canvas.width / 2, canvas.height / 2 + 30);
  }

  if (state.isGameOver) {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f87171';
    ctx.textAlign = 'center';
    ctx.font = '700 46px Segoe UI';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }

  if (state.isWin) {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#5eead4';
    ctx.textAlign = 'center';
    ctx.font = '700 46px Segoe UI';
    ctx.fillText('You Win!', canvas.width / 2, canvas.height / 2);
  }

  if (state.levelQueued) {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.58)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.font = '700 38px Segoe UI';
    ctx.fillText('Level Cleared', canvas.width / 2, canvas.height / 2 - 12);
    ctx.font = '600 18px Segoe UI';
    ctx.fillText('Ready for the next challenge', canvas.width / 2, canvas.height / 2 + 24);
  }
}

function draw() {
  drawBackground();
  drawBricks();
  drawPaddle();
  drawBall();
  drawOverlay();
}

function update() {
  if (state.running) {
    updatePaddle();
    updateBall();
  }

  draw();
  window.requestAnimationFrame(update);
}

function handleKey(event, isDown) {
  const key = (event.key || '').toLowerCase();
  const code = event.code || '';

  if (key === 'arrowleft' || key === 'a') {
    state.keys.left = isDown;
  }

  if (key === 'arrowright' || key === 'd') {
    state.keys.right = isDown;
  }

  if (code === 'Space' && isDown) {
    event.preventDefault();
    toggleRunning();
  }

  if (key === 'e' && isDown) {
    event.preventDefault();
    buyExtraBall();
  }
}

window.addEventListener('keydown', (event) => handleKey(event, true));
window.addEventListener('keyup', (event) => handleKey(event, false));

canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  const pointerX = ((event.clientX - rect.left) / rect.width) * canvas.width;
  state.paddle.x = clamp(pointerX - state.paddle.width / 2, 0, canvas.width - state.paddle.width);
});

canvas.addEventListener('touchmove', (event) => {
  const touch = event.touches[0];
  if (!touch) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const pointerX = ((touch.clientX - rect.left) / rect.width) * canvas.width;
  state.paddle.x = clamp(pointerX - state.paddle.width / 2, 0, canvas.width - state.paddle.width);
  event.preventDefault();
}, { passive: false });

document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.running) {
    state.running = false;
    setButtonLabel('Resume');
  }
});

startButton.addEventListener('click', () => {
  toggleRunning();
});

buyBallButton.addEventListener('click', buyExtraBall);
levelSelect.addEventListener('change', selectLevel);

resetGame();
window.requestAnimationFrame(update);
