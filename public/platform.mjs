let lt;
let ctx;
let w, h;
let gameState;
let canvas;

let _Game;
function gameLoop(dt) {
  _Game.gameLoop(dt, gameState);
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
  ctx = canvas.getContext("2d");
  loadGame(() => {
    gameState = _Game.initGame(w, h, ctx);
    initEventListeners();
    lt = performance.now();
    requestAnimationFrame(nextFrame);
  });
}

function nextFrame(t) {
  let dt = t - lt; // dt is ~16ms
  lt = t;
  gameLoop(dt);
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
