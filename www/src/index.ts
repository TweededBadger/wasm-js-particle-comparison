// import 'wasm-ts';

import { addParticles, tick } from "../particles";
import { PARTICLES_TO_ADD, CANVAS_WIDTH } from "./config";
import * as Stats from "stats.js";
import { runBenchmark } from "./bench";

import "./styles.css";

async function init() {
  var stats = new Stats();
  document.body.appendChild(stats.dom);
  const panel = new Stats.Panel("Tick Time", "#0f0", "#020");
  stats.addPanel(panel);
  stats.showPanel(3);

  const { instance } = await WebAssembly.instantiateStreaming(
    fetch("./particles.wasm")
  );

  const exports = instance.exports as any;

  const wasmTick = exports.tick as Function;
  const wasmStart = exports.start as Function;
  const buffer = exports.memory.buffer as ArrayBuffer;

  const canvas: HTMLCanvasElement = document.getElementById(
    "demo-canvas"
  ) as HTMLCanvasElement;
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_WIDTH;

  const debug = document.getElementById("debug");

  const buffer_address = exports.BUFFER.value;
  const image = new ImageData(
    new Uint8ClampedArray(
      buffer,
      buffer_address,
      4 * CANVAS_WIDTH * CANVAS_WIDTH
    ),
    CANVAS_WIDTH
  );

  const buffer_address_mouse = exports.MOUSE_POS.value;
  const mousePos = new Uint32Array(buffer, buffer_address_mouse, 2);

  const buffer_address_debug = exports.DEBUG_BUFFER.value;
  const debugArray = new Uint32Array(buffer, buffer_address_debug, 100);

  let mouseX = 0;
  let mouseY = 0;

  canvas.addEventListener(
    "mousemove",
    ({ offsetX, offsetY }) => {
      mouseX = offsetX;
      mouseY = offsetY;
    },
    false
  );

  canvas.addEventListener("mouseout", () => {
    mouseX = 0;
    mouseY = 0;
  });

  const ctx = canvas.getContext("2d");

  addParticles(PARTICLES_TO_ADD);

  var imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_WIDTH);
  var buf = new ArrayBuffer(imageData.data.length);
  var buf8 = new Uint8ClampedArray(buf);
  var data = new Uint32Array(buf);

  let RENDER_WASM = true;
  let running = false;
  let runningBenchmark = false;

  const toggleButton = document.getElementById("toggle-btn");
  const startButton = document.getElementById("start-btn");
  const benchmarkButton = document.getElementById("bench-btn");

  toggleButton.addEventListener("click", () => {
    if (runningBenchmark) return;
    RENDER_WASM = !RENDER_WASM;
    toggleButton.innerHTML = `Toggle (Currently using ${RENDER_WASM ? "Wasm": "JS"})`;;
    ticktime = 0;
    n = 0;
    render();
  });
  startButton.addEventListener("click", () => {
    if (runningBenchmark) return;
    running = !running;
    startButton.innerHTML = running ? "Stop" : "Start";
    if (running) render();
  });

  benchmarkButton.addEventListener("click", async () => {
    if (runningBenchmark) return;
    running = false;
    startButton.innerHTML = "Start";
    runningBenchmark = true;
    benchmarkButton.innerHTML = "Running Benchmark ....";

    await runBenchmark(
      [
        {
          label: "WASM",
          func: () => {
            mousePos[0] = Math.round(Math.random() * 100);
            mousePos[1] = Math.round(Math.random() * 100);

            wasmTick();
          },
        },
        {
          label: "JS",
          func: () =>
            tick(
              data,
              Math.round(Math.random() * 100),
              Math.round(Math.random() * 100)
            ),
        },
      ],
      (debugStr) => {
        debug.innerHTML = debugStr;
      }
    );
    runningBenchmark = false;
    
    benchmarkButton.innerHTML = "Run Benchmark";
  });

  let ticktime = 0;
  let n = 0;

  const render = () => {

    if (!running) {
      if (RENDER_WASM) {
        ctx.putImageData(image, 0, 0);
      } else {
        imageData.data.set(buf8);
        ctx.putImageData(imageData, 0, 0);
      }
      return;
    }
    stats.begin();
    mousePos[0] = mouseX;
    mousePos[1] = mouseY;
    debug.innerHTML = 
`X: ${mouseX} Y: ${mouseY}
ticktime: ${ticktime.toFixed(3)}`;

    const t0 = performance.now();

    if (RENDER_WASM) {
      wasmTick();
      ctx.putImageData(image, 0, 0);
    } else {
      tick(data, mouseX, mouseY);
      imageData.data.set(buf8);
      ctx.putImageData(imageData, 0, 0);
    }

    const t1 = performance.now();

    const t = t1 - t0;

    n++;
    ticktime = ticktime ? t : (ticktime * (n - 1)) / n + t / n;
    panel.update(ticktime, 50);

    stats.end();

    if (running) requestAnimationFrame(render);
  };

  wasmStart();
  wasmTick();
  tick(data, mouseX, mouseY);

  render();
}

init();
