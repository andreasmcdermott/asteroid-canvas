import { lerp } from "./utils.mjs";

export const PI = Math.PI;
export const PI2 = Math.PI * 2;
export const DEG2RAD = PI / 180;
export const RAD2DEG = 180 / PI;

export function rnd(first, second) {
  if (arguments.length === 1) return Math.random() * first;
  return Math.random() * (second - first) + first;
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

  constructor(r, g, b, a = 1) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
  copy() {
    return new Rgba(this.r, this.g, this.b, this.a);
  }
  alpha(a) {
    this.a = a;
    return this;
  }
  toString() {
    return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
  }
}

export class Vec2 {
  static origin = new Vec2(0, 0);

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
    this.x /= len;
    this.y /= len;
    return this;
  }
}
