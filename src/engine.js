export const GRID_SIZE = 24;

export const DIRECTIONS = Object.freeze({
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
});

export function createInitialState(random = Math.random) {
  const snake = [
    { x: 12, y: 12 },
    { x: 11, y: 12 },
    { x: 10, y: 12 },
    { x: 9, y: 12 },
  ];
  return {
    snake,
    food: placeFood(snake, random),
    direction: DIRECTIONS.right,
    nextDirection: DIRECTIONS.right,
    score: 0,
    level: 1,
    eaten: 0,
    alive: true,
  };
}

export function isOpposite(a, b) {
  return a.x + b.x === 0 && a.y + b.y === 0;
}

export function turn(state, direction) {
  if (!direction || isOpposite(direction, state.direction)) return state;
  return { ...state, nextDirection: direction };
}

export function placeFood(snake, random = Math.random) {
  const occupied = new Set(snake.map(({ x, y }) => `${x},${y}`));
  const free = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  return free[Math.floor(random() * free.length)] ?? null;
}

export function step(state, random = Math.random) {
  if (!state.alive) return state;
  const direction = state.nextDirection;
  const head = {
    x: state.snake[0].x + direction.x,
    y: state.snake[0].y + direction.y,
  };
  const ate = state.food && head.x === state.food.x && head.y === state.food.y;
  const bodyToCheck = ate ? state.snake : state.snake.slice(0, -1);
  const hitWall = head.x < 0 || head.y < 0 || head.x >= GRID_SIZE || head.y >= GRID_SIZE;
  const hitSelf = bodyToCheck.some(part => part.x === head.x && part.y === head.y);
  if (hitWall || hitSelf) return { ...state, direction, alive: false };

  const snake = [head, ...state.snake];
  if (!ate) snake.pop();
  const eaten = state.eaten + (ate ? 1 : 0);
  return {
    ...state,
    snake,
    food: ate ? placeFood(snake, random) : state.food,
    direction,
    score: state.score + (ate ? 100 * state.level : 0),
    level: 1 + Math.floor(eaten / 5),
    eaten,
  };
}

export function tickDelay(level) {
  return Math.max(62, 150 - (level - 1) * 11);
}
