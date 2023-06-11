import { initGame } from "./game.mjs";

let lt;
let ctx;
let w, h;
let debug = false;
let input = {};
let gameState;

let _GameLoop;
function gameLoop(dt, input, debug) {
  _GameLoop.gameLoop(dt, input, debug, gameState);
}

function loadGame(cb) {
  import(`./gameLoop.mjs?t=${Date.now()}`).then((module) => {
    _GameLoop = module;
    if (cb) cb();
  });
}

export function init(canvas) {
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.setAttribute("width", w);
  canvas.setAttribute("height", h);
  ctx = canvas.getContext("2d");
  loadGame(() => {
    initEventListeners();
    gameState = initGame(w, h, ctx);
    lt = performance.now();
    requestAnimationFrame(nextFrame);
  });
}

function nextFrame(t) {
  let dt = t - lt; // dt is ~16ms
  lt = t;
  gameLoop(dt, input, debug);
  requestAnimationFrame(nextFrame);
}
1;

function initEventListeners() {
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
      input[e.key] = true;
    },
    { passive: true }
  );

  window.addEventListener(
    "keyup",
    (e) => {
      delete input[e.key];

      if (e.key === "-") loadGame();
      if (e.key === "Backspace") debug = !debug;
    },
    { passive: true }
  );

  window.addEventListener(
    "mousemove",
    (e) => {
      gameState.mouse_active = true;
      input["MouseX"] = e.x;
      input["MouseY"] = e.y;
    },
    { passive: true }
  );

  window.addEventListener(
    "mousedown",
    (e) => {
      input[`Mouse${e.button}`] = true;
    },
    { passive: true }
  );

  window.addEventListener(
    "mouseup",
    (e) => {
      delete input[`Mouse${e.button}`];
    },
    { passive: true }
  );

  window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });
}
