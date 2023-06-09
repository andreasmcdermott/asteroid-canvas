export const DEG2RAD = Math.PI / 180;

export class Vec2 {
  static copy(v) {
    return new Vec2(v.x, v.y);
  }

  static fromAngle(angle) {
    let rad = angle * DEG2RAD;
    return new Vec2(Math.cos(rad), Math.sin(rad)).normalize();
  }

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  len() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  add(v) {
    this.x += v.x;
    this.y += v.y;
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
