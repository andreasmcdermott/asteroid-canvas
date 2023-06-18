import { GuiBackgroundImage, UiSpriteSheetImage } from "./utils.mjs";

let font = "kenvectorfuture";
let sizes = { s: 14, m: 18, l: 30, xl: 80 };
let bg = new GuiBackgroundImage(101, 201, 98, 98, 20, 20);
let cbx_unchecked = new UiSpriteSheetImage(336, 402, 24, 24);
let cbx_checked = new UiSpriteSheetImage(362, 346, 24, 24);
let cbx_active = new UiSpriteSheetImage(362, 322, 24, 24);
export let padding = 20;

export function drawCheckbox(gameState, x, y, state = "unchecked") {
  (state === "checked"
    ? cbx_checked
    : state === "active"
    ? cbx_active
    : cbx_unchecked
  ).draw(gameState, x, y, 24, 24);
}

export function drawText(
  gameState,
  str,
  x,
  y,
  size = "m",
  align = "center",
  valign = "middle"
) {
  let { ctx } = gameState;
  ctx.textAlign = align;
  ctx.textBaseline = valign;
  ctx.fillStyle = "white";
  ctx.font = `${sizes[size]}px ${font}`;
  ctx.fillText(str, x, y);
}

export function measureText(gameState, str, size = "m") {
  gameState.ctx.font = `${sizes[size]}px ${font}`;
  let metrics = gameState.ctx.measureText(str);
  return metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
}

export function drawLines(
  gameState,
  strs,
  x,
  y,
  align = "center",
  valign = "top",
  lineHeight = 1.25
) {
  let _h = 0;
  for (let i = 0; i < strs.length; ++i) {
    _h += sizes[strs[i][1]] * lineHeight;
  }

  let _y = valign === "top" ? y : valign === "middle" ? y - _h / 2 : y - _h;
  for (let i = 0; i < strs.length; ++i) {
    let [str, size] = strs[i];
    drawText(gameState, str, x, _y, size, align, valign);
    _y += sizes[size] * lineHeight;
  }
}

export function drawOverlay(gameState, fill = "rgba(0, 0, 0, 0.5)") {
  let { ctx, win } = gameState;
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, win.w, win.h);
}

export function drawBg(gameState, l, t, r, b, alpha = 1) {
  gameState.ctx.globalAlpha = alpha;
  bg.draw(gameState, l, t, r - l, b - t);
  gameState.ctx.globalAlpha = 1;
}
