let DEG2RAD = Math.PI / 180;

let mapKeyName = (key) => (key === " " ? "Space" : key);
let ctx2d;
let w, h;
let lt;
let asteroid_levels = 3;
let asteroid_widths = [
  [72, 112],
  [48, 64],
  [16, 32],
];
let asteroid_speed = 2;
let input = {};
let player;
let asteroids;

export function init(canvas) {
  w = canvas.offsetWidth;
  h = canvas.offsetHeight;
  ctx2d = canvas.getContext("2d");

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
    w: 24,
    h: 64,
    x: w / 2,
    y: h / 2,
    angle: 270,
    rot: 0,
  };
  asteroids = [];
  let lvl = 0;
  for (let i = 0; i < 3; ++i) {
    asteroids.push({
      level: lvl,
      r:
        Math.random() * (asteroid_widths[lvl][1] - asteroid_widths[lvl][0]) +
        asteroid_widths[lvl][0],
      x: Math.random() * w,
      y: Math.random() * h,
      angle: Math.random() * 360,
      rot: Math.random() * 0.2 - 0.1,
      v: new Vec2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize(),
    });
  }
}

class Vec2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  normalize() {
    let len = Math.sqrt(this.x * this.x + this.y * this.y);
    this.x = this.x / len;
    this.y = this.y / len;
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
  ctx2d.clearRect(0, 0, w, h);

  // updatePlayer();
  drawPlayer(player);

  for (let i = 0; i < asteroids.length; ++i) {
    updateAsteroid(dt, asteroids[i]);
    drawAsteroid(asteroids[i]);
  }
}

function updateAsteroid(dt, asteroid) {
  asteroid.angle += asteroid.rot * dt;
  if (asteroid.angle >= 360) asteroid.angle -= 360;
  asteroid.x += asteroid.v.x * asteroid_speed;
  asteroid.y += asteroid.v.y * asteroid_speed;
  if (asteroid.x - asteroid.r > w) asteroid.x = -asteroid.r;
  else if (asteroid.x + asteroid.r < 0) asteroid.x = w + asteroid.r;
  if (asteroid.y - asteroid.r > h) asteroid.y = -asteroid.r;
  else if (asteroid.y + asteroid.r < 0) asteroid.y = h + asteroid.r;
}

function drawPlayer(player) {
  ctx2d.save();
  ctx2d.translate(player.x, player.y);
  ctx2d.rotate(player.angle * DEG2RAD);
  ctx2d.lineWidth = 2;
  ctx2d.strokeStyle = "white";
  ctx2d.beginPath();
  ctx2d.moveTo(player.h * 0.5, 0);
  ctx2d.lineTo(player.h * -0.5, player.w * 0.5);
  ctx2d.lineTo(player.h * -0.5, player.w * -0.5);
  ctx2d.lineTo(player.h * 0.5, 0);

  // ctx2d.roundRect(
  //   player.w * -0.5,
  //   player.h * -0.5,
  //   player.w,
  //   player.h,
  //   player.w / 10
  // );
  // ctx2d.roundRect(
  //   player.w * -1,
  //   player.h * -0.5,
  //   player.w * 2,
  //   player.h / 4,
  //   player.w / 10
  // );
  ctx2d.stroke();
  ctx2d.restore();
}

function drawAsteroid(asteroid) {
  ctx2d.save();
  ctx2d.translate(asteroid.x, asteroid.y);
  ctx2d.rotate(asteroid.angle * DEG2RAD);
  ctx2d.strokeStyle = "white";
  ctx2d.lineWidth = asteroid_levels - asteroid.level + 1;
  ctx2d.beginPath();
  ctx2d.roundRect(
    asteroid.r * -0.5,
    asteroid.r * -0.5,
    asteroid.r,
    asteroid.r,
    asteroid.r / 10
  );
  ctx2d.stroke();
  ctx2d.restore();
}
