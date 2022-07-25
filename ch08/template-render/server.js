#!/usr/bin/env node

const Fastify = require("fastify");
const RpcWorkerPool = require("./rpc-worker.js");
const worker = new RpcWorkerPool("./worker.js", 4, "leastBusy");
const template = require("./template.js");
const server = Fastify();

server.get("/main", async (request, reply) =>
  template.renderLove({ me: "Thomas", you: "katelyn" })
);

server.get("/offload", async (request, reply) =>
  worker.exec("renderLove", { me: "Thomas", you: "katelyn" })
);

server.listen(3000, (err, address) => {
  if (err) throw err;
  console.log(`listening on: ${address}`);
});

const timer = process.hrtime.bigint;
setInterval(() => {
  const start = time();
  setImmediate(() => {
    console.log(`delay: ${(timer() - start).toLocaleString()}ns`);
  });
}, 1000);
