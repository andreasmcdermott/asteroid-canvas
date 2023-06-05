let DEG2RAD = Math.PI / 180;

let mapKeyName = (key) => (key === " " ? "Space" : key);
let ctx2d;
let w, h;
let lt;
let asteroid_initial_width = [1, 1.5];
let assets = {};
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

  loadAssets(() => {
    initLevel();
    lt = performance.now();
    requestAnimationFrame(nextFrame);
  });
}

async function loadAssets(onDone) {
  await Promise.all([
    loadImgAsset("spaceship"),
    loadImgAsset("ufo"),
    loadImgAsset("asteroid_0"),
    loadImgAsset("asteroid_1"),
  ]);
  onDone();
}

function initLevel() {
  player = {
    sprite: assets.spaceship,
    r: assets.spaceship.width / 2,
    scale: 0.5,
    x: w / 2,
    y: h / 2,
    angle: 90,
  };
  asteroids = [];
  for (let i = 0; i < 3; ++i) {
    let sprite = [assets.asteroid_0, assets.asteroid_1][
      Math.floor(Math.random() * 2)
    ];
    let scale =
      Math.random() * (asteroid_initial_width[1] - asteroid_initial_width[0]) +
      asteroid_initial_width[0];
    let r = sprite.width * 0.5;
    console.log(scale, r, sprite.width);
    asteroids.push({
      sprite,
      r,
      scale,
      x: Math.random() * w,
      y: Math.random() * h,
      angle: Math.random() * 360,
      rot: Math.random() * 0.5 - 0.25,
    });
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
  draw(player);

  for (let i = 0; i < asteroids.length; ++i) {
    update(dt, asteroids[i]);
    draw(asteroids[i]);
  }
}

function update(dt, entity) {
  entity.angle += entity.rot * dt;
  if (entity.angle >= 360) entity.angle -= 360;
}

function draw(entity) {
  ctx2d.save();
  ctx2d.translate(entity.x, entity.y);
  ctx2d.rotate(entity.angle * DEG2RAD);
  ctx2d.scale(entity.scale, entity.scale);
  ctx2d.drawImage(entity.sprite, -entity.r, -entity.r);
  ctx2d.restore();
}

function loadImgAsset(name) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = `./assets/${name}.png`;
    img.onload = resolve;
    assets[name] = img;
  });
}
