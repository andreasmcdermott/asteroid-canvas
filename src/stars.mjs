import { Rgba, PI2, clampMin, rnd } from "./utils.mjs";
import { Entity } from "./entities.mjs";

export class Star extends Entity {
  static color = new Rgba(255, 255, 255, 0.75);

  constructor() {
    super();
    this.r = 0;
  }
  activate(gameState, x, y, r) {
    super.activate(gameState, x, y);
    this.r = r;
  }
  draw(ctx, gameState) {
    ctx.beginPath();
    ctx.fillStyle = Star.color;
    ctx.ellipse(this.p.x, this.p.y, this.r, this.r, 0, 0, PI2);
    ctx.fill();
  }
}
