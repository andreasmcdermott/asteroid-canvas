export const PI = Math.PI;
export const PI2 = Math.PI * 2;
export const DEG2RAD = PI / 180;
export const RAD2DEG = 180 / PI;

const MIN_GAMEPAD_ANALOG = 0.2;

export function rnd(first, second) {
  if (arguments.length === 1) return Math.random() * first;
  return Math.random() * (second - first) + first;
}

export function keypressed(gameState, key) {
  return !gameState.input[key] && !!gameState.lastInput[key];
}

export function gamepadButtonPressed(gameState, button) {
  return (
    !!gameState.gamepad &&
    !gameState.input[`gamepad${button}`] &&
    !!gameState.lastInput[`gamepad${button}`]
  );
}

export function gamepadButtonDown(gameState, button) {
  return !!gameState.gamepad && !!gameState.input[`gamepad${button}`];
}

export function gamepadAnalogButtonDown(gameState, button, val) {
  return !!gameState.gamepad && gameState.input[`gamepad${button}`] >= val;
}

export function gamepadStickIsActive(gameState, stick) {
  return (
    !!gameState.gamepad &&
    (Math.abs(gameState.input[`gamepad${stick}`].x) >= MIN_GAMEPAD_ANALOG ||
      Math.abs(gameState.input[`gamepad${stick}`].y) >= MIN_GAMEPAD_ANALOG)
  );
}

export function gamepadAnalogStick(gameState, stick) {
  if (!gameState.gamepad) return null;
  let { x, y } = gameState.input[`gamepad${stick}`];
  return new Vec2(x, y);
}

export function keydown(gameState, key) {
  return !!gameState.input[key];
}

export class ImageAsset {
  constructor(name, x, y, w, h = w, rot = 0) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.rot = rot;
  }

  copyFrom(a) {
    this.name = a.name;
    this.x = a.x;
    this.y = a.y;
    this.w = a.w;
    this.h = a.h;
    this.rot = a.rot;
  }

  draw(gameState, x, y, w, h = w) {
    gameState.ctx.save();
    gameState.ctx.rotate(this.rot * DEG2RAD);
    gameState.ctx.drawImage(
      gameState.assets[this.name],
      this.x,
      this.y,
      this.w,
      this.h,
      x,
      y,
      w,
      h
    );
    gameState.ctx.restore();
  }
}

export class GuiBarImage {
  constructor([lx, ly, lw, lh], [mx, my, mw, mh], [rx, ry, rw, rh]) {
    this.bs = lw;
    this.topleft = new ImageAsset("ui", lx, ly, lw, this.bs);
    this.midleft = new ImageAsset("ui", lx, ly + this.bs, lw, lh - 2 * this.bs);
    this.bottomleft = new ImageAsset("ui", lx, ly + lh - this.bs, lw, this.bs);
    this.topmid = new ImageAsset("ui", mx, my, mw, this.bs);
    this.midmid = new ImageAsset("ui", mx, my + this.bs, mw, mh - 2 * this.bs);
    this.bottommid = new ImageAsset("ui", mx, my + mh - this.bs, mw, this.bs);
    this.topright = new ImageAsset("ui", rx, ry, rw, this.bs);
    this.midright = new ImageAsset(
      "ui",
      rx,
      ry + this.bs,
      rw,
      rh - 2 * this.bs
    );
    this.bottomright = new ImageAsset("ui", rx, ry + rh - this.bs, rw, this.bs);
  }

  draw(gameState, x, y, w, h) {
    w = Math.max(w, this.bs * 2);
    this.topleft.draw(gameState, x, y, this.bs, this.bs);
    this.midleft.draw(gameState, x, y + this.bs, this.bs, h - this.bs * 2);
    this.bottomleft.draw(gameState, x, y + h - this.bs, this.bs, this.bs);
    this.topmid.draw(gameState, x + this.bs, y, w - 2 * this.bs, this.bs);
    this.midmid.draw(
      gameState,
      x + this.bs,
      y + this.bs,
      w - 2 * this.bs,
      h - 2 * this.bs
    );
    this.bottommid.draw(
      gameState,
      x + this.bs,
      y + h - this.bs,
      w - 2 * this.bs,
      this.bs
    );
    this.topright.draw(gameState, x + w - this.bs, y, this.bs, this.bs);
    this.midright.draw(
      gameState,
      x + w - this.bs,
      y + this.bs,
      this.bs,
      h - this.bs * 2
    );
    this.bottomright.draw(
      gameState,
      x + w - this.bs,
      y + h - this.bs,
      this.bs,
      this.bs
    );
  }
}

export class GuiBackgroundImage extends ImageAsset {
  constructor(x, y, w, h, bw, bh) {
    super("ui", x, y, w, h, 0);
    this.bw = bw;
    this.bh = bh;
  }

  _drawCorner(gameState, ox, oy, x, y) {
    gameState.ctx.drawImage(
      gameState.assets[this.name],
      this.x + ox,
      this.y + oy,
      this.bw,
      this.bh,
      x,
      y,
      this.bw,
      this.bh
    );
  }
  _drawVerticalSide(gameState, ox, x, y, h) {
    gameState.ctx.drawImage(
      gameState.assets[this.name],
      this.x + ox,
      this.y + this.bh,
      this.bw,
      this.bh,
      x,
      y + this.bh,
      this.bw,
      h - this.bh * 2
    );
  }

