import { Vec2, rnd } from "./utils.mjs";
import { Particle } from "./particles.mjs";
import { Star } from "./stars.mjs";
import { EntityList } from "./entities.mjs";
import { Asteroid } from "./asteroids.mjs";
import { Player } from "./players.mjs";
import { Projectile } from "./projectiles.mjs";

export { gameLoop } from "./gameLoop.mjs";

export function initGame(w, h, ctx) {
  let gameState = {
    ctx,
    mouse_active: false,
    win: new Vec2(w, h),
    input: {},
    lastInput: {},
    player: new Player(),
    projectiles: new EntityList(200, Projectile),
    asteroids: new EntityList(100, Asteroid),
    stars: new EntityList(100, Star),
    particles: new EntityList(500, Particle),
    screen: "menu",
    level: -1,
    difficulty: "easy",
    powerups: {},
  };
  initMenu(gameState);
  initStars(gameState);
  return gameState;
}

function initStars(gameState) {
  let num_stars = rnd(gameState.stars.size / 2, gameState.stars.size);
  for (let i = 0; i < num_stars; ++i) {
    gameState.stars.push(rnd(gameState.win.w), rnd(gameState.win.h), rnd(1, 3));
  }
}

function initMenu(gameState) {
  gameState.menu_items = ["Easy", "Medium", "Hard", "Help"];
  gameState.menu_active = 0;
  gameState.menu_screen = "";

  for (let i = 0; i < 6; ++i) {
    gameState.asteroids.push(
      rnd(gameState.win.w),
      rnd(gameState.win.h),
      i < 3 ? 0 : i < 5 ? 1 : 2
    );
  }
}
