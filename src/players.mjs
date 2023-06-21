import { Entity } from "./entities.mjs";
import {
  Vec2,
  ImageAsset,
  DEG2RAD,
  PI2,
  clampMin,
  clampMax,
  PI,
  wrapDeg,
  RAD2DEG,
  distance,
  rnd,
  keydown,
  SpriteSheetImage,
  GuiBackgroundImage,
  GuiBarImage,
  gamepadButtonPressed,
  gamepadAnalogButtonDown,
  gamepadButtonDown,
  gamepadAnalogStick,
  gamepadStickIsActive,
} from "./utils.mjs";
import { particle } from "./particles.mjs";
import { max_lives } from "./constants.mjs";
import { drawText, measureText } from "./gui.mjs";

let player_acc = 0.0006;
let player_max_speed = 0.3;
let player_rot_speed = 0.5;
let thrust_cooldown = 30;
let player_invincibilty_max = 1500;
let restart_cooldown = 500;

export class Player extends Entity {
  static cursor = new ImageAsset("ui", 333, 469, 30, 30);
  static ship = new SpriteSheetImage(305, 384, 94, 96, 90);
  static thrust = new SpriteSheetImage(610, 0, 62, 126, 90);
  static bg = new GuiBackgroundImage(100, 200, 99, 100, 20, 20);
  static barbg = new GuiBarImage(
    [400, 182, 6, 26],
    [386, 314, 12, 26],
    [400, 208, 6, 26]
  );
  static bar = new GuiBarImage(
    [402, 314, 6, 26],
    [402, 236, 12, 26],
    [402, 366, 6, 26]
  );
  static barred = new GuiBarImage(
    [400, 130, 6, 26],
    [388, 340, 12, 26],
    [400, 156, 6, 26]
  );
  static shield = new ImageAsset("shield", 0, 0, 512, 512);

  constructor() {
    super();
    this.w = 64;
    this.h = 64;
    this.r = Math.max(this.w, this.h) * 0.65;
    this.angle = 270;
    this.rot = 0;
    this.v = new Vec2();
    this.destroyed = false;
    this.restart_timer = 0;
    this.lives = 0;
    this.acc = false;
  }

  activate(gameState, x, y) {
    super.activate(gameState, x, y);
    this.destroyed = false;
    this.restart_timer = 0;
    this.angle = 270;
    this.rot = 0;
    this.v.set(0, 0);
    this.laser_cooldown = 0;
    this.thrust_cooldown = 0;
    this.shield = false;
    this.shield_charge = gameState.settings.max_shield_charge;
    this.shield_cooldown_timer = 0;
    this.invincibility = player_invincibilty_max;
    this.lives = 3;
    this.acc = false;
  }

  resetForNewLevel(gameState) {
    this._restart(gameState);
  }

  _restart(gameState) {
    this.acc = false;
    this.destroyed = false;
    this.restart_timer = 0;
    this.angle = 270;
    this.rot = 0;
    this.p.set(gameState.win.w / 2, gameState.win.h / 2);
    this.v.set(0, 0);
    this.laser_cooldown = 0;
    this.thrust_cooldown = 0;
    this.shield = false;
    this.shield_charge = gameState.settings.max_shield_charge;
    this.shield_cooldown_timer = 0;
    this.invincibility = player_invincibilty_max;
  }

  _destroy(gameState) {
    gameState.screen_shake = 500;
    this.lives--;
    this.destroyed = true;
    this.restart_timer = restart_cooldown;
    particle(gameState, rnd(100), {
      x: this.p.x,
      y: this.p.y,
      v0x: [-1, 1],
      v0y: [-1, 1],
      v0v: [0.01, 0.35],
      v1x: 0,
      v1y: 0,
      v1v: 0,
      cr0: [200, 255],
      cg0: [128, 200],
      cb0: 0,
      ca0: [0.55, 0.75],
      ca1: 0,
      r0: [6, 10],
      r1: 0,
      rot0: [-180, 180],
      rot1: [-180, 180],
      delay: [0, 50],
      life: [500, 1500],
    });
    particle(gameState, 3, {
      x: this.p.x,
      y: this.p.y,
      life: 250,
      cr0: 255,
      cg0: 200,
      cb0: 0,
      ca0: 0.5,
      ca1: 0,
      r0: 0,
      r1: this.h * 3,
      rot0: [-45, 45],
      rot1: [-45, 45],
      style: "stroke",
      lineWidth: 4,
      delay: [0, 50],
    });
  }

