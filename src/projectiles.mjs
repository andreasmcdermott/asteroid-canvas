import { Entity } from "./entities.mjs";
import { Vec2, point_inside } from "./utils.mjs";

export class Projectile extends Entity {
  static laser_len = 32;

  constructor() {
    super();
    this.angle = 0;
    this.v = new Vec2();
    this.len = 0;
    this.speed = 0;
  }

  activate(gameState, x, y, angle) {
    super.activate(gameState, x, y);
    this.angle = angle;
    this.v = Vec2.fromAngle(angle);
    this.len = Projectile.laser_len;
    this.speed = gameState.settings.laser_speed;
  }

  draw(ctx, gameState) {
    drawLaser(
      ctx,
      this.p.x,
      this.p.y,
      this.v.x * this.len,
      this.v.y * this.len
    );
  }

  update(dt, gameState) {
    this.p.add(this.v.copy().scale(dt * this.speed));
    if (!point_inside(this.p, Vec2.origin, gameState.win)) this.deactivate();
  }
}

export function drawLaser(ctx, x0, y0, x1, y1, lineWidth = 2) {
  ctx.save();
  ctx.translate(x0, y0);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = "skyblue";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.restore();
}
