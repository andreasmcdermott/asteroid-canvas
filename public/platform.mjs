import { GIFEncoder, quantize, applyPalette } from "https://unpkg.com/gifenc";

let lt;
let ctx;
let w, h;
let gameState;
let canvas;
let chunks;
let fps = 25;
let seconds = 10;
let recording = false;
let gifSize = 500;

const startRecorder = () => {
  if (recording) return;
  chunks = new Array(fps * seconds);
  recording = true;
};

const stopRecorder = async (e) => {
  if (!recording) return;
  recording = false;
  const gif = GIFEncoder();
  for (let i = 0; i < chunks.length; ++i) {
    let data = chunks[i];
    if (data) {
      const palette = quantize(data, 256);
      const index = applyPalette(data, palette);
      gif.writeFrame(index, gifSize, gifSize, { palette });
    }
  }
  gif.finish();
  const output = gif.bytes();
  const img = document.createElement("img");
  img.width = gifSize;
  img.height = gifSize;
  img.src = URL.createObjectURL(
    new Blob([output.buffer], { type: "image/gif" })
  );
  document.getElementById("output").appendChild(img);
};

let _Game;
function gameLoop(dt) {
  try {
    _Game.gameLoop(dt, gameState);
    if (gameState.screen !== "gameOver") {
      startRecorder();
    }
    if (gameState.screen === "gameOver") {
      setTimeout(stopRecorder, 100);
    }
  } catch (err) {
    console.error(err);
  }
}

function loadGame(cb) {
  import(`http://localhost:8000/game.mjs?t=${Date.now()}`).then((module) => {
    _Game = module;
    if (cb) cb();
    else _Game.refresh(gameState);
  });
}

export function init(_canvas) {
  canvas = _canvas;
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.setAttribute("width", w);
  canvas.setAttribute("height", h);
  ctx = canvas.getContext("2d", { willReadFrequently: true });
  loadGame(() => {
    gameState = _Game.initGame(w, h, ctx);
    initEventListeners();
    lt = performance.now();
    requestAnimationFrame(nextFrame);
  });
}

let frameCounter = 0;
function nextFrame(t) {
  let dt = t - lt; // dt is ~16ms
  lt = t;
  canvas.classList.toggle("mouse_active", gameState.mouse_active);
  gameLoop(dt);
  if (recording) {
    if (frameCounter++ > 4) {
      let left = Math.max(gameState.player.p.x - gifSize / 2, 0);
      let top = Math.max(gameState.player.p.y - gifSize / 2, 0);
      if (left + gifSize > gameState.win.w) left = gameState.win.w - gifSize;
      if (top + gifSize > gameState.win.h) top = gameState.win.h - gifSize;

      const { data } = gameState.ctx.getImageData(left, top, gifSize, gifSize);

      if (chunks.length >= fps * seconds - 1) chunks.shift();
      chunks.push(data);
      frameCounter = 0;
    }
  } else frameCounter = 0;
  // TODO: Can we grab the canvas content and create a video/screenshot?
  gameState.lastInput = { ...gameState.input };
  requestAnimationFrame(nextFrame);
}
1;

function initEventListeners() {
  new EventSource("http://localhost:8000/esbuild").addEventListener(
    "change",
    () => {
      loadGame();
    }
  );

  window.addEventListener(
    "resize",
    () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.setAttribute("width", w);
      canvas.setAttribute("height", h);
      chunks = new Array(fps * seconds);
      gameState.win.set(w, h);
    },
    { passive: true }
  );

  window.addEventListener(
    "keydown",
    (e) => {
      gameState.input[e.key] = true;
    },
    { passive: true }
  );

  window.addEventListener(
    "keyup",
    (e) => {
      delete gameState.input[e.key];
      if (e.key === "Backspace") gameState.debug = !gameState.debug;
    },
    { passive: true }
  );

  window.addEventListener(
    "mousemove",
    (e) => {
      gameState.mouse_active = true;
      gameState.input["MouseX"] = e.x;
      gameState.input["MouseY"] = e.y;
    },
    { passive: true }
  );

  window.addEventListener(
    "mousedown",
    (e) => {
      gameState.input[`Mouse${e.button}`] = true;
    },
    { passive: true }
  );

  window.addEventListener(
    "mouseup",
    (e) => {
      delete gameState.input[`Mouse${e.button}`];
    },
    { passive: true }
  );

  window.addEventListener("blur", (e) => {
    if (gameState.screen === "play") gameState.screen = "pause";
  });

  window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });
}
