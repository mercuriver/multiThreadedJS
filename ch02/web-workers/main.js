console.log("hello from main.js"); // 1

const worker = new Worker("worker.js");

worker.onmessage = (msg) => {
  console.log("message received from worker"); // 6
  console.log(msg.data);
};

worker.postMessage("message sent to worker"); // 5

console.log("hello from end of main.js"); // 2
