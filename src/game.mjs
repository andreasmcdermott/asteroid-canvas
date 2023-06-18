import { Vec2, rnd, clampMin, clampMax, PI2, keypressed } from "./utils.mjs";
import { Particle } from "./particles.mjs";
import { Star, initStars } from "./stars.mjs";
import { EntityList } from "./entities.mjs";
import { Asteroid } from "./asteroids.mjs";
import { Player, drawShield } from "./players.mjs";
import { Projectile, drawLaser, initLaser } from "./projectiles.mjs";
import {
  available_upgrades,
  getSettings,
  max_upgrade_levels,
} from "./constants.mjs";
import {
  drawBg,
  drawCheckbox,
  drawLines,
  drawOverlay,
  drawText,
  measureText,
  padding,
} from "./gui.mjs";

let screens = { play, menu, pause, gameOver, upgrade };

export function initGame(w, h, ctx, assets) {
  let gameState = {
    ctx,
    assets,
    debug: false,
    has_mouse_lock: false,
    mx: w / 2,
    my: h / 2,
    win: new Vec2(w, h),
    input: {},
    lastInput: {},
    player: new Player(),
    projectiles: new EntityList(100, Projectile),
    asteroids: new EntityList(200, Asteroid),
    stars: new EntityList(60, Star),
    particles: new EntityList(500, Particle),
    screen: "menu",
    level: -1,
    difficulty: "easy",
    upgrade_keyboard_active: 0,
    upgrade_mouse_active: -1,
    screen_shake: 0,
    upgrades: {
      shield_charge: 0,
      fire_rate: 0,
      laser_speed: 0,
    },
    points: 0,
    last_points_payed: 0,
  };
  initMenu(gameState);
  initStars(gameState);
  initLaser(gameState);
  return gameState;
}

export function refresh(gameState) {
  gameState.player = new Player().copyFrom(gameState.player);
  gameState.projectiles = EntityList.copyFrom(
    gameState.projectiles,
    Projectile
  );
  gameState.asteroids = EntityList.copyFrom(gameState.asteroids, Asteroid);
  gameState.stars = EntityList.copyFrom(gameState.stars, Star);
  gameState.particles = EntityList.copyFrom(gameState.particles, Particle);
}

export function onResize(gameState) {
  if (gameState.mx > gameState.win.w) gameState.mx = gameState.win.w;
  if (gameState.my > gameState.win.h) gameState.mx = gameState.win.h;

  gameState.stars.reset();
  let num_stars = rnd(gameState.stars.size / 2, gameState.stars.size);
  for (let i = 0; i < num_stars; ++i) {
    gameState.stars.push(
      gameState,
      rnd(gameState.win.w),
      rnd(gameState.win.h),
      rnd(1, 3)
    );
  }
}

export function gameLoop(dt, gameState) {
  let { ctx, win } = gameState;
  let screen = screens[gameState.screen];

  ctx.clearRect(0, 0, win.w, win.h);

  gameState.screen_shake = clampMin(gameState.screen_shake - dt);
  gameState.stars.drawAll(ctx, gameState);

  screen(dt, gameState);

  if (gameState.debug) {
    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.font = "14px kenvectorfuture";
    ctx.fillText(`FPS: ${Math.round(1000 / dt)}`, win.w - 10, win.h - 10);
    ctx.fillText(
      `Asteroids: ${gameState.asteroids.activeCount}`,
      win.w - 10,
      win.h - 25
    );
    ctx.fillText(
      `Particles: ${gameState.particles.activeCount}`,
      win.w - 10,
      win.h - 40
    );
    ctx.fillText(
      `Projectiles: ${gameState.projectiles.activeCount}`,
      win.w - 10,
      win.h - 55
    );
  }
}

