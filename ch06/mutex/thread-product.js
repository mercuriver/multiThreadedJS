const { Worker, isMainThread, workerData } = require("worker_threads");
const assert = require("assert");

if (isMainThread) {
  const shared = new SharedArrayBuffer(4 * 4);
  const sharedInts = new Int32Array(shared);

  sharedInts.set([2, 3, 5, 7]);
  for (let i = 0; i < 3; i++) {
    new Worker(__filename, { workerData: { i, shared } });
  }
} else {
  const { i, shared } = workerData;
  const sharedInts = new Int32Array(shared);
  const a = Atomics.load(sharedInts, i);

  for (let j = 0; j < 1_000_000; j++) {} // 의도적 지연 발생

  const b = Atomics.load(sharedInts, 3);
  Atomics.store(sharedInts, 3, a * b);
  assert.strictEqual(Atomics.load(sharedInts, 3), a * b);
}

// 다른 스레드에 의해 공유 버퍼 값이 갱신되는 상황을 의도
// 실행하면 간헐적으로 assert 에러가 발생하는 예제
