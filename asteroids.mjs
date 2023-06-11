import { Entity } from "./entities.mjs";
import { Vec2, rnd, wrapDeg, DEG2RAD } from "./utils.mjs";

let asteroid_levels = 3;
let asteroid_sizes = [
  [72, 112],
  [48, 64],
  [16, 32],
];
let asteroid_speed = [0.01, 0.175];
let asteroid_rot_speed = [0.05, 0.15];

export class Asteroid extends Entity {
  constructor() {
    super();
    this.level = -1;
    this.size = 0;
    this.angle = 0;
    this.rot = 0;
    this.v = new Vec2();
  }

  activate(x, y, level) {
    super.activate(x, y);
    this.level = level;
    this.size = rnd(...asteroid_sizes[level]);
    this.angle = rnd(360);
    this.rot = rnd(-1, 1) * rnd(...asteroid_rot_speed);
    this.v
      .set(rnd(-1, 1), rnd(-1, 1))
      .normalize()
      .scale(rnd(...asteroid_speed));
  }

  _draw(ctx, x, y) {
    drawAsteroid(
      ctx,
      x,
      y,
      this.angle,
      this.size,
      asteroid_levels - this.level + 1
    );
  }

  draw(ctx, gameState) {
    let xx = null;
    let yy = null;
    if (this.p.x - this.size / 2 < 0) xx = this.p.x + gameState.win.w;
    else if (this.p.x + this.size / 2 > gameState.win.w)
      xx = this.p.x - gameState.win.w;
    if (this.p.y - this.size / 2 < 0) yy = this.p.y + gameState.win.h;
    else if (this.p.y + this.size / 2 > gameState.win.h)
      yy = this.p.y - gameState.win.h;

    this._draw(ctx, this.p.x, this.p.y);
    if (xx !== null) this._draw(ctx, xx, this.p.y);
    if (yy !== null) this._draw(ctx, this.p.x, yy);
    if (xx !== null && yy !== null) this._draw(ctx, xx, yy);
  }

  update(dt, gameState) {
    this.angle = wrapDeg(this.angle + this.rot * dt);
    this.p.add(this.v.copy().scale(dt));

    if (this.p.x - this.size / 2 > gameState.win.w) this.p.x -= gameState.win.w;
    else if (this.p.x + this.size / 2 < 0) this.p.x += gameState.win.w;
    if (this.p.y - this.size / 2 > gameState.win.h) this.p.y -= gameState.win.h;
    else if (this.p.y + this.size / 2 < 0) this.p.y += gameState.win.h;
  }
}

function drawAsteroid(
  ctx,
  x,
  y,
  angle,
  size,
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
  ctx.roundRect(size * -0.5, size * -0.5, size, size, size / 5);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
