import { Entity } from "./entities.mjs";
import { Vec2, point_inside } from "./utils.mjs";

// let fade_out = 10;
// let life_span = 1500;

export class Projectile extends Entity {
  static laser_len = 32;

  constructor() {
    super();
    this.angle = 0;
    this.v = new Vec2();
    this.len = 0;
    this.speed = 0;
    this.life = 0;
  }

  activate(gameState, x, y, angle) {
    super.activate(gameState, x, y);
    this.angle = angle;
    this.v = Vec2.fromAngle(angle);
    this.len = Projectile.laser_len;
    this.speed = gameState.settings.laser_speed;
    this.life = 0;
  }

  draw(ctx) {
    // if (this.life >= life_span) this.deactivate();
    let strokeStyle = `rgba(135, 206, 250, 1)`; /*${clampMax(
      (life_span - this.life) / fade_out,
      1
    )})`;*/
    drawLaser(
      ctx,
      this.p.x,
      this.p.y,
      this.v.x * this.len,
      this.v.y * this.len,
      strokeStyle
    );
  }

  update(dt, gameState) {
    // this.life += dt;
    this.p.add(this.v.copy().scale(dt * this.speed));

    // TODO: Uncomment to wrap around

    // if (this.p.x - this.v.x * this.len > gameState.win.w)
    //   this.p.x -= gameState.win.x;
    // else if (this.p.x + this.v.x * this.len < 0) this.p.x += gameState.win.x;
    // if (this.p.y - this.v.y * this.len > gameState.win.y)
    //   this.p.y -= gameState.win.y;
    // else if (this.p.y + this.v.y * this.len < 0) this.p.y += gameState.win.y;

    if (!point_inside(this.p, Vec2.origin, gameState.win)) this.deactivate();
  }
}

export function drawLaser(ctx, x0, y0, x1, y1, strokeStyle, lineWidth = 2) {
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
