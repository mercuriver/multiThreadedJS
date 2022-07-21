if (!crossOriginIsolated) throw new Error("Cannot use SharedArrayBuffer");

const BUFFER_SIZE = 64;
const buffer = new SharedArrayBuffer(BUFFER_SIZE);
const view = new Int32Array(buffer);
const now = Date.now();
let count = BUFFER_SIZE;

for (let i = 0; i < BUFFER_SIZE; i++) {
  const worker = new Worker("worker.js");
  worker.postMessage({ buffer, name: i });
  worker.onmessage = () => {
    console.log(`Ready; id=${i}, count=${--count}, time=${Date.now() - now}ms`);
    if (count === 0) {
      Atomics.notify(view, 0);
    }
  };
}
