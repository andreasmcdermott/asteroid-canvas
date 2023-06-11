import { Vec2 } from "./utils.mjs";

export class Entity {
  constructor() {
    this.p = new Vec2();
    this.active = false;
  }
  activate(x, y) {
    this.active = true;
    this.p.set(x, y);
  }
  deactivate() {
    this.active = false;
  }
  draw() {}
  update() {}
}

export class EntityList {
  constructor(size, Clazz) {
    this.list = Array.from({ length: size }, () => new Clazz());
    this.index = 0;
  }

  get size() {
    return this.list.length;
  }

  get activeCount() {
    let c = 0;
    for (let i = 0; i < this.list.length; ++i) {
      if (this.list[i].active) c++;
    }
    return c;
  }

  reset() {
    for (let i = 0; i < this.list.length; ++i) {
      this.list[i].deactivate();
    }
    this.index = 0;
  }

  push(...args) {
    this.list[this.index++].activate(...args);
    if (this.index >= this.list.length) this.index = 0;
  }

  drawAll(ctx, gameState) {
    for (let i = 0; i < this.list.length; ++i) {
      if (this.list[i].active) {
        this.list[i].draw(ctx, gameState);
      }
    }
  }

  updateAll(dt, gameState) {
    for (let i = 0; i < this.list.length; ++i) {
      if (this.list[i].active) {
        this.list[i].update(dt, gameState);
      }
    }
  }
}
