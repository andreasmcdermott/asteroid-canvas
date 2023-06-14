var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// src/utils.mjs
var PI = Math.PI;
var PI2 = Math.PI * 2;
var DEG2RAD = PI / 180;
var RAD2DEG = 180 / PI;
function rnd(first, second) {
  if (arguments.length === 1)
    return Math.random() * first;
  return Math.random() * (second - first) + first;
}
function keypressed(gameState, key) {
  return !gameState.input[key] && !!gameState.lastInput[key];
}
function keydown(gameState, key) {
  return !!gameState.input[key];
}
var _Rgba = class {
  static lerp(c0, c1, t0, t) {
    return new _Rgba(
      lerp(c0.r, c1.r, t0, t),
      lerp(c0.g, c1.g, t0, t),
      lerp(c0.b, c1.b, t0, t),
      lerp(c0.a, c1.a, t0, t)
    );
  }
  static toString(r, g, b, a) {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  constructor(r, g, b, a = 1) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
  copyFrom(rgba) {
    this.r = rgba.r;
    this.g = rgba.g;
    this.b = rgba.b;
    this.a = rgba.a;
  }
  copy() {
    return new _Rgba(this.r, this.g, this.b, this.a);
  }
  set(r, g, b, a) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
  alpha(a) {
    this.a = a;
    return this;
  }
  toString() {
    return _Rgba.toString(this.r, this.g, this.b, this.a);
  }
};
var Rgba = _Rgba;
__publicField(Rgba, "black", new _Rgba(0, 0, 0));
__publicField(Rgba, "white", new _Rgba(255, 255, 255));
var _Vec2 = class {
  static rnd(min_x, max_x, min_y, max_y) {
    return new _Vec2(rnd(min_x, max_x), rnd(min_y, max_y));
  }
  static fromAngle(angle) {
    let rad = angle * DEG2RAD;
    return new _Vec2(Math.cos(rad), Math.sin(rad)).normalize();
  }
  static lerp(v0, v1, t0, t) {
    return new _Vec2(lerp(v0.x, v1.x, t0, t), lerp(v0.y, v1.y, t0, t));
  }
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  copyFrom(v) {
    this.x = v.x;
    this.y = v.y;
  }
  get w() {
    return this.x;
  }
  get h() {
    return this.y;
  }
  copy() {
    return new _Vec2(this.x, this.y);
  }
  len() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }
  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }
  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }
  scale(n) {
    this.x *= n;
    this.y *= n;
    return this;
  }
  normalize() {
    let len = this.len();
    if (len === 0) {
      this.x = 0;
      this.y = 0;
    } else {
      this.x /= len;
      this.y /= len;
    }
    return this;
  }
};
var Vec2 = _Vec2;
__publicField(Vec2, "origin", new _Vec2(0, 0));
function point_inside(p, bmin, bmax) {
  return p.x >= bmin.x && p.x <= bmax.x && p.y >= bmin.y && p.y <= bmax.y;
}
function line_intersect_circle(l1, l2, c, r) {
  return new Vec2(l1.x - c.x, l1.y - c.y).len() < r || new Vec2(l2.x - c.x, l2.y - c.y).len() < r;
}
function distance(c1, c2) {
  return new Vec2(c1.x - c2.x, c1.y - c2.y).len();
}
function wrapDeg(v) {
  return wrap(v, 0, 360);
}
function wrap(v, min, max) {
  if (v > max)
    return v - (max - min);
  if (v < min)
    return v + (max - min);
  return v;
}
function clamp(v, min, max) {
  if (min > max) {
    [min, max] = [max, min];
  }
  return Math.max(Math.min(v, max), min);
}
function clampMin(v, min = 0) {
  return Math.max(v, min);
}
function clampMax(v, max) {
  return Math.min(v, max);
}
function lerp(v0, v1, ct, t) {
  let span = v1 - v0;
  let p = ct / t;
  return clamp(v0 + span * p, v0, v1);
}

