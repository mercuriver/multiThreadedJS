const http = require("http");
const cluster = require("cluster");

if (cluster.isPrimary) {
  cluster.fork();
  cluster.fork();
  cluster.fork();
  cluster.fork();
} else {
  http
    .createServer((req, res) => {
      res.end("Hello, World\n");
    })
    .listen(3000);
}
