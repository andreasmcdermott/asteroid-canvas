import { clamp } from "./utils.mjs";

let last_level_index = 4;

export let available_upgrades = [
  { type: "fire_rate", name: "Fire Rate" },
  { type: "laser_speed", name: "Laser Speed" },
  { type: "shield_charge", name: "Shield Charge" },
];
export let asteroid_levels = 3;
export let asteroid_sizes = [
  [72, 112],
  [48, 64],
  [16, 32],
];
let levels_by_difficulty = {
  easy: {
    levels: [
      { asteroids: [0, 0, 1], new_asteroids: { 1: 1, 2: 1 } }, //{ 1: 3, 2: 3 } },
      { asteroids: [0, 0, 0], new_asteroids: { 1: 3, 2: 3 } },
      { asteroids: [0, 0, 0, 0], new_asteroids: { 1: 3, 2: 3 } },
      { asteroids: [0, 0, 0, 0, 0], new_asteroids: { 1: 3, 2: 3 } },
    ],
    laser_speed: 1,
    asteroid_speed: [0.01, 0.165],
    asteroid_sizes,
    laser_cooldown: 200,
    max_shield_charge: 3000,
    shield_recharge_rate: 3,
    shield_discharge_cooldown: 1000,
  },
  medium: {
    levels: [
      { asteroids: [0, 0, 0], new_asteroids: { 1: 4, 2: 4 } },
      { asteroids: [0, 0, 0, 0], new_asteroids: { 1: 4, 2: 4 } },
      { asteroids: [0, 0, 0, 0, 0], new_asteroids: { 1: 4, 2: 4 } },
      { asteroids: [0, 0, 0, 0, 0], new_asteroids: { 1: 5, 2: 5 } },
    ],
    asteroid_sizes,
    laser_speed: 0.75,
    asteroid_speed: [0.01, 0.175],
    laser_cooldown: 250,
    max_shield_charge: 2000,
    shield_recharge_rate: 2,
    shield_discharge_cooldown: 2000,
  },
  hard: {
    levels: [
      { asteroids: [0, 0, 0, 0], new_asteroids: { 1: 5, 2: 5 } },
      { asteroids: [0, 0, 0, 0, 0], new_asteroids: { 1: 5, 2: 5 } },
      { asteroids: [0, 0, 0, 0, 0, 0], new_asteroids: { 1: 6, 2: 7 } },
      { asteroids: [0, 0, 0, 0, 0, 0], new_asteroids: { 1: 7, 2: 8 } },
    ],
    asteroid_sizes,
    laser_speed: 0.6,
    asteroid_speed: [0.01, 0.185],
    laser_cooldown: 300,
    max_shield_charge: 1000,
    shield_recharge_rate: 1,
    shield_discharge_cooldown: 3000,
  },
};

export let getSettings = (difficulty, level) => {
  level = clamp(level, 0, last_level_index);
  let settings = levels_by_difficulty[difficulty];
  let for_level = settings.levels[level];
  return { ...settings, ...for_level };
};
