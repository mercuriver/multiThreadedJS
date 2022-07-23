class Grid {
  constructor(size, buffer, paint = () => {}) {
    const sizeSquared = size * size;
    this.buffer = buffer;
    this.size = size;
    this.cells = new Uint8Array(this.buffer, 0, sizeSquared);
    this.nextCells = new Uint8Array(this.buffer, sizeSquared, sizeSquared);
    this.paint = paint;
  }

  static NEIGHBORS = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];

  getCell(x, y) {
    const size = this.size;
    const sizeM1 = size - 1;
    x = x < 0 ? sizeM1 : x > sizeM1 ? 0 : x;
    y = y < 0 ? sizeM1 : y > sizeM1 ? 0 : y;
    return this.cells[size * x + y];
  }

  iterate(minX, minY, maxX, maxY) {
    const size = this.size;

    for (let x = minX; x < maxX; x++) {
      for (let y = minY; y < maxY; y++) {
        const cell = this.cells[size * x + y];
        let alive = 0;
        for (const [i, j] of Grid.NEIGHBORS) {
          alive += this.getCell(x + i, y + j);
        }
        const newCell = alive === 3 || (cell && alive === 2) ? 1 : 0;
        this.nextCells[size * x + y] = newCell;
        this.paint(newCell, x, y);
      }
    }

    const cells = this.nextCells;
    this.nextCells = this.cells;
    this.cells = cells;
  }
}

const BLACK = 0xff000000;
const WHITE = 0xffffffff;
const SIZE = 800;
const THREADS = 5; // SIZE의 약수

const imageaOffset = 2 * SIZE * SIZE;
const syncOffset = imageaOffset + 4 * SIZE * SIZE;

const isMainThread = !!self.window;

if (isMainThread) {
  const iterationCounter = document.getElementById("iteration");
  const gridCanvas = document.getElementById("gridCanvas");
  gridCanvas.height = SIZE;
  gridCanvas.width = SIZE;
  const ctx = gridCanvas.getContext("2d");

  const sharedMemory = new SharedArrayBuffer(
    syncOffset + // data + imageData
      THREADS * 4 // 각 스레드에 4바이트 씩 부여된 동기화 데이터 처리부
  );
  const imageData = new ImageData(SIZE, SIZE);
  const cells = new Uint8Array(sharedMemory, 0, imageaOffset);
  const sharedImageBuf = new Uint32Array(sharedMemory, imageaOffset);
  const sharedImageBuf8 = new Uint8ClampedArray(
    sharedMemory,
    imageaOffset,
    4 * SIZE * SIZE
  );

  for (let x = 0; x < SIZE; x++) {
    for (let y = 0; y < SIZE; y++) {
      const cell = Math.random() < 0.5 ? 0 : 1;
      cells[SIZE * x + y] = cell;
      sharedImageBuf[SIZE * x + y] = cell ? BLACK : WHITE;
    }
  }

  imageData.data.set(sharedImageBuf8);
  ctx.putImageData(imageData, 0, 0);

  const chunkSize = SIZE / THREADS;
  for (let i = 0; i < THREADS; i++) {
    const worker = new Worker("gol.js", { name: `gol-worker-${i}` });

    worker.postMessage({
      range: [0, chunkSize * i, SIZE, chunkSize * (i + 1)],
      sharedMemory,
      i,
    });
  }

  const coordWorker = new Worker("gol.js", { name: `gol-coordination` });
  coordWorker.postMessage({ coord: true, sharedMemory });

  let iteration = 0;
  coordWorker.addEventListener("message", () => {
    imageData.data.set(sharedImageBuf8);
    ctx.putImageData(imageData, 0, 0);
    iterationCounter.innerHTML = ++iteration;
    window.requestAnimationFrame(() => coordWorker.postMessage());
  });
} else {
  let sharedMemory;
  let sync;
  let sharedImageBuf;
  let cells;
  let nextCells;

  function runWorker({ range, i }) {
    const grid = new Grid(SIZE, sharedMemory);
    while (true) {
      Atomics.wait(sync, i, 0);
      grid.iterate(...range);
      Atomics.store(sync, i, 0);
      Atomics.notify(sync, i);
    }
  }

  function initListener(msg) {
    const opts = msg.data;
    sharedMemory = opts.sharedMemory;
    sync = new Int32Array(sharedMemory, syncOffset);

    self.removeEventListener("message", initListener);

    if (opts.coord) {
      self.addEventListener("message", runCoord);
      cells = new Uint8Array(sharedMemory);
      nextCells = new Uint8Array(sharedMemory, SIZE * SIZE);
      sharedImageBuf = new Uint32Array(sharedMemory, imageaOffset);
      runCoord();
    } else {
      runWorker(opts);
    }
  }

  self.addEventListener("message", initListener);
}