import assert from "node:assert/strict";
import {
  createGameState,
  jump,
  renderGameToText,
  startGame,
  stepGame,
} from "../src/game-core.js";

function stepFor(state, seconds) {
  const dt = 1 / 60;
  const steps = Math.round(seconds / dt);
  for (let i = 0; i < steps; i += 1) stepGame(state, dt);
}

const state = createGameState({ seed: 1234 });
assert.equal(state.mode, "title");

startGame(state);
assert.equal(state.mode, "playing");

const initialY = state.player.y;
assert.equal(jump(state), true);
stepFor(state, 0.18);
assert.ok(state.player.y < initialY, "jump should move the bunny upward");
assert.equal(jump(state), true, "double jump should be available");

stepFor(state, 2.4);
assert.ok(state.obstacles.length > 0, "runner should spawn obstacles");
assert.ok(state.collectibles.length > 0 || state.carrots > 0, "runner should spawn carrots");
assert.ok(state.score > 0, "score should increase while running");

state.obstacles.push({
  type: "crate",
  x: state.player.x + 8,
  y: state.groundY - 48,
  w: 50,
  h: 48,
});
state.player.y = state.groundY - state.player.h;
stepGame(state, 1 / 60);
assert.equal(state.mode, "gameover", "collision should end the run");

const text = JSON.parse(renderGameToText(state));
assert.equal(text.coordinateSystem, "origin top-left, x right, y down");
assert.equal(text.mode, "gameover");
assert.ok(Number.isInteger(text.score));

console.log("core smoke test passed");

