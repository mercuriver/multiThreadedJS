self.onmessage = ({ data: { buffer, name } }) => {
  postMessage("ready");
  const view = new Int32Array(buffer);
  console.log(`Worker ${name} started`);
  const result = Atomics.wait(view, 0, 0);
  console.log(`Worker ${name} awoken with ${result}`);
};
