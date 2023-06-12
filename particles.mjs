import { lerp, rnd, Vec2, Rgba, PI2 } from "./utils.mjs";
import { Entity } from "./entities.mjs";

export class Particle extends Entity {
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
  activate(
    x,
    y,
    v0x,
    v0y,
    v0v,
    v1x,
    v1y,
    v1v,
    c0r,
    c0g,
    c0b,
    c0a,
    c1r,
    c1g,
    c1b,
    c1a,
    r0,
    r1,
    delay,
    life,
    style,
    lineWidth
  ) {
    super.activate(x, y);
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

    if (this.style === "fill") ctx.fillStyle = c;
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
}

const val = (v) => {
  if (Array.isArray(v)) return rnd(v[0], v[1]);
  return v;
};

export function particle(
  gameState,
  count,
  {
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
    lineWidth = 0,
  }
) {
  for (let i = 0; i < count; ++i) {
    gameState.particles.push(
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
