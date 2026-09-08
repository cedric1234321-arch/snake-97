const GRID_SIZE = 24;
const DIRECTIONS = Object.freeze({
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
});

function placeFood(snake) {
  const occupied = new Set(snake.map(({ x, y }) => `${x},${y}`));
  const free = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  return free[Math.floor(Math.random() * free.length)] ?? null;
}

function createInitialState() {
  const snake = [{ x: 12, y: 12 }, { x: 11, y: 12 }, { x: 10, y: 12 }, { x: 9, y: 12 }];
  return { snake, food: placeFood(snake), direction: DIRECTIONS.right, nextDirection: DIRECTIONS.right, score: 0, level: 1, eaten: 0, alive: true };
}

function turn(currentState, direction) {
  const current = currentState.direction;
  if (!direction || direction.x + current.x === 0 && direction.y + current.y === 0) return currentState;
  return { ...currentState, nextDirection: direction };
}

function step(currentState) {
  if (!currentState.alive) return currentState;
  const direction = currentState.nextDirection;
  const head = { x: currentState.snake[0].x + direction.x, y: currentState.snake[0].y + direction.y };
  const ate = currentState.food && head.x === currentState.food.x && head.y === currentState.food.y;
  const bodyToCheck = ate ? currentState.snake : currentState.snake.slice(0, -1);
  const hitWall = head.x < 0 || head.y < 0 || head.x >= GRID_SIZE || head.y >= GRID_SIZE;
  const hitSelf = bodyToCheck.some(part => part.x === head.x && part.y === head.y);
  if (hitWall || hitSelf) return { ...currentState, direction, alive: false };
  const snake = [head, ...currentState.snake];
  if (!ate) snake.pop();
  const eaten = currentState.eaten + (ate ? 1 : 0);
  return { ...currentState, snake, food: ate ? placeFood(snake) : currentState.food, direction, score: currentState.score + (ate ? 100 * currentState.level : 0), level: 1 + Math.floor(eaten / 5), eaten };
}

function tickDelay(currentLevel) { return Math.max(62, 150 - (currentLevel - 1) * 11); }

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const scoreEl = document.querySelector('#score');
const levelEl = document.querySelector('#level');
const highScoreEl = document.querySelector('#high-score');
const overlay = document.querySelector('#overlay');
const overlayKicker = document.querySelector('#overlay-kicker');
const overlayTitle = document.querySelector('#overlay-title');
const overlayText = document.querySelector('#overlay-text');
const startButton = document.querySelector('#start-button');
const soundButton = document.querySelector('#sound-button');

const CELL = canvas.width / GRID_SIZE;
const STORAGE_KEY = 'snake97-high-score';
let highScore = Number(localStorage.getItem(STORAGE_KEY)) || 0;
let state = createInitialState();
let status = 'idle';
let lastTick = 0;
let audioContext;
let soundEnabled = true;

const keyMap = {
  ArrowUp: DIRECTIONS.up, z: DIRECTIONS.up, Z: DIRECTIONS.up, w: DIRECTIONS.up, W: DIRECTIONS.up,
  ArrowDown: DIRECTIONS.down, s: DIRECTIONS.down, S: DIRECTIONS.down,
  ArrowLeft: DIRECTIONS.left, q: DIRECTIONS.left, Q: DIRECTIONS.left, a: DIRECTIONS.left, A: DIRECTIONS.left,
  ArrowRight: DIRECTIONS.right, d: DIRECTIONS.right, D: DIRECTIONS.right,
};

function formatScore(value) { return String(value).padStart(5, '0'); }

