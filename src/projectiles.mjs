import { Entity } from "./entities.mjs";
import { DEG2RAD, SpriteSheetImage, Vec2, point_inside } from "./utils.mjs";

// let fade_out = 10;
// let life_span = 1500;

export class Projectile extends Entity {
  static laser = new SpriteSheetImage(464, 448, 32, 64, 180);
  static laserc = new SpriteSheetImage(688, 160, 62, 126, 90);

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
  }

  draw(ctx, gameState) {
    ctx.save();
    ctx.translate(this.p.x, this.p.y);
    ctx.rotate(this.angle * DEG2RAD);
    Projectile.laser.draw(gameState, -5, 0, 10, 30);
    ctx.restore();
    // drawLaser(
    //   ctx,
    //   this.p.x,
    //   this.p.y,
    //   this.v.x * this.len,
    //   this.v.y * this.len
    // );
  }

  update(dt, gameState) {
    this.p.add(this.v.copy().scale(dt * this.speed));
    if (!point_inside(this.p, Vec2.origin, gameState.win)) this.deactivate();
  }
}

export function drawLaser(
  ctx,
  x0,
  y0,
  x1,
  y1,
  strokeStyle = "lightskyblue",
  lineWidth = 2
) {
  ctx.save();
  ctx.translate(x0, y0);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = strokeStyle;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.restore();
}
