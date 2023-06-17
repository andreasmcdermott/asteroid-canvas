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
} from "./utils.mjs";
import { particle } from "./particles.mjs";

let player_acc = 0.0006;
let player_max_speed = 0.3;
let player_rot_speed = 0.5;
let thrust_cooldown = 30;
let player_invincibilty_max = 1500;
let restart_cooldown = 500;

export class Player extends Entity {
  static ship = new SpriteSheetImage(305, 384, 94, 96, 90);
  static shield = new ImageAsset("shield", 0, 0, 512, 512);
  static thrust = new SpriteSheetImage(610, 0, 62, 126, 90);

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
      style: "stroke",
      lineWidth: 4,
      delay: [0, 50],
    });
  }

  drawGui(ctx, gameState) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgb(25, 255, 25)";
    ctx.fillStyle =
      this.shield_charge <= 0
        ? `rgba(255, 25, 25, ${
            this.shield_recharging
              ? Math.sin(
                  (this.shield_cooldown_timer /
                    gameState.settings.shield_discharge_cooldown) *
                    PI *
                    32
                )
              : 0.5
          })`
        : `rgba(25, 255, 25, 0.5)`;
    ctx.strokeRect(15, 15, 200, 20);
    ctx.fillRect(
      17,
      17,
      196 *
        (this.shield_charge <= 0
          ? 1
          : clampMin(
              this.shield_charge / gameState.settings.max_shield_charge
            )),
      16
    );

    let i = 0;
    for (i; i < this.lives; ++i) {
      ctx.save();
      ctx.translate(250 + i * (this.w / 2 + 10), 10);
      ctx.rotate(-90 * DEG2RAD);
      Player.ship.draw(gameState, 0, 0, this.w / 2, this.h / 2);
      ctx.restore();
    }

    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.fillText(
      `Score: ${Math.round(gameState.points).toLocaleString("en-US")}`,
      gameState.win.w - 10,
      16
    );
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
      if (this.shield) {
        ctx.globalAlpha = 0.75;
        ctx.globalCompositeOperation = "source-over";
        Player.shield.draw(gameState, -this.r, -this.r, this.r * 2, this.r * 2);
        ctx.globalCompositeOperation = "darken";
        ctx.fillStyle = "rgba(50,255,185,1)";
        ctx.beginPath();
        ctx.ellipse(0, 0, this.r, this.r, 0, 0, PI2);
        ctx.fill();
      }
      ctx.fillStyle = "white";
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    if (gameState.screen === "play") this.drawGui(ctx, gameState);
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
      Accelerate: keydown(gameState, "ArrowUp") || keydown(gameState, "w"),
      Fire:
        keydown(gameState, " ") ||
        keydown(gameState, ".") ||
        keydown(gameState, "Mouse0"),
      Shield:
        keydown(gameState, "Shift") ||
        keydown(gameState, ",") ||
        keydown(gameState, "Mouse2"),
    };

    if (gameState.screen === "play") {
      if (actions.RotLeft) {
        this.rot = -1;
        gameState.mouse_active = false;
      }
      if (actions.RotRight) {
        this.rot = 1;
        gameState.mouse_active = false;
      }
      if (actions.RotLeft === actions.RotRight) this.rot = 0;

      if (gameState.mouse_active && gameState.screen !== "pause") {
        let dir = new Vec2(
          gameState.input.MouseX - this.p.x,
          gameState.input.MouseY - this.p.y
        ).normalize();
        this.angle = Math.atan2(dir.y, dir.x) * RAD2DEG;
      } else
        this.angle = wrapDeg(this.angle + this.rot * player_rot_speed * dt);

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

      if (!this.shield && actions.Accelerate) {
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
              v0v: [0.5, 0.75],
              v1v: 0,
              cr0: 100,
              cg0: 255,
              cb0: 100,
              ca0: 1,
              ca1: 0,
              r0: [1, 2],
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

function drawShip(
  ctx,
  x,
  y,
  angle,
  w,
  h,
  strokeStyle = "white",
  fillStyle = "black",
  lineWidth = 2
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

export function drawShield(ctx, x, y, angle, r) {
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
