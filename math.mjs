export const PI = Math.PI;
export const PI2 = Math.PI * 2;
export const DEG2RAD = PI / 180;
export const RAD2DEG = 180 / PI;

export function rnd(first, second) {
  if (arguments.length === 1) return Math.random() * first;
  return Math.random() * (second - first) + first;
}

export class Vec2 {
  static origin() {
    return new Vec2(0, 0);
  }
  static fromAngle(angle) {
    let rad = angle * DEG2RAD;
    return new Vec2(Math.cos(rad), Math.sin(rad)).normalize();
  }

  constructor(x, y) {
    this.x = x;
    this.y = y;
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