  _drawHorizontalSide(gameState, oy, x, y, w) {
    gameState.ctx.drawImage(
      gameState.assets[this.name],
      this.x + this.bw,
      this.y + oy,
      this.bw,
      this.bh,
      x + this.bw,
      y,
      w - this.bw * 2,
      this.bh
    );
  }

  draw(gameState, x, y, w, h) {
    this._drawCorner(gameState, 0, 0, x, y); // Top Left
    this._drawCorner(gameState, this.w - this.bw, 0, x + w - this.bw, y); // Top Right
    this._drawCorner(gameState, 0, this.h - this.bh, x, y + h - this.bh); // Bottom Left
    this._drawCorner(
      gameState,
      this.w - this.bw,
      this.h - this.bh,
      x + w - this.bw,
      y + h - this.bh
    ); // Bottom Right
    this._drawVerticalSide(gameState, 0, x, y, h); // Left
    this._drawVerticalSide(gameState, this.w - this.bw, x + w - this.bw, y, h); // Right
    this._drawHorizontalSide(gameState, 0, x, y, w); // Top
    this._drawHorizontalSide(
      gameState,
      this.h - this.bh,
      x,
      y + h - this.bh,
      w
    ); // Bottom
    // Middle
    gameState.ctx.drawImage(
      gameState.assets[this.name],
      this.x + this.bw,
      this.y + this.bh,
      this.bw,
      this.bh,
      x + this.bw,
      y + this.bh,
      w - this.bw * 2,
      h - this.bh * 2
    );
  }
}

export class UiSpriteSheetImage extends ImageAsset {
  constructor(x, y, w, h = w, rot = 0) {
    super("ui", x, y, w, h, rot);
  }
}

export class SpriteSheetImage extends ImageAsset {
  constructor(x, y, w, h = w, rot = 0) {
    super("tilesheet", x, y, w, h, rot);
  }
}

export class Rgba {
  static black = new Rgba(0, 0, 0);
  static white = new Rgba(255, 255, 205);

  static lerp(c0, c1, t0, t) {
    return new Rgba(
      lerp(c0.r, c1.r, t0, t),
      lerp(c0.g, c1.g, t0, t),
      lerp(c0.b, c1.b, t0, t),
      lerp(c0.a, c1.a, t0, t)
    );
  }

  static toString(r, g, b, a) {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  constructor(r, g, b, a = 1) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
  copyFrom(rgba) {
    this.r = rgba.r;
    this.g = rgba.g;
    this.b = rgba.b;
    this.a = rgba.a;
  }
  copy() {
    return new Rgba(this.r, this.g, this.b, this.a);
  }
  set(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
  alpha(a) {
    this.a = a;
    return this;
  }
  toString() {
    return Rgba.toString(this.r, this.g, this.b, this.a);
  }
}

export class Vec2 {
  static origin = new Vec2(0, 0);

  static rnd(min_x, max_x, min_y, max_y) {
    return new Vec2(rnd(min_x, max_x), rnd(min_y, max_y));
  }

  static fromAngle(angle) {
    let rad = angle * DEG2RAD;
    return new Vec2(Math.cos(rad), Math.sin(rad)).normalize();
  }

  static lerp(v0, v1, t0, t) {
    return new Vec2(lerp(v0.x, v1.x, t0, t), lerp(v0.y, v1.y, t0, t));
  }

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  copyFrom(v) {
    this.x = v.x;
    this.y = v.y;
  }
  get w() {
    return this.x;
  }
  get h() {
    return this.y;
  }
  copy() {
    return new Vec2(this.x, this.y);
  }
  len() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }
  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }
  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }
  scale(n) {
    this.x *= n;
    this.y *= n;
    return this;
  }
  normalize() {
    let len = this.len();
    if (len === 0) {
      this.x = 0;
      this.y = 0;
    } else {
      this.x /= len;
      this.y /= len;
    }
    return this;
  }
}

export function point_inside(p, bmin, bmax) {
  return p.x >= bmin.x && p.x <= bmax.x && p.y >= bmin.y && p.y <= bmax.y;
}

export function line_intersect_circle(l1, l2, c, r) {
  return (
    new Vec2(l1.x - c.x, l1.y - c.y).len() < r ||
    new Vec2(l2.x - c.x, l2.y - c.y).len() < r
  );
}

export function distance(c1, c2) {
  return new Vec2(c1.x - c2.x, c1.y - c2.y).len();
}

export function circle_intersect_circle(c1, r1, c2, r2) {
  return new Vec2(c1.x - c2.x, c1.y - c2.y).len() < r1 + r2;
}

export function wrapDeg(v) {
  return wrap(v, 0, 360);
}

export function wrap(v, min, max) {
  if (v > max) return v - (max - min);
  if (v < min) return v + (max - min);
  return v;
}

export function clamp(v, min, max) {
  if (min > max) {
    [min, max] = [max, min];
  }
  return Math.max(Math.min(v, max), min);
}

export function clampMin(v, min = 0) {
  return Math.max(v, min);
}

export function clampMax(v, max) {
  return Math.min(v, max);
}

export function lerp(v0, v1, ct, t) {
  let span = v1 - v0;
  let p = ct / t;
  return clamp(v0 + span * p, v0, v1);
}
