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

  // onMessageHandler(msg) {
  //   const { result, error, id } = msg.data;
  //   const { resolve, reject } = this.in_flight_commands.get(id);
  //   this.in_flight_commands.delete(id);
  //   if (error) reject(error);
  //   else resolve(result);
  // }

  // exec(method, ...args) {
  //   this.next_command_id += 1;
  //   const id = this.next_command_id;
  //   let resolve, reject;
  //   const promise = new Promise((res, rej) => {
  //     resolve = res;
  //     reject = rej;
  //   });
  //   this.in_flight_commands.set(id, { resolve, reject });
  //   this.worker.postMessage({ method, params: args, id });
  //   return promise;
  // }
};
