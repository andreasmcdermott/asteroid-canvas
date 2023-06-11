import { Vec2, rnd } from "./utils.mjs";
import {
  asteroid_sizes,
  asteroid_rot_speed,
  asteroid_speed,
} from "./constants.mjs";
import { initParticles } from "./particles.mjs";

export function initGame(w, h, ctx) {
  let gameState = {
    ctx,
    mouse_active: false,
    player_destroyed: false,
    win: new Vec2(w, h),
    player: undefined,
    asteroids: undefined,
    const_entities: undefined,
    particles: undefined,
    screen: "menu",
    level: -1,
    difficulty: "easy",
    powerups: {},
  };
  initMenu(gameState);
  initTempAsteroids(gameState);
  initParticles(gameState);
  initConstants(gameState);
  return gameState;
}

function initConstants(gameState) {
  gameState.const_entities = [];
  let num_stars = rnd(50, 100);
  for (let i = 0; i < num_stars; ++i) {
    gameState.const_entities.push({
      p: new Vec2(rnd(gameState.win.w), rnd(gameState.win.h)),
      r: rnd(1, 3),
    });
  }
}

function initMenu(gameState) {
  gameState.menu_items = ["Easy", "Medium", "Hard", "Help"];
  gameState.menu_active = 0;
  gameState.menu_screen = "";
  gameState.menu_key_down = false;
}

function initTempAsteroids(gameState) {
  gameState.asteroids = [];
  let lvl = 0;
  for (let i = 0; i < 3; ++i) {
    gameState.asteroids.push({
      level: lvl,
      size: rnd(...asteroid_sizes[lvl]),
      p: new Vec2(rnd(gameState.win.w), rnd(gameState.win.h)),
      angle: rnd(360),
      rot: rnd(-1, 1) * rnd(...asteroid_rot_speed),
      v: new Vec2(rnd(-1, 1), rnd(-1, 1))
        .normalize()
        .scale(rnd(...asteroid_speed)),
    });
  }
}
