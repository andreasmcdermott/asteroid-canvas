import { Entity } from "./entities.mjs";
import {
  Vec2,
  Rgba,
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
} from "./utils.mjs";
import { particle } from "./particles.mjs";

let player_acc = 0.0006;
let player_max_speed = 0.3;
let player_rot_speed = 0.5;
let thrust_size = [6, 12];
let thrust_max_age = 300;
let thrust_cooldown = 30;
let player_invincibilty_max = 1500;
let restart_cooldown = 500;

export class Player extends Entity {
  constructor() {
    super();
    this.w = 24;
    this.h = 64;
    this.r = this.h / 1.7;
    this.angle = 0;
    this.rot = 0;
    this.v = new Vec2();
    this.destroyed = false;
    this.restart_timer = 0;
    this.lives = 0;
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
  }

  resetForNewLevel(gameState) {
    this._restart(gameState);
  }

  _restart(gameState) {
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

  _drawGui(ctx, gameState) {
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
    ctx.strokeRect(10, 10, 200, 20);
    ctx.fillRect(
      12,
      12,
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
      drawShip(
        ctx,
        250 + i * (this.w / 3 + 20),
        20,
        270,
        this.w / 3,
        this.h / 3,
        "rgba(255, 255, 255, 1)",
        "rgba(0, 0, 0, 0.5)",
        1
      );
    }

    if (this.restart_timer > 0) {
      drawShip(
        ctx,
        250 + i * (this.w / 3 + 20),
        20,
        270,
        this.w / 3,
        this.h / 3,
        `rgba(255, 255, 255, ${Math.sin(
          (this.restart_timer / restart_cooldown) * PI * 8
        )})`,
        "rgba(0, 0, 0, 0.5)",
        1
      );
    }

    ctx.fillStyle = "white";
    ctx.textAlign = "right";
    ctx.fillText(
      `Score: ${Math.round(gameState.points).toLocaleString("en-US")}`,
      gameState.win.w - 10,
      16
    );
  }

  _draw(ctx, x, y, strokeStyle) {
    drawShip(ctx, x, y, this.angle, this.w, this.h, strokeStyle);
    if (this.shield) drawShield(ctx, x, y, this.angle, this.r);
  }

  draw(ctx, gameState) {
    if (this.active && !this.destroyed) {
      let strokeStyle = Rgba.white.copy();

      if (this.invincibility > 0) {
        strokeStyle.alpha(
          clampMin(
            Math.sin((this.invincibility / player_invincibilty_max) * PI * 12),
            0.25
          )
        );
      }

      // let xx = null;
      // let yy = null;
      // if (this.p.x - this.w < 0) xx = this.p.x + gameState.win.w;
      // else if (this.p.x + this.w > gameState.win.w)
      //   xx = this.p.x - gameState.win.w;
      // if (this.p.y - this.h < 0) yy = this.p.y + gameState.win.h;
      // else if (this.p.y + this.h > gameState.win.h)
      //   yy = this.p.y - gameState.win.h;

      this._draw(ctx, this.p.x, this.p.y, strokeStyle);
      // if (xx !== null) this._draw(ctx, xx, this.p.y, strokeStyle);
      // if (yy !== null) this._draw(ctx, this.p.x, yy, strokeStyle);
      // if (xx !== null && yy !== null) this._draw(ctx, xx, yy, strokeStyle);
    }

    // if (gameState.screen === "play")
    this._drawGui(ctx, gameState);
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
        let acc = Vec2.fromAngle(this.angle);
        this.v.add(acc.scale(dt * player_acc));
        if (this.v.len() > player_max_speed) {
          this.v.normalize().scale(player_max_speed);
        }
        if (this.thrust_cooldown <= 0) {
          this.thrust_cooldown = thrust_cooldown;
          let v = Vec2.fromAngle(this.angle);
          let x = this.p.x - v.x * this.h * 0.6;
          let y = this.p.y - v.y * this.h * 0.6;
          if (x < 0) x += gameState.win.w;
          else if (x > gameState.win.w) x -= gameState.win.w;
          if (y < 0) y += gameState.win.h;
          else if (y > gameState.win.h) y += gameState.win.h;
          particle(gameState, 1, {
            x,
            y,
            life: thrust_max_age,
            cr0: 255,
            cg0: 255,
            ca0: 1,
            cr1: 200,
            cg1: 55,
            ca1: 0,
            r0: thrust_size,
            r1: 0,
          });
        }
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
            this.v = this.p
              .copy()
              .sub(asteroid.p)
              .normalize()
              .scale((asteroid.v.len() + this.v.len()) * 0.5);
            asteroid.v = asteroid.p
              .copy()
              .sub(this.p)
              .normalize()
              .scale((asteroid.v.len() + this.v.len()) * 0.45);
            asteroid.p.add(
              asteroid.v
                .copy()
                .normalize()
                .scale(this.r + asteroid.radius - d)
            );
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
