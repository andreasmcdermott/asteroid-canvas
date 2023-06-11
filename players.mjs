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
} from "./utils.mjs";
import { particle } from "./particles.mjs";

let player_acc = 0.0006;
let player_max_speed = 0.3;
let player_rot_speed = 0.5;
let laser_cooldown = 200;
let thrust_size = [6, 12];
let thrust_max_age = 300;
let thrust_cooldown = 30;
let max_shield_charge = 5000;
let shield_recharge_rate = 1;
let shield_discharge_cooldown = 2500;
let player_invincibilty_max = 2500;

export class Player extends Entity {
  constructor() {
    super();
    this.w = 24;
    this.h = 64;
    this.r = 0;
    this.angle = 0;
    this.rot = 0;
    this.v = new Vec2();
  }

  activate(x, y) {
    super.activate(x, y);
    this.r = this.h / 1.7;
    this.angle = 270;
    this.rot = 0;
    this.v.set(0, 0);
    this.laser_cooldown = 0;
    this.thrust_cooldown = 0;
    this.shield = false;
    this.shield_charge = max_shield_charge;
    this.shield_cooldown_timer = 0;
    this.invincibility = player_invincibilty_max;
  }

  _drawGui(ctx) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgb(25, 255, 25)";
    ctx.fillStyle =
      this.shield_charge <= 0
        ? `rgba(255, 25, 25, ${
            this.shield_recharging
              ? Math.sin(
                  (this.shield_cooldown_timer / shield_discharge_cooldown) *
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
          : clampMin(this.shield_charge / max_shield_charge)),
      16
    );
  }

  _draw(ctx, x, y, strokeStyle) {
    drawShip(ctx, x, y, this.angle, this.w, this.h, strokeStyle);
    if (this.shield) drawShield(ctx, x, y, this.angle, this.r);
  }

  draw(ctx, gameState) {
    let strokeStyle = Rgba.white.copy();

    if (this.invincibility > 0) {
      strokeStyle.alpha(
        clampMin(
          Math.sin((this.invincibility / player_invincibilty_max) * PI * 24),
          0.25
        )
      );
    }

    let xx = null;
    let yy = null;
    if (this.p.x - this.w < 0) xx = this.p.x + gameState.win.w;
    else if (this.p.x + this.w > gameState.win.w)
      xx = this.p.x - gameState.win.w;
    if (this.p.y - this.h < 0) yy = this.p.y + gameState.win.h;
    else if (this.p.y + this.h > gameState.win.h)
      yy = this.p.y - gameState.win.h;

    this._draw(ctx, this.p.x, this.p.y, strokeStyle);
    if (xx !== null) this._draw(ctx, xx, this.p.y, strokeStyle);
    if (yy !== null) this._draw(ctx, this.p.x, yy, strokeStyle);
    if (xx !== null && yy !== null) this._draw(ctx, xx, yy, strokeStyle);

    this._drawGui(ctx);
  }

  update(dt, gameState) {
    let actions = {
      RotLeft: gameState.input.ArrowLeft || gameState.input.a,
      RotRight: gameState.input.ArrowRight || gameState.input.d,
      Accelerate: gameState.input.ArrowUp || gameState.input.w,
      Fire:
        gameState.input[" "] || gameState.input["."] || gameState.input.Mouse0,
      Shield:
        gameState.input.Shift || gameState.input[","] || gameState.input.Mouse2,
    };

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
    } else this.angle = wrapDeg(this.angle + this.rot * player_rot_speed * dt);

    if (actions.Shield && this.shield_charge > 0 && this.invincibility <= 0) {
      this.shield_recharging = false;
      this.shield = true;
    } else {
      if (!actions.Shield) this.shield_recharging = true;
      this.shield = false;
    }
    if (this.shield) {
      this.shield_charge = clampMin(this.shield_charge - dt);
      if (this.shield_charge === 0) {
        this.shield_cooldown_timer = shield_discharge_cooldown;
      }
    } else if (this.shield_recharging) {
      this.shield_cooldown_timer = clampMin(this.shield_cooldown_timer - dt);
      if (this.shield_cooldown_timer <= 0) {
        this.shield_charge = clampMax(
          this.shield_charge + dt * shield_recharge_rate,
          max_shield_charge
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

    if (!this.shield && actions.Fire && this.invincibility <= 0) {
      if (this.laser_cooldown <= 0) {
        this.laser_cooldown = laser_cooldown;
        let v = Vec2.fromAngle(this.angle);
        let x = this.p.x + v.x * this.h * 0.5;
        let y = this.p.y + v.y * this.h * 0.5;
        if (x < 0) x += gameState.win.w;
        else if (x > gameState.win.w) x -= gameState.win.w;
        if (y < 0) y += gameState.win.h;
        else if (y > gameState.win.h) y += gameState.win.h;
        gameState.projectiles.push(x, y, this.angle);
      }
    }

    this.p.add(this.v.copy().scale(dt));

    if (this.p.x - this.w > gameState.win.w) this.p.x -= gameState.win.x;
    else if (this.p.x + this.w < 0) this.p.x += gameState.win.x;
    if (this.p.y - this.h > gameState.win.y) this.p.y -= gameState.win.y;
    else if (this.p.y + this.h < 0) this.p.y += gameState.win.y;

    this.thrust_cooldown = clampMin(this.thrust_cooldown - dt);
    this.laser_cooldown = clampMin(this.laser_cooldown - dt);
    this.invincibility = clampMin(this.invincibility - dt);
  }
}

function drawShip(ctx, x, y, angle, w, h, strokeStyle = "white") {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle * DEG2RAD);
  ctx.lineWidth = 2;
  ctx.fillStyle = "black";
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

function drawShield(ctx, x, y, angle, r) {
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
