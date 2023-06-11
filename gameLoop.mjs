import {
  Vec2,
  Rgba,
  RAD2DEG,
  PI,
  PI2,
  rnd,
  point_inside,
  wrapDeg,
  clampMin,
  clampMax,
  line_intersect_circle,
  distance,
} from "./utils.mjs";
import {
  drawRoundRect,
  drawPlayerShip,
  drawPlayerShield,
  drawStar,
} from "./drawing.mjs";
import {
  asteroid_levels,
  player_rot_speed,
  player_acc,
  asteroid_speed,
  player_max_speed,
  laser_speed,
  laser_cooldown,
  laser_len,
  thrust_size,
  thrust_max_age,
  thrust_cooldown,
  max_shield_charge,
  shield_recharge_rate,
  shield_discharge_cooldown,
  asteroid_sizes,
  asteroid_rot_speed,
  player_invincibilty_max,
  player_w,
  player_h,
} from "./constants.mjs";
import { drawParticles, updateParticles, particle } from "./particles.mjs";

let ctx;
let win;

let screens = { play, menu, pause, gameOver, gameWin };

export function gameLoop(dt, input, lastInput, debug, gameState) {
  win = gameState.win;
  ctx = gameState.ctx;

  let screen = screens[gameState.screen];

  ctx.clearRect(0, 0, win.w, win.h);

  for (let i = 0; i < gameState.const_entities.length; ++i) {
    let e = gameState.const_entities[i];
    drawStar(ctx, e.p.x, e.p.y, e.r);
  }

  if (gameState.screen === "pause") {
    play(0, {}, {}, gameState);
  }

  screen(dt, input, lastInput, gameState);

  if (debug) {
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.fillText((1000 / dt).toFixed(2), win.w - 10, 10);
  }
}

