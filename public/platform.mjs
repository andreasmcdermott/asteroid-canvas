// src/platform.mjs
import { GIFEncoder, quantize, applyPalette } from "https://unpkg.com/gifenc";
var lt;
var ctx;
var w;
var h;
var gameState;
var canvas;
var chunks;
var final_chunks;
var record_fps = 15;
var record_seconds = 30;
var record_frames = record_fps * record_seconds;
var recording = 0;
var gif_size;
var startRecorder = () => {
  if (recording === 1)
    return;
  if (!chunks)
    chunks = new Array(record_frames);
  recording = 1;
  document.body.classList.remove("show-save-prompt");
  document.body.classList.remove("show-gif");
};
var pauseRecorder = () => {
  recording = 2;
};
var stopRecorder = () => {
  if (recording === 0)
    return;
  recording = 0;
  final_chunks = chunks;
  chunks = null;
  document.body.classList.add("show-save-prompt");
};
var saveGifRecording = async () => {
  try {
    const gif = GIFEncoder();
    for (let i = 0; i < final_chunks.length; ++i) {
      let data = final_chunks[i];
      if (data) {
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);
        gif.writeFrame(index, gif_size, gif_size, { palette });
      }
    }
    gif.finish();
    final_chunks = null;
    const output = gif.bytes();
    const img = document.createElement("img");
    img.width = gif_size / 2;
    img.height = gif_size / 2;
    let objectUrl = URL.createObjectURL(
      new Blob([output.buffer], { type: "image/gif" })
    );
    img.src = objectUrl;
    document.getElementById("download").download = "Asteroids.gif";
    document.getElementById("download").href = objectUrl;
    document.getElementById("img").innerHTML = "";
    document.getElementById("img").appendChild(img);
    document.body.classList.add("show-gif");
  } catch (err) {
    console.error(err);
  }
};
var _Game;
function gameLoop(dt) {
  try {
    _Game.gameLoop(dt, gameState);
    if (gameState.screen === "play") {
      startRecorder();
    } else if (gameState.screen !== "gameOver") {
      pauseRecorder();
    } else if (gameState.screen === "gameOver" && gameState.screen_transition <= 0) {
      stopRecorder();
    }
  } catch (err) {
    console.error(err);
  }
}
function loadGame(cb) {
  let loadFrom = "./game.mjs";
  if (NODE_ENV === "dev") {
    loadFrom = `http://localhost:8000/game.mjs?t=${Date.now()}`;
  }
  import(loadFrom).then((module) => {
    _Game = module;
    if (cb)
      cb();
    else
      _Game.refresh(gameState);
  });
}
function init(_canvas) {
  canvas = _canvas;
  w = window.innerWidth;
  h = window.innerHeight;
  gif_size = Math.min(w, h);
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
var frameCounter = 0;
function nextFrame(t) {
  let dt = t - lt;
  lt = t;
  canvas.classList.toggle("mouse_active", gameState.mouse_active);
  gameLoop(dt);
  if (recording === 1) {
    if (++frameCounter >= 60 / record_fps) {
      let left = gameState.player.p.x - gif_size / 2;
      let top = gameState.player.p.y - gif_size / 2;
      if (left + gif_size > w)
        left = w - gif_size;
      else if (left < 0)
        left = 0;
      if (top + gif_size > h)
        top = h - gif_size;
      else if (top < 0)
        top = 0;
      const { data } = gameState.ctx.getImageData(
        left,
        top,
        gif_size,
        gif_size
      );
      if (chunks.length >= record_frames - 1)
        chunks.shift();
      chunks.push(data);
      frameCounter = 0;
    }
  } else
    frameCounter = 0;
  gameState.lastInput = { ...gameState.input };
  requestAnimationFrame(nextFrame);
}
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
      gif_size = Math.min(w, h);
      canvas.setAttribute("width", w);
      canvas.setAttribute("height", h);
      chunks = null;
      gameState.win.set(w, h);
      _Game.onResize(gameState);
    },
    { passive: true }
  );
  document.getElementById("save-gif-btn").addEventListener("click", () => {
    document.body.classList.remove("show-save-prompt");
    saveGifRecording();
  });
  document.getElementById("close-gif-btn").addEventListener("click", () => {
    document.body.classList.remove("show-gif");
  });
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
      if (e.key === "Backspace")
        gameState.debug = !gameState.debug;
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
    if (gameState.screen === "play")
      gameState.screen = "pause";
  });
  window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });
}
export {
  init
};