  drawGui(ctx, gameState) {
    let barw = Math.max(gameState.win.w * 0.2, 200);
    let shipw = (this.w / 3 + 10) * max_lives;

    // Background
    Player.bg.draw(gameState, -20, -20, barw + shipw + 60, 64);

    // Shield
    let alpha = 1;
    let fill =
      this.shield_charge <= 0
        ? 1
        : clampMin(this.shield_charge / gameState.settings.max_shield_charge);
    if (this.shield_charge <= 0) {
      if (this.shield_recharging)
        alpha = Math.sin(
          (this.shield_cooldown_timer /
            gameState.settings.shield_discharge_cooldown) *
            PI *
            3
        );
      else alpha = 0.75;
    }
    ctx.globalAlpha = alpha;
    Player.barbg.draw(gameState, 10, 10, barw, 20);
    (this.shield_charge <= 0 ? Player.barred : Player.bar).draw(
      gameState,
      10,
      10,
      barw * fill,
      20
    );
    ctx.globalAlpha = 1;

    // Lives
    let i = 0;
    for (i; i < this.lives; ++i) {
      ctx.save();
      ctx.translate(barw + 30 + i * (this.w / 3 + 10), 10);
      ctx.rotate(-90 * DEG2RAD);
      Player.ship.draw(gameState, 0, 0, this.w / 3, this.h / 3);
      ctx.restore();
    }

    // Score Background
    let text = `Score: ${Math.round(gameState.points).toLocaleString("en-US")}`;
    let tw = measureText(gameState, text, "m");
    Player.bg.draw(gameState, gameState.win.w - tw - 60, -20, tw + 90, 64);
    drawText(gameState, text, gameState.win.w - 20, 16, "m", "right");

    // Cursor
    if (gameState.active_input === "mouse" && gameState.screen === "play") {
      Player.cursor.draw(
        gameState,
        gameState.mx - 16,
        gameState.my - 16,
        32,
        32
      );
    }
  }

  draw(ctx, gameState) {
    if (this.active && !this.destroyed) {
      let alpha = 1;

      if (this.invincibility > 0) {
        alpha = clampMin(
          Math.sin((this.invincibility / player_invincibilty_max) * PI * 12),
          0.25
        );
      }

      ctx.save();
      ctx.translate(this.p.x, this.p.y);
      ctx.rotate(this.angle * DEG2RAD);
      ctx.globalAlpha = alpha;
      Player.ship.draw(gameState, -this.w * 0.5, -this.h * 0.5, this.w, this.h);
      if (this.acc) {
        Player.thrust.draw(
          gameState,
          this.w / -9,
          this.h * 0.5 - 11,
          this.w / 4,
          this.w / 2
        );
      }
      ctx.restore();
      ctx.globalAlpha = 1;

      if (this.shield) {
        drawShield(gameState, this.p.x, this.p.y, this.angle, this.r);
      }
    }
    this.drawGui(ctx, gameState);
  }