function pause(dt, input, lastInput, gameState) {
  if (input.Escape && !lastInput.Escape) {
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
}

function menu(dt, input, lastInput, gameState) {
  for (let i = 0; i < gameState.asteroids.length; ++i) {
    let asteroid = gameState.asteroids[i];
    updateAsteroid(dt, asteroid, gameState);
    drawAsteroid(asteroid, gameState);
  }
  let actions = {
    Select:
      (input["Enter"] && !lastInput["Enter"]) ||
      (input[" "] && !lastInput[" "]),
    Up:
      (input["ArrowUp"] && !lastInput["ArrowUp"]) || (input.w && !lastInput.w),
    Down:
      (input["ArrowDown"] && !lastInput["ArrowDown"]) ||
      (input.s && !lastInput.s),
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

function gameOver(dt, input, lastInput, gameState) {}

function gameWin(dt, input, lastInput, gameState) {}

function play(dt, input, lastInput, gameState) {
  if (input.Escape && !lastInput.Escape) {
    gameState.screen = "pause";
    return;
  }

  if (gameState.level < 0) {
    gotoNextLevel(gameState);
  }

  let { asteroids, player } = gameState;

  let valid_asteroids = [];
  for (let i = 0; i < asteroids.length; ++i) {
    let asteroid = asteroids[i];

    let destroyed = false;
    for (let i = 0; i < player.lasers.length; ++i) {
      let laser = player.lasers[i];
      if (laser.destroyed) continue;
      if (
        line_intersect_circle(
          laser.p,
          laser.p.copy().add(laser.v.copy().scale(laser_len)),
          asteroid.p,
          asteroid.size / 2
        )
      ) {
        laser.destroyed = true;
        destroyed = true;
        particle(gameState, rnd(15, 30) * (asteroid_levels - asteroid.level), {
          x: asteroid.p.x,
          y: asteroid.p.y,
          v0x: [-1, 1],
          v0y: [-1, 1],
          v0v: [0.01, 0.24],
          v1x: 0,
          v1y: 0,
          v1v: 0,
          cr0: 255,
          cg0: 255,
          cb0: 255,
          ca0: [0.5, 1],
          ca1: 0,
          r0: [2, 5],
          r1: 0.1,
          delay: [0, 150],
          life: [1000, 3000],
        });

        let lvl = asteroid.level + 1;
        if (lvl < asteroid_levels) {
          for (let i = 0; i < 4; ++i) {
            valid_asteroids.push({
              level: lvl,
              size: rnd(...asteroid_sizes[lvl]),
              p: asteroid.p.copy(),
              angle: rnd(360),
              rot: rnd(-1, 1) * rnd(...asteroid_rot_speed),
              v: new Vec2(rnd(-1, 1), rnd(-1, 1))
                .normalize()
                .scale(rnd(...asteroid_speed)),
            });
          }
        }
      }
    }
    if (!destroyed) {
      updateAsteroid(dt, asteroid, gameState);
      drawAsteroid(asteroid, gameState);
      valid_asteroids.push(asteroid);
    }
    gameState.asteroids = valid_asteroids;

    if (player.invincibility <= 0) {
      for (let i = 0; i < asteroids.length; ++i) {
        let asteroid = asteroids[i];
        let d = distance(player.p, asteroid.p);
        if (d < player.r + asteroid.size / 2) {
          if (player.shield) {
            // let plen = player.v.len();
            // let alen = asteroid.v.len();
            // player.v = asteroid.v
            //   .copy()
            //   .sub(player.v)
            //   .normalize()
            //   .scale((plen + alen) * 0.5);
            // asteroid.v = asteroid.v
            //   .copy()
            //   .sub(player.v)
            //   .normalize()
            //   .scale((alen + plen) * 0.5);
            // asteroid.p.add(
            //   asteroid.v
            //     .copy()
            //     .normalize()
            //     .scale(player.r + asteroid.size / 2 - d)
            // );
            player.v = player.p
              .copy()
              .sub(asteroid.p)
              .normalize()
              .scale(player.v.len() * 0.95);
            asteroid.v = asteroid.p
              .copy()
              .sub(player.p)
              .normalize()
              .scale(player.v.len() * 0.75);
            asteroid.p.add(
              asteroid.v
                .copy()
                .normalize()
                .scale(player.r + asteroid.size / 2 - d)
            );
          } else {
            if (!gameState.player_destroyed) {
              player.lasers = [];
              gameState.player_destroyed = true;
              particle(gameState, rnd(85, 150), {
                x: player.p.x,
                y: player.p.y,
                v0x: [-1, 1],
                v0y: [-1, 1],
                v0v: [0.01, 0.35],
                v1x: 0,
                v1y: 0,
                v1v: 0,
                cr0: [200, 255],
                cg0: [128, 200],
                cb0: 0,
                ca0: [0.55, 0.75],
                ca1: 0,
                r0: [6, 10],
                r1: 0,
                delay: [0, 50],
                life: [500, 1500],
              });
            }
          }
          break;
        }
      }
    }
  }

  updateParticles(dt, gameState);
  drawParticles(gameState);

  if (asteroids.length === 0) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, win.w, win.h);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.font = "80px monospace";
    ctx.fillText("You Win", win.w / 2, win.h / 2 - 50);
    ctx.font = "22px monospace";
    ctx.fillText("Press Enter to Restart", win.w / 2, win.h / 2 + 50);
    if (input.Enter && !lastInput.Enter) {
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
    if (input.Enter && !lastInput.Enter) {
      gameState.level = -1;
      gameState.player_destroyed = false;
    }
  } else {
    updatePlayer(dt, player, input, gameState);
    drawPlayer(player, gameState);
    drawPlayerGui(player);
  }
}

function gotoNextLevel(gameState) {
  gameState.level += 1;

  gameState.player = {
    w: player_w,
    h: player_h,
    r: player_h / 1.7,
    p: new Vec2(gameState.win.w / 2, gameState.win.h / 2),
    angle: 270,
    rot: 0,
    v: Vec2.origin.copy(),
    thrusts: [],
    lasers: [],
    laser_cooldown: 0,
    thrust_cooldown: 0,
    shield: false,
    shield_charge: max_shield_charge,
    shield_cooldown_timer: 0,
    invincibility: player_invincibilty_max,
  };

  switch (gameState.level) {
    case 0: {
      gameState.asteroids = [];
      for (let i = 0; i < 3; ++i) {
        gameState.asteroids.push({
          level: 0,
          size: rnd(...asteroid_sizes[0]),
          p: new Vec2(rnd(gameState.win.w), rnd(gameState.win.h)),
          angle: rnd(360),
          rot: rnd(-1, 1) * rnd(...asteroid_rot_speed),
          v: new Vec2(rnd(-1, 1), rnd(-1, 1))
            .normalize()
            .scale(rnd(...asteroid_speed)),
        });
      }
      break;
    }
  }
}

function updatePlayer(dt, player, input, gameState) {
  let valid_lasers = [];
  for (let i = 0; i < player.lasers.length; ++i) {
    let laser = player.lasers[i];
    if (laser.destroyed) continue;
    laser.p.add(laser.v.copy().scale(dt * laser_speed));
    if (point_inside(laser.p, Vec2.origin, win)) {
      valid_lasers.push(laser);
    }
  }
  player.lasers = valid_lasers;

  let valid_thrusts = [];
  for (let i = 0; i < player.thrusts.length; ++i) {
    let thrust = player.thrusts[i];
    thrust.age += dt;
    if (thrust.age < thrust_max_age) {
      valid_thrusts.push(thrust);
    }
  }
  player.thrusts = valid_thrusts;

  let actions = {
    RotLeft: input.ArrowLeft || input.a,
    RotRight: input.ArrowRight || input.d,
    Accelerate: input.ArrowUp || input.w,
    Fire: input[" "] || input["."] || input.Mouse0,
    Shield: input.Shift || input[","] || input.Mouse2,
  };

  if (actions.RotLeft) {
    player.rot = -1;
    gameState.mouse_active = false;
  }
  if (actions.RotRight) {
    player.rot = 1;
    gameState.mouse_active = false;
  }
  if (actions.RotLeft === actions.RotRight) player.rot = 0;

  if (gameState.mouse_active) {
    let dir = new Vec2(
      input.MouseX - player.p.x,
      input.MouseY - player.p.y
    ).normalize();
    player.angle = Math.atan2(dir.y, dir.x) * RAD2DEG;
  } else {
    player.angle = wrapDeg(player.angle + player.rot * player_rot_speed * dt);
  }

  if (actions.Shield && player.shield_charge > 0 && player.invincibility <= 0) {
    player.shield_recharging = false;
    player.shield = true;
  } else {
    if (!actions.Shield) {
      player.shield_recharging = true;
    }
    player.shield = false;
  }

  if (player.shield) {
    player.shield_charge = clampMin(player.shield_charge - dt);
    if (player.shield_charge === 0) {
      player.shield_cooldown_timer = shield_discharge_cooldown;
    }
  } else if (player.shield_recharging) {
    player.shield_cooldown_timer = clampMin(player.shield_cooldown_timer - dt);
    if (player.shield_cooldown_timer <= 0) {
      player.shield_charge = clampMax(
        player.shield_charge + dt * shield_recharge_rate,
        max_shield_charge
      );
    }
  }

  if (!player.shield && actions.Accelerate) {
    let acc = Vec2.fromAngle(player.angle);
    player.v.add(acc.scale(dt * player_acc));
    if (player.v.len() > player_max_speed) {
      player.v.normalize().scale(player_max_speed);
    }
    if (player.thrust_cooldown <= 0) {
      player.thrust_cooldown = thrust_cooldown;
      let v = Vec2.fromAngle(player.angle);
      let x = player.p.x - v.x * player.h * 0.6;
      let y = player.p.y - v.y * player.h * 0.6;
      if (x < 0) x += win.w;
      else if (x > win.w) x -= win.w;
      if (y < 0) y += win.h;
      else if (y > win.h) y += win.h;
      let p = new Vec2(x, y);
      player.thrusts.push({
        p,
        age: 0,
      });
    }
  }

  if (!player.shield && actions.Fire && player.invincibility <= 0) {
    if (player.laser_cooldown <= 0) {
      player.laser_cooldown = laser_cooldown;
      let v = Vec2.fromAngle(player.angle);
      let x = player.p.x + v.x * player.h * 0.5;
      let y = player.p.y + v.y * player.h * 0.5;
      if (x < 0) x += win.w;
      else if (x > win.w) x -= win.w;
      if (y < 0) y += win.h;
      else if (y > win.h) y += win.h;
      let p = new Vec2(x, y);
      player.lasers.push({
        v,
        p,
        angle: player.angle,
      });
    }
  }

  player.thrust_cooldown = clampMin(player.thrust_cooldown - dt);
  player.laser_cooldown = clampMin(player.laser_cooldown - dt);
  player.invincibility = clampMin(player.invincibility - dt);

  player.p.add(player.v.copy().scale(dt));

  if (player.p.x - player.w > win.w) {
    player.p.x -= win.x;
  } else if (player.p.x + player.w < 0) {
    player.p.x += win.x;
  }
  if (player.p.y - player.h > win.y) {
    player.p.y -= win.y;
  } else if (player.p.y + player.h < 0) {
    player.p.y += win.y;
  }
}

function drawPlayer(player) {
  let strokeStyle = new Rgba(255, 255, 255, 1);
  if (player.invincibility > 0) {
    strokeStyle.alpha(
      clampMin(
        Math.sin((player.invincibility / player_invincibilty_max) * PI * 24),
        0.25
      )
    );
  }
  drawPlayerShip(
    ctx,
    player.p.x,
    player.p.y,
    player.angle,
    player.w,
    player.h,
    strokeStyle
  );
  if (player.shield) {
    drawPlayerShield(ctx, player.p.x, player.p.y, player.angle, player.r);
  }

  if (player.thrusts.length) {
    for (let i = 0; i < player.thrusts.length; ++i) {
      let thrust = player.thrusts[i];
      let pa = thrust.age / thrust_max_age;
      ctx.save();
      ctx.translate(thrust.p.x, thrust.p.y);
      let size = (thrust_size - 6) * pa + 6;
      ctx.fillStyle = `rgba(${55 * (1 - pa) + 200}, ${
        200 * (1 - pa) + 55
      }, 0, ${1 - pa})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, size, size, 0, 0, PI2);
      ctx.fill();
      ctx.restore();
    }
  }

  if (player.lasers.length) {
    for (let i = 0; i < player.lasers.length; ++i) {
      let laser = player.lasers[i];
      ctx.save();
      ctx.translate(laser.p.x, laser.p.y);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "skyblue";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(laser.v.x * laser_len, laser.v.y * laser_len);
      ctx.stroke();
      ctx.restore();
    }
  }

  let xx = null;
  let yy = null;
  if (player.p.x - player.w < 0) xx = player.p.x + win.w;
  else if (player.p.x + player.w > win.w) xx = player.p.x - win.w;
  if (player.p.y - player.h < 0) yy = player.p.y + win.h;
  else if (player.p.y + player.h > win.h) yy = player.p.y - win.h;

  if (xx !== null || yy !== null) {
    if (xx === null) xx = player.p.x;
    if (yy === null) yy = player.p.y;
    drawPlayerShip(ctx, xx, yy, player.angle, player.w, player.h, strokeStyle);
    if (player.shield) {
      drawPlayerShield(ctx, xx, yy, player.angle, player.h / 1.7);
    }
  }
}

function drawPlayerGui(player) {
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgb(25, 255, 25)";
  ctx.fillStyle =
    player.shield_charge <= 0
      ? `rgba(255, 25, 25, ${
          player.shield_recharging
            ? Math.sin(
                (player.shield_cooldown_timer / shield_discharge_cooldown) *
                  PI *
                  32
              )
            : 0.5
        })`
      : `rgba(25, 255, 25, 0.5)`;
  ctx.strokeRect(10, 10, 200, 20);
  ctx.fillRect(
    12,
    12,
    196 *
      (player.shield_charge <= 0
        ? 1
        : clampMin(player.shield_charge / max_shield_charge)),
    16
  );
}

function updateAsteroid(dt, asteroid) {
  asteroid.angle = wrapDeg(asteroid.angle + asteroid.rot * dt);
  asteroid.p.add(asteroid.v.copy().scale(dt));

  if (asteroid.p.x - asteroid.size / 2 > win.w) asteroid.p.x -= win.w;
  else if (asteroid.p.x + asteroid.size / 2 < 0) asteroid.p.x += win.w;
  if (asteroid.p.y - asteroid.size / 2 > win.h) asteroid.p.y -= win.h;
  else if (asteroid.p.y + asteroid.size / 2 < 0) asteroid.p.y += win.h;
}

function drawAsteroid(asteroid) {
  drawRoundRect(
    ctx,
    asteroid.p.x,
    asteroid.p.y,
    asteroid.angle,
    asteroid.size,
    asteroid.size,
    asteroid.size / 5,
    asteroid_levels - asteroid.level + 1
  );

  let xx = null;
  let yy = null;
  if (asteroid.p.x - asteroid.size / 2 < 0) xx = asteroid.p.x + win.w;
  else if (asteroid.p.x + asteroid.size / 2 > win.w) xx = asteroid.p.x - win.w;
  if (asteroid.p.y - asteroid.size / 2 < 0) yy = asteroid.p.y + win.h;
  else if (asteroid.p.y + asteroid.size / 2 > win.h) yy = asteroid.p.y - win.h;

  if (xx !== null && yy !== null) {
    drawRoundRect(
      ctx,
      xx,
      asteroid.p.y,
      asteroid.angle,
      asteroid.size,
      asteroid.size,
      asteroid.size / 5,
      asteroid_levels - asteroid.level + 1
    );
    drawRoundRect(
      ctx,
      asteroid.p.x,
      yy,
      asteroid.angle,
      asteroid.size,
      asteroid.size,
      asteroid.size / 5,
      asteroid_levels - asteroid.level + 1
    );
    drawRoundRect(
      ctx,
      xx,
      asteroid.p.y,
      asteroid.angle,
      asteroid.size,
      asteroid.size,
      asteroid.size / 5,
      asteroid_levels - asteroid.level + 1
    );
    drawRoundRect(
      ctx,
      xx,
      yy,
      asteroid.angle,
      asteroid.size,
      asteroid.size,
      asteroid.size / 5,
      asteroid_levels - asteroid.level + 1
    );
  } else if (xx !== null) {
    drawRoundRect(
      ctx,
      xx,
      asteroid.p.y,
      asteroid.angle,
      asteroid.size,
      asteroid.size,
      asteroid.size / 5,
      asteroid_levels - asteroid.level + 1
    );
  } else if (yy !== null) {
    drawRoundRect(
      ctx,
      asteroid.p.x,
      yy,
      asteroid.angle,
      asteroid.size,
      asteroid.size,
      asteroid.size / 5,
      asteroid_levels - asteroid.level + 1
    );
  }
}
