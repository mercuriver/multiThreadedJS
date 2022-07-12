if (!crossOriginIsolated) {
  throw new Error("Cannot use SharedArrayBuffer");
}

const worker = new Worker("worker.js");

const buffer = new SharedArrayBuffer(1024);
const view = new Uint8Array(buffer);

console.log("now", view[0]);

worker.postMessage(buffer);

setTimeout(() => {
  console.log("later", view[0]);
  console.log("props", buffer.foo);
}, 500);