// src/entities.mjs
var Entity = class {
  constructor() {
    this.p = new Vec2();
    this.active = false;
  }
  copyFrom(e) {
    let keys = Object.keys(e);
    for (let i = 0; i < keys.length; ++i) {
      let key = keys[i];
      if (!e[key] || typeof e[key] !== "object")
        this[key] = e[key];
      else
        this[key].copyFrom(e[key]);
    }
    return this;
  }
  activate(gameState, x, y) {
    this.active = true;
    this.p.set(x, y);
  }
  deactivate() {
    this.active = false;
  }
  draw() {
  }
  update() {
  }
};
var EntityList = class {
  static copyFrom(e, Clazz) {
    let newList = new EntityList(e.size, Clazz);
    newList.activeCount = 0;
    for (let i = 0; i < newList.size; ++i) {
      newList.list[i].copyFrom(e.list[i]);
      if (newList.list[i].active)
        newList.activeCount++;
    }
    newList.index = e.index;
    return newList;
  }
  constructor(size, Clazz) {
    this.list = Array.from({ length: size }, () => new Clazz());
    this.index = 0;
    this.activeCount = 0;
  }
  get size() {
    return this.list.length;
  }
  *[Symbol.iterator]() {
    for (let i = 0; i < this.list.length; ++i) {
      if (this.list[i].active) {
        yield this.list[i];
      }
    }
  }
  reset() {
    for (let i = 0; i < this.list.length; ++i) {
      this.list[i].deactivate();
    }
    this.index = 0;
  }
  push(gameState, ...args) {
    this.list[this.index++].activate(gameState, ...args);
    if (this.index >= this.list.length)
      this.index = 0;
  }
  drawAll(ctx, gameState) {
    for (let i = 0; i < this.list.length; ++i) {
      if (this.list[i].active) {
        this.list[i].draw(ctx, gameState);
      }
    }
  }
  updateAll(dt, gameState) {
    this.activeCount = 0;
    for (let i = 0; i < this.list.length; ++i) {
      if (this.list[i].active) {
        this.activeCount++;
        this.list[i].update(dt, gameState);
      }
    }
  }
};

// src/particles.mjs
var Particle = class extends Entity {
  constructor() {
    super();
    this.v0 = new Vec2();
    this.v1 = new Vec2();
    this.c0 = new Rgba();
    this.c1 = new Rgba();
    this.r0 = 0;
    this.r1 = 0;
    this.delay = 0;
    this.life = 0;
    this.t = 0;
  }
  activate(gameState, x, y, v0x, v0y, v0v, v1x, v1y, v1v, c0r, c0g, c0b, c0a, c1r, c1g, c1b, c1a, r0, r1, delay, life, style, lineWidth) {
    super.activate(gameState, x, y);
    this.v0.set(v0x, v0y).normalize().scale(v0v);
    this.v1.set(v1x, v1y).normalize().scale(v1v);
    this.c0.set(c0r, c0g, c0b, c0a);
    this.c1.set(c1r, c1g, c1b, c1a);
    this.r0 = r0;
    this.r1 = r1;
    this.delay = delay;
    this.life = life;
    this.t = 0;
    this.style = style;
    this.lineWidth = lineWidth;
  }
  draw(ctx) {
    let r = lerp(this.r0, this.r1, this.t, this.life);
    let c = Rgba.lerp(this.c0, this.c1, this.t, this.life);
    if (this.style === "fill")
      ctx.fillStyle = c;
    else {
      ctx.strokeStyle = c;
      ctx.lineWidth = this.lineWidth;
    }
    ctx.beginPath();
    ctx.ellipse(this.p.x, this.p.y, r, r, 0, 0, PI2);
    this.style === "fill" ? ctx.fill() : ctx.stroke();
  }
  update(dt) {
    this.delay -= dt;
    if (this.t >= this.life) {
      this.deactivate();
    }
    if (this.delay <= 0) {
      this.t += dt;
      let v = Vec2.lerp(this.v0, this.v1, this.t, this.life);
      this.p.add(v.scale(dt));
    }
  }
};
var val = (v) => {
  if (Array.isArray(v))
    return rnd(v[0], v[1]);
  return v;
};
function particle(gameState, count, {
  x,
  y,
  v0x = 0,
  v0y = 0,
  v0v = 0,
  v1x = v0x,
  v1y = v0x,
  v1v = v0v,
  cr0 = 0,
  cg0 = 0,
  cb0 = 0,
  ca0 = 0,
  cr1 = cr0,
  cg1 = cg0,
  cb1 = cb0,
  ca1 = ca0,
  r0 = 0,
  r1 = r0,
  delay = 0,
  life = 0,
  style = "fill",
  lineWidth = 0
}) {
  for (let i = 0; i < count; ++i) {
    gameState.particles.push(
      gameState,
      val(x),
      val(y),
      val(v0x),
      val(v0y),
      val(v0v),
      val(v1x),
      val(v1y),
      val(v1v),
      val(cr0),
      val(cg0),
      val(cb0),
      val(ca0),
      val(cr1),
      val(cg1),
      val(cb1),
      val(ca1),
      val(r0),
      val(r1),
      val(delay),
      val(life),
      style,
      lineWidth
    );
  }
}

