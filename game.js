let coins = 0;
let gems = 0;
let clicks = 0;
const clicksToMine = 100;
const helpers = [];
let coinValue = 0.5;
let chart;
let helperCount = 0;
let previousCoinValue = coinValue;

function onClick() {
  clicks++;
  document.getElementById("clicks-left").innerText = clicksToMine - clicks;

  if (clicks >= clicksToMine) {
    mineCoin();
  }
}

function mineCoin() {
  const lastBlock = blockchain.lastBlock();
  const lastProof = lastBlock.proof;
  const proof = blockchain.proofOfWork(lastProof);

  blockchain.newTransaction("0", "user", 1);

  const previousHash = blockchain.hash(lastBlock);
  const newBlock = blockchain.newBlock(proof, previousHash);

  coins++;
  document.getElementById("coins-count").innerText = coins;
  clicks = 0;
  document.getElementById("clicks-left").innerText = clicksToMine - clicks;

  addBlockToTable(newBlock);
  triggerCoinAnimation();
}

function addBlockToTable(block) {
  const table = document
    .getElementById("blockchain-table")
    .getElementsByTagName("tbody")[0];
  const row = table.insertRow();

  const cell1 = row.insertCell(0);
  const cell2 = row.insertCell(1);
  const cell3 = row.insertCell(2);
  const cell4 = row.insertCell(3);
  const cell5 = row.insertCell(4);
  const cell6 = row.insertCell(5);

  cell1.innerHTML =
    '<button class="btn btn-danger" onclick="sellCoin(this, ' +
    block.index +
    ')">Sell</button>';
  cell2.innerHTML = block.index;
  cell3.innerHTML = new Date(block.timestamp).toLocaleString();
  cell4.innerHTML = JSON.stringify(block.transactions);
  cell5.innerHTML = block.proof;
  cell6.innerHTML = block.previous_hash;
}

function sellCoin(button, blockIndex) {
  button.parentElement.parentElement.remove();
  coins--;
  gems += Math.round(coinValue * 10) / 10;
  document.getElementById("coins-count").innerText = coins;
  document.getElementById("gems-count").innerText = gems.toFixed(1);
}

function sellAllCoins() {
  gems += Math.round(coins * coinValue * 10) / 10;
  coins = 0;
  document.getElementById("coins-count").innerText = coins;
  document.getElementById("gems-count").innerText = gems.toFixed(1);
  clearBlockchainTable();
}

function clearBlockchainTable() {
  const table = document
    .getElementById("blockchain-table")
    .getElementsByTagName("tbody")[0];
  while (table.rows.length > 0) {
    table.deleteRow(0);
  }
}

function triggerCoinAnimation() {
  const animationLeft = document.getElementById("mine-animation-left");
  const animationRight = document.getElementById("mine-animation-right");
  animationLeft.style.display = "inline";
  animationRight.style.display = "inline";
  setTimeout(() => {
    animationLeft.style.display = "none";
    animationRight.style.display = "none";
  }, 1000);
}

function buyHelper() {
  if (gems >= 3) {
    gems -= 3;
    document.getElementById("gems-count").innerText = gems.toFixed(1);
    helperCount++;
    document.getElementById("helper-count").innerText = helperCount;
    const helper = document.createElement("div");
    helper.classList.add("helper");
    helper.innerText = "🤖";
    document.getElementById("helpers").appendChild(helper);
    helpers.push(helper);
    setInterval(() => {
      onClick();
    }, 1000);
  } else {
    alert("Not enough gems to buy a helper!");
  }
}

function updateCoinValue() {
  // Generate a random value between 0.1 and 1, rounding to the nearest tenth
  previousCoinValue = coinValue;
  coinValue = Math.round((Math.random() * 0.9 + 0.1) * 10) / 10;

  const priceElement = document.getElementById("current-price");
  const arrowElement = document.getElementById("price-arrow");

  priceElement.innerText = coinValue.toFixed(1);
  if (coinValue > previousCoinValue) {
    arrowElement.innerHTML = "🚀";
    arrowElement.style.color = "green";
  } else if (coinValue < previousCoinValue) {
    arrowElement.innerHTML = "🔻";
    arrowElement.style.color = "red";
  } else {
    arrowElement.innerHTML = "-";
  }

  updateChart();
}

function updateChart() {
  const labels = chart.data.labels;
  const data = chart.data.datasets[0].data;

  if (labels.length >= 20) {
    labels.shift();
    data.shift();
  }

  labels.push("");
  data.push(coinValue);

  chart.update();
}

function initializeChart() {
  const ctx = document.getElementById("coinValueChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Coin Value",
          data: [],
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 2,
          fill: false,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 1,
        },
      },
    },
  });
}

document.addEventListener("DOMContentLoaded", (event) => {
  initializeChart();
  setInterval(updateCoinValue, 2000);
});
