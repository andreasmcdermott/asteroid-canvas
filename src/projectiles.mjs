import { Entity } from "./entities.mjs";
import { DEG2RAD, Vec2, point_inside } from "./utils.mjs";

let imgw = 32;
let imgh = 64;

let laserw = 10;
let laserh = 30;

export class Projectile extends Entity {
  constructor() {
    super();
    this.angle = 0;
    this.v = new Vec2();
    this.speed = 0;
    this.life = 0;
  }

  activate(gameState, x, y, angle) {
    super.activate(gameState, x, y);
    this.angle = angle - 270;
    this.v = Vec2.fromAngle(angle);
    this.speed = gameState.settings.laser_speed;
    this.life = 0;
    this.len = laserh;
  }

  draw(ctx, gameState) {
    drawLaser(gameState, this.p.x, this.p.y, laserw, laserh, this.angle);
  }

  update(dt, gameState) {
    this.p.add(this.v.copy().scale(dt * this.speed));
    if (!point_inside(this.p, Vec2.origin, gameState.win)) this.deactivate();
  }
}

export function drawLaser(gameState, x, y, w, h, angle) {
  let { ctx } = gameState;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle * DEG2RAD);
  ctx.drawImage(gameState.assets.laser, -w / 2, -h / 2, w, h);
  ctx.restore();

  ctx.fillStyle = "white";
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
}

export function initLaser(gameState) {
  if (!gameState.assets.laser) {
    const offscreen = new OffscreenCanvas(32, 64);
    const ctx = offscreen.getContext("2d");

    ctx.save();
    ctx.translate(imgw / 2, imgh / 2);
    ctx.rotate(180 * DEG2RAD);
    ctx.globalCompositeOperation = "source-out";
    ctx.drawImage(
      gameState.assets.tilesheet,
      464,
      448,
      imgw,
      imgh,
      -imgw / 2,
      -imgh / 2,
      imgw,
      imgh
    );
    ctx.restore();

    ctx.save();
    ctx.translate(imgw / 2, imgh / 2);
    ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(
      gameState.assets.tilesheet,
      690,
      160,
      60,
      128,
      -imgw / 2,
      -imgh / 2,
      imgw,
      imgh
    );
    ctx.restore();
    ctx.save();
    ctx.translate(imgw / 2, imgh / 2);
    ctx.rotate(180 * DEG2RAD);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(
      gameState.assets.tilesheet,
      464,
      448,
      imgw,
      imgh,
      -imgw / 2,
      -imgh / 2,
      imgw,
      imgh
    );
    ctx.restore();
    gameState.assets.laser = offscreen;
  }
}
