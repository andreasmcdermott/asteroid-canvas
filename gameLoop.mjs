import {
  Vec2,
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
} from "./constants.mjs";
import { drawParticles, updateParticles, particle } from "./particles.mjs";

let ctx;
let wsize;

export function gameLoop(dt, input, debug, gameState) {
  wsize = gameState.wsize;
  ctx = gameState.ctx;

  let { asteroids, player, stars } = gameState;

  ctx.clearRect(0, 0, wsize.w, wsize.h);

  for (let i = 0; i < stars.length; ++i) {
    drawStar(ctx, stars[i].p.x, stars[i].p.y, stars[i].r);
  }

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
        particle(gameState, rnd(3, 8) * (asteroid_levels - asteroid.level), {
          x: asteroid.p.x,
          y: asteroid.p.y,
          v0x: [-1, 1],
          v0y: [-1, 1],
          v0v: [0.08, 0.12],
          v1x: 0,
          v1y: 0,
          v1v: 0,
          cr0: 255,
          cg0: 255,
          cb0: 255,
          ca0: [0.5, 1],
          ca1: 0,
          r0: [2, 5],
          r1: 0,
          delay: [0, 50],
          life: [1000, 2000],
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

    for (let i = 0; i < asteroids.length; ++i) {
      let asteroid = asteroids[i];
      let d = distance(player.p, asteroid.p);
      if (d < player.r + asteroid.size / 2) {
        if (player.shield) {
          player.v = asteroid.v.copy().sub(player.v).scale(0.85);
          asteroid.v = asteroid.v.copy().sub(player.v).scale(0.85);
          asteroid.p.add(
            asteroid.v
              .copy()
              .normalize()
              .scale(player.r + asteroid.size / 2 - d)
          );
        } else {
          if (!gameState.player_destroyed) {
            gameState.player_destroyed = true;
            particle(gameState, rnd(35, 50), {
              x: player.p.x,
              y: player.p.y,
              v0x: [-1, 1],
              v0y: [-1, 1],
              v0v: [0.1, 0.25],
              v1x: 0,
              v1y: 0,
              v1v: 0,
              cr0: [200, 255],
              cg0: [128, 200],
              cb0: 0,
              ca0: [0.55, 0.75],
              ca1: 0,
              r0: [6, 8],
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

  updateParticles(dt, gameState);
  drawParticles(gameState);

  if (asteroids.length === 0) {
    ctx.lineWidht = 4;
    ctx.strokeStyle = "black";
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, wsize.w, wsize.h);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.font = "80px monospace";
    ctx.fillText("You Win", wsize.w / 2, wsize.h / 2 - 50);
    ctx.font = "22px monospace";
    ctx.fillText("Press Enter to Restart", wsize.w / 2, wsize.h / 2 + 50);
    if (input.Enter) {
      location.reload();
    }
  } else if (gameState.player_destroyed) {
    ctx.lineWidht = 4;
    ctx.strokeStyle = "black";
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, wsize.w, wsize.h);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.font = "80px monospace";
    ctx.fillText("Game Over", wsize.w / 2, wsize.h / 2 - 50);
    ctx.font = "22px monospace";
    ctx.fillText("Press Enter to Restart", wsize.w / 2, wsize.h / 2 + 50);
    if (input.Enter) {
      location.reload();
    }
  } else {
    updatePlayer(dt, player, input, gameState);
    drawPlayer(player, gameState);
    drawPlayerGui(player);
  }
  if (debug) {
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.fillText((1000 / dt).toFixed(2), wsize.w - 10, 10);
  }
}

function updatePlayer(dt, player, input, gameState) {
  let valid_lasers = [];
  for (let i = 0; i < player.lasers.length; ++i) {
    let laser = player.lasers[i];
    if (laser.destroyed) continue;
    laser.p.add(laser.v.copy().scale(dt * laser_speed));
    if (point_inside(laser.p, Vec2.origin, wsize)) {
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

  if (actions.Accelerate) {
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
      if (x < 0) x += wsize.w;
      else if (x > wsize.w) x -= wsize.w;
      if (y < 0) y += wsize.h;
      else if (y > wsize.h) y += wsize.h;
      let p = new Vec2(x, y);
      player.thrusts.push({
        p,
        age: 0,
      });
    }
  }

  if (actions.Shield && player.shield_charge > 0) {
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

  if (!player.shield && actions.Fire) {
    if (player.laser_cooldown <= 0) {
      player.laser_cooldown = laser_cooldown;
      let v = Vec2.fromAngle(player.angle);
      let x = player.p.x + v.x * player.h * 0.5;
      let y = player.p.y + v.y * player.h * 0.5;
      if (x < 0) x += wsize.w;
      else if (x > wsize.w) x -= wsize.w;
      if (y < 0) y += wsize.h;
      else if (y > wsize.h) y += wsize.h;
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

  player.p.add(player.v.copy().scale(dt));

  if (player.p.x - player.w > wsize.w) {
    player.p.x -= wsize.x;
  } else if (player.p.x + player.w < 0) {
    player.p.x += wsize.x;
  }
  if (player.p.y - player.h > wsize.y) {
    player.p.y -= wsize.y;
  } else if (player.p.y + player.h < 0) {
    player.p.y += wsize.y;
  }
}

function drawPlayer(player) {
  drawPlayerShip(ctx, player.p.x, player.p.y, player.angle, player.w, player.h);
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
  if (player.p.x - player.w < 0) xx = player.p.x + wsize.w;
  else if (player.p.x + player.w > wsize.w) xx = player.p.x - wsize.w;
  if (player.p.y - player.h < 0) yy = player.p.y + wsize.h;
  else if (player.p.y + player.h > wsize.h) yy = player.p.y - wsize.h;

  if (xx !== null || yy !== null) {
    if (xx === null) xx = player.p.x;
    if (yy === null) yy = player.p.y;
    drawPlayerShip(ctx, xx, yy, player.angle, player.w, player.h);
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

  if (asteroid.p.x - asteroid.size / 2 > wsize.w) asteroid.p.x -= wsize.w;
  else if (asteroid.p.x + asteroid.size / 2 < 0) asteroid.p.x += wsize.w;
  if (asteroid.p.y - asteroid.size / 2 > wsize.h) asteroid.p.y -= wsize.h;
  else if (asteroid.p.y + asteroid.size / 2 < 0) asteroid.p.y += wsize.h;
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
  if (asteroid.p.x - asteroid.size / 2 < 0) xx = asteroid.p.x + wsize.w;
  else if (asteroid.p.x + asteroid.size / 2 > wsize.w)
    xx = asteroid.p.x - wsize.w;
  if (asteroid.p.y - asteroid.size / 2 < 0) yy = asteroid.p.y + wsize.h;
  else if (asteroid.p.y + asteroid.size / 2 > wsize.h)
    yy = asteroid.p.y - wsize.h;

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
