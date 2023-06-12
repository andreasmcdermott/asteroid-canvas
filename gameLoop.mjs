import {
  Vec2,
  Rgba,
  RAD2DEG,
  PI,
  PI2,
  point_inside,
  wrapDeg,
  rnd,
  clampMin,
  clampMax,
  line_intersect_circle,
  distance,
} from "./utils.mjs";
import { particle } from "./particles.mjs";

let ctx;
let win;

let screens = { play, menu, pause, gameOver, gameWin };

export function gameLoop(dt, gameState) {
  win = gameState.win;
  ctx = gameState.ctx;

  let screen = screens[gameState.screen];

  ctx.clearRect(0, 0, win.w, win.h);

  gameState.stars.drawAll(ctx, gameState);

  if (gameState.screen === "pause") {
    play(0, gameState);
  }

  screen(dt, gameState);

  if (gameState.debug) {
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.fillText((1000 / dt).toFixed(2), win.w - 10, 10);
  }
}

function pause(dt, gameState) {
  if (gameState.input.Escape && !gameState.lastInput.Escape) {
    gameState.screen = "play";
    return;
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, win.w, win.h);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.font = "80px monospace";
  ctx.fillText("Asteroids", win.w / 2, win.h / 3);
  ctx.font = "22px monospace";
  ctx.fillText("Press Escape to Resume", win.w / 2, win.h / 2 - 60);
}

function menu(dt, gameState) {
  gameState.asteroids.updateAll(dt, gameState);
  gameState.asteroids.drawAll(ctx, gameState);

  let actions = {
    Select:
      (gameState.input["Enter"] && !gameState.lastInput["Enter"]) ||
      (gameState.input[" "] && !gameState.lastInput[" "]),
    Up:
      (gameState.input["ArrowUp"] && !gameState.lastInput["ArrowUp"]) ||
      (gameState.input.w && !gameState.lastInput.w),
    Down:
      (gameState.input["ArrowDown"] && !gameState.lastInput["ArrowDown"]) ||
      (gameState.input.s && !gameState.lastInput.s),
  };

  if (actions.Up) {
    gameState.menu_active = clampMin(gameState.menu_active - 1, 0);
  } else if (actions.Down) {
    gameState.menu_active = clampMax(
      gameState.menu_active + 1,
      gameState.menu_items.length - 1
    );
  } else if (actions.Select) {
    if (gameState.menu_screen === "help") {
      gameState.menu_screen = "";
    } else {
      if (gameState.menu_items[gameState.menu_active] === "Help") {
        gameState.menu_screen = "help";
      } else {
        gameState.screen = "play";
        gameState.level = -1;
        gameState.difficulty =
          gameState.menu_items[gameState.menu_active].toLowerCase();
      }
    }
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, win.w, win.h);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.font = "80px monospace";
  ctx.fillText("Asteroids", win.w / 2, win.h / 3);

  if (gameState.menu_screen === "help") {
    ctx.font = "16px monospace";
    ctx.fillStyle = "white";
    ctx.fillText(
      "Shoot: Left Mouse Button / Space / Period",
      win.w / 2,
      win.h / 2
    );
    ctx.fillText(
      "Shield: Right Mouse Button / Shift / Comma",
      win.w / 2,
      win.h / 2 + 40
    );
    ctx.fillText("Thruster: Up / W", win.w / 2, win.h / 2 + 80);
    ctx.fillText("Turn: Left|Right / A|D", win.w / 2, win.h / 2 + 120);

    ctx.font = "22px monospace";
    ctx.fillText("Okay", win.w / 2, win.h / 2 + 240);
    let size = ctx.measureText("Okay");
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      win.w / 2 - size.actualBoundingBoxLeft - 20,
      win.h / 2 + 240 - 20,
      size.width + 40,
      40
    );
  } else {
    ctx.font = "22px monospace";
    for (let i = 0; i < gameState.menu_items.length; ++i) {
      ctx.fillText(gameState.menu_items[i], win.w / 2, win.h / 2 + 60 * i);

      if (i === gameState.menu_active) {
        let size = ctx.measureText(gameState.menu_items[i]);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          win.w / 2 - size.actualBoundingBoxLeft - 20,
          win.h / 2 + 60 * i - 20,
          size.width + 40,
          40
        );
      }
    }
  }
}

function gameOver(dt, gameState) {
  let { ctx, win } = gameState;

  gameState.projectiles.updateAll(dt, gameState);
  gameState.asteroids.updateAll(dt, gameState);
  gameState.particles.updateAll(dt, gameState);

  gameState.projectiles.drawAll(ctx, gameState);
  gameState.asteroids.drawAll(ctx, gameState);
  gameState.particles.drawAll(ctx, gameState);

  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fillRect(0, 0, win.w, win.h);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.font = "80px monospace";
  ctx.fillText("Game Over", win.w / 2, win.h / 2 - 50);
  ctx.font = "22px monospace";
  ctx.fillText("Press Enter to Restart", win.w / 2, win.h / 2 + 50);
  if (gameState.input.Enter && !gameState.lastInput.Enter) {
    gameState.level = -1;
    gameState.screen = "play";
  }
}

function gameWin(dt, gameState) {
  let { ctx, win } = gameState;

  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fillRect(0, 0, win.w, win.h);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.font = "80px monospace";
  ctx.fillText("You Win", win.w / 2, win.h / 2 - 50);
  ctx.font = "22px monospace";
  ctx.fillText("Press Enter to Restart", win.w / 2, win.h / 2 + 50);
  if (gameState.input.Enter && !gameState.lastInput.Enter) {
    gameState.level = -1;
    gameState.screen = "play";
  }
}

function play(dt, gameState) {
  if (
    gameState.input.Escape &&
    !gameState.lastInput.Escape &&
    !gameState.player.destroyed &&
    gameState.asteroids.activeCount > 0
  ) {
    gameState.screen = "pause";
    return;
  }

  if (gameState.level < 0) {
    gotoNextLevel(gameState);
  }

  gameState.projectiles.updateAll(dt, gameState);
  gameState.asteroids.updateAll(dt, gameState);
  gameState.player.update(dt, gameState);
  gameState.particles.updateAll(dt, gameState);

  gameState.projectiles.drawAll(ctx, gameState);
  gameState.asteroids.drawAll(ctx, gameState);
  gameState.player.draw(ctx, gameState);
  gameState.particles.drawAll(ctx, gameState);

  if (gameState.asteroids.activeCount === 0) {
    gameState.screen = "gameWin";
  }
}

function gotoNextLevel(gameState) {
  gameState.level += 1;

  gameState.particles.reset();
  gameState.projectiles.reset();
  gameState.asteroids.reset();
  gameState.player.activate(gameState.win.w / 2, gameState.win.h / 2);

  switch (gameState.level) {
    case 0: {
      let level = 0;
      for (let i = 0; i < 3; ++i) {
        gameState.asteroids.push(
          rnd(gameState.win.w),
          rnd(gameState.win.h),
          level
        );
      }
      break;
    }
  }
}