// src/stars.mjs
var _Star = class extends Entity {
  constructor() {
    super();
    this.r = 0;
  }
  activate(gameState, x, y, r) {
    super.activate(gameState, x, y);
    this.r = r;
  }
  draw(ctx, gameState) {
    ctx.beginPath();
    ctx.fillStyle = _Star.color;
    ctx.ellipse(this.p.x, this.p.y, this.r, this.r, 0, 0, PI2);
    ctx.fill();
  }
};
var Star = _Star;
__publicField(Star, "color", new Rgba(255, 255, 255, 0.75));

// src/constants.mjs
var last_level_index = 4;
var max_upgrade_levels = 5;
var available_upgrades = [
  {
    type: "fire_rate",
    name: "Fire Rate",
    field: "laser_cooldown",
    adjustment: [0, -10, -25, -50, -100]
  },
  {
    type: "laser_speed",
    name: "Laser Speed",
    field: "laser_speed",
    adjustment: [0, 0.1, 0.25, 0.5, 0.75]
  },
  {
    type: "shield_charge",
    name: "Shield Charge",
    field: "max_shield_charge",
    adjustment: [0, 500, 1e3, 1500, 2e3]
  }
];
var asteroid_levels = 3;
var asteroid_sizes = [
  [72, 112],
  [48, 64],
  [16, 32]
];
var levels_by_difficulty = {
  easy: {
    levels: [
      { asteroids: [0, 0, 1], new_asteroids: { 1: 1, 2: 1 } },
      { asteroids: [0, 0, 0], new_asteroids: { 1: 2, 2: 2 } },
      { asteroids: [0, 0, 0, 0], new_asteroids: { 1: 3, 2: 3 } },
      { asteroids: [0, 0, 0, 0, 0], new_asteroids: { 1: 3, 2: 3 } },
      { asteroids: [0, 0, 0, 0, 0], new_asteroids: { 1: 4, 2: 4 } }
    ],
    laser_speed: 1,
    asteroid_speed: [0.01, 0.165],
    asteroid_sizes,
    laser_cooldown: 200,
    max_shield_charge: 3e3,
    shield_recharge_rate: 3,
    shield_discharge_cooldown: 1e3,
    points_modifier: 1
  },
  medium: {
    levels: [
      { asteroids: [0, 0, 0], new_asteroids: { 1: 4, 2: 4 } },
      { asteroids: [0, 0, 0, 0], new_asteroids: { 1: 4, 2: 4 } },
      { asteroids: [0, 0, 0, 0, 0], new_asteroids: { 1: 4, 2: 4 } },
      { asteroids: [0, 0, 0, 0, 0], new_asteroids: { 1: 5, 2: 5 } },
      { asteroids: [0, 0, 0, 0, 0, 0], new_asteroids: { 1: 5, 2: 5 } }
    ],
    asteroid_sizes,
    laser_speed: 1,
    asteroid_speed: [0.01, 0.175],
    laser_cooldown: 200,
    max_shield_charge: 2e3,
    shield_recharge_rate: 2,
    shield_discharge_cooldown: 2e3,
    points_modifier: 1.1
  },
  hard: {
    levels: [
      { asteroids: [0, 0, 0, 0], new_asteroids: { 1: 5, 2: 5 } },
      { asteroids: [0, 0, 0, 0, 0], new_asteroids: { 1: 5, 2: 5 } },
      { asteroids: [0, 0, 0, 0, 0, 0], new_asteroids: { 1: 6, 2: 7 } },
      { asteroids: [0, 0, 0, 0, 0, 0], new_asteroids: { 1: 7, 2: 8 } },
      { asteroids: [0, 0, 0, 0, 0, 0, 0], new_asteroids: { 1: 7, 2: 8 } }
    ],
    asteroid_sizes,
    laser_speed: 1,
    asteroid_speed: [0.01, 0.185],
    laser_cooldown: 200,
    max_shield_charge: 1e3,
    shield_recharge_rate: 1,
    shield_discharge_cooldown: 3e3,
    points_modifier: 1.15
  }
};
var getSettings = (difficulty, level) => {
  level = clamp(level, 0, last_level_index);
  let settings = levels_by_difficulty[difficulty];
  let for_level = settings.levels[level];
  return { ...settings, ...for_level };
};

