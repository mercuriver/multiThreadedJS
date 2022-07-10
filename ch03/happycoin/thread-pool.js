const Piscina = require("piscina");
const crypto = require("crypto");
const { Worker, isMainThread, parentPort } = require("worker_threads");

const big64arr = new BigUint64Array(1);

function random64() {
  crypto.randomFillSync(big64arr);
  return big64arr[0];
}

function sumDigitsSquared(num) {
  let total = 0n;
  while (num > 0) {
    const numModBase = num % 10n;
    total += numModBase ** 2n;
    num = num / 10n;
  }
  return total;
}

function isHappy(num) {
  while (num != 1n && num != 4n) {
    num = sumDigitsSquared(num);
  }
  return num === 1n;
}

function isHappyCoin(num) {
  return isHappy(num) && num % 100_000n == 0n;
}

const THREAD_COUNT = 4;

if (!Piscina.isWorkerThread) {
  const piscina = new Piscina({
    filename: __filename,
    minThreads: THREAD_COUNT,
    maxThreads: THREAD_COUNT,
  });

  let done = 0;
  let count = 0;

  for (let i = 0; i < THREAD_COUNT; i++) {
    (async () => {
      const { total, happycoins } = await piscina.run();
      process.stdout.write(happycoins);
      count += total;
      if (++done === THREAD_COUNT) {
        console.log("\ncount", count);
      }
    })();
  }
}

module.exports = () => {
  let happycoins = "";
  let total = 0;

  for (let i = 0; i < 10_000_000 / THREAD_COUNT; i++) {
    const randomNum = random64();
    if (isHappyCoin(randomNum)) {
      happycoins += `${randomNum.toString()} `;
      total += 1;
    }
  }

  return { total, happycoins };
};
