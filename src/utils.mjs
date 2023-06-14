export const PI = Math.PI;
export const PI2 = Math.PI * 2;
export const DEG2RAD = PI / 180;
export const RAD2DEG = 180 / PI;

export function rnd(first, second) {
  if (arguments.length === 1) return Math.random() * first;
  return Math.random() * (second - first) + first;
}

export function keypressed(gameState, key) {
  return !gameState.input[key] && !!gameState.lastInput[key];
}

export function keydown(gameState, key) {
  return !!gameState.input[key];
}

export class Rgba {
  static black = new Rgba(0, 0, 0);
  static white = new Rgba(255, 255, 255);

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
