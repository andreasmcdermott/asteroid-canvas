import { Vec2, DEG2RAD } from "./math.mjs";

let ctx;
let w, h;
let lt;
let asteroid_levels = 3;
let asteroid_widths = [
  [72, 112],
  [48, 64],
  [16, 32],
];
let asteroid_speed = 2;
let asteroid_rot_speed = 0.1;
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

export function init(canvas) {
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.setAttribute("width", w);
  canvas.setAttribute("height", h);
  ctx = canvas.getContext("2d");

  window.addEventListener(
    "resize",
    () => {
      w = window.innerWidth;
      h = window.innerHeight;
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
    },
    { passive: true }
  );

  initConstants();
  initLevel();
  lt = performance.now();
  requestAnimationFrame(nextFrame);
}

function initConstants() {
  stars = [];
  let num_stars = Math.floor(Math.random() * 50) + 50;
  for (let i = 0; i < num_stars; ++i) {
    stars.push({
      p: new Vec2(Math.random() * w, Math.random() * h),
      r: Math.random() * 2 + 1,
    });
  }
}

function initLevel() {
  player = {
    w: player_w,
    h: player_h,
    p: new Vec2(w / 2, h / 2),
    angle: 270,
    rot: 0,
    v: new Vec2(0, 0),
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
      r:
        Math.random() * (asteroid_widths[lvl][1] - asteroid_widths[lvl][0]) +
        asteroid_widths[lvl][0],
      p: new Vec2(Math.random() * w, Math.random() * h),
      angle: Math.random() * 360,
      rot: Math.random() * 2 - 1,
      v: new Vec2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize(),
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
    ctx.ellipse(
      stars[i].p.x,
      stars[i].p.y,
      stars[i].r,
      stars[i].r,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  updatePlayer(dt, player);
  drawPlayer(player);

  let valid_asteroids = [];
  for (let i = 0; i < asteroids.length; ++i) {
    let asteroid = asteroids[i];

    let destroyed = false;
    for (let i = 0; i < player.lasers.length; ++i) {
      let laser = player.lasers[i];
      if (laser.destroyed) continue;
      if (
        laser.p.x < asteroid.p.x + asteroid.r / 2 &&
        laser.p.x > asteroid.p.x - asteroid.r / 2 &&
        laser.p.y < asteroid.p.y + asteroid.r / 2 &&
        laser.p.y > asteroid.p.y - asteroid.r / 2
      ) {
        laser.destroyed = true;
        destroyed = true;
        let lvl = asteroid.level + 1;
        if (lvl < asteroid_levels) {
          for (let i = 0; i < 4; ++i) {
            valid_asteroids.push({
              level: lvl,
              r:
                Math.random() *
                  (asteroid_widths[lvl][1] - asteroid_widths[lvl][0]) +
                asteroid_widths[lvl][0],
              p: Vec2.copy(asteroid.p),
              angle: Math.random() * 360,
              rot: Math.random() * 2 - 1,
              v: new Vec2(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
              ).normalize(),
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

  // ctx.fillStyle = "white";
  // ctx.fillText((1000 / dt).toFixed(2), 10, 10);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgb(25, 255, 25)";
  ctx.fillStyle =
    player.shield_charge <= 0
      ? `rgba(255, 25, 25, ${
          player.shield_recharging
            ? Math.sin(
                (player.shield_cooldown_timer / shield_discharge_cooldown) *
                  Math.PI *
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
        : Math.max(0, player.shield_charge / max_shield_charge)),
    16
  );
}

function updatePlayer(dt, player) {
  let valid_lasers = [];
  for (let i = 0; i < player.lasers.length; ++i) {
    let laser = player.lasers[i];
    if (laser.destroyed) continue;
    laser.p.x += laser.v.x * dt * laser_speed;
    laser.p.y += laser.v.y * dt * laser_speed;
    if (
      laser.p.x + laser_len >= 0 &&
      laser.p.x - laser_len <= w &&
      laser.p.y + laser_len >= 0 &&
      laser.p.y - laser_len <= h
    ) {
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

  const actions = {
    RotLeft: input.ArrowLeft || input.a,
    RotRight: input.ArrowRight || input.d,
    Accelerate: input.ArrowUp || input.w,
    Fire: input[" "] || input.q,
    Shield: input.e,
  };

  if (actions.RotLeft) player.rot = -1;
  if (actions.RotRight) player.rot = 1;
  if (actions.RotLeft === actions.RotRight) player.rot = 0;

  if (actions.Accelerate) {
    let acc = Vec2.fromAngle(player.angle);
    player.v.x += acc.x * dt * player_acc;
    player.v.y += acc.y * dt * player_acc;
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
    player.shield_charge = Math.max(player.shield_charge - dt, 0);
    if (player.shield_charge === 0) {
      player.shield_cooldown_timer = shield_discharge_cooldown;
    }
  } else if (player.shield_recharging) {
    player.shield_cooldown_timer = Math.max(player.shield_cooldown_timer - dt);
    if (player.shield_cooldown_timer <= 0) {
      player.shield_charge = Math.min(
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

  player.thrust_cooldown = Math.max(0, player.thrust_cooldown - dt);
  player.laser_cooldown = Math.max(0, player.laser_cooldown - dt);

  player.p.x += player.v.x * dt;
  player.p.y += player.v.y * dt;
  player.angle += player.rot * player_rot_speed * dt;
  if (player.angle > 360) player.angle -= 360;
  if (player.angle < 0) player.angle += 360;

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
    drawPlayerShield(player.p.x, player.p.y, player.angle, player.h / 1.7);
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
      ctx.ellipse(0, 0, size, size, 0, 0, Math.PI * 2);
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
  asteroid.angle += asteroid.rot * asteroid_rot_speed * dt;
  if (asteroid.angle > 360) asteroid.angle -= 360;
  if (asteroid.angle < 0) asteroid.angle += 360;

  asteroid.p.x += asteroid.v.x * asteroid_speed;
  asteroid.p.y += asteroid.v.y * asteroid_speed;

  if (asteroid.p.x - asteroid.r > w) asteroid.p.x -= w;
  else if (asteroid.p.x + asteroid.r < 0) asteroid.p.x += w;
  if (asteroid.p.y - asteroid.r > h) asteroid.p.y -= h;
  else if (asteroid.p.y + asteroid.r < 0) asteroid.p.y += h;
}

function drawAsteroid(asteroid) {
  drawRoundRect(
    asteroid.p.x,
    asteroid.p.y,
    asteroid.angle,
    asteroid.r,
    asteroid.r,
    asteroid.r / 5,
    asteroid_levels - asteroid.level + 1
  );

  let xx = null;
  let yy = null;
  if (asteroid.p.x - asteroid.r < 0) xx = asteroid.p.x + w;
  else if (asteroid.p.x + asteroid.r > w) xx = asteroid.p.x - w;
  if (asteroid.p.y - asteroid.r < 0) yy = asteroid.p.y + h;
  else if (asteroid.p.y + asteroid.r > h) yy = asteroid.p.y - h;

  if (xx !== null && yy !== null) {
    drawRoundRect(
      xx,
      asteroid.p.y,
      asteroid.angle,
      asteroid.r,
      asteroid.r,
      asteroid.r / 5,
      asteroid_levels - asteroid.level + 1
    );
    drawRoundRect(
      asteroid.p.x,
      yy,
      asteroid.angle,
      asteroid.r,
      asteroid.r,
      asteroid.r / 5,
      asteroid_levels - asteroid.level + 1
    );
    drawRoundRect(
      xx,
      asteroid.p.y,
      asteroid.angle,
      asteroid.r,
      asteroid.r,
      asteroid.r / 5,
      asteroid_levels - asteroid.level + 1
    );
    drawRoundRect(
      xx,
      yy,
      asteroid.angle,
      asteroid.r,
      asteroid.r,
      asteroid.r / 5,
      asteroid_levels - asteroid.level + 1
    );
  } else if (xx !== null) {
    drawRoundRect(
      xx,
      asteroid.p.y,
      asteroid.angle,
      asteroid.r,
      asteroid.r,
      asteroid.r / 5,
      asteroid_levels - asteroid.level + 1
    );
  } else if (yy !== null) {
    drawRoundRect(
      asteroid.p.x,
      yy,
      asteroid.angle,
      asteroid.r,
      asteroid.r,
      asteroid.r / 5,
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
  ctx.ellipse(0, 0, r, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
