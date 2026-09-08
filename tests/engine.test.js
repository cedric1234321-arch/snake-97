import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, DIRECTIONS, placeFood, step, tickDelay, turn } from '../src/engine.js';

test('le serpent avance d’une case', () => {
  const state = createInitialState(() => 0);
  const next = step(state, () => 0);
  assert.deepEqual(next.snake[0], { x: 13, y: 12 });
  assert.equal(next.snake.length, state.snake.length);
});

test('un demi-tour immédiat est refusé', () => {
  const state = createInitialState();
  assert.deepEqual(turn(state, DIRECTIONS.left).nextDirection, DIRECTIONS.right);
});

test('manger fait grandir et augmente le score', () => {
  const state = { ...createInitialState(), food: { x: 13, y: 12 } };
  const next = step(state, () => 0);
  assert.equal(next.snake.length, 5);
  assert.equal(next.score, 100);
  assert.equal(next.eaten, 1);
});

test('toucher un mur termine la partie', () => {
  const state = { ...createInitialState(), snake: [{ x: 23, y: 5 }], direction: DIRECTIONS.right, nextDirection: DIRECTIONS.right };
  assert.equal(step(state).alive, false);
});

test('la nourriture ne se place jamais sur le serpent', () => {
  const snake = [{ x: 0, y: 0 }, { x: 1, y: 0 }];
  assert.deepEqual(placeFood(snake, () => 0), { x: 2, y: 0 });
});

test('la vitesse est plafonnée pour rester jouable', () => {
  assert.equal(tickDelay(1), 150);
  assert.equal(tickDelay(99), 62);
});
