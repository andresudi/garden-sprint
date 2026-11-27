const WIDTH = 960;
const HEIGHT = 540;
const GROUND_Y = 422;
const PLAYER_X = 170;

function makeRng(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function createGameState(options = {}) {
  const seed = Number.isFinite(options.seed) ? options.seed : 7461;
  return {
    width: WIDTH,
    height: HEIGHT,
    groundY: GROUND_Y,
    mode: "title",
    elapsed: 0,
    distance: 0,
    score: 0,
    carrots: 0,
    bestScore: 0,
    speed: 310,
    gravity: 2200,
    spawnTimer: 0.9,
    carrotTimer: 0.55,
    carrotWave: 0,
    rng: makeRng(seed),
    seed,
    player: {
      x: PLAYER_X,
      y: GROUND_Y - 72,
      w: 58,
      h: 72,
      vy: 0,
      jumpsUsed: 0,
      maxJumps: 2,
      grounded: true,
      squash: 0,
    },
    obstacles: [],
    collectibles: [],
    particles: [],
    message: "",
  };
}

export function startGame(state) {
  restartGame(state);
  state.mode = "playing";
}

export function restartGame(state) {
  const bestScore = state.bestScore || 0;
  const seed = state.seed;
  Object.assign(state, createGameState({ seed }));
  state.bestScore = bestScore;
  state.mode = "playing";
}

export function setPaused(state, paused) {
  if (state.mode === "playing" && paused) state.mode = "paused";
  else if (state.mode === "paused" && !paused) state.mode = "playing";
}

export function jump(state) {
  if (state.mode === "title") {
    startGame(state);
    return true;
  }
  if (state.mode === "gameover") {
    restartGame(state);
    return true;
  }
  if (state.mode !== "playing") return false;
  const p = state.player;
  if (p.grounded || p.jumpsUsed < p.maxJumps) {
    p.vy = p.grounded ? -760 : -650;
    p.grounded = false;
    p.jumpsUsed += 1;
    p.squash = 1;
    burst(state, p.x + p.w * 0.5, GROUND_Y - 10, "#fff5c8", 4);
    return true;
  }
  return false;
}

function spawnObstacle(state) {
  const roll = state.rng();
  const tall = roll > 0.62;
  state.obstacles.push({
    type: tall ? "fence" : "crate",
    x: WIDTH + 40,
    y: tall ? GROUND_Y - 72 : GROUND_Y - 48,
    w: tall ? 36 : 50,
    h: tall ? 72 : 48,
  });
}

function spawnCarrot(state) {
  const wave = state.carrotWave++ % 7;
  const high = wave === 2 || wave === 3;
  state.collectibles.push({
    x: WIDTH + 28,
    y: GROUND_Y - (high ? 168 : 104 + wave * 4),
    w: 30,
    h: 42,
    bob: state.rng() * Math.PI * 2,
    collected: false,
  });
}

function burst(state, x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = state.rng() * Math.PI * 2;
    const power = 60 + state.rng() * 120;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * power,
      vy: Math.sin(angle) * power - 40,
      life: 0.34 + state.rng() * 0.25,
      maxLife: 0.6,
      color,
    });
  }
}

function updatePlayer(state, dt) {
  const p = state.player;
  p.vy += state.gravity * dt;
  p.y += p.vy * dt;
  p.squash = Math.max(0, p.squash - dt * 4);
  const floorY = GROUND_Y - p.h;
  if (p.y >= floorY) {
    if (!p.grounded && p.vy > 500) burst(state, p.x + p.w * 0.5, GROUND_Y - 8, "#d8bf75", 6);
    p.y = floorY;
    p.vy = 0;
    p.grounded = true;
    p.jumpsUsed = 0;
  } else {
    p.grounded = false;
  }
}

function updateCollections(state) {
  const p = state.player;
  const playerBox = {
    x: p.x + 8,
    y: p.y + 8,
    w: p.w - 16,
    h: p.h - 12,
  };

  for (const carrot of state.collectibles) {
    if (!carrot.collected && overlap(playerBox, carrot)) {
      carrot.collected = true;
      state.carrots += 1;
      state.score += 75;
      burst(state, carrot.x + carrot.w * 0.5, carrot.y + carrot.h * 0.5, "#ffb13b", 8);
    }
  }
  state.collectibles = state.collectibles.filter((carrot) => !carrot.collected && carrot.x > -80);
}

function updateCollisions(state) {
  const p = state.player;
  const playerBox = {
    x: p.x + 12,
    y: p.y + 12,
    w: p.w - 22,
    h: p.h - 18,
  };
  for (const obstacle of state.obstacles) {
    const obstacleBox = {
      x: obstacle.x + 5,
      y: obstacle.y + 8,
      w: obstacle.w - 10,
      h: obstacle.h - 8,
    };
    if (overlap(playerBox, obstacleBox)) {
      state.mode = "gameover";
      state.message = "Garden dash ended";
      state.bestScore = Math.max(state.bestScore, Math.floor(state.score));
      burst(state, p.x + p.w * 0.5, p.y + p.h * 0.5, "#f07c62", 12);
      return;
    }
  }
}

export function stepGame(state, dt) {
  if (state.mode !== "playing") {
    updateParticles(state, dt);
    return;
  }

  state.elapsed += dt;
  state.speed = Math.min(530, 310 + state.elapsed * 8);
  state.distance += state.speed * dt * 0.08;
  state.score = Math.floor(state.distance) + state.carrots * 75;

  state.spawnTimer -= dt;
  state.carrotTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnObstacle(state);
    state.spawnTimer = 1.05 + state.rng() * 0.85 - Math.min(0.32, state.elapsed * 0.006);
  }
  if (state.carrotTimer <= 0) {
    spawnCarrot(state);
    state.carrotTimer = 0.72 + state.rng() * 0.48;
  }

  updatePlayer(state, dt);

  for (const obstacle of state.obstacles) obstacle.x -= state.speed * dt;
  for (const carrot of state.collectibles) {
    carrot.x -= state.speed * dt;
    carrot.bob += dt * 6;
  }

  state.obstacles = state.obstacles.filter((obstacle) => obstacle.x > -90);
  updateCollections(state);
  updateCollisions(state);
  updateParticles(state, dt);
}

function updateParticles(state, dt) {
  for (const particle of state.particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 360 * dt;
  }
  state.particles = state.particles.filter((particle) => particle.life > 0);
}

export function renderGameToText(state) {
  const p = state.player;
  return JSON.stringify({
    coordinateSystem: "origin top-left, x right, y down",
    mode: state.mode,
    score: Math.floor(state.score),
    bestScore: state.bestScore,
    carrots: state.carrots,
    speed: Math.round(state.speed),
    player: {
      x: Math.round(p.x),
      y: Math.round(p.y),
      vy: Math.round(p.vy),
      grounded: p.grounded,
      jumpsUsed: p.jumpsUsed,
    },
    obstacles: state.obstacles.slice(0, 4).map((o) => ({
      type: o.type,
      x: Math.round(o.x),
      y: Math.round(o.y),
      w: o.w,
      h: o.h,
    })),
    carrotsVisible: state.collectibles.slice(0, 5).map((c) => ({
      x: Math.round(c.x),
      y: Math.round(c.y + Math.sin(c.bob) * 5),
    })),
  });
}

