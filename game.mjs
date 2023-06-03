let ctx2d;
let w, h;
let lt;

export function init(canvas) {
  w = canvas.offsetWidth;
  h = canvas.offsetHeight;
  ctx2d = canvas.getContext("2d");
  lt = performance.now();
  requestAnimationFrame(nextFrame);
}

function nextFrame(t) {
  let dt = t - lt;
  lt = t;
  gameLoop(dt);
  requestAnimationFrame(nextFrame);
}

function gameLoop(dt) {
  ctx2d.clearRect(0, 0, w, h);
}