function play(dt, gameState) {
  let { ctx } = gameState;

  if (
    keypressed(gameState, "Escape") &&
    !gameState.player.destroyed &&
    gameState.asteroids.activeCount > 0
  ) {
    gameState.screen = "pause";
    return;
  }

  if (gameState.level < 0) {
    gotoNextLevel(gameState);
  }

  // Dev code for adding more astroid

  if (keypressed(gameState, "1"))
    gameState.asteroids.push(
      gameState,
      rnd(gameState.win.w),
      rnd(gameState.win.h),
      0
    );
  else if (keypressed(gameState, "2"))
    gameState.asteroids.push(
      gameState,
      rnd(gameState.win.w),
      rnd(gameState.win.h),
      1
    );
  else if (keypressed(gameState, "3"))
    gameState.asteroids.push(
      gameState,
      rnd(gameState.win.w),
      rnd(gameState.win.h),
      2
    );

  gameState.projectiles.updateAll(dt, gameState);
  gameState.asteroids.updateAll(dt, gameState);
  gameState.player.update(dt, gameState);
  gameState.particles.updateAll(dt, gameState);

  let has_screen_shake = add_screen_shake(ctx, gameState);

  gameState.projectiles.drawAll(ctx, gameState);
  gameState.asteroids.drawAll(ctx, gameState);
  gameState.player.draw(ctx, gameState);
  gameState.particles.drawAll(ctx, gameState);

  if (has_screen_shake) clear_screen_shake(ctx);

  if (gameState.asteroids.activeCount === 0) {
    gameState.screen = "upgrade";
    gameState.screen_transition = 1500;
  }
}

function gotoNextLevel(gameState) {
  let new_game = gameState.level < 0;

  gameState.level += 1;

  gameState.particles.reset();
  gameState.projectiles.reset();
  gameState.asteroids.reset();

  if (new_game) {
    gameState.player.activate(
      gameState,
      gameState.win.w / 2,
      gameState.win.h / 2
    );
    for (let i = 0; i < available_upgrades.length; ++i) {
      let upgradeType = available_upgrades[i].type;
      gameState.upgrades[upgradeType] = 0;
    }
    gameState.points = 0;
    gameState.last_points_payed = 0;
  } else {
    gameState.player.resetForNewLevel(gameState);
  }

  let settings = getSettings(gameState.difficulty, gameState.level);
  for (let i = 0; i < available_upgrades.length; ++i) {
    let upgrade = available_upgrades[i];
    let level = gameState.upgrades[upgrade.type];
    let adjustment = upgrade.adjustment[level];
    settings[upgrade.field] += adjustment;
  }
  gameState.settings = settings;

  for (let i = 0; i < settings.asteroids.length; ++i) {
    gameState.asteroids.push(
      gameState,
      rnd(gameState.win.w),
      rnd(gameState.win.h),
      settings.asteroids[i]
    );
  }
}

function initMenu(gameState) {
  gameState.menu_items = ["Easy", "Medium", "Hard", "Help"];
  gameState.menu_keyboard_active = 0;
  gameState.menu_mouse_over = -1;
  gameState.menu_screen = "";
  gameState.settings = getSettings("easy", 0);
  for (let i = 0; i < 6; ++i) {
    gameState.asteroids.push(
      gameState,
      rnd(gameState.win.w),
      rnd(gameState.win.h),
      i < 3 ? 0 : i < 5 ? 1 : 2
    );
  }
}