function beep(frequency, duration = 0.06, type = 'square', volume = 0.035) {
  if (!soundEnabled) return;
  audioContext ??= new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function updateHud() {
  scoreEl.textContent = formatScore(state.score);
  levelEl.textContent = String(state.level).padStart(2, '0');
  highScoreEl.textContent = formatScore(highScore);
}

function showOverlay(kicker, title, text, buttonText) {
  overlayKicker.textContent = kicker;
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  startButton.textContent = buttonText;
  overlay.hidden = false;
}

function startGame() {
  state = createInitialState();
  status = 'playing';
  lastTick = performance.now();
  overlay.hidden = true;
  updateHud();
  beep(220, .05);
  setTimeout(() => beep(330, .05), 60);
  setTimeout(() => beep(440, .08), 120);
}

function togglePause() {
  if (status === 'playing') {
    status = 'paused';
    showOverlay('TEMPS MORT', 'PAUSE', 'Même les légendes soufflent un peu.', 'REPRENDRE');
  } else if (status === 'paused') {
    status = 'playing';
    lastTick = performance.now();
    overlay.hidden = true;
  }
}

function gameOver() {
  status = 'gameover';
  const isNewRecord = state.score > highScore;
  if (isNewRecord) {
    highScore = state.score;
    localStorage.setItem(STORAGE_KEY, String(highScore));
  }
  updateHud();
  beep(150, .18, 'sawtooth', .05);
  setTimeout(() => beep(90, .35, 'sawtooth', .05), 140);
  showOverlay('FIN DE PARTIE', `SCORE ${formatScore(state.score)}`, isNewRecord ? 'Nouveau record ! La borne se souviendra de toi.' : 'Encore une ? Ton record ne va pas se battre tout seul.', 'REJOUER');
}

function drawBlock(x, y, color, inset = 2) {
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL + inset, y * CELL + inset, CELL - inset * 2, CELL - inset * 2);
}

function draw() {
  ctx.fillStyle = '#10180d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(183, 255, 60, .045)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i += 1) {
    ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(canvas.width, i * CELL); ctx.stroke();
  }

  if (state.food) {
    const pulse = 3 + Math.sin(performance.now() / 110) * 1.3;
    drawBlock(state.food.x, state.food.y, '#ff6b2c', pulse);
    ctx.fillStyle = '#fff2a8';
    ctx.fillRect(state.food.x * CELL + 8, state.food.y * CELL + 6, 5, 5);
  }

  state.snake.forEach((part, index) => {
    drawBlock(part.x, part.y, index === 0 ? '#d9ff6c' : index % 2 ? '#8ed143' : '#6eb538', 1.5);
    if (index === 0) {
      ctx.fillStyle = '#10180d';
      const horizontal = state.direction.x !== 0;
      const eyes = horizontal ? [[8, 6], [8, 15]] : [[6, 8], [15, 8]];
      eyes.forEach(([ex, ey]) => ctx.fillRect(part.x * CELL + ex, part.y * CELL + ey, 4, 4));
    }
  });
}

function loop(now) {
  if (status === 'playing' && now - lastTick >= tickDelay(state.level)) {
    const oldScore = state.score;
    state = step(state);
    lastTick = now;
    if (state.score > oldScore) beep(520 + state.level * 25, .07, 'square', .045);
    if (!state.alive) gameOver();
    updateHud();
  }
  draw();
  requestAnimationFrame(loop);
}

document.addEventListener('keydown', event => {
  if (keyMap[event.key]) {
    event.preventDefault();
    if (status === 'idle' || status === 'gameover') startGame();
    state = turn(state, keyMap[event.key]);
  } else if (event.code === 'Space') {
    event.preventDefault();
    togglePause();
  } else if (event.key === 'Enter') {
    status === 'paused' ? togglePause() : startGame();
  } else if (event.key.toLowerCase() === 'r') {
    startGame();
  } else if (event.key.toLowerCase() === 'm') {
    toggleSound();
  }
});

function toggleSound() {
  soundEnabled = !soundEnabled;
  soundButton.querySelector('span').textContent = soundEnabled ? 'ON' : 'OFF';
  soundButton.setAttribute('aria-label', soundEnabled ? 'Couper le son' : 'Activer le son');
  if (soundEnabled) beep(440, .06);
}

startButton.addEventListener('click', () => status === 'paused' ? togglePause() : startGame());
soundButton.addEventListener('click', toggleSound);
document.addEventListener('visibilitychange', () => { if (document.hidden && status === 'playing') togglePause(); });

updateHud();
draw();
requestAnimationFrame(loop);
