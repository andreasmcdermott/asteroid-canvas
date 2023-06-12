import { Vec2 } from "./utils.mjs";

export class Entity {
  constructor() {
    this.p = new Vec2();
    this.active = false;
  }
  copyFrom(e) {
    let keys = Object.keys(e);
    for (let i = 0; i < keys.length; ++i) {
      let key = keys[i];
      if (!e[key] || typeof e[key] !== "object") this[key] = e[key];
      else this[key].copyFrom(e[key]);
    }
    return this;
  }
  activate(gameState, x, y) {
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
  static copyFrom(e, Clazz) {
    let newList = new EntityList(e.size, Clazz);
    newList.activeCount = 0;
    for (let i = 0; i < newList.size; ++i) {
      newList.list[i].copyFrom(e.list[i]);
      if (newList.list[i].active) newList.activeCount++;
    }
    newList.index = e.index;
    return newList;
  }
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

  push(gameState, ...args) {
    this.list[this.index++].activate(gameState, ...args);
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