function menu(dt, gameState) {
  let { ctx, win } = gameState;

  gameState.asteroids.updateAll(dt, gameState);
  gameState.asteroids.drawAll(ctx, gameState);

  let actions = {
    SelectKeyboard:
      keypressed(gameState, "Enter") || keypressed(gameState, " "),
    SelectMouse: keypressed(gameState, "Mouse0"),
    Up: keypressed(gameState, "ArrowUp") || keypressed(gameState, "w"),
    Down: keypressed(gameState, "ArrowDown") || keypressed(gameState, "s"),
  };

  if (actions.Up) {
    if (gameState.mouse_active && gameState.menu_mouse_active >= 0)
      gameState.menu_keyboard_active = gameState.menu_mouse_active;

    gameState.mouse_active = false;
    gameState.menu_keyboard_active = clampMin(
      gameState.menu_keyboard_active - 1,
      0
    );
  } else if (actions.Down) {
    if (gameState.mouse_active && gameState.menu_mouse_active >= 0)
      gameState.menu_keyboard_active = gameState.menu_mouse_active;

    gameState.mouse_active = false;
    gameState.menu_keyboard_active = clampMax(
      gameState.menu_keyboard_active + 1,
      gameState.menu_items.length - 1
    );
  } else if (
    actions.SelectKeyboard ||
    (actions.SelectMouse && gameState.menu_mouse_active >= 0)
  ) {
    if (gameState.menu_screen === "help") {
      gameState.menu_screen = "";
    } else {
      let active = actions.SelectKeyboard
        ? gameState.menu_keyboard_active
        : gameState.menu_mouse_active;
      if (gameState.menu_items[active] === "Help") {
        gameState.menu_screen = "help";
      } else {
        gameState.screen = "play";
        gameState.level = -1;
        gameState.difficulty = gameState.menu_items[active].toLowerCase();
      }
    }
  }

  drawOverlay(gameState);
  drawBg(
    gameState,
    gameState.win.w / 4,
    gameState.win.h / 3,
    (gameState.win.w / 4) * 3,
    (gameState.win.h / 4) * 3
  );
  drawLines(
    gameState,
    [
      ["Asteroids", "xl"],
      ["By Andreas McDermott", "m"],
    ],
    gameState.win.w / 2,
    gameState.win.h / 3
  );

  if (gameState.menu_screen === "help") {
    drawLines(
      gameState,
      [
        ["Shoot: Left Mouse Button / Space / Period", "m"],
        ["Shield: Right Mouse Button / Shift / Comma", "m"],
        ["Thruster: Up / W", "m"],
        ["Turn: Left|Right / A|D", "m"],
      ],
      gameState.win.w / 2,
      (gameState.win.h / 4) * 2.4,
      "center",
      "middle",
      2
    );
    drawText(
      gameState,
      "Press any key to go back ",
      win.w / 2,
      (win.h / 4) * 3 - 20,
      "l",
      "center",
      "bottom"
    );
  } else {
    gameState.menu_mouse_active = -1;
    let item_height = 46;
    let item_height_with_space = 56;
    let start =
      (win.h / 4) * 3 -
      (gameState.menu_items.length - 1) * item_height_with_space -
      item_height;
    for (let i = 0; i < gameState.menu_items.length; ++i) {
      let tw = measureText(gameState, gameState.menu_items[i]);
      let left = win.w / 2 - tw / 2 - padding;
      let top = start + item_height_with_space * i - padding;
      let width = tw + padding * 2;
      let height = item_height;
      let right = left + width;
      let bottom = top + height;

      if (gameState.mouse_active) {
        let { MouseX, MouseY } = gameState.input;
        if (
          MouseX >= left &&
          MouseX <= right &&
          MouseY >= top &&
          MouseY <= bottom
        ) {
          gameState.menu_mouse_active = i;
        }
      }

      if (
        gameState.mouse_active
          ? gameState.menu_mouse_active === i
          : gameState.menu_keyboard_active === i
      ) {
        drawBg(gameState, left, top, right, bottom);
      }

      drawText(
        gameState,
        gameState.menu_items[i],
        win.w / 2,
        start + item_height_with_space * i,
        "m"
      );
    }
  }
}

