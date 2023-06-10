import { Vec2 } from "./math.mjs";

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
  return Math.max(Math.min(v, max), min);
}

export function clampMin(v, min = 0) {
  return Math.max(v, min);
}

export function clampMax(v, max) {
  return Math.min(v, max);
}
