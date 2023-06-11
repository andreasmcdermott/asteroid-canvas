import { lerp, rnd, Vec2, Rgba, PI2 } from "./utils.mjs";

export function initParticles(gameState) {
  gameState.particles = [];
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
    v0x,
    v0y,
    v0v,
    v1x = v0x,
    v1y = v0x,
    v1v = v0v,
    cr0,
    cg0,
    cb0,
    ca0,
    cr1 = cr0,
    cg1 = cg0,
    cb1 = cb0,
    ca1 = ca0,
    r0,
    r1 = r0,
    delay,
    life,
  }
) {
  for (let i = 0; i < count; ++i) {
    gameState.particles.push({
      p: new Vec2(val(x), val(y)),
      v0: new Vec2(val(v0x), val(v0y)).normalize().scale(val(v0v)),
      v1: new Vec2(val(v1x), val(v1y)).normalize().scale(val(v1v)),
      c0: new Rgba(val(cr0), val(cg0), val(cb0), val(ca0)),
      c1: new Rgba(val(cr1), val(cg1), val(cb1), val(ca1)),
      r0: val(r0),
      r1: val(r1),
      delay: val(delay),
      life: val(life),
      t: 0,
    });
  }
}

export function updateParticles(dt, gameState) {
  let valid_particles = [];
  for (let i = 0; i < gameState.particles.length; ++i) {
    let p = gameState.particles[i];
    p.delay -= dt;
    if (p.t < p.life) {
      valid_particles.push(p);
      if (p.delay <= 0) {
        p.t += dt;
        let v = p.v || Vec2.lerp(p.v0, p.v1, p.t, p.life);
        p.p.add(v.copy().scale(dt));
      }
    }
  }
  gameState.particles = valid_particles;
}

export function drawParticles(gameState) {
  let { ctx } = gameState;
  for (let i = 0; i < gameState.particles.length; ++i) {
    let p = gameState.particles[i];
    let r = p.r || lerp(p.r0, p.r1, p.t, p.life);
    let c = p.c || Rgba.lerp(p.c0, p.c1, p.t, p.life);

    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(p.p.x, p.p.y, r, r, 0, 0, PI2);
    ctx.fill();
  }
}
