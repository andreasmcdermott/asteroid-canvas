import { asteroid_levels } from "./constants.mjs";
import { Entity } from "./entities.mjs";
import { particle } from "./particles.mjs";
import {
  Vec2,
  rnd,
  wrapDeg,
  DEG2RAD,
  line_intersect_circle,
} from "./utils.mjs";

let asteroid_rot_speed = [0.05, 0.15];
let asteroid_start_dir = [-1, 1];

export class Asteroid extends Entity {
  constructor() {
    super();
    this.level = -1;
    this.radius = 0;
    this.angle = 0;
    this.rot = 0;
    this.v = new Vec2();
  }

  activate(gameState, x, y, level) {
    super.activate(gameState, x, y);
    let settings = gameState.settings;
    this.level = level;
    this.radius = rnd(...settings.asteroid_sizes[level]) * 0.5;
    this.angle = rnd(360);
    this.rot = rnd(-1, 1) * rnd(...asteroid_rot_speed);
    this.v
      .set(rnd(-1, 1), rnd(-1, 1))
      .normalize()
      .scale(rnd(...settings.asteroid_speed));
  }

  _destroy(gameState) {
    this.deactivate();
    gameState.points += 10 * (asteroid_levels - this.level);
    gameState.screen_shake = 75 * (asteroid_levels - this.level);
    particle(gameState, 20 * (asteroid_levels - this.level), {
      x: this.p.x,
      y: this.p.y,
      v0x: asteroid_start_dir,
      v0y: asteroid_start_dir,
      v0v: [0.01, 0.24],
      v1x: 0,
      v1y: 0,
      v1v: 0,
      cr0: 255,
      cg0: 255,
      cb0: 255,
      ca0: [0.5, 1],
      ca1: 0,
      r0: [2, 5],
      r1: 0.1,
      delay: [0, 150],
      life: [1000, 3000],
    });
    particle(gameState, 3, {
      x: this.p.x,
      y: this.p.y,
      life: 250,
      cr0: 255,
      cg0: 255,
      cb0: 255,
      ca0: 0.5,
      ca1: 0,
      r0: 0,
      r1: this.radius * 3,
      style: "stroke",
      lineWidth: 4,
      delay: [0, 50],
    });
  }

  _draw(ctx, x, y) {
    drawAsteroid(
      ctx,
      x,
      y,
      this.angle,
      this.radius,
      asteroid_levels - this.level + 1
    );
  }

  draw(ctx, gameState) {
    let xx = null;
    let yy = null;
    if (this.p.x - this.radius < 0) xx = this.p.x + gameState.win.w;
    else if (this.p.x + this.radius > gameState.win.w)
      xx = this.p.x - gameState.win.w;
    if (this.p.y - this.radius < 0) yy = this.p.y + gameState.win.h;
    else if (this.p.y + this.radius > gameState.win.h)
      yy = this.p.y - gameState.win.h;

    this._draw(ctx, this.p.x, this.p.y);
    if (xx !== null) this._draw(ctx, xx, this.p.y);
    if (yy !== null) this._draw(ctx, this.p.x, yy);
    if (xx !== null && yy !== null) this._draw(ctx, xx, yy);
  }

  update(dt, gameState) {
    this.angle = wrapDeg(this.angle + this.rot * dt);
    this.p.add(this.v.copy().scale(dt));

    // Wrap around:

    if (this.p.x - this.radius > gameState.win.w) this.p.x -= gameState.win.w;
    else if (this.p.x + this.radius < 0) this.p.x += gameState.win.w;
    if (this.p.y - this.radius > gameState.win.h) this.p.y -= gameState.win.h;
    else if (this.p.y + this.radius < 0) this.p.y += gameState.win.h;

    // Collisions with projectiles:
    // TODO: Handle collision when wrapping around
    for (let projectile of gameState.projectiles) {
      if (
        line_intersect_circle(
          projectile.p,
          projectile.p.copy().add(projectile.v.copy().scale(projectile.len)),
          this.p,
          this.radius
        )
      ) {
        projectile.deactivate();
        this._destroy(gameState);

        if (this.level + 1 < asteroid_levels) {
          let settings = gameState.settings;
          for (let i = 0; i < settings.new_asteroids[this.level + 1]; ++i) {
            gameState.asteroids.push(
              gameState,
              this.p.x,
              this.p.y,
              this.level + 1
            );
          }
        }
      }
    }
  }
}

function drawAsteroid(
  ctx,
  x,
  y,
  angle,
  radius,
  lineWidth = 2,
  strokeStyle = "white",
  fillStyle = "black"
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle * DEG2RAD);
  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.roundRect(-radius, -radius, radius * 2, radius * 2, radius / 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
