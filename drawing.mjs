import { DEG2RAD, PI2 } from "./math.mjs";

export function drawStar(ctx, x, y, r) {
  ctx.beginPath();
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.ellipse(x, y, r, r, 0, 0, PI2);
  ctx.fill();
}

export function drawRoundRect(
  ctx,
  x,
  y,
  angle,
  w,
  h,
  r,
  lineWidth = 2,
  strokeStyle = "white",
  fillStyle = "black"
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle * DEG2RAD);
  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.roundRect(w * -0.5, h * -0.5, w, h, r);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawPlayerShip(
  ctx,
  x,
  y,
  angle,
  w,
  h,
  lineWidth = 2,
  strokeStyle = "white",
  fillStyle = "black"
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle * DEG2RAD);
  ctx.lineWidth = lineWidth;
  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = strokeStyle;
  // Wings
  ctx.beginPath();
  ctx.moveTo(h * -0.5, 0);
  ctx.lineTo(h * -0.4, w);
  ctx.lineTo(h * -0.1, w);
  ctx.lineTo(0, 0);
  ctx.lineTo(h * -0.1, -w);
  ctx.lineTo(h * -0.4, -w);
  ctx.lineTo(h * -0.5, 0);
  ctx.fill();
  ctx.stroke();
  // Body
  ctx.beginPath();
  ctx.moveTo(h * 0.5, 0);
  ctx.lineTo(h * -0.5, w * 0.5);
  ctx.lineTo(h * -0.5, w * -0.5);
  ctx.lineTo(h * 0.5, 0);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawPlayerShield(ctx, x, y, angle, r) {
  let gradient = ctx.createRadialGradient(0, 0, r / 8, 0, 0, r * 2);
  gradient.addColorStop(0, "rgba(128, 255, 128, 0.75)");
  gradient.addColorStop(1, "rgba(100, 255, 100, 0.1)");

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle * DEG2RAD);
  ctx.lineWidth = 1;
  ctx.fillStyle = gradient;
  ctx.strokeStyle = "rgba(100, 255, 100, 1)";
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r, 0, 0, PI2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
