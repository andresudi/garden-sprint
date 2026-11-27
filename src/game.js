import {
  createGameState,
  jump,
  renderGameToText,
  restartGame,
  setPaused,
  startGame,
  stepGame,
} from "./game-core.js";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const menu = document.querySelector("#menu");
const menuCopy = document.querySelector("#menu-copy");
const startBtn = document.querySelector("#start-btn");
const restartBtn = document.querySelector("#restart-btn");
const params = new URLSearchParams(window.location.search);
const state = createGameState({ seed: Number(params.get("seed")) || 7461 });

let lastTime = performance.now();
let accumulator = 0;
const fixedDt = 1 / 60;

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(320, Math.round(rect.width * ratio));
  const height = Math.max(180, Math.round(rect.height * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function withLogicalScale(fn) {
  const scaleX = canvas.width / state.width;
  const scaleY = canvas.height / state.height;
  ctx.save();
  ctx.scale(scaleX, scaleY);
  fn();
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, state.height);
  sky.addColorStop(0, "#bfeaf6");
  sky.addColorStop(0.55, "#f9f3c5");
  sky.addColorStop(1, "#dcedb6");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, state.width, state.height);

  drawCloud(116, 84, 1.05);
  drawCloud(410, 64, 0.78);
  drawCloud(760, 104, 0.92);

  ctx.fillStyle = "#8ccf75";
  ctx.beginPath();
  ctx.moveTo(0, 338);
  ctx.bezierCurveTo(140, 296, 250, 324, 390, 286);
  ctx.bezierCurveTo(570, 242, 740, 324, 960, 268);
  ctx.lineTo(960, state.height);
  ctx.lineTo(0, state.height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#77bd68";
  ctx.beginPath();
  ctx.moveTo(0, 374);
  ctx.bezierCurveTo(180, 330, 250, 388, 430, 336);
  ctx.bezierCurveTo(610, 288, 740, 384, 960, 328);
  ctx.lineTo(960, state.height);
  ctx.lineTo(0, state.height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#7fbd56";
  ctx.fillRect(0, state.groundY, state.width, state.height - state.groundY);

  ctx.strokeStyle = "rgba(81, 122, 55, 0.35)";
  ctx.lineWidth = 2;
  for (let i = -80; i < state.width + 80; i += 54) {
    const offset = (state.elapsed * state.speed * 0.14) % 54;
    ctx.beginPath();
    ctx.moveTo(i - offset, state.groundY + 22);
    ctx.lineTo(i - offset + 44, state.height);
    ctx.stroke();
  }

  ctx.fillStyle = "#5b9f48";
  ctx.fillRect(0, state.groundY, state.width, 10);

  for (let x = 44; x < state.width; x += 108) {
    drawFlower((x - (state.elapsed * 52) % 108 + 108) % 1080 - 60, state.groundY + 34, x % 3);
  }
}

function drawCloud(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
  ctx.beginPath();
  ctx.arc(0, 16, 22, 0, Math.PI * 2);
  ctx.arc(24, 4, 30, 0, Math.PI * 2);
  ctx.arc(56, 18, 24, 0, Math.PI * 2);
  ctx.fillRect(-2, 16, 70, 26);
  ctx.fill();
  ctx.restore();
}

function drawFlower(x, y, variant) {
  const colors = ["#ffcf4d", "#f08ca8", "#f28a41"];
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#3e7c3d";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 18);
  ctx.lineTo(0, 3);
  ctx.stroke();
  ctx.fillStyle = colors[variant];
  for (let i = 0; i < 5; i += 1) {
    const angle = (Math.PI * 2 * i) / 5;
    ctx.beginPath();
    ctx.ellipse(Math.cos(angle) * 5, Math.sin(angle) * 5, 4, 7, angle, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#ffe889";
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBunny() {
  const p = state.player;
  const stretch = p.squash * 0.08;
  ctx.save();
  ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
  ctx.scale(1 + stretch, 1 - stretch);
  ctx.translate(-p.w / 2, -p.h / 2);

  ctx.fillStyle = "#fff9ef";
  ctx.strokeStyle = "#5d594f";
  ctx.lineWidth = 3;

  ctx.save();
  ctx.rotate(-0.18);
  roundRect(15, -22, 15, 48, 9);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f5b7c7";
  roundRect(19, -15, 7, 34, 5);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.rotate(0.14);
  roundRect(35, -24, 15, 50, 9);
  ctx.fillStyle = "#fff9ef";
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f5b7c7";
  roundRect(39, -16, 7, 36, 5);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#fff9ef";
  roundRect(4, 18, 49, 45, 24);
  ctx.fill();
  ctx.stroke();
  roundRect(12, 2, 42, 42, 22);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#5d594f";
  ctx.beginPath();
  ctx.arc(38, 20, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ec8da3";
  ctx.beginPath();
  ctx.arc(49, 27, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#5d594f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(46, 23);
  ctx.quadraticCurveTo(52, 25, 55, 21);
  ctx.stroke();

  ctx.fillStyle = "#f7e4d2";
  ctx.beginPath();
  ctx.arc(5, 44, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawCarrot(carrot) {
  const y = carrot.y + Math.sin(carrot.bob) * 5;
  ctx.save();
  ctx.translate(carrot.x + carrot.w / 2, y + carrot.h / 2);
  ctx.rotate(0.18);
  ctx.fillStyle = "#f47b2f";
  ctx.strokeStyle = "#8d4c24";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-10, -8);
  ctx.quadraticCurveTo(0, 26, 10, -8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 245, 200, 0.55)";
  ctx.beginPath();
  ctx.moveTo(-3, -2);
  ctx.lineTo(4, 10);
  ctx.stroke();
  ctx.fillStyle = "#4d9a44";
  ctx.beginPath();
  ctx.ellipse(-6, -14, 5, 13, -0.75, 0, Math.PI * 2);
  ctx.ellipse(2, -16, 5, 14, 0.15, 0, Math.PI * 2);
  ctx.ellipse(9, -12, 5, 12, 0.75, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawObstacle(obstacle) {
  if (obstacle.type === "fence") drawFence(obstacle);
  else drawCrate(obstacle);
}

function drawFence(obstacle) {
  ctx.save();
  ctx.translate(obstacle.x, obstacle.y);
  ctx.fillStyle = "#d2a96f";
  ctx.strokeStyle = "#76543a";
  ctx.lineWidth = 3;
  for (let i = 0; i < 2; i += 1) {
    roundRect(i * 18, 0, 14, obstacle.h, 4);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillRect(-6, 19, obstacle.w + 12, 12);
  ctx.strokeRect(-6, 19, obstacle.w + 12, 12);
  ctx.fillRect(-6, 43, obstacle.w + 12, 12);
  ctx.strokeRect(-6, 43, obstacle.w + 12, 12);
  ctx.restore();
}

function drawCrate(obstacle) {
  ctx.save();
  ctx.translate(obstacle.x, obstacle.y);
  ctx.fillStyle = "#b98255";
  ctx.strokeStyle = "#6e4b35";
  ctx.lineWidth = 3;
  roundRect(0, 0, obstacle.w, obstacle.h, 7);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(9, 10);
  ctx.lineTo(obstacle.w - 9, obstacle.h - 10);
  ctx.moveTo(obstacle.w - 9, 10);
  ctx.lineTo(9, obstacle.h - 10);
  ctx.stroke();
  ctx.restore();
}

function drawParticles() {
  for (const particle of state.particles) {
    const alpha = Math.max(0, particle.life / particle.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 4 + alpha * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawHud() {
  ctx.save();
  ctx.fillStyle = "rgba(255, 250, 235, 0.86)";
  roundRect(22, 20, 218, 72, 8);
  ctx.fill();
  ctx.fillStyle = "#33472f";
  ctx.font = "800 24px Inter, system-ui, sans-serif";
  ctx.fillText(`${Math.floor(state.score).toString().padStart(4, "0")}`, 40, 52);
  ctx.font = "700 18px Inter, system-ui, sans-serif";
  ctx.fillText(`Carrots ${state.carrots}`, 40, 78);
  ctx.restore();

  if (state.mode === "paused") {
    ctx.save();
    ctx.fillStyle = "rgba(49, 54, 40, 0.44)";
    ctx.fillRect(0, 0, state.width, state.height);
    ctx.fillStyle = "#fff7df";
    ctx.font = "800 48px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Paused", state.width / 2, state.height / 2);
    ctx.restore();
  }
}

function render() {
  resizeCanvas();
  withLogicalScale(() => {
    drawBackground();
    for (const carrot of state.collectibles) drawCarrot(carrot);
    for (const obstacle of state.obstacles) drawObstacle(obstacle);
    drawBunny();
    drawParticles();
    drawHud();
  });
  syncMenu();
}

function syncMenu() {
  const shouldShow = state.mode === "title" || state.mode === "gameover";
  menu.hidden = !shouldShow;
  startBtn.hidden = state.mode !== "title";
  restartBtn.hidden = state.mode !== "gameover";
  if (state.mode === "gameover") {
    menuCopy.textContent = `Score ${Math.floor(state.score)} | Best ${state.bestScore}`;
  } else {
    menuCopy.textContent = "Hop through the garden and scoop up every carrot you can reach.";
  }
}

function tick(now) {
  const dt = Math.min(0.06, (now - lastTime) / 1000 || 0);
  lastTime = now;
  accumulator += dt;
  while (accumulator >= fixedDt) {
    stepGame(state, fixedDt);
    accumulator -= fixedDt;
  }
  render();
  requestAnimationFrame(tick);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.querySelector(".shell").requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

function handlePrimaryAction() {
  jump(state);
  render();
}

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") {
    event.preventDefault();
    handlePrimaryAction();
  } else if (event.code === "KeyR" && state.mode === "gameover") {
    restartGame(state);
  } else if (event.code === "KeyP") {
    setPaused(state, state.mode === "playing");
  } else if (event.code === "KeyF") {
    toggleFullscreen();
  }
});

canvas.addEventListener("pointerdown", () => handlePrimaryAction());
startBtn.addEventListener("click", () => startGame(state));
restartBtn.addEventListener("click", () => restartGame(state));
window.addEventListener("resize", () => render());
document.addEventListener("fullscreenchange", () => render());

window.render_game_to_text = () => renderGameToText(state);
window.advanceTime = (ms) => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i += 1) stepGame(state, fixedDt);
  render();
};
window.bunbun = {
  state,
  start: () => startGame(state),
  restart: () => restartGame(state),
  jump: () => jump(state),
  step: (seconds) => stepGame(state, seconds),
};

function applyShowcaseScene() {
  startGame(state);
  state.elapsed = 8;
  state.distance = 165;
  state.carrots = 2;
  state.score = 315;
  state.player.y = state.groundY - state.player.h - 78;
  state.player.vy = -180;
  state.player.grounded = false;
  state.player.jumpsUsed = 1;
  state.collectibles = [
    { x: 430, y: state.groundY - 144, w: 30, h: 42, bob: 0.5, collected: false },
    { x: 548, y: state.groundY - 190, w: 30, h: 42, bob: 1.2, collected: false },
    { x: 728, y: state.groundY - 112, w: 30, h: 42, bob: 2.2, collected: false },
  ];
  state.obstacles = [
    { type: "crate", x: 642, y: state.groundY - 48, w: 50, h: 48 },
    { type: "fence", x: 826, y: state.groundY - 72, w: 36, h: 72 },
  ];
}

if (params.get("autostart") === "1") startGame(state);
if (params.get("showcase") === "1") applyShowcaseScene();

resizeCanvas();
render();
requestAnimationFrame(tick);
