let lt;
let ctx;
let w, h;
let gameState;
let canvas;
let _Game;
let gamepad = -1;

function gameLoop(dt) {
  try {
    _Game.gameLoop(dt, gameState);
  } catch (err) {
    console.error(err);
  }
}

function loadGame(cb) {
  let loadFrom = "./game.mjs";
  if (IS_DEV) {
    loadFrom = `http://localhost:8000/game.mjs?t=${Date.now()}`;
  }
  import(loadFrom).then((module) => {
    _Game = module;
    if (cb) cb();
    else _Game.refresh(gameState);
  });
}

function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.src = url;
  });
}

function loadAssets(cb) {
  let font = new FontFace(
    "kenvectorfuture",
    "url(assets/kenvector_future.ttf)",
    {
      style: "normal",
      weight: "400",
    }
  );

  Promise.all([
    font.load(),
    loadImage("assets/simpleSpace_sheet@2.png"),
    loadImage("assets/crosshairs_tilesheet_white@2.png"),
    loadImage("assets/tilemap.png"),
    loadImage("assets/uipackSpace_sheet.png"),
    loadImage("assets/shield.png"),
  ]).then(([, tilesheet, crosshairs, controls, ui, shield]) => {
    document.fonts.add(font);
    cb({ tilesheet, crosshairs, controls, ui, shield });
  });
}

export function init(_canvas) {
  canvas = _canvas;
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.setAttribute("width", w);
  canvas.setAttribute("height", h);
  ctx = canvas.getContext("2d");

  loadAssets((assets) => {
    loadGame(() => {
      gameState = _Game.initGame(w, h, ctx, assets);
      if (IS_DEV) {
        window._gameState = gameState;
      }
      initEventListeners();
      lt = performance.now();
      requestAnimationFrame(nextFrame);
    });
  });
}

function nextFrame(t) {
  let dt = t - lt; // dt is ~16ms
  lt = t;
  if (gamepad >= 0) {
    let { axes, buttons } = navigator.getGamepads()[gamepad];
    gameState.input.gamepadLeftStick = { x: axes[0], y: axes[1] };
    gameState.input.gamepadRightStick = { x: axes[2], y: axes[3] };
    gameState.input.gamepadLeftTrigger = buttons[6]?.value ?? 0;
    gameState.input.gamepadRightTrigger = buttons[7]?.value ?? 0;
    gameState.input.gamepadA = buttons[0]?.pressed ?? false;
    gameState.input.gamepadB = buttons[1]?.pressed ?? false;
    gameState.input.gamepadStart = buttons[9]?.pressed ?? false;
    gameState.input.gamepadDpadLeft = buttons[14]?.pressed ?? false;
    gameState.input.gamepadDpadRight = buttons[15]?.pressed ?? false;
    gameState.input.gamepadDpadUp = buttons[12]?.pressed ?? false;
    gameState.input.gamepadDpadDown = buttons[13]?.pressed ?? false;
    if (buttons.some((b) => b.pressed) || axes.some((v) => Math.abs(v) > 0.5)) {
      gameState.active_input = "gamepad";
    }
  }
  gameLoop(dt);
  gameState.lastInput = { ...gameState.input };
  gameState.input.MouseX = 0;
  gameState.input.MouseY = 0;
  requestAnimationFrame(nextFrame);
}

function initEventListeners() {
  if (IS_DEV) {
    // Reload the game on change:
    new EventSource("http://localhost:8000/esbuild").addEventListener(
      "change",
      () => {
        loadGame();
      }
    );
  }

  window.addEventListener(
    "resize",
    () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.setAttribute("width", w);
      canvas.setAttribute("height", h);
      gameState.win.set(w, h);
      _Game.onResize(gameState);
    },
    { passive: true }
  );

  window.addEventListener(
    "keydown",
    (e) => {
      gameState.active_input = "keyboard";
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
    ({ movementX, movementY }) => {
      if (gameState.has_mouse_lock) {
        gameState.input["MouseX"] = movementX;
        gameState.input["MouseY"] = movementY;
        gameState.active_input = "mouse";
      }
    },
    { passive: true }
  );

  window.addEventListener(
    "mousedown",
    (e) => {
      if (gameState.has_mouse_lock) {
        gameState.active_input = "mouse";
        gameState.input[`Mouse${e.button}`] = true;
      }
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
    if (gameState.screen === "play" && !IS_DEV) gameState.screen = "pause";
  });

  window.addEventListener("gamepadconnected", (e) => {
    let gp = navigator.getGamepads()[e.gamepad.index];
    if (gp.mapping === "standard") {
      gamepad = e.gamepad.index;
      gameState.gamepad = gp;
    } else {
      gamepad = -1;
      console.log("Unsupported gamepad", gp);
    }
  });

  window.addEventListener("gamepaddisconnected", (e) => {
    gameState.gamepad = null;
    gamepad = -1;
  });

  document.addEventListener(
    "pointerlockchange",
    () => {
      gameState.has_mouse_lock = document.pointerLockElement === canvas;
      if (gameState.has_mouse_lock) {
        gameState.mx = gameState.win.w / 2;
        gameState.my = gameState.win.h / 2;
      }
    },
    { passive: true }
  );

  canvas.addEventListener("click", async () => {
    if (!document.pointerLockElement) {
      await canvas.requestPointerLock({ unadjustedMovement: false });
    }
  });

  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });
}
