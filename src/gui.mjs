import { GuiBackgroundImage, UiSpriteSheetImage } from "./utils.mjs";

let font = "kenvectorfuture";
let sizes = { s: 14, m: 18, l: 30, xl: 80 };
let bg = new GuiBackgroundImage(101, 201, 98, 98, 20, 20);
let cbx_unchecked = new UiSpriteSheetImage(336, 402, 24, 24);
let cbx_checked = new UiSpriteSheetImage(362, 346, 24, 24);
let cbx_active = new UiSpriteSheetImage(362, 322, 24, 24);

export function drawCheckbox(gameState, x, y, state = "unchecked") {
  (state === "checked"
    ? cbx_checked
    : state === "active"
    ? cbx_active
    : cbx_unchecked
  ).draw(gameState, x, y, 24, 24);
}

export function drawText(gameState, str, x, y, size = "m", align = "center") {
  let { ctx } = gameState;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.font = `${sizes[size]}px ${font}`;
  ctx.fillText(str, x, y);
}

export function measureText(gameState, str, size = "m") {
  gameState.ctx.font = `${sizes[size]}px ${font}`;
  return gameState.ctx.measureText(str).width;
}

export function drawLines(gameState, strs, x, y, align = "center") {
  let _y = y;
  for (let i = 0; i < strs.length; ++i) {
    let [str, size] = strs[i];
    drawText(gameState, str, x, _y, size, align);
    _y += sizes[size];
  }
}

export function drawOverlay(
  gameState,
  x,
  y,
  w,
  h,
  fill = "rgba(0, 0, 0, 0.5)"
) {
  let { ctx } = gameState;
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

export function drawBg(gameState, l, t, r, b, alpha = 1) {
  gameState.ctx.globalAlpha = alpha;
  bg.draw(gameState, l, t, r - l, b - t);
  gameState.ctx.globalAlpha = 1;
}
