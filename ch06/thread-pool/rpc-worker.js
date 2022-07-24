const { Worker } = require("worker_threads");
const CORES = require("os").cpus().length;
const STRATEGY = {
  ROUND_ROBIN: "roundRobin",
  RANDOM: "random",
  LEAST_BUSY: "leastBusy",
};
const STRATEGIES = new Set([
  STRATEGY.ROUND_ROBIN,
  STRATEGY.RANDOM,
  STRATEGY.LEAST_BUSY,
]);

module.exports = class RpcWorkerPool {
  constructor(path, size = 0, strategy = STRATEGY.ROUND_ROBIN) {
    if (size === 0) {
      this.size = CORES;
    } else if (size < 0) {
      this.size = Math.max(CORES + size, 1);
    } else {
      this.size = size;
    }

    if (!STRATEGIES.has(strategy)) throw new TypeError("invalid strategy");

    this.strategy = strategy;
    this.rr_index = -1; // STRATEGY.ROUND_ROBIN index

    this.next_command_id = 0;
    this.workers = [];

    for (let i = 0; i < this.size; i++) {
      const worker = new Worker(path);
      this.workers.push({ worker, in_flight_commands: new Map() });
      worker.on("message", (msg) => {
        this.onMessageHandler(msg, i);
      });
    }
  }

  onMessageHandler(msg, worker_id) {
    const worker = this.workers[worker_id];
    const { result, error, id } = msg;
    const { resolve, reject } = worker.in_flight_commands.get(id);
    worker.in_flight_commands.delete(id);
    if (error) {
      reject(error);
    } else {
      resolve(result);
    }
  }

  exec(method, ...args) {
    const id = ++this.next_command_id;
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    const worker = this.getWorker();
    worker.in_flight_commands.set(id, { resolve, reject });
    worker.worker.postMessage({ method, params: args, id });
    return promise;
  }

  getWorker() {
    let id;

    if (this.strategy === STRATEGY.RANDOM) {
      id = Math.floor(Math.random() * this.size);
    } else if (this.strategy === STRATEGY.ROUND_ROBIN) {
      this.rr_index++;
      if (this.rr_index >= this.size) {
        this.rr_index = 0;
      }
      id = this.rr_index;
    } else if (this.strategy === STRATEGY.LEAST_BUSY) {
      let min = Infinity;
      for (let i = 0; i < this.size; i++) {
        let worker = this.workers[i];
        if (worker.in_flight_commands.size < min) {
          min = worker.in_flight_commands.size;
          id = i;
        }
      }
    }

    console.log("Selected Worker:", id);
    return this.workers[id];
  }
};