  update(dt, gameState) {
    if (!this.active) return;
    if (this.destroyed) {
      if (this.lives > 0) {
        this.restart_timer = clampMin(this.restart_timer - dt);

        if (this.restart_timer <= 0) this._restart(gameState);
      } else {
        gameState.screen = "gameOver";
        gameState.screen_transition = 1500;
      }
      return;
    }

    let actions = {
      RotLeft: keydown(gameState, "ArrowLeft") || keydown(gameState, "a"),
      RotRight: keydown(gameState, "ArrowRight") || keydown(gameState, "d"),
      Accelerate:
        keydown(gameState, "ArrowUp") ||
        keydown(gameState, "w") ||
        gamepadButtonDown(gameState, "A"),
      Fire:
        keydown(gameState, " ") ||
        keydown(gameState, ".") ||
        keydown(gameState, "Mouse0") ||
        gamepadAnalogButtonDown(gameState, "RightTrigger", 0.5),
      Shield:
        keydown(gameState, "Shift") ||
        keydown(gameState, ",") ||
        keydown(gameState, "Mouse2") ||
        gamepadAnalogButtonDown(gameState, "LeftTrigger", 0.5),
    };

    if (gameState.screen === "play") {
      if (actions.Shield && this.shield_charge > 0) {
        this.shield_recharging = false;
        this.shield = true;
      } else {
        if (!actions.Shield) this.shield_recharging = true;
        this.shield = false;
      }
      if (this.shield) {
        this.shield_charge = clampMin(this.shield_charge - dt);
        if (this.shield_charge === 0) {
          this.shield_cooldown_timer =
            gameState.settings.shield_discharge_cooldown;
        }
      } else if (this.shield_recharging) {
        this.shield_cooldown_timer = clampMin(this.shield_cooldown_timer - dt);
        if (this.shield_cooldown_timer <= 0) {
          this.shield_charge = clampMax(
            this.shield_charge + dt * gameState.settings.shield_recharge_rate,
            gameState.settings.max_shield_charge
          );
        }
      }

      if (gamepadStickIsActive(gameState, "LeftStick")) {
        let acc = gamepadAnalogStick(gameState, "LeftStick");
        acc.normalize();
        this.angle =
          RAD2DEG * Math.acos(acc.x * 1 + acc.y * 0) * (acc.y < 0 ? -1 : 1);
      } else if (gamepadStickIsActive(gameState, "RightStick")) {
        let acc = gamepadAnalogStick(gameState, "RightStick");
        acc.normalize();
        this.angle =
          RAD2DEG * Math.acos(acc.x * 1 + acc.y * 0) * (acc.y < 0 ? -1 : 1);
      } else {
        if (actions.RotLeft) {
          this.rot = -1;
        }
        if (actions.RotRight) {
          this.rot = 1;
        }
        if (actions.RotLeft === actions.RotRight) this.rot = 0;

        if (gameState.has_mouse_lock) {
          let dir = new Vec2(
            gameState.mx - this.p.x,
            gameState.my - this.p.y
          ).normalize();
          this.angle = Math.atan2(dir.y, dir.x) * RAD2DEG;
        } else
          this.angle = wrapDeg(this.angle + this.rot * player_rot_speed * dt);
      }

      if (
        !this.shield &&
        (actions.Accelerate || gamepadStickIsActive(gameState, "LeftStick"))
      ) {
        this.acc = true;
        let acc = Vec2.fromAngle(this.angle);
        this.v.add(acc.scale(dt * player_acc));
        if (this.v.len() > player_max_speed) {
          this.v.normalize().scale(player_max_speed);
        }
        if (this.thrust_cooldown <= 0) {
          this.thrust_cooldown = thrust_cooldown;
        }
      } else {
        this.acc = false;
      }

      if (!this.shield && actions.Fire) {
        if (this.laser_cooldown <= 0) {
          this.laser_cooldown = gameState.settings.laser_cooldown;
          let v = Vec2.fromAngle(this.angle);
          let x = this.p.x + v.x * this.h * 0.5;
          let y = this.p.y + v.y * this.h * 0.5;
          if (x < 0) x += gameState.win.w;
          else if (x > gameState.win.w) x -= gameState.win.w;
          if (y < 0) y += gameState.win.h;
          else if (y > gameState.win.h) y += gameState.win.h;
          gameState.projectiles.push(gameState, x, y, this.angle);
        }
      }
    }

    this.p.add(this.v.copy().scale(dt));

    if (this.p.x - this.w > gameState.win.w) this.p.x = -this.w;
    else if (this.p.x + this.w < 0) this.p.x = gameState.win.x + this.w;
    if (this.p.y - this.h > gameState.win.y) this.p.y = -this.h;
    else if (this.p.y + this.h < 0) this.p.y = gameState.win.y + this.h;

    this.thrust_cooldown = clampMin(this.thrust_cooldown - dt);
    this.laser_cooldown = clampMin(this.laser_cooldown - dt);
    this.invincibility = clampMin(this.invincibility - dt);

    // Collision with asteroids

    if (this.invincibility <= 0) {
      for (let asteroid of gameState.asteroids) {
        let d = distance(this.p, asteroid.p);
        if (d < this.r + asteroid.radius) {
          if (this.shield) {
            let diff_vec = asteroid.p.copy().sub(this.p).normalize();

            this.v = this.p
              .copy()
              .sub(asteroid.p)
              .normalize()
              .scale((asteroid.v.len() + this.v.len()) * 0.5);
            asteroid.v = diff_vec
              .copy()
              .scale((asteroid.v.len() + this.v.len()) * 0.45);
            asteroid.p.add(
              asteroid.v
                .copy()
                .normalize()
                .scale(this.r + asteroid.radius - d)
            );
            let collp = this.p.copy().add(diff_vec.copy().scale(this.r));
            let dir = collp.copy().normalize();
            particle(gameState, 15, {
              x: collp.x,
              y: collp.y,
              v0x: [dir.x - 2, dir.x + 2],
              v0y: [dir.y - 2, dir.y + 2],
              v0v: [0.45, 0.65],
              v1v: 0,
              cr0: 88,
              cg0: 222,
              cb0: 191,
              ca0: 1,
              ca1: 0,
              r0: [2, 4],
              life: [50, 200],
              delay: [0, 10],
            });
          } else {
            if (this.active) {
              this._destroy(gameState);
            }

            break;
          }
        }
      }
    }
  }
}

export function drawShield(gameState, x, y, angle, r) {
  let { ctx } = gameState;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle * DEG2RAD);
  ctx.globalAlpha = 0.75;
  ctx.globalCompositeOperation = "source-over";
  Player.shield.draw(gameState, -r, -r, r * 2, r * 2);
  ctx.globalCompositeOperation = "darken";
  ctx.fillStyle = "rgba(50,255,185,1)";
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r, 0, 0, PI2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "white";
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
}
