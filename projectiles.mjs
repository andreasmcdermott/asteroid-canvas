import { Entity } from "./entities.mjs";
import { Vec2, point_inside } from "./utils.mjs";

let laser_speed = 0.85;
let laser_len = 32;

export class Projectile extends Entity {
  constructor() {
    super();
    this.angle = 0;
    this.v = new Vec2();
    this.len = 0;
    this.speed = 0;
  }

  activate(x, y, angle) {
    super.activate(x, y);
    this.angle = angle;
    this.v = Vec2.fromAngle(angle);
    this.len = laser_len;
    this.speed = laser_speed;
  }

  draw(ctx, gameState) {
    ctx.save();
    ctx.translate(this.p.x, this.p.y);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "skyblue";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.v.x * this.len, this.v.y * this.len);
    ctx.stroke();
    ctx.restore();
  }

  update(dt, gameState) {
    this.p.add(this.v.copy().scale(dt * this.speed));
    if (!point_inside(this.p, Vec2.origin, gameState.win)) this.deactivate();
  }
}
