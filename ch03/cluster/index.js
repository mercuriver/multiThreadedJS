const http = require("http");
const { Worker, isMainThread, workerData } = require("worker_threads");

if (isMainThread) {
  new Worker(__filename, { workerData: { isWorker: true } });
} else {
  http
    .createServer((req, res) => {
      console.log(workerData);
      res.end("Hello, World\n");
    })
    .listen(3000);
}
