import { Rgba, SpriteSheetImage, rnd } from "./utils.mjs";
import { Entity } from "./entities.mjs";

export class Star extends Entity {
  static color = new Rgba(255, 255, 255, 0.75);
  static large = new SpriteSheetImage(528, 480, 32);
  static small = new SpriteSheetImage(496, 480, 32);

  constructor() {
    super();
    this.r = 0;
  }
  activate(gameState, x, y, r) {
    super.activate(gameState, x, y);
    this.r = r;
    this.alpha = rnd(0.5, 1);
  }
  draw(ctx, gameState) {
    ctx.globalAlpha = this.alpha;
    let img = this.r >= 7 ? Star.large : Star.small;
    img.draw(
      gameState,
      this.p.x - this.r,
      this.p.y - this.r,
      this.r * 2,
      this.r * 2
    );
    ctx.globalAlpha = 1;
  }
}

export function initStars(gameState) {
  let num_stars = rnd(gameState.stars.size / 2, gameState.stars.size);
  for (let i = 0; i < num_stars; ++i) {
    gameState.stars.push(
      gameState,
      Math.floor(rnd(gameState.win.w - 64)),
      Math.floor(rnd(64, gameState.win.h - 64)),
      Math.floor(rnd(2, 9))
    );
  }
}
