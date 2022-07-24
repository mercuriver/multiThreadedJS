#!/usr/bin/env node

const net = require("net");
const RpcWorkerPool = require("./rpc-worker.js");

const [, , host] = process.argv;
const [hostname, port] = host.split(":");
const worker = new RpcWorkerPool("./worker.js", 4, "leastBusy");

const upstream = net
  .connect(port, hostname, () => {
    console.log("connected to server");
  })
  .on("data", async (raw_data) => {
    const chunks = String(raw_data).split("\0");
    chunks.pop();
    for (let chunk of chunks) {
      const data = JSON.parse(chunk);
      const value = await worker.exec(data.method, ...data.args);

      upstream.write(
        JSON.stringify({
          id: data.id,
          value,
          pid: process.pid,
        }) + "\0"
      );
    }
  })
  .on("end", () => {
    console.log("disconnect from server");
  });
