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
    this.activeCount = 0;
  }

  get size() {
    return this.list.length;
  }

  *[Symbol.iterator]() {
    for (let i = 0; i < this.list.length; ++i) {
      if (this.list[i].active) {
        yield this.list[i];
      }
    }
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
    this.activeCount = 0;
    for (let i = 0; i < this.list.length; ++i) {
      if (this.list[i].active) {
        this.activeCount++;
        this.list[i].update(dt, gameState);
      }
    }
  }
}
