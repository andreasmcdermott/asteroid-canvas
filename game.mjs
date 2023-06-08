let DEG2RAD = Math.PI / 180;

let mapKeyName = (key) => (key === " " ? "Space" : key);
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
let player_h = 64;
let player_w = 24;
let thrust_size = player_h / 5;

export function init(canvas) {
  w = canvas.offsetWidth;
  h = canvas.offsetHeight;
  ctx = canvas.getContext("2d");

  window.addEventListener("keydown", (e) => {
    input[mapKeyName(e.key)] = true;
  });

  window.addEventListener("keyup", (e) => {
    delete input[mapKeyName(e.key)];
  });

  initLevel();
  lt = performance.now();
  requestAnimationFrame(nextFrame);
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

class Vec2 {
  static copy(v) {
    return new Vec2(v.x, v.y);
  }

  static fromAngle(angle) {
    let rad = angle * DEG2RAD;
    return new Vec2(Math.cos(rad), Math.sin(rad)).normalize();
  }

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  len() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }
  scale(n) {
    this.x *= n;
    this.y *= n;
    return this;
  }
  normalize() {
    let len = this.len();
    this.x /= len;
    this.y /= len;
    return this;
  }
}

function nextFrame(t) {
  let dt = t - lt;
  lt = t;
  gameLoop(dt);
  requestAnimationFrame(nextFrame);
}

function gameLoop(dt) {
  ctx.clearRect(0, 0, w, h);

  updatePlayer(dt, player);
  drawPlayer(player);

  for (let i = 0; i < asteroids.length; ++i) {
    updateAsteroid(dt, asteroids[i]);
    drawAsteroid(asteroids[i]);
  }
}

function addThrusts(player) {
  player.thrusts = [
    Vec2.copy(player.p),
    Vec2.copy(player.p),
    Vec2.copy(player.p),
  ];
}

function updatePlayer(dt, player) {
  const actions = {
    RotLeft: input.ArrowLeft || input.a,
    RotRight: input.ArrowRight || input.d,
    Accelerate: input.ArrowUp || input.w,
    Fire: input.Space,
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
    if (!player.thrusts.length) {
      addThrusts(player);
    } else {
      for (let i = player.thrusts.length - 1; i > 0; --i) {
        let self = player.thrusts[i];
        let prev = player.thrusts[i - 1];
        self.x = self.x + (prev.x - self.x) / 2;
        self.y = self.y + (prev.y - self.y) / 2;
      }
      player.thrusts[0].x = player.p.x;
      player.thrusts[0].y = player.p.y;
    }
  } else {
    player.thrusts = [];
  }

  player.p.x += player.v.x * dt;
  player.p.y += player.v.y * dt;
  player.angle += player.rot * player_rot_speed * dt;

  if (player.p.x - player.w > w) {
    player.p.x = -player.w;
    addThrusts(player);
  } else if (player.p.x + player.w < 0) {
    player.p.x = w + player.w;
    addThrusts(player);
  }
  if (player.p.y - player.h > h) {
    player.p.y = -player.h;
    addThrusts(player);
  } else if (player.p.y + player.h < 0) {
    player.p.y = h + player.h;
    addThrusts(player);
  }
}

function drawPlayer(player) {
  ctx.save();
  ctx.translate(player.p.x, player.p.y);
  ctx.rotate(player.angle * DEG2RAD);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.moveTo(player.h * 0.5, 0);
  ctx.lineTo(player.h * -0.5, player.w * 0.5);
  ctx.lineTo(player.h * -0.5, player.w * -0.5);
  ctx.lineTo(player.h * 0.5, 0);
  ctx.stroke();
  ctx.restore();

  if (player.thrusts.length) {
    for (let i = 0; i < player.thrusts.length; ++i) {
      let self = player.thrusts[i];
      ctx.save();
      ctx.translate(self.x, self.y);
      ctx.rotate(player.angle * DEG2RAD);
      ctx.lineWidth = 2;
      let size =
        thrust_size * ((player.thrusts.length - i) / player.thrusts.length);
      ctx.strokeStyle = ["orange", "gold", "yellow"][Math.min(i, 2)];
      ctx.beginPath();
      ctx.roundRect(player.h * -0.5 - size, -size / 2, size, size, size / 4);
      ctx.stroke();
      ctx.restore();
    }
  }
}

function updateAsteroid(dt, asteroid) {
  asteroid.angle += asteroid.rot * asteroid_rot_speed * dt;
  if (asteroid.angle >= 360) asteroid.angle -= 360;
  asteroid.p.x += asteroid.v.x * asteroid_speed;
  asteroid.p.y += asteroid.v.y * asteroid_speed;
  if (asteroid.p.x - asteroid.r > w) asteroid.p.x = -asteroid.r;
  else if (asteroid.p.x + asteroid.r < 0) asteroid.p.x = w + asteroid.r;
  if (asteroid.p.y - asteroid.r > h) asteroid.p.y = -asteroid.r;
  else if (asteroid.p.y + asteroid.r < 0) asteroid.p.y = h + asteroid.r;
}

function drawAsteroid(asteroid) {
  ctx.save();
  ctx.translate(asteroid.p.x, asteroid.p.y);
  ctx.rotate(asteroid.angle * DEG2RAD);
  ctx.strokeStyle = "white";
  ctx.lineWidth = asteroid_levels - asteroid.level + 1;
  ctx.beginPath();
  ctx.roundRect(
    asteroid.r * -0.5,
    asteroid.r * -0.5,
    asteroid.r,
    asteroid.r,
    asteroid.r / 5
  );
  ctx.stroke();
  ctx.restore();
}