// src/asteroids.mjs
var asteroid_rot_speed = [0.05, 0.15];
var asteroid_start_dir = [-1, 1];
var Asteroid = class extends Entity {
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
    this.v.set(rnd(-1, 1), rnd(-1, 1)).normalize().scale(rnd(...settings.asteroid_speed));
  }
  _destroy(gameState) {
    this.deactivate();
    gameState.points += 10 * (asteroid_levels - this.level) * gameState.settings.points_modifier;
    if (Math.floor(gameState.points / 5e3) > gameState.last_points_payed) {
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
      life: [1e3, 3e3]
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
      delay: [0, 50]
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
  draw(ctx) {
    this._draw(ctx, this.p.x, this.p.y);
  }
  update(dt, gameState) {
    this.angle = wrapDeg(this.angle + this.rot * dt);
    this.p.add(this.v.copy().scale(dt));
    if (this.p.x - this.radius > gameState.win.w)
      this.p.x = -this.radius;
    else if (this.p.x + this.radius < 0)
      this.p.x = gameState.win.w + this.radius;
    if (this.p.y - this.radius > gameState.win.h)
      this.p.y = -this.radius;
    else if (this.p.y + this.radius < 0)
      this.p.y = gameState.win.h + this.radius;
    for (let projectile of gameState.projectiles) {
      if (line_intersect_circle(
        projectile.p,
        projectile.p.copy().add(projectile.v.copy().scale(projectile.len)),
        this.p,
        this.radius
      )) {
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
};
function drawAsteroid(ctx, x, y, angle, radius, lineWidth = 2, strokeStyle = "white", fillStyle = "black") {
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

// src/players.mjs
var player_acc = 6e-4;
var player_max_speed = 0.3;
var player_rot_speed = 0.5;
var thrust_size = [6, 12];
var thrust_max_age = 300;
var thrust_cooldown = 30;
var player_invincibilty_max = 1500;
var restart_cooldown = 500;
var Player = class extends Entity {
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
      life: [500, 1500]
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
      delay: [0, 50]
    });
  }
  _drawGui(ctx, gameState) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgb(25, 255, 25)";
    ctx.fillStyle = this.shield_charge <= 0 ? `rgba(255, 25, 25, ${this.shield_recharging ? Math.sin(
      this.shield_cooldown_timer / gameState.settings.shield_discharge_cooldown * PI * 32
    ) : 0.5})` : `rgba(25, 255, 25, 0.5)`;
    ctx.strokeRect(10, 10, 200, 20);
    ctx.fillRect(
      12,
      12,
      196 * (this.shield_charge <= 0 ? 1 : clampMin(
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
          this.restart_timer / restart_cooldown * PI * 8
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
    if (this.shield)
      drawShield(ctx, x, y, this.angle, this.r);
  }
  draw(ctx, gameState) {
    if (this.active && !this.destroyed) {
      let strokeStyle = Rgba.white.copy();
      if (this.invincibility > 0) {
        strokeStyle.alpha(
          clampMin(
            Math.sin(this.invincibility / player_invincibilty_max * PI * 12),
            0.25
          )
        );
      }
      this._draw(ctx, this.p.x, this.p.y, strokeStyle);
    }
    this._drawGui(ctx, gameState);
  }
  update(dt, gameState) {
    if (!this.active)
      return;
    if (this.destroyed) {
      if (this.lives > 0) {
        this.restart_timer = clampMin(this.restart_timer - dt);
        if (this.restart_timer <= 0)
          this._restart(gameState);
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
      Fire: keydown(gameState, " ") || keydown(gameState, ".") || keydown(gameState, "Mouse0"),
      Shield: keydown(gameState, "Shift") || keydown(gameState, ",") || keydown(gameState, "Mouse2")
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
      if (actions.RotLeft === actions.RotRight)
        this.rot = 0;
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
        if (!actions.Shield)
          this.shield_recharging = true;
        this.shield = false;
      }
      if (this.shield) {
        this.shield_charge = clampMin(this.shield_charge - dt);
        if (this.shield_charge === 0) {
          this.shield_cooldown_timer = gameState.settings.shield_discharge_cooldown;
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
          if (x < 0)
            x += gameState.win.w;
          else if (x > gameState.win.w)
            x -= gameState.win.w;
          if (y < 0)
            y += gameState.win.h;
          else if (y > gameState.win.h)
            y += gameState.win.h;
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
            r1: 0
          });
        }
      }
      if (!this.shield && actions.Fire) {
        if (this.laser_cooldown <= 0) {
          this.laser_cooldown = gameState.settings.laser_cooldown;
          let v = Vec2.fromAngle(this.angle);
          let x = this.p.x + v.x * this.h * 0.5;
          let y = this.p.y + v.y * this.h * 0.5;
          if (x < 0)
            x += gameState.win.w;
          else if (x > gameState.win.w)
            x -= gameState.win.w;
          if (y < 0)
            y += gameState.win.h;
          else if (y > gameState.win.h)
            y += gameState.win.h;
          gameState.projectiles.push(gameState, x, y, this.angle);
        }
      }
    }
    this.p.add(this.v.copy().scale(dt));
    if (this.p.x - this.w > gameState.win.w)
      this.p.x = -this.w;
    else if (this.p.x + this.w < 0)
      this.p.x = gameState.win.x + this.w;
    if (this.p.y - this.h > gameState.win.y)
      this.p.y = -this.h;
    else if (this.p.y + this.h < 0)
      this.p.y = gameState.win.y + this.h;
    this.thrust_cooldown = clampMin(this.thrust_cooldown - dt);
    this.laser_cooldown = clampMin(this.laser_cooldown - dt);
    this.invincibility = clampMin(this.invincibility - dt);
    if (this.invincibility <= 0) {
      for (let asteroid of gameState.asteroids) {
        let d = distance(this.p, asteroid.p);
        if (d < this.r + asteroid.radius) {
          if (this.shield) {
            this.v = this.p.copy().sub(asteroid.p).normalize().scale((asteroid.v.len() + this.v.len()) * 0.5);
            asteroid.v = asteroid.p.copy().sub(this.p).normalize().scale((asteroid.v.len() + this.v.len()) * 0.45);
            asteroid.p.add(
              asteroid.v.copy().normalize().scale(this.r + asteroid.radius - d)
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
};
function drawShip(ctx, x, y, angle, w, h, strokeStyle = "white", fillStyle = "black", lineWidth = 2) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle * DEG2RAD);
  ctx.lineWidth = lineWidth;
  ctx.fillStyle = fillStyle;
  ctx.strokeStyle = strokeStyle;
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

// src/projectiles.mjs
var _Projectile = class extends Entity {
  constructor() {
    super();
    this.angle = 0;
    this.v = new Vec2();
    this.len = 0;
    this.speed = 0;
    this.life = 0;
  }
  activate(gameState, x, y, angle) {
    super.activate(gameState, x, y);
    this.angle = angle;
    this.v = Vec2.fromAngle(angle);
    this.len = _Projectile.laser_len;
    this.speed = gameState.settings.laser_speed;
    this.life = 0;
  }
  draw(ctx) {
    let strokeStyle = `rgba(135, 206, 250, 1)`;
    drawLaser(
      ctx,
      this.p.x,
      this.p.y,
      this.v.x * this.len,
      this.v.y * this.len,
      strokeStyle
    );
  }
  update(dt, gameState) {
    this.p.add(this.v.copy().scale(dt * this.speed));
    if (!point_inside(this.p, Vec2.origin, gameState.win))
      this.deactivate();
  }
};
var Projectile = _Projectile;
__publicField(Projectile, "laser_len", 32);
function drawLaser(ctx, x0, y0, x1, y1, strokeStyle = "lightskyblue", lineWidth = 2) {
  ctx.save();
  ctx.translate(x0, y0);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = strokeStyle;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.restore();
}

// src/game.mjs
function refresh(gameState) {
  gameState.player = new Player().copyFrom(gameState.player);
  gameState.projectiles = EntityList.copyFrom(
    gameState.projectiles,
    Projectile
  );
  gameState.asteroids = EntityList.copyFrom(gameState.asteroids, Asteroid);
  gameState.stars = EntityList.copyFrom(gameState.stars, Star);
  gameState.particles = EntityList.copyFrom(gameState.particles, Particle);
}
function initGame(w, h, ctx) {
  let gameState = {
    ctx,
    debug: false,
    mouse_active: false,
    win: new Vec2(w, h),
    input: {},
    lastInput: {},
    player: new Player(),
    projectiles: new EntityList(100, Projectile),
    asteroids: new EntityList(100, Asteroid),
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
      laser_speed: 0
    },
    points: 0,
    last_points_payed: 0
  };
  initMenu(gameState);
  initStars(gameState);
  return gameState;
}
function onResize(gameState) {
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
var screens = { play, menu, pause, gameOver, upgrade };
function gameLoop(dt, gameState) {
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
    ctx.fillText(`FPS: ${Math.round(1e3 / dt)}`, win.w - 10, win.h - 10);
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
    if (gameState.upgrades.shield_charge >= max_upgrade_levels && gameState.upgrades.fire_rate >= max_upgrade_levels && gameState.upgrades.laser_speed >= max_upgrade_levels) {
      gotoNextLevel(gameState);
      gameState.screen = "play";
      return;
    }
  }
  let actions = {
    Prev: keypressed(gameState, "ArrowLeft") || keypressed(gameState, "a"),
    Next: keypressed(gameState, "ArrowRight") || keypressed(gameState, "d"),
    SelectKeyboard: keypressed(gameState, "Enter") || keypressed(gameState, " "),
    SelectMouse: keypressed(gameState, "Mouse0")
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
  } else if (actions.SelectKeyboard || actions.SelectMouse && gameState.upgrade_mouse_active >= 0) {
    let selected = available_upgrades[actions.SelectKeyboard ? gameState.upgrade_keyboard_active : gameState.upgrade_mouse_active];
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
    let upgrade2 = available_upgrades[i];
    let boxLeft = win.w / 2 - (win.w / 6 + 20) * 1.5 + (win.w / 6 + 20) * i;
    if (gameState.mouse_active) {
      let { MouseX, MouseY } = gameState.input;
      if (MouseX >= boxLeft && MouseX <= boxLeft + boxSize && MouseY >= boxTop && MouseY <= boxTop + boxSize) {
        gameState.upgrade_mouse_active = i;
      }
    }
    let isActive = gameState.mouse_active ? gameState.upgrade_mouse_active === i : gameState.upgrade_keyboard_active === i;
    ctx.lineWidth = 2;
    ctx.strokeStyle = isActive ? "skyblue" : "white";
    ctx.fillStyle = `rgba(255, 255, 255, ${isActive ? 0.33 : 0.1})`;
    ctx.beginPath();
    ctx.roundRect(boxLeft, boxTop, boxSize, boxSize, boxSize / 5);
    ctx.stroke();
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.fillText(upgrade2.name, boxLeft + boxSize / 2, boxTop + boxSize / 4);
    ctx.strokeStyle = "white";
    ctx.fillStyle = "skyblue";
    ctx.lineWidth = 1;
    let leftMost = boxLeft + boxSize / 2 + (boxSize / 15 + boxSize / 30) * ((max_upgrade_levels - 1) / 2 - (max_upgrade_levels - 1));
    for (let i2 = 0; i2 < max_upgrade_levels; ++i2) {
      ctx.beginPath();
      ctx.ellipse(
        leftMost + (boxSize / 15 + boxSize / 30) * i2,
        boxTop + boxSize - boxSize / 15,
        boxSize / 30,
        boxSize / 30,
        0,
        0,
        PI2
      );
      ctx.stroke();
      if (gameState.upgrades[upgrade2.type] > i2)
        ctx.fill();
    }
    switch (upgrade2.type) {
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
    SelectKeyboard: keypressed(gameState, "Enter") || keypressed(gameState, " "),
    SelectMouse: keypressed(gameState, "Mouse0"),
    Up: keypressed(gameState, "ArrowUp") || keypressed(gameState, "w"),
    Down: keypressed(gameState, "ArrowDown") || keypressed(gameState, "s")
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
  } else if (actions.SelectKeyboard || actions.SelectMouse && gameState.menu_mouse_active >= 0) {
    if (gameState.menu_screen === "help") {
      gameState.menu_screen = "";
    } else {
      let active = actions.SelectKeyboard ? gameState.menu_keyboard_active : gameState.menu_mouse_active;
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
        if (MouseX >= left && MouseX <= right && MouseY >= top && MouseY <= bottom) {
          gameState.menu_mouse_active = i;
        }
      }
      if (gameState.mouse_active ? gameState.menu_mouse_active === i : gameState.menu_keyboard_active === i) {
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
  if (has_screen_shake)
    clear_screen_shake(ctx);
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
  if (keypressed(gameState, "Escape") && !gameState.player.destroyed && gameState.asteroids.activeCount > 0) {
    gameState.screen = "pause";
    return;
  }
  if (gameState.level < 0) {
    gotoNextLevel(gameState);
  }
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
  if (has_screen_shake)
    clear_screen_shake(ctx);
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
    let upgrade2 = available_upgrades[i];
    let level = gameState.upgrades[upgrade2.type];
    let adjustment = upgrade2.adjustment[level];
    settings[upgrade2.field] += adjustment;
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
export {
  gameLoop,
  initGame,
  onResize,
  refresh
};
