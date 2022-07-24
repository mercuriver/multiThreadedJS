#!/usr/bin/env node

const net = require("net"); // TCP Server
const http = require("http"); // HTTP Server

const [_, __, web_host, actor_host] = process.argv;
const [web_hostname, web_port] = web_host.split(":");
const [actor_hostname, actor_port] = actor_host.split(":");

let message_id = 0;
let actors = new Set(); // collection of actor handlers
let messages = new Map(); // message ID -> HTTP response

net
  .createServer((client) => {
    const handler = (data) => client.write(JSON.stringify(data) + "\0");
    actors.add(handler);
    console.log("actor pool connected", actors.size);

    client
      .on("end", () => {
        actors.delete(handler);
        console.log("actor pool disconnected", actors.size);
      })
      .on("data", (raw_data) => {
        const chunks = String(raw_data).split("\0");
        chunks.pop();

        for (let chunk of chunks) {
          const data = JSON.parse(chunk);
          const res = messages.get(data.id);
          res.end(JSON.stringify(data) + "\0");
          messages.delete(data.id);
        }
      });
  })
  .listen(actor_port, actor_hostname, () => {
    console.log(`actor: tcp://${actor_hostname}:${actor_port}`);
  });

function randomActor() {
  const pool = Array.from(actors);
  return pool[Math.floor(Math.random() * pool.length)];
}

http
  .createServer(async (req, res) => {
    message_id++;
    if (actors.size === 0) return res.end("Error: Empty actor pool");
    const actor = randomActor();
    messages.set(message_id, res);
    actor({
      id: message_id,
      method: "square_sum",
      args: [Number(req.url.substr(1))],
    });
  })
  .listen(web_host, web_hostname, () => {
    console.log(`web:   http://${web_hostname}:${web_port}`);
  });
