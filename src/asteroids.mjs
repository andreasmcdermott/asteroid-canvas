import { asteroid_levels } from "./constants.mjs";
import { Entity } from "./entities.mjs";
import { particle } from "./particles.mjs";
import {
  Vec2,
  rnd,
  wrapDeg,
  DEG2RAD,
  clampMax,
  line_intersect_circle,
  SpriteSheetImage,
} from "./utils.mjs";

let asteroid_rot_speed = [0.05, 0.15];
let asteroid_start_dir = [-1, 1];

export class Asteroid extends Entity {
  static large = [
    new SpriteSheetImage(592, 288, 96),
    new SpriteSheetImage(592, 192, 96),
  ];
  static medium = [
    new SpriteSheetImage(688, 287, 64),
    new SpriteSheetImage(736, 96, 64),
  ];
  static small = [
    new SpriteSheetImage(400, 448, 64),
    new SpriteSheetImage(216, 192, 64),
  ];

  constructor() {
    super();
    this.level = -1;
    this.radius = 0;
    this.angle = 0;
    this.rot = 0;
    this.img = new SpriteSheetImage(0, 0, 0, 0);
    this.v = new Vec2();
  }

  activate(gameState, x, y, level) {
    super.activate(gameState, x, y);
    let settings = gameState.settings;
    this.level = level;
    this.radius = rnd(...settings.asteroid_sizes[level]) * 0.5;
    this.img = (
      this.level === 0
        ? Asteroid.large
        : this.level === 1
        ? Asteroid.medium
        : Asteroid.small
    )[Math.floor(rnd(2))];
    this.angle = rnd(360);
    this.rot = rnd(-1, 1) * rnd(...asteroid_rot_speed);
    this.v
      .set(rnd(-1, 1), rnd(-1, 1))
      .normalize()
      .scale(rnd(...settings.asteroid_speed));
  }

  _destroy(gameState) {
    this.deactivate();
    gameState.points +=
      10 * (asteroid_levels - this.level) * gameState.settings.points_modifier;
    if (Math.floor(gameState.points / 5000) > gameState.last_points_payed) {
      gameState.last_points_payed += 1;
      gameState.player.lives = clampMax(gameState.player.lives + 1, 5);
    }
    gameState.screen_shake = 50 * (asteroid_levels - this.level);
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

  draw(ctx, gameState) {
    ctx.save();
    ctx.translate(this.p.x, this.p.y);
    ctx.rotate(this.angle * DEG2RAD);
    this.img.draw(gameState, -this.radius, -this.radius, this.radius * 2);
    ctx.restore();
  }

  update(dt, gameState) {
    this.angle = wrapDeg(this.angle + this.rot * dt);
    this.p.add(this.v.copy().scale(dt));

    // Wrap around:

    if (this.p.x - this.radius > gameState.win.w) this.p.x = -this.radius;
    else if (this.p.x + this.radius < 0)
      this.p.x = gameState.win.w + this.radius;
    if (this.p.y - this.radius > gameState.win.h) this.p.y = -this.radius;
    else if (this.p.y + this.radius < 0)
      this.p.y = gameState.win.h + this.radius;

    // Collisions with projectiles:
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
