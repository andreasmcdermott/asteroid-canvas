import { Entity } from "./entities.mjs";
import { Vec2, point_inside } from "./utils.mjs";

let laser_speed = 0.85;
let laser_len = 32;

export class Projectile extends Entity {
  constructor() {
    super();
    this.angle = 0;
    this.v = new Vec2();
  }

  activate(x, y, angle) {
    super.activate(x, y);
    this.angle = angle;
    this.v = Vec2.fromAngle(angle);
  }

  draw(ctx, gameState) {
    ctx.save();
    ctx.translate(this.p.x, this.p.y);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "skyblue";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.v.x * laser_len, this.v.y * laser_len);
    ctx.stroke();
    ctx.restore();
  }

  update(dt, gameState) {
    this.p.add(this.v.copy().scale(dt * laser_speed));
    if (!point_inside(this.p, Vec2.origin, gameState.win)) {
      this.deactivate();
    }
  }
}