function upgrade(dt, gameState) {
  let { ctx, win } = gameState;

  drawOverlay(gameState);
  drawBg(
    gameState,
    win.w / 6,
    win.h / 3 - padding,
    (win.w / 6) * 5,
    win.h / 2 + win.w / 6 + padding
  );
  drawText(
    gameState,
    `Level ${gameState.level + 1} Completed!`,
    win.w / 2,
    win.h / 3,
    "l",
    "center",
    "top"
  );

  if (gameState.screen_transition > 0) {
    gameState.particles.updateAll(dt, gameState);
    gameState.projectiles.updateAll(dt, gameState);
    gameState.player.update(dt, gameState);

    gameState.particles.drawAll(ctx, gameState);
    gameState.projectiles.drawAll(ctx, gameState);
    gameState.player.draw(ctx, gameState);

    gameState.screen_transition -= dt;

    return;
  } else if (
    gameState.upgrades.shield_charge >= max_upgrade_levels &&
    gameState.upgrades.fire_rate >= max_upgrade_levels &&
    gameState.upgrades.laser_speed >= max_upgrade_levels
  ) {
    gotoNextLevel(gameState);
    gameState.screen = "play";
    return;
  }

  let actions = {
    Prev: keypressed(gameState, "ArrowLeft") || keypressed(gameState, "a"),
    Next: keypressed(gameState, "ArrowRight") || keypressed(gameState, "d"),
    SelectKeyboard:
      keypressed(gameState, "Enter") || keypressed(gameState, " "),
    SelectMouse: keypressed(gameState, "Mouse0"),
  };

  if (actions.Prev) {
    if (gameState.mouse_active && gameState.upgrade_mouse_active >= 0)
      gameState.upgrade_keyboard_active = gameState.upgrade_mouse_active;

    gameState.mouse_active = false;
    gameState.upgrade_keyboard_active = clampMin(
      gameState.upgrade_keyboard_active - 1
    );
  } else if (actions.Next) {
    if (gameState.mouse_active && gameState.upgrade_mouse_active >= 0)
      gameState.upgrade_keyboard_active = gameState.upgrade_mouse_active;

    gameState.mouse_active = false;
    gameState.upgrade_keyboard_active = clampMax(
      gameState.upgrade_keyboard_active + 1,
      available_upgrades.length - 1
    );
  } else if (
    actions.SelectKeyboard ||
    (actions.SelectMouse && gameState.upgrade_mouse_active >= 0)
  ) {
    let selected =
      available_upgrades[
        actions.SelectKeyboard
          ? gameState.upgrade_keyboard_active
          : gameState.upgrade_mouse_active
      ];
    if (gameState.upgrades[selected.type] < max_upgrade_levels) {
      gameState.upgrades[selected.type] += 1;
      gotoNextLevel(gameState);
      gameState.screen = "play";
    }
  }

  drawText(
    gameState,
    "Pick Your Upgrade:",
    win.w / 2,
    win.h / 3 + 60,
    "m",
    "center",
    "middle"
  );

  let boxSize = win.w / 6;
  let boxTop = win.h / 2;

  gameState.upgrade_mouse_active = -1;
  for (let i = 0; i < available_upgrades.length; ++i) {
    let upgrade = available_upgrades[i];
    let boxLeft = win.w / 2 - (win.w / 6 + 15) * 1.5 + (win.w / 6 + 20) * i;

    if (gameState.mouse_active) {
      let { MouseX, MouseY } = gameState.input;
      if (
        MouseX >= boxLeft &&
        MouseX <= boxLeft + boxSize &&
        MouseY >= boxTop &&
        MouseY <= boxTop + boxSize
      ) {
        gameState.upgrade_mouse_active = i;
      }
    }

    let isActive = gameState.mouse_active
      ? gameState.upgrade_mouse_active === i
      : gameState.upgrade_keyboard_active === i;
    let currUpgradeValue = gameState.upgrades[upgrade.type];
    drawBg(
      gameState,
      boxLeft,
      boxTop,
      boxLeft + boxSize,
      boxTop + boxSize,
      isActive ? 1 : 0.5
    );
    drawText(gameState, upgrade.name, boxLeft + boxSize / 2, boxTop + 24, "m");

    let leftMost =
      boxLeft +
      boxSize / 2 +
      36 * ((max_upgrade_levels - 1) / 2 - (max_upgrade_levels - 1));
    for (let i = 0; i < max_upgrade_levels; ++i) {
      drawCheckbox(
        gameState,
        leftMost + 30 * i,
        boxTop + boxSize - 36,
        isActive && i === currUpgradeValue
          ? "active"
          : currUpgradeValue > i
          ? "checked"
          : "unchecked"
      );
    }

    switch (upgrade.type) {
      case "fire_rate":
        drawLaser(
          gameState,
          boxLeft + boxSize / 2 + 30,
          boxTop + boxSize / 2 - 30,
          10,
          30,
          45
        );
        drawLaser(
          gameState,
          boxLeft + boxSize / 2,
          boxTop + boxSize / 2,
          10,
          30,
          45
        );
        drawLaser(
          gameState,
          boxLeft + boxSize / 2 - 30,
          boxTop + boxSize / 2 + 30,
          10,
          30,
          45
        );
        break;
      case "laser_speed":
        drawLaser(
          gameState,
          boxLeft + boxSize / 2,
          boxTop + boxSize / 2,
          20,
          100,
          45
        );
        break;
      case "shield_charge":
        drawShield(
          gameState,
          boxLeft + boxSize / 2,
          boxTop + boxSize / 2,
          0,
          50
        );
        break;
    }
  }
}

