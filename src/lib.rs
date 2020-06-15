#![no_std]

extern crate rand;
extern crate rand_chacha;

use rand::{Rng, SeedableRng};

const WIDTH: usize = 600;
const HEIGHT: usize = 600;
const SIZE: u32 = WIDTH as u32 * HEIGHT as u32;

#[no_mangle]
static mut BUFFER: [u32; WIDTH * HEIGHT] = [0x00_00_00_00; WIDTH * HEIGHT];

#[no_mangle]
static mut MOUSE_POS: [u32; 2] = [5; 2];

#[no_mangle]
static mut DEBUG_BUFFER: [u32; 100] = [0; 100];

const NUM_PARTICLES: usize = 1000000;

static mut GLOBAL_PARTICLES: [Particle; NUM_PARTICLES] = particles();

const fn particles() -> [Particle; NUM_PARTICLES] {
    let particles = [Particle {
        x: 0.0,
        y: 0.0,
        vx: 0.0,
        vy: 0.0,
    }; NUM_PARTICLES];
    particles
}

#[derive(Debug, Copy, Clone)]
pub struct Particle {
    x: f32,
    y: f32,
    vx: f32,
    vy: f32,
}

impl Particle {
    pub fn new() -> Particle {
        Particle {
            x: 10.0,
            y: 10.0,
            vx: 1.0,
            vy: 1.0,
        }
    }
}

#[no_mangle]
pub unsafe extern "C" fn tick() {
    let index = (((WIDTH) as u32 * MOUSE_POS[1]) + MOUSE_POS[0]) as usize;

    if index < BUFFER.len() {
        BUFFER[index as usize] = 0xAA_00_FF_00;
    }
    let mouse_x = MOUSE_POS[0];
    let mouse_y = MOUSE_POS[1];

    let mut rng = rand_chacha::ChaCha8Rng::seed_from_u64(mouse_x as u64);

    for (_i, b) in GLOBAL_PARTICLES.iter_mut().enumerate() {
        let x = b.x as i64;
        let y = b.y as i64;

        let mut index = HEIGHT as i64 * y + x;
        // println!("{}", index);
        if index > (SIZE - 1) as i64 {
            index = (SIZE - 1) as i64;
        }
        if index < 0 as i64 {
            index = 0;
        }

        BUFFER[index as usize] = 0x00_00_00_00;
        if b.x > WIDTH as f32 {
            b.vx = b.vx * -1.0;
        }

        if b.y > HEIGHT as f32 {
            b.vy = b.vy * -1.0;
        }

        if b.x < 0 as f32 {
            b.vx = b.vx * -1.0;
        }

        if b.y < 0 as f32 {
            b.vy = b.vy * -1.0;
        }
        let mut pull_x = 0.0;
        let mut pull_y = 0.0;

        if mouse_x != 0 || mouse_y != 0 {
            let diff_x = mouse_x as f32 - b.x as f32;
            let diff_y = mouse_y as f32 - b.y as f32;

            let distance = (diff_x.powf(2.0) + diff_y.powf(2.0)).sqrt();

            if distance < 10.0 {
                b.vx = b.vx * -1.5 * -rng.gen::<f32>();
                b.vy = b.vy * -1.5 * -rng.gen::<f32>();
            }

            pull_x = diff_x / 10.0 * 1.0 / distance;

            pull_y = diff_y / 10.0 * 1.0 / distance
        }

        b.x = b.x + b.vx;
        b.y = b.y + b.vy;
        b.vx = (b.vx + pull_x) * {
            if b.vx.abs() > 0.2 {
                0.995
            } else {
                1.0
            }
        };
        b.vy = (b.vy + pull_y) * {
            if b.vy.abs() > 0.2 {
                0.995
            } else {
                1.0
            }
        };

        let x = b.x as i64;
        let y = b.y as i64;

        let mut index = HEIGHT as i64 * y + x;
        // println!("{}", index);
        if index > (SIZE - 1) as i64 {
            index = (SIZE - 1) as i64;
        }
        if index < 0 as i64 {
            index = 0;
        }

        BUFFER[index as usize] = 0xAA_FF_00_00;
    }
}

#[no_mangle]
pub unsafe extern "C" fn start() {
    let mut rng = rand_chacha::ChaCha8Rng::seed_from_u64(0);

    for (_i, b) in GLOBAL_PARTICLES.iter_mut().enumerate() {
        let r = rng.gen::<f32>();
        let r2 = rng.gen::<f32>();

        b.x = r * WIDTH as f32;
        b.y = r2 * HEIGHT as f32;
        b.vx = r - 0.5;
        b.vy = r2 - 0.5;
    }
}
