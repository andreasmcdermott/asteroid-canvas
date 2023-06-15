import { Vec2, rnd, clampMin, clampMax, PI2, keypressed } from "./utils.mjs";
import { Particle } from "./particles.mjs";
import { Star } from "./stars.mjs";
import { EntityList } from "./entities.mjs";
import { Asteroid } from "./asteroids.mjs";
import { Player, drawShield } from "./players.mjs";
import { Projectile, drawLaser } from "./projectiles.mjs";
import {
  available_upgrades,
  getSettings,
  max_upgrade_levels,
} from "./constants.mjs";

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

export function initGame(w, h, ctx) {
  let gameState = {
    ctx,
    debug: false,
    mouse_active: false,
    win: new Vec2(w, h),
    input: {},
    lastInput: {},
    player: new Player(),
    projectiles: new EntityList(100, Projectile),
    asteroids: new EntityList(200, Asteroid),
    stars: new EntityList(100, Star),
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
  return gameState;
}

export function onResize(gameState) {
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

function initStars(gameState) {
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

let screens = { play, menu, pause, gameOver, upgrade };

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
    ctx.font = "14px monospace";
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

function upgrade(dt, gameState) {
  let { ctx, win } = gameState;

  if (gameState.screen_transition > 0) {
    gameState.particles.updateAll(dt, gameState);
    gameState.projectiles.updateAll(dt, gameState);
    gameState.player.update(dt, gameState);

    gameState.particles.drawAll(ctx, gameState);
    gameState.projectiles.drawAll(ctx, gameState);
    gameState.player.draw(ctx, gameState);

    gameState.screen_transition -= dt;
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, win.w, win.h);
    _drawGameTitle(ctx, gameState);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.font = "22px monospace";
    ctx.fillText(
      `Level ${gameState.level + 1} Completed!`,
      win.w / 2,
      win.h / 2 - 80
    );
    return;
  } else {
    if (
      gameState.upgrades.shield_charge >= max_upgrade_levels &&
      gameState.upgrades.fire_rate >= max_upgrade_levels &&
      gameState.upgrades.laser_speed >= max_upgrade_levels
    ) {
      gotoNextLevel(gameState);
      gameState.screen = "play";
      return;
    }
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

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, win.w, win.h);
  _drawGameTitle(ctx, gameState);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.font = "22px monospace";
  ctx.fillText(
    `Level ${gameState.level + 1} Completed!`,
    win.w / 2,
    win.h / 2 - 80
  );

  ctx.font = "18px monospace";
  ctx.fillText(`Pick your Upgrade:`, win.w / 2, win.h / 2 - 20);

  let boxSize = win.w / 6;
  let boxTop = win.h / 2 + 50;

  gameState.upgrade_mouse_active = -1;
  for (let i = 0; i < available_upgrades.length; ++i) {
    let upgrade = available_upgrades[i];
    let boxLeft = win.w / 2 - (win.w / 6 + 20) * 1.5 + (win.w / 6 + 20) * i;

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

    ctx.lineWidth = 2;
    ctx.strokeStyle = isActive ? "skyblue" : "white";
    ctx.fillStyle = `rgba(255, 255, 255, ${isActive ? 0.33 : 0.1})`;
    ctx.beginPath();
    ctx.roundRect(boxLeft, boxTop, boxSize, boxSize, boxSize / 5);
    ctx.stroke();
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.fillText(upgrade.name, boxLeft + boxSize / 2, boxTop + boxSize / 4);

    ctx.strokeStyle = "white";
    ctx.fillStyle = "skyblue";
    ctx.lineWidth = 1;

    let leftMost =
      boxLeft +
      boxSize / 2 +
      (boxSize / 15 + boxSize / 30) *
        ((max_upgrade_levels - 1) / 2 - (max_upgrade_levels - 1));
    for (let i = 0; i < max_upgrade_levels; ++i) {
      ctx.beginPath();
      ctx.ellipse(
        leftMost + (boxSize / 15 + boxSize / 30) * i,
        boxTop + boxSize - boxSize / 15,
        boxSize / 30,
        boxSize / 30,
        0,
        0,
        PI2
      );

      ctx.stroke();
      if (gameState.upgrades[upgrade.type] > i) ctx.fill();
    }

    switch (upgrade.type) {
      case "fire_rate":
        drawLaser(
          ctx,
          boxLeft + boxSize / 2 - 40,
          boxTop + boxSize / 2 + 60,
          20,
          -20,
          "lightskyblue",
          4
        );
        drawLaser(
          ctx,
          boxLeft + boxSize / 2 - 10,
          boxTop + boxSize / 2 + 30,
          20,
          -20,
          "lightskyblue",
          4
        );
        drawLaser(
          ctx,
          boxLeft + boxSize / 2 + 20,
          boxTop + boxSize / 2,
          20,
          -20,
          "lightskyblue",
          4
        );
        break;
      case "laser_speed":
        drawLaser(
          ctx,
          boxLeft + boxSize / 2 - 30,
          boxTop + boxSize / 2 + 30,
          50,
          -50,
          "lightskyblue",
          4
        );
        drawLaser(
          ctx,
          boxLeft + boxSize / 2 - 45,
          boxTop + boxSize / 2 + 35,
          30,
          -30,
          "lightskyblue",
          1
        );
        drawLaser(
          ctx,
          boxLeft + boxSize / 2 - 30,
          boxTop + boxSize / 2 + 40,
          35,
          -35,
          "lightskyblue",
          1
        );
        drawLaser(
          ctx,
          boxLeft + boxSize / 2 - 50,
          boxTop + boxSize / 2 + 50,
          10,
          -10,
          "lightskyblue",
          1
        );
        break;
      case "shield_charge":
        drawShield(
          ctx,
          boxLeft + boxSize / 2,
          boxTop + boxSize / 2 + 25,
          0,
          50
        );
        break;
    }
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

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, win.w, win.h);
  _drawGameTitle(ctx, gameState);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.font = "22px monospace";
  ctx.fillText("Press Escape to Resume", win.w / 2, win.h / 2 - 60);
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

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, win.w, win.h);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  _drawGameTitle(ctx, gameState);

  if (gameState.menu_screen === "help") {
    ctx.font = "16px monospace";
    ctx.fillStyle = "white";
    ctx.fillText(
      "Shoot: Left Mouse Button / Space / Period",
      win.w / 2,
      win.h / 2 - 40
    );
    ctx.fillText(
      "Shield: Right Mouse Button / Shift / Comma",
      win.w / 2,
      win.h / 2
    );
    ctx.fillText("Thruster: Up / W", win.w / 2, win.h / 2 + 40);
    ctx.fillText("Turn: Left|Right / A|D", win.w / 2, win.h / 2 + 80);

    ctx.font = "22px monospace";
    ctx.fillText("Press any key to go back ", win.w / 2, win.h / 2 + 180);
  } else {
    ctx.font = "22px monospace";
    gameState.menu_mouse_active = -1;
    for (let i = 0; i < gameState.menu_items.length; ++i) {
      let size = ctx.measureText(gameState.menu_items[i]);
      let left = win.w / 2 - size.actualBoundingBoxLeft - 30;
      let top = win.h / 2 + 60 * i - 20;
      let width = size.width + 60;
      let height = 40;
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
        ctx.fillStyle = "rgba(255, 255, 255, 0.33)";
        ctx.strokeStyle = "skyblue";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(left, top, width, height, height / 5);
        ctx.stroke();
        ctx.fill();
      }

      ctx.fillStyle = "white";
      ctx.fillText(gameState.menu_items[i], win.w / 2, win.h / 2 + 60 * i);
    }
  }
}

function _drawGameTitle(ctx, gameState) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.font = "80px monospace";
  ctx.fillText("Asteroids", gameState.win.w / 2, gameState.win.h / 3);
  ctx.font = "18px monospace";
  ctx.fillText(
    "By Andreas McDermott",
    gameState.win.w / 2,
    gameState.win.h / 3 + 50
  );
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

  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.fillRect(0, 0, win.w, win.h);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.font = "80px monospace";
  ctx.fillText("Game Over", win.w / 2, win.h / 2 - 50);
  ctx.font = "30px monospace";
  ctx.fillText(
    `Final Score: ${Math.round(gameState.points).toLocaleString("en-US")}`,
    win.w / 2,
    win.h / 2 + 50
  );
  ctx.font = "22px monospace";
  ctx.fillText("Press Enter to Restart", win.w / 2, win.h / 2 + 160);
  if (keypressed(gameState, "Enter")) {
    gameState.level = -1;
    gameState.screen = "play";
  }
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
