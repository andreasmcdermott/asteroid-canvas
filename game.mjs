import { Vec2, rnd } from "./math.mjs";
import {
  player_w,
  player_h,
  max_shield_charge,
  asteroid_sizes,
  asteroid_rot_speed,
  asteroid_speed,
} from "./constants.mjs";

export function initGame(w, h, ctx) {
  let gameState = {
    mouse_active: false,
    player_destroyed: false,
    wsize: new Vec2(w, h),
    ctx,
    player: undefined,
    asterouds: undefined,
    stars: undefined,
    particles: [],
  };
  initConstants(gameState);
  initLevel(gameState);
  return gameState;
}

function initConstants(gameState) {
  gameState.stars = [];
  let num_stars = rnd(50, 100);
  for (let i = 0; i < num_stars; ++i) {
    gameState.stars.push({
      p: new Vec2(rnd(gameState.wsize.w), rnd(gameState.wsize.h)),
      r: rnd(1, 3),
    });
  }
}

function initLevel(gameState) {
  gameState.player = {
    w: player_w,
    h: player_h,
    r: player_h / 1.7,
    p: new Vec2(gameState.wsize.w / 2, gameState.wsize.h / 2),
    angle: 270,
    rot: 0,
    v: Vec2.origin,
    thrusts: [],
    lasers: [],
    laser_cooldown: 0,
    thrust_cooldown: 0,
    shield: false,
    shield_charge: max_shield_charge,
    shield_cooldown_timer: 0,
  };

  gameState.asteroids = [];
  let lvl = 0;
  for (let i = 0; i < 3; ++i) {
    gameState.asteroids.push({
      level: lvl,
      size: rnd(...asteroid_sizes[lvl]),
      p: new Vec2(rnd(gameState.wsize.w), rnd(gameState.wsize.h)),
      angle: rnd(360),
      rot: rnd(-1, 1) * rnd(...asteroid_rot_speed),
      v: new Vec2(rnd(-1, 1), rnd(-1, 1))
        .normalize()
        .scale(rnd(...asteroid_speed)),
    });
  }
}
