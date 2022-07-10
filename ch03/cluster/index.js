const http = require("http");
const {
  Worker,
  isMainThread,
  // workerData,
  parentPort,
} = require("worker_threads");

if (isMainThread) {
  // const worker = new Worker(__filename, { workerData: { isWorker: true } });
  const worker = new Worker(__filename);
  worker.on("message", (msg) => {
    worker.postMessage(msg);
  });
} else {
  // http
  //   .createServer((req, res) => {
  //     console.log(workerData);
  //     res.end("Hello, World\n");
  //   })
  //   .listen(3000);
  parentPort.on("message", (msg) => {
    console.log("We hot a message from the main thread:", msg);
  });
  parentPort.postMessage("Hello, World!");
}
