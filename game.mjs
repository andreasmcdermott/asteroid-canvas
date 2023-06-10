import { Vec2, DEG2RAD, RAD2DEG, PI, PI2, rnd } from "./math.mjs";
import {
  point_inside,
  wrapDeg,
  clampMin,
  clampMax,
  line_intersect_circle,
  distance,
} from "./utils.mjs";

let ctx;
let w, h;
let lt;
let asteroid_levels = 3;
let asteroid_sizes = [
  [72, 112],
  [48, 64],
  [16, 32],
];
let asteroid_speed = [0.01, 0.175];
let asteroid_rot_speed = [0.05, 0.15];
let player_acc = 0.0006;
let player_max_speed = 0.3;
let player_rot_speed = 0.5;
let input = {};
let player;
let asteroids;
let stars;
let player_h = 64;
let player_w = 24;
let laser_speed = 0.85;
let laser_cooldown = 200;
let laser_len = 32;
let thrust_size = player_h / 5;
let thrust_max_age = 300;
let thrust_cooldown = 30;
let max_shield_charge = 1000;
let shield_recharge_rate = 1;
let shield_discharge_cooldown = 2500;
let debug = false;
let mouse_active = false;
let wmin = Vec2.origin();
let wmax;
let player_destroyed = false;

export function init(canvas) {
  w = window.innerWidth;
  h = window.innerHeight;
  wmax = new Vec2(w, h);
  canvas.setAttribute("width", w);
  canvas.setAttribute("height", h);
  ctx = canvas.getContext("2d");

  window.addEventListener(
    "resize",
    () => {
      w = window.innerWidth;
      h = window.innerHeight;
      wmax.set(w, h);
      canvas.setAttribute("width", w);
      canvas.setAttribute("height", h);
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

      if (e.key === "Backspace") debug = !debug;
    },
    { passive: true }
  );

  window.addEventListener(
    "mousemove",
    (e) => {
      // mouse_active = true;
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

  initConstants();
  initLevel();
  lt = performance.now();
  requestAnimationFrame(nextFrame);
}

function initConstants() {
  stars = [];
  let num_stars = rnd(50, 100);
  for (let i = 0; i < num_stars; ++i) {
    stars.push({
      p: new Vec2(rnd(w), rnd(h)),
      r: rnd(1, 3),
    });
  }
}

function initLevel() {
  player = {
    w: player_w,
    h: player_h,
    r: player_h / 1.7,
    p: new Vec2(w / 2, h / 2),
    angle: 270,
    rot: 0,
    v: Vec2.origin(),
    thrusts: [],
    lasers: [],
    laser_cooldown: 0,
    thrust_cooldown: 0,
    shield: false,
    shield_charge: max_shield_charge,
    shield_cooldown_timer: 0,
  };

  asteroids = [];
  let lvl = 0;
  for (let i = 0; i < 3; ++i) {
    asteroids.push({
      level: lvl,
      size: rnd(...asteroid_sizes[lvl]),
      p: new Vec2(rnd(w), rnd(h)),
      angle: rnd(360),
      rot: rnd(-1, 1) * rnd(...asteroid_rot_speed),
      v: new Vec2(rnd(-1, 1), rnd(-1, 1))
        .normalize()
        .scale(rnd(...asteroid_speed)),
    });
  }
}

function nextFrame(t) {
  let dt = t - lt; // dt is ~16ms
  lt = t;
  gameLoop(dt);
  requestAnimationFrame(nextFrame);
}

function gameLoop(dt) {
  ctx.clearRect(0, 0, w, h);

  for (let i = 0; i < stars.length; ++i) {
    ctx.beginPath();
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.ellipse(stars[i].p.x, stars[i].p.y, stars[i].r, stars[i].r, 0, 0, PI2);
    ctx.fill();
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
      updateAsteroid(dt, asteroid);
      drawAsteroid(asteroid);
      valid_asteroids.push(asteroid);
    }
  }
  asteroids = valid_asteroids;

  for (let i = 0; i < asteroids.length; ++i) {
    let asteroid = asteroids[i];
    let d = distance(player.p, asteroid.p);
    if (d < player.r + asteroid.size / 2) {
      if (player.shield) {
        player.v = player.p
          .copy()
          .sub(asteroid.p)
          .normalize()
          .scale(player.v.len() * 0.75);
        asteroid.v = asteroid.p
          .copy()
          .sub(player.p)
          .normalize()
          .scale(player.v.len() * 0.5);
        asteroid.p.add(
          asteroid.v
            .copy()
            .normalize()
            .scale(player.r + asteroid.size / 2 - d)
        );
      } else {
        player_destroyed = true;
        break;
      }
    }
  }

  if (asteroids.length === 0) {
    ctx.lineWidht = 4;
    ctx.strokeStyle = "black";
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.font = "80px monospace";
    ctx.fillText("You Win", w / 2, h / 2 - 50);
    ctx.font = "22px monospace";
    ctx.fillText("Press Space to Start", w / 2, h / 2 + 50);
  } else if (player_destroyed) {
    ctx.lineWidht = 4;
    ctx.strokeStyle = "black";
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.font = "80px monospace";
    ctx.fillText("Game Over", w / 2, h / 2 - 50);
    ctx.font = "22px monospace";
    ctx.fillText("Press Space to Start", w / 2, h / 2 + 50);
  } else {
    updatePlayer(dt, player);
    drawPlayer(player);

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
  if (debug) {
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.fillText((1000 / dt).toFixed(2), w - 10, 10);
  }
}

function updatePlayer(dt, player) {
  let valid_lasers = [];
  for (let i = 0; i < player.lasers.length; ++i) {
    let laser = player.lasers[i];
    if (laser.destroyed) continue;
    laser.p.add(laser.v.copy().scale(dt * laser_speed));
    if (point_inside(laser.p, wmin, wmax)) {
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
    mouse_active = false;
  }
  if (actions.RotRight) {
    player.rot = 1;
    mouse_active = false;
  }
  if (actions.RotLeft === actions.RotRight) player.rot = 0;

  if (mouse_active) {
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
      if (x < 0) x += w;
      else if (x > w) x -= w;
      if (y < 0) y += h;
      else if (y > h) y += h;
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
      if (x < 0) x += w;
      else if (x > w) x -= w;
      if (y < 0) y += h;
      else if (y > h) y += h;
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

  if (player.p.x - player.w > w) {
    player.p.x -= w;
  } else if (player.p.x + player.w < 0) {
    player.p.x += w;
  }
  if (player.p.y - player.h > h) {
    player.p.y -= h;
  } else if (player.p.y + player.h < 0) {
    player.p.y += h;
  }
}

function drawPlayer(player) {
  drawPlayerShip(player.p.x, player.p.y, player.angle, player.w, player.h);
  if (player.shield) {
    drawPlayerShield(player.p.x, player.p.y, player.angle, player.r);
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
  if (player.p.x - player.w < 0) xx = player.p.x + w;
  else if (player.p.x + player.w > w) xx = player.p.x - w;
  if (player.p.y - player.h < 0) yy = player.p.y + h;
  else if (player.p.y + player.h > h) yy = player.p.y - h;

  if (xx !== null || yy !== null) {
    if (xx === null) xx = player.p.x;
    if (yy === null) yy = player.p.y;
    drawPlayerShip(xx, yy, player.angle, player.w, player.h);
    if (player.shield) {
      drawPlayerShield(xx, yy, player.angle, player.h / 1.7);
    }
  }
}

function updateAsteroid(dt, asteroid) {
  asteroid.angle = wrapDeg(asteroid.angle + asteroid.rot * dt);
  asteroid.p.add(asteroid.v.copy().scale(dt));

  if (asteroid.p.x - asteroid.size / 2 > w) asteroid.p.x -= w;
  else if (asteroid.p.x + asteroid.size / 2 < 0) asteroid.p.x += w;
  if (asteroid.p.y - asteroid.size / 2 > h) asteroid.p.y -= h;
  else if (asteroid.p.y + asteroid.size / 2 < 0) asteroid.p.y += h;
}

function drawAsteroid(asteroid) {
  drawRoundRect(
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
  if (asteroid.p.x - asteroid.size / 2 < 0) xx = asteroid.p.x + w;
  else if (asteroid.p.x + asteroid.size / 2 > w) xx = asteroid.p.x - w;
  if (asteroid.p.y - asteroid.size / 2 < 0) yy = asteroid.p.y + h;
  else if (asteroid.p.y + asteroid.size / 2 > h) yy = asteroid.p.y - h;

  if (xx !== null && yy !== null) {
    drawRoundRect(
      xx,
      asteroid.p.y,
      asteroid.angle,
      asteroid.size,
      asteroid.size,
      asteroid.size / 5,
      asteroid_levels - asteroid.level + 1
    );
    drawRoundRect(
      asteroid.p.x,
      yy,
      asteroid.angle,
      asteroid.size,
      asteroid.size,
      asteroid.size / 5,
      asteroid_levels - asteroid.level + 1
    );
    drawRoundRect(
      xx,
      asteroid.p.y,
      asteroid.angle,
      asteroid.size,
      asteroid.size,
      asteroid.size / 5,
      asteroid_levels - asteroid.level + 1
    );
    drawRoundRect(
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

function drawRoundRect(
  x,
  y,
  angle,
  w,
  h,
  r,
  lineWidth = 2,
  strokeStyle = "white",
  fillStyle = "black"
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle * DEG2RAD);
  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.roundRect(w * -0.5, h * -0.5, w, h, r);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawPlayerShip(
  x,
  y,
  angle,
  w,
  h,
  lineWidth = 2,
  strokeStyle = "white",
  fillStyle = "black"
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle * DEG2RAD);
  ctx.lineWidth = lineWidth;
  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = strokeStyle;
  // Wings
  ctx.beginPath();
  ctx.moveTo(h * -0.5, 0);
  ctx.lineTo(h * -0.4, w);
  ctx.lineTo(h * -0.1, w);
  ctx.lineTo(0, 0);
  ctx.lineTo(h * -0.1, -w);
  ctx.lineTo(h * -0.4, -w);
  ctx.lineTo(h * -0.5, 0);
  ctx.fill();
  ctx.stroke();
  // Body
  ctx.beginPath();
  ctx.moveTo(h * 0.5, 0);
  ctx.lineTo(h * -0.5, w * 0.5);
  ctx.lineTo(h * -0.5, w * -0.5);
  ctx.lineTo(h * 0.5, 0);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawPlayerShield(x, y, angle, r) {
  let gradient = ctx.createRadialGradient(0, 0, r / 8, 0, 0, r * 2);
  gradient.addColorStop(0, "rgba(128, 255, 128, 0.75)");
  gradient.addColorStop(1, "rgba(100, 255, 100, 0.1)");

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle * DEG2RAD);
  ctx.lineWidth = 1;
  ctx.fillStyle = gradient;
  ctx.strokeStyle = "rgba(100, 255, 100, 1)";
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r, 0, 0, PI2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
