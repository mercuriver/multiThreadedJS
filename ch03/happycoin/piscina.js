const Piscina = require("piscina");

if (!Piscina.isWorkerThread) {
  const piscina = new Piscina({ filename: __filename });
  piscina.run(9).then((squareRootOfNine) => {
    console.log("The square root of nine is", squareRootOfNine);
  });
}

module.exports = (num) => Math.sqrt(num);