function gameOver(dt, gameState) {
  let { ctx, win } = gameState;

  gameState.projectiles.updateAll(dt, gameState);
  gameState.asteroids.updateAll(dt, gameState);
  gameState.particles.updateAll(dt, gameState);

  let has_screen_shake = add_screen_shake(ctx, gameState);

  gameState.projectiles.drawAll(ctx, gameState);
  gameState.asteroids.drawAll(ctx, gameState);
  gameState.particles.drawAll(ctx, gameState);

  if (has_screen_shake) clear_screen_shake(ctx);

  if (gameState.screen_transition > 0) {
    gameState.screen_transition -= dt;
    return;
  }

  drawOverlay(gameState);
  drawBg(gameState, win.w / 4, win.h / 3, (win.w / 4) * 3, win.h / 2 + padding);
  drawText(
    gameState,
    "Game Over",
    gameState.win.w / 2,
    gameState.win.h / 3,
    "xl",
    "center",
    "top"
  );
  drawText(
    gameState,
    "Press Enter to Restart",
    win.w / 2,
    win.h / 2,
    "l",
    "center",
    "bottom"
  );

  if (keypressed(gameState, "Enter")) {
    gameState.level = -1;
    gameState.screen = "play";
  }
}

function pause(dt, gameState) {
  let { ctx, win } = gameState;

  if (keypressed(gameState, "Escape")) {
    gameState.screen = "play";
    return;
  }

  gameState.projectiles.drawAll(ctx, gameState);
  gameState.asteroids.drawAll(ctx, gameState);
  gameState.player.draw(ctx, gameState);
  gameState.particles.drawAll(ctx, gameState);

  drawOverlay(gameState);
  drawBg(gameState, win.w / 4, win.h / 3, (win.w / 4) * 3, win.h / 2 + padding);
  drawText(
    gameState,
    "Paused",
    gameState.win.w / 2,
    gameState.win.h / 3,
    "xl",
    "center",
    "top"
  );
  drawText(
    gameState,
    "Press Escape to Continue",
    win.w / 2,
    win.h / 2,
    "l",
    "center",
    "bottom"
  );
}

function add_screen_shake(ctx, gameState) {
  if (gameState.screen_shake > 0) {
    let strength = gameState.screen_shake / 10;
    let ox = rnd(-strength, strength);
    let oy = rnd(-strength, strength);
    ctx.save();
    ctx.translate(ox, oy);
    return true;
  }
  return false;
}

function clear_screen_shake(ctx) {
  ctx.restore();
}
