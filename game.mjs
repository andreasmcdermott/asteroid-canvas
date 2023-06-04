let DEG2RAD = Math.PI / 180;

let mapKeyName = (key) => (key === " " ? "Space" : key);
let ctx2d;
let w, h;
let lt;
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
    asteroids.push({
      sprite: [assets.asteroid_0, assets.asteroid_1][
        Math.floor(Math.random() * 2)
      ],
      r: assets.asteroid_0.width / 2,
      scale: Math.random() * 0.5 + 1,
      x: (w / 5) * (i + 1),
      y: h / 4,
      angle: Math.random() * 360,
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

  draw(player);

  for (let i = 0; i < asteroids.length; ++i) {
    draw(asteroids[i]);
  }
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
