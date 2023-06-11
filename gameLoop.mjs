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

function gameOver(dt, gameState) {}

function gameWin(dt, gameState) {}

function play(dt, gameState) {
  if (
    gameState.input.Escape &&
    !gameState.lastInput.Escape &&
    !gameState.player_destroyed &&
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
  gameState.players.updateAll(dt, gameState);
  gameState.particles.updateAll(dt, gameState);

  gameState.projectiles.drawAll(ctx, gameState);
  gameState.asteroids.drawAll(ctx, gameState);
  gameState.players.drawAll(ctx, gameState);
  gameState.particles.drawAll(ctx, gameState);

  // let valid_asteroids = [];
  // for (let i = 0; i < asteroids.length; ++i) {
  //   let asteroid = asteroids[i];

  //   let destroyed = false;
  //   for (let i = 0; i < player.lasers.length; ++i) {
  //     let laser = player.lasers[i];
  //     if (laser.destroyed) continue;
  //     if (
  //       line_intersect_circle(
  //         laser.p,
  //         laser.p.copy().add(laser.v.copy().scale(laser_len)),
  //         asteroid.p,
  //         asteroid.size / 2
  //       )
  //     ) {
  //       laser.destroyed = true;
  //       destroyed = true;
  //       particle(gameState, rnd(15, 30) * (asteroid_levels - asteroid.level), {
  //         x: asteroid.p.x,
  //         y: asteroid.p.y,
  //         v0x: [-1, 1],
  //         v0y: [-1, 1],
  //         v0v: [0.01, 0.24],
  //         v1x: 0,
  //         v1y: 0,
  //         v1v: 0,
  //         cr0: 255,
  //         cg0: 255,
  //         cb0: 255,
  //         ca0: [0.5, 1],
  //         ca1: 0,
  //         r0: [2, 5],
  //         r1: 0.1,
  //         delay: [0, 150],
  //         life: [1000, 3000],
  //       });

  //       let lvl = asteroid.level + 1;
  //       if (lvl < asteroid_levels) {
  //         for (let i = 0; i < 4; ++i) {
  //           valid_asteroids.push({
  //             level: lvl,
  //             size: rnd(...asteroid_sizes[lvl]),
  //             p: asteroid.p.copy(),
  //             angle: rnd(360),
  //             rot: rnd(-1, 1) * rnd(...asteroid_rot_speed),
  //             v: new Vec2(rnd(-1, 1), rnd(-1, 1))
  //               .normalize()
  //               .scale(rnd(...asteroid_speed)),
  //           });
  //         }
  //       }
  //     }
  //   }
  //   if (!destroyed) {
  // updateAsteroid(dt, asteroid, gameState);
  //     drawAsteroid(asteroid, gameState);
  //     valid_asteroids.push(asteroid);
  //   }
  //   gameState.asteroids = valid_asteroids;

  //   if (player.invincibility <= 0) {
  //     for (let i = 0; i < asteroids.length; ++i) {
  //       let asteroid = asteroids[i];
  //       let d = distance(player.p, asteroid.p);
  //       if (d < player.r + asteroid.size / 2) {
  //         if (player.shield) {
  //           // let plen = player.v.len();
  //           // let alen = asteroid.v.len();
  //           // player.v = asteroid.v
  //           //   .copy()
  //           //   .sub(player.v)
  //           //   .normalize()
  //           //   .scale((plen + alen) * 0.5);
  //           // asteroid.v = asteroid.v
  //           //   .copy()
  //           //   .sub(player.v)
  //           //   .normalize()
  //           //   .scale((alen + plen) * 0.5);
  //           // asteroid.p.add(
  //           //   asteroid.v
  //           //     .copy()
  //           //     .normalize()
  //           //     .scale(player.r + asteroid.size / 2 - d)
  //           // );
  //           player.v = player.p
  //             .copy()
  //             .sub(asteroid.p)
  //             .normalize()
  //             .scale(player.v.len() * 0.95);
  //           asteroid.v = asteroid.p
  //             .copy()
  //             .sub(player.p)
  //             .normalize()
  //             .scale(player.v.len() * 0.75);
  //           asteroid.p.add(
  //             asteroid.v
  //               .copy()
  //               .normalize()
  //               .scale(player.r + asteroid.size / 2 - d)
  //           );
  //         } else {
  //           if (!gameState.player_destroyed) {
  //             player.lasers = [];
  //             gameState.player_destroyed = true;
  //             particle(gameState, rnd(85, 150), {
  //               x: player.p.x,
  //               y: player.p.y,
  //               v0x: [-1, 1],
  //               v0y: [-1, 1],
  //               v0v: [0.01, 0.35],
  //               v1x: 0,
  //               v1y: 0,
  //               v1v: 0,
  //               cr0: [200, 255],
  //               cg0: [128, 200],
  //               cb0: 0,
  //               ca0: [0.55, 0.75],
  //               ca1: 0,
  //               r0: [6, 10],
  //               r1: 0,
  //               delay: [0, 50],
  //               life: [500, 1500],
  //             });
  //           }
  //         }
  //         break;
  //       }
  //     }
  //   }
  // }

  if (gameState.asteroids.activeCount === 0) {
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
    }
  } else if (gameState.player_destroyed) {
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
      gameState.player_destroyed = false;
    }
  }
}

function gotoNextLevel(gameState) {
  gameState.level += 1;

  gameState.players.push(gameState.win.w / 2, gameState.win.h / 2);

  switch (gameState.level) {
    case 0: {
      gameState.asteroids.reset();
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
