console.log("hello from worker.js"); // 3

self.onmessage = (msg) => {
  console.log("message from main"); // 4
  console.log(msg.data);

  postMessage("message sent from worker"); // 7
};
