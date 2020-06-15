import { CANVAS_WIDTH, PARTICLE_COLOR, PARTICLE_WIDTH } from "./src/config";

let ctx;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const particles: Particle[] = [];

const addParticle = () => {
  particles.push({
    x: Math.random() * CANVAS_WIDTH,
    y: Math.random() * CANVAS_WIDTH,
    vx: Math.random() - 0.5,
    vy: Math.random() - 0.5,
  });
};

export const addParticles = (n: number) => {
  for (let index = 0; index < n; index++) {
    addParticle();
  }
};

const MEM_LENGTH = CANVAS_WIDTH * CANVAS_WIDTH;

export const tick = (memory: Uint32Array, mouseX: number, mouseY: number) => {
  let index = CANVAS_WIDTH * mouseY + mouseX;
  memory[Math.round(index)] = 0xff0000ff;

  for (let i = 0; i < particles.length; i++) {
    const particle = particles[i];

    let index = CANVAS_WIDTH * Math.round(particle.y) + Math.round(particle.x);

    if (index > MEM_LENGTH - 1) {
      index = MEM_LENGTH - 1;
    }
    if (index < 0) {
      index = 0;
    }
    memory[Math.round(index)] = 0x00000000;

    if (particle.x > CANVAS_WIDTH) particle.vx = particle.vx * -1;
    if (particle.y > CANVAS_WIDTH) particle.vy = particle.vy * -1;
    if (particle.y < 0) particle.vy = particle.vy * -1;
    if (particle.x < 0) particle.vx = particle.vx * -1;

    let pullX = 0;
    let pullY = 0;

    if (mouseX !== 0 || mouseY !== 0) {
      let diffX = mouseX - particle.x;
      let diffY = mouseY - particle.y;

      let distance = Math.sqrt(diffX * diffX + diffY * diffY);

      if (distance < 10) {
        particle.vx = particle.vx * -1.5 * -Math.random();
        particle.vy = particle.vy * -1.5 * -Math.random();
      }
      pullX = ((diffX / 10) * 1) / distance;
      pullY = ((diffY / 10) * 1) / distance;
    }
    particle.x += particle.vx;
    particle.y += particle.vy;

    particle.vx =
      (particle.vx + pullX) * (Math.abs(particle.vx) > 0.1 ? 0.995 : 1);
    particle.vy =
      (particle.vy + pullY) * (Math.abs(particle.vy) > 0.1 ? 0.995 : 1);

    index = CANVAS_WIDTH * Math.round(particle.y) + Math.round(particle.x);

    if (index > MEM_LENGTH - 1) {
      index = MEM_LENGTH - 1;
    }
    if (index < 0) {
      index = 0;
    }

    memory[Math.round(index)] = 0xff0000ff;
  }
};
