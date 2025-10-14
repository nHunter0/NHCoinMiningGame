let coins = 0;
let gems = 0;
let clicks = 0;
const helpers = [];
let coinValue = 0.5;
let chart;
let helperCount = 0;
let minerCount = 0;
let engineerCount = 0;
let factoryCount = 0;
let rocketCount = 0;
let previousCoinValue = coinValue;
let clicksInLastSecond = 0;
let clicksPerSecond = 0;
let highScoreCPS = 0;
let userClickedRecently = false;
let cpsVisibilityTimeout = null;
let cpsVisible = false;
let marketMultiplier = 1;
let cpsMultiplier = 1;
let activePowerups = {
  market: { active: false, endTime: 0 },
  cps: { active: false, endTime: 0 },
};
let coinsSinceLastAnimation = 0;
let animationThreshold = 1;
let currentMiningProof = 0;
let estimatedProofTarget = 100;
let totalProofsAttempted = 0;
let bestLeadingZeros = 0;
let displayUpdateCounter = 0;
let lastGreenFlashTime = 0;

const blockchainFacts = [
  {
    title: "Blake2s Hashing",
    fact: "NHCoin uses Blake2s - the same hash algorithm used by Zcash! It's faster than SHA-256 and perfect for browser mining.",
  },
  {
    title: "Watch Leading Zeros Glow",
    fact: "See those green glowing zeros in the hash display? Each one makes the hash exponentially rarer - just like real mining!",
  },
  {
    title: "Real Proof of Work",
    fact: "Every hash you see is actually computed! The 'Attempts' counter shows how many nonces you've tested to find valid blocks.",
  },
  {
    title: "Progressive Difficulty",
    fact: "Started at difficulty 1? After block 6, minimum jumps to 2! NHCoin adjusts every 5 blocks to maintain 20-second block times.",
  },
  {
    title: "Your Genesis Block",
    fact: "Click on Block #1 to see your Genesis Block - it has no previous hash and started your entire blockchain!",
  },
  {
    title: "Block Halving",
    fact: "You earn 50 NHC per block now, but every 100 blocks the reward halves - just like Bitcoin's halving events!",
  },
  {
    title: "Merkle Trees Inside",
    fact: "Each block contains a Merkle root that verifies all transactions - the same data structure Bitcoin uses!",
  },
  {
    title: "Frozen Timestamps",
    fact: "When you start mining, the timestamp freezes so the same nonce always produces the same hash - real blockchain behavior!",
  },
  {
    title: "Smart Display Throttling",
    fact: "At high CPS, the display updates less frequently to prevent lag - but every hash is still being computed!",
  },
  {
    title: "Mining Visualization",
    fact: "The header shows Mining Block, Target zeros, Best Found, and Attempts - all the data real miners track!",
  },
  {
    title: "Chain Integrity",
    fact: "Each block links to the previous one via hash. Change one block? Every block after it becomes invalid!",
  },
  {
    title: "Difficulty Range",
    fact: "NHCoin difficulty ranges from 1 to 7 leading zeros. At difficulty 7, you need a hash starting with 0000000!",
  },
  {
    title: "Distributed Mining Pool",
    fact: "Your upgrades (🤖⛏️👷🏭🚀) simulate a mining pool - multiple miners working together to solve blocks faster!",
  },
  {
    title: "Real Cryptographic Hashing",
    fact: "The 64-character hex hash you see is actual Blake2s output - not a simulation! Try the same input twice, same hash.",
  },
  {
    title: "Network Security",
    fact: "With each block you mine, your chain becomes more secure - changing old blocks requires re-mining everything after!",
  },
];

let lastFactIndex = -1;

const blockFunFacts = [
  "💡 Fun fact: Bitcoin's first block contained the message 'The Times 03/Jan/2009 Chancellor on brink of second bailout for banks'",
  "🔍 Did you know? A Bitcoin hash has about the same odds as winning the lottery 5 times in a row!",
  "⚡ Lightning fast: Modern mining rigs try billions of hashes per second!",
  "🌍 Global network: Real blockchains are copied across thousands of computers worldwide",
  "💎 Rare gems: The Genesis Block is the only block without a previous hash",
  "🔗 Unbreakable: To hack a blockchain, you'd need to control 51% of all mining power",
  "📈 Growing chain: Bitcoin's blockchain is over 500 GB and growing every 10 minutes!",
  "🎲 Pure chance: Finding the right proof is like rolling a dice with billions of sides",
  "🏆 Block reward: Bitcoin miners currently earn 6.25 BTC per block (~$250,000!)",
  "⏰ Tick tock: Bitcoin targets exactly 10 minutes per block, adjusted every 2 weeks",
];

function onClick() {
  clicks++;
  clicksInLastSecond++;

  // start mining session (freezes timestamp and merkle root)
  if (totalProofsAttempted === 0) {
    blockchain.startMining();
    bestLeadingZeros = 0;
    displayUpdateCounter = 0;
  }

  const lastBlock = blockchain.lastBlock();
  const difficulty = blockchain.getDifficulty();

  // test 1-8 nonces per click depending on upgrades
  const baseNonces = 1;
  const upgradeBonus = Math.floor((helperCount + minerCount * 2 + engineerCount * 3 + factoryCount * 5 + rocketCount * 10) * 0.08);
  const noncesPerClick = Math.min(baseNonces + upgradeBonus, 8);

  for (let i = 0; i < noncesPerClick; i++) {
    currentMiningProof++;
    totalProofsAttempted++;
    displayUpdateCounter++;

    const isValid = blockchain.validProof(currentMiningProof);

    const tempBlock = {
      index: lastBlock.index + 1,
      timestamp: blockchain.miningStartTime || Date.now(),
      merkleRoot: blockchain.miningMerkleRoot,
      previousHash: lastBlock.hash,
      nonce: currentMiningProof,
      difficulty: difficulty
    };
    const guessHash = blockchain.hashBlock(tempBlock);
    const leadingZeros = guessHash.match(/^0*/)[0].length;

    if (leadingZeros > bestLeadingZeros) {
      bestLeadingZeros = leadingZeros;
    }

    const totalCPS = helperCount * 3 + minerCount * 10 + engineerCount * 25 + factoryCount * 75 + rocketCount * 200;

    // smart throttling: update display less frequently at high CPS
    let updateFrequency = 1;
    if (totalCPS > 500) {
      updateFrequency = 100;
    } else if (totalCPS > 200) {
      updateFrequency = 50;
    } else if (totalCPS > 100) {
      updateFrequency = 25;
    } else if (totalCPS > 50) {
      updateFrequency = 10;
    }

    // update on last nonce, frequency threshold, or when zeros found
    const shouldUpdate = (i === noncesPerClick - 1) || (displayUpdateCounter >= updateFrequency) || (leadingZeros > 0);

    if (shouldUpdate) {
      displayUpdateCounter = 0;

      const zerosMatch = guessHash.match(/^0*/);
      const zeros = zerosMatch ? zerosMatch[0] : '';
      const rest = guessHash.substring(zeros.length);

      document.getElementById("hash-zeros-part").textContent = zeros;
      document.getElementById("hash-rest-part").textContent = rest;

      document.getElementById("best-zeros-display").textContent = bestLeadingZeros;
      document.getElementById("attempts-display").textContent = totalProofsAttempted;
      document.getElementById("clicks-left").innerText = totalProofsAttempted;

      // Debounce the green flash animation to prevent flickering at high CPS
      const hashDisplay = document.getElementById("current-hash-display");
      const now = Date.now();
      if (leadingZeros > 0 && (now - lastGreenFlashTime) > 200) {
        hashDisplay.classList.add("hash-success");
        lastGreenFlashTime = now;
        setTimeout(() => hashDisplay.classList.remove("hash-success"), 500);
      }
    }

    if (isValid) {
      const hashDisplay = document.getElementById("current-hash-display");
      hashDisplay.classList.add("hash-success");
      displayUpdateCounter = 0;
      mineCoin(currentMiningProof);
      return;
    }
  }
}

function onManualClick(event) {
  if (cpsMultiplier > 1) {
    for (let i = 0; i < Math.floor(cpsMultiplier); i++) {
      onClick();
    }
  } else {
    onClick();
  }
  showCursorCPS(event);
}

function mineCoin(validNonce) {
  const lastBlock = blockchain.lastBlock();
  const blockReward = blockchain.getBlockReward();

  blockchain.newTransaction("NHCoin Network", "user", blockReward);

  const newBlock = blockchain.newBlock(validNonce);

  const attemptsUsed = totalProofsAttempted;
  const miningTime = (newBlock.timestamp - (lastBlock.timestamp || Date.now())) / 1000;

  currentMiningProof = 0;
  totalProofsAttempted = 0;
  bestLeadingZeros = 0;

  const blockHash = newBlock.hash;
  const totalSupply = blockchain.getTotalSupply();

  document.getElementById("mining-block-number").textContent = newBlock.index + 1;
  document.getElementById("mining-difficulty").textContent = blockchain.getDifficulty();
  document.getElementById("clicks-left").innerText = 0;
  document.getElementById("best-zeros-display").textContent = 0;
  document.getElementById("attempts-display").textContent = 0;

  document.getElementById("hash-zeros-part").textContent = "";
  document.getElementById("hash-rest-part").textContent = `✅ Block #${newBlock.index} mined! ${blockReward} NHC earned. Hash: ${blockHash.substring(0, 32)}...`;

  setTimeout(() => {
    if (newBlock.index % blockchain.difficultyAdjustmentInterval === 0 && newBlock.index > 1) {
      const oldDiff = lastBlock.difficulty;
      const newDiff = blockchain.getDifficulty();

      if (oldDiff !== newDiff) {
        const direction = newDiff > oldDiff ? "increased" : "decreased";
        const icon = newDiff > oldDiff ? "⬆️" : "⬇️";
        document.getElementById("hash-rest-part").textContent =
          `${icon} Difficulty ${direction} from ${oldDiff} to ${newDiff} zeros. Start mining Block #${newBlock.index + 1}!`;
      } else {
        document.getElementById("hash-rest-part").textContent =
          `Ready to mine Block #${newBlock.index + 1}. Difficulty: ${newDiff} zeros. Click to start!`;
      }
    } else {
      document.getElementById("hash-rest-part").textContent =
        `Ready to mine Block #${newBlock.index + 1}. Next reward: ${blockchain.getBlockReward()} NHC. Click to start!`;
    }
    document.getElementById("hash-zeros-part").textContent = "";
  }, 2500);

  coins += blockReward;
  coinsSinceLastAnimation++;
  document.getElementById("coins-count").innerText = coins.toFixed(2);
  clicks = 0;

  if (clicksPerSecond > 100) {
    animationThreshold = 100;
  } else if (clicksPerSecond > 10) {
    animationThreshold = 10;
  } else {
    animationThreshold = 1;
  }

  addBlockToTable(newBlock);
  updateBlockchainVisualization();

  if (coinsSinceLastAnimation >= animationThreshold) {
    triggerCoinAnimation();
    coinsSinceLastAnimation = 0;
  }

  const difficulty = blockchain.getDifficulty();
  const factFrequency = 100;

  if (coins % factFrequency === 0 && coins > 0) {
    showBlockchainFact();
  }
}

function showBlockchainFact() {
  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * blockchainFacts.length);
  } while (randomIndex === lastFactIndex && blockchainFacts.length > 1);

  lastFactIndex = randomIndex;
  const fact = blockchainFacts[randomIndex];

  const factPopup = document.createElement("div");
  factPopup.classList.add("blockchain-fact-popup");

  const closeButton = document.createElement("button");
  closeButton.classList.add("fact-close-button");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", () => factPopup.remove());
  factPopup.appendChild(closeButton);

  const factTitle = document.createElement("div");
  factTitle.classList.add("fact-title");
  factTitle.textContent = `💡 ${fact.title}`;
  factPopup.appendChild(factTitle);

  const factText = document.createElement("div");
  factText.classList.add("fact-text");
  factText.textContent = fact.fact;
  factPopup.appendChild(factText);

  document.body.appendChild(factPopup);
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
  const cell7 = row.insertCell(6);

  cell1.innerHTML =
    '<button class="btn btn-danger" onclick="sellCoin(this, ' +
    block.index +
    ', ' +
    block.reward +
    ')">Sell</button>';
  cell2.innerHTML = block.index;
  cell3.innerHTML = (block.reward || 50).toFixed(2);
  cell4.innerHTML = new Date(block.timestamp).toLocaleString();
  cell5.innerHTML = JSON.stringify(block.transactions);
  cell6.innerHTML = block.nonce;
  cell7.innerHTML = block.hash ? block.hash.substring(0, 16) + '...' : 'N/A';
}

function sellCoin(button, blockIndex, reward) {
  button.parentElement.parentElement.remove();
  coins -= reward;
  gems += Math.round(reward * coinValue * marketMultiplier * 10) / 10;
  document.getElementById("coins-count").innerText = coins.toFixed(2);
  document.getElementById("gems-count").innerText = gems.toFixed(1);
}

function sellAllCoins() {
  gems += Math.round(coins * coinValue * marketMultiplier * 10) / 10;
  coins = 0;
  document.getElementById("coins-count").innerText = coins.toFixed(2);
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

  animationLeft.classList.remove("active");
  animationRight.classList.remove("active");
  void animationLeft.offsetWidth;

  animationLeft.classList.add("active");
  animationRight.classList.add("active");

  setTimeout(() => {
    animationLeft.classList.remove("active");
    animationRight.classList.remove("active");
  }, 600);
}

function buyHelper() {
  const price = Math.floor(15 * Math.pow(1.15, helperCount));
  if (gems >= price) {
    gems -= price;
    document.getElementById("gems-count").innerText = gems.toFixed(1);
    helperCount++;
    document.getElementById("helper-count").innerText = helperCount;
    document.getElementById("helper-price").innerText = Math.floor(
      15 * Math.pow(1.15, helperCount)
    );
    const helper = document.createElement("div");
    helper.classList.add("helper");
    helper.innerText = "🤖";
    document.getElementById("helpers").appendChild(helper);
    helpers.push(helper);
    setInterval(() => {
      for (let i = 0; i < 3; i++) {
        onClick();
      }
    }, 1000);
  } else {
    alert("Not enough gems to buy a helper!");
  }
}

function buyMiner() {
  const price = Math.floor(50 * Math.pow(1.15, minerCount));
  if (gems >= price) {
    gems -= price;
    document.getElementById("gems-count").innerText = gems.toFixed(1);
    minerCount++;
    document.getElementById("miner-count").innerText = minerCount;
    document.getElementById("miner-price").innerText = Math.floor(
      50 * Math.pow(1.15, minerCount)
    );
    const miner = document.createElement("div");
    miner.classList.add("helper");
    miner.innerText = "⛏️";
    document.getElementById("helpers").appendChild(miner);
    helpers.push(miner);
    setInterval(() => {
      for (let i = 0; i < 10; i++) {
        onClick();
      }
    }, 1000);
  } else {
    alert("Not enough gems to buy a miner!");
  }
}

function buyEngineer() {
  const price = Math.floor(200 * Math.pow(1.15, engineerCount));
  if (gems >= price) {
    gems -= price;
    document.getElementById("gems-count").innerText = gems.toFixed(1);
    engineerCount++;
    document.getElementById("engineer-count").innerText = engineerCount;
    document.getElementById("engineer-price").innerText = Math.floor(
      200 * Math.pow(1.15, engineerCount)
    );
    const engineer = document.createElement("div");
    engineer.classList.add("helper");
    engineer.innerText = "👷";
    document.getElementById("helpers").appendChild(engineer);
    helpers.push(engineer);
    setInterval(() => {
      for (let i = 0; i < 25; i++) {
        onClick();
      }
    }, 1000);
  } else {
    alert("Not enough gems to buy an engineer!");
  }
}

function buyFactory() {
  const price = Math.floor(800 * Math.pow(1.15, factoryCount));
  if (gems >= price) {
    gems -= price;
    document.getElementById("gems-count").innerText = gems.toFixed(1);
    factoryCount++;
    document.getElementById("factory-count").innerText = factoryCount;
    document.getElementById("factory-price").innerText = Math.floor(
      800 * Math.pow(1.15, factoryCount)
    );
    const factory = document.createElement("div");
    factory.classList.add("helper");
    factory.innerText = "🏭";
    document.getElementById("helpers").appendChild(factory);
    helpers.push(factory);
    setInterval(() => {
      for (let i = 0; i < 75; i++) {
        onClick();
      }
    }, 1000);
  } else {
    alert("Not enough gems to buy a factory!");
  }
}

function buyRocket() {
  const price = Math.floor(4000 * Math.pow(1.15, rocketCount));
  if (gems >= price) {
    gems -= price;
    document.getElementById("gems-count").innerText = gems.toFixed(1);
    rocketCount++;
    document.getElementById("rocket-count").innerText = rocketCount;
    document.getElementById("rocket-price").innerText = Math.floor(
      4000 * Math.pow(1.15, rocketCount)
    );
    const rocket = document.createElement("div");
    rocket.classList.add("helper");
    rocket.innerText = "🚀";
    document.getElementById("helpers").appendChild(rocket);
    helpers.push(rocket);
    setInterval(() => {
      for (let i = 0; i < 200; i++) {
        onClick();
      }
    }, 1000);
  } else {
    alert("Not enough gems to buy a rocket!");
  }
}

function updateCoinValue() {
  // Generate a random value between 0.1 and 1, rounding to the nearest tenth
  previousCoinValue = coinValue;
  coinValue = Math.round((Math.random() * 0.9 + 0.1) * 10) / 10;

  const priceElement = document.getElementById("current-price");
  const arrowElement = document.getElementById("price-arrow");

  const displayValue = coinValue * marketMultiplier;
  priceElement.innerText = displayValue.toFixed(1);

  if (marketMultiplier > 1) {
    priceElement.style.color = "#FFD700";
    priceElement.style.textShadow = "0 0 10px rgba(255, 215, 0, 0.8)";
  } else {
    priceElement.style.color = "";
    priceElement.style.textShadow = "";
  }

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
  data.push(coinValue * marketMultiplier);

  const maxValue = marketMultiplier > 1 ? 10 : 1;
  chart.options.scales.y.max = maxValue;

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

function updateBlockchainVisualization() {
  const container = document.getElementById("blockchain-visual-compact");
  const recentBlocks = blockchain.chain; // show all blocks
  const currentBlockCount = container.children.length;

  if (currentBlockCount === 0) {
    recentBlocks.forEach((block, index) => {
      const blockCard = createBlockCard(block, false);
      container.appendChild(blockCard);
    });
  } else {
    const newBlocks = recentBlocks.slice(currentBlockCount);
    newBlocks.forEach((block) => {
      const blockCard = createBlockCard(block, true);
      container.appendChild(blockCard);

      if (container.children.length > 1) {
        const previousBlock = container.children[container.children.length - 2];
        previousBlock.classList.add("block-connecting");
        setTimeout(() => {
          previousBlock.classList.remove("block-connecting");
        }, 300);
      }
    });
  }

  container.scrollLeft = container.scrollWidth;
}

function createBlockCard(block, animate) {
  const blockCard = document.createElement("div");
  blockCard.classList.add("block-card-compact");
  if (animate) {
    blockCard.classList.add("block-new");
  }

  const blockNumber = document.createElement("div");
  blockNumber.classList.add("block-number-compact");
  blockNumber.textContent = block.index;
  blockCard.appendChild(blockNumber);

  const blockLabel = document.createElement("div");
  blockLabel.classList.add("block-label-compact");
  blockLabel.textContent = "Block";
  blockCard.appendChild(blockLabel);

  blockCard.addEventListener("click", () => showBlockDetails(block));

  return blockCard;
}

function showBlockDetails(block) {
  const modal = document.createElement("div");
  modal.classList.add("block-modal-overlay");

  const modalContent = document.createElement("div");
  modalContent.classList.add("block-modal-content");

  const modalHeader = document.createElement("div");
  modalHeader.classList.add("block-modal-header");
  modalHeader.textContent = `Block #${block.index} Details`;
  modalContent.appendChild(modalHeader);

  const blockHash = block.hash;

  const details = [
    { label: "Block Index", value: block.index },
    { label: "Timestamp", value: new Date(block.timestamp).toLocaleString() },
    { label: "Block Reward", value: `${block.reward || 50} NHC` },
    { label: "Nonce (Proof of Work)", value: block.nonce },
    { label: "Difficulty Target", value: `${block.difficulty || 2} leading zeros` },
    { label: "Transactions", value: block.transactions.length },
    { label: "Merkle Root", value: block.merkleRoot, mono: true },
    { label: "Block Hash (Blake2s)", value: blockHash, mono: true },
    {
      label: "Previous Hash",
      value: block.previousHash || "Genesis Block",
      mono: true,
    },
  ];

  details.forEach((detail) => {
    const detailRow = document.createElement("div");
    detailRow.classList.add("block-detail-row");

    const label = document.createElement("div");
    label.classList.add("block-detail-label");
    label.textContent = detail.label + ":";
    detailRow.appendChild(label);

    const value = document.createElement("div");
    value.classList.add("block-detail-value");
    if (detail.mono) {
      value.classList.add("mono");
    }
    value.textContent = detail.value;
    detailRow.appendChild(value);

    modalContent.appendChild(detailRow);
  });

  const funFact = document.createElement("div");
  funFact.classList.add("block-fun-fact");
  const randomFact =
    blockFunFacts[Math.floor(Math.random() * blockFunFacts.length)];
  funFact.textContent = randomFact;
  modalContent.appendChild(funFact);

  const closeButton = document.createElement("button");
  closeButton.classList.add("block-modal-close");
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", () => modal.remove());
  modalContent.appendChild(closeButton);

  modal.appendChild(modalContent);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  document.body.appendChild(modal);
}

function updateClicksPerSecond() {
  clicksPerSecond = clicksInLastSecond;

  if (clicksPerSecond > highScoreCPS) {
    highScoreCPS = clicksPerSecond;
  }

  clicksInLastSecond = 0;
}

function showHighScoreNotification() {
  const notification = document.getElementById("high-score-notification");
  notification.classList.remove("show");
  void notification.offsetWidth;
  notification.classList.add("show");

  setTimeout(() => {
    notification.classList.remove("show");
  }, 2000);
}

function showCursorCPS(event) {
  const cursorCPS = document.getElementById("cursor-cps");
  const adjustedCPS = Math.round(clicksPerSecond * cpsMultiplier);

  if (cpsMultiplier > 1) {
    cursorCPS.innerHTML = `${adjustedCPS} CPS <span style="color: #FFD700; font-weight: bold;">x${cpsMultiplier}</span>`;
  } else {
    cursorCPS.textContent = `${adjustedCPS} CPS`;
  }

  if (!cpsVisible) {
    cursorCPS.classList.add("visible");
    cpsVisible = true;
  }

  if (cpsVisibilityTimeout) {
    clearTimeout(cpsVisibilityTimeout);
  }

  cpsVisibilityTimeout = setTimeout(() => {
    cursorCPS.classList.remove("visible");
    cpsVisible = false;
  }, 2000);
}

function spawnPowerup() {
  const powerupType = Math.random() < 0.5 ? "market" : "cps";
  const powerup = document.createElement("div");
  powerup.classList.add("powerup");

  if (powerupType === "market") {
    powerup.textContent = "💎";
    powerup.dataset.type = "market";
  } else {
    powerup.textContent = "⚡";
    powerup.dataset.type = "cps";
  }

  const x = Math.random() * (window.innerWidth - 100);
  const y = Math.random() * (window.innerHeight - 100);
  powerup.style.left = x + "px";
  powerup.style.top = y + "px";

  powerup.addEventListener("click", () => activatePowerup(powerup));

  document.getElementById("powerups-container").appendChild(powerup);

  setTimeout(() => {
    if (powerup.parentElement) {
      powerup.remove();
    }
  }, 10000);
}

function activatePowerup(powerup) {
  const type = powerup.dataset.type;
  powerup.classList.add("activated");

  setTimeout(() => {
    powerup.remove();
  }, 500);

  if (type === "market") {
    marketMultiplier = 3;
    activePowerups.market.active = true;
    activePowerups.market.endTime = Date.now() + 15000;
    showPowerupNotification("💎 MARKET BOOST! 3x Sell Value!");

    setTimeout(() => {
      marketMultiplier = 1;
      activePowerups.market.active = false;
    }, 15000);
  } else if (type === "cps") {
    cpsMultiplier = 1.25;
    activePowerups.cps.active = true;
    activePowerups.cps.endTime = Date.now() + 15000;
    showPowerupNotification("⚡ SPEED BOOST! 1.25x Click Speed!");

    const turboInterval = setInterval(() => {
      const totalClicks =
        helperCount * 0.25 +
        minerCount * 1.25 +
        engineerCount * 2.5 +
        factoryCount * 6.25 +
        rocketCount * 12.5;

      for (let i = 0; i < totalClicks; i++) {
        onClick();
      }
    }, 1000);

    setTimeout(() => {
      cpsMultiplier = 1;
      activePowerups.cps.active = false;
      clearInterval(turboInterval);
    }, 15000);
  }
}

function showPowerupNotification(message) {
  const notification = document.createElement("div");
  notification.classList.add("powerup-notification");
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function showMiningInfo() {
  const modal = document.createElement("div");
  modal.classList.add("info-modal-overlay");

  const modalContent = document.createElement("div");
  modalContent.classList.add("info-modal-content");

  const modalHeader = document.createElement("div");
  modalHeader.classList.add("info-modal-header");
  modalHeader.textContent = "🔍 How NHCoin Mining Works";
  modalContent.appendChild(modalHeader);

  const sections = [
    {
      title: "⛏️ What is Mining?",
      content: "Mining is the process of finding a special number (called a <code>nonce</code>) that, when combined with block data and hashed with Blake2s, produces a hash starting with a certain number of zeros. This is called <strong>Proof of Work</strong>."
    },
    {
      title: "🎯 What Are We Looking For?",
      content: "We're searching for a hash that starts with enough zeros. Watch the hash display to see leading zeros light up in green!",
      list: [
        "<strong>Leading Zeros</strong> - The zeros at the start of the hash glow green",
        "<strong>Best Found</strong> - Tracks the most zeros you've found (0, 1, 2, etc.)",
        "<strong>Target</strong> - Shows how many zeros you need (difficulty level)",
        "When you find enough zeros, the display flashes green and you mine the block!"
      ]
    },
    {
      title: "🔍 Hash Examples",
      content: "Here's what different hashes look like:",
      list: [
        "❌ <strong>Bad Hash (0 zeros):</strong><br><code style='color: #ff6b6b;'>bb9d50e437cd589692dd51eb61568ab4...</code>",
        "⚠️ <strong>Better (1 zero):</strong><br><code style='color: #ffd93d;'>0b3f8e2a91cd7456ef89ba12c4567d8e...</code>",
        "✅ <strong>Good (2 zeros):</strong><br><code style='color: #6bcf7f;'>00a4f91e8d3c2b7a56ef1234abcd5678...</code>",
        "🎉 <strong>Excellent (3 zeros):</strong><br><code style='color: #61dafb;'>000e7a2f5c8b1d94a367ef2b5c9d1a48...</code>",
        "💎 <strong>Jackpot (4+ zeros):</strong><br><code style='color: #fbbf24;'>0000012a5f8e3c7b2d91e4a68f3c5b7a...</code>"
      ]
    },
    {
      title: "🔢 Understanding the Display",
      content: "The mining visualization shows four key stats and the current hash:",
      list: [
        "<strong>Mining Block</strong> - Which block number you're currently mining",
        "<strong>Target</strong> - How many leading zeros required (difficulty)",
        "<strong>Best Found</strong> - Most leading zeros found so far this block",
        "<strong>Attempts</strong> - Total nonces (numbers) you've tested",
        "<strong>Current Hash</strong> - Live 64-character Blake2s hash with zeros in green",
        "The hash updates in real-time as you click, showing actual proof-of-work!"
      ]
    },
    {
      title: "📈 Difficulty Adjustment",
      content: "NHCoin automatically adjusts difficulty every 5 blocks to maintain a 20-second target block time:",
      list: [
        "Starts at difficulty 1 (one leading zero - easy to learn!)",
        "Mining too fast? Difficulty increases (more zeros required)",
        "Mining too slow? Difficulty decreases (fewer zeros required)",
        "Difficulty ranges from 1 to 7 leading zeros"
      ]
    },
    {
      title: "💎 Rewards & Economics",
      content: "Each block mined earns you NHCoin (NHC) stored in your wallet:",
      list: [
        "<strong>Block Reward:</strong> 50 NHC (halves every 100 blocks, like Bitcoin)",
        "<strong>Wallet:</strong> View all your mined blocks in the table below",
        "<strong>Selling:</strong> Click 'Sell' on any block to convert NHC to gems 💎",
        "<strong>Market Price:</strong> Fluctuates randomly - sell high for more gems!",
        "<strong>Upgrades:</strong> Use gems to buy miners (🤖⛏️👷🏭🚀) that auto-mine"
      ]
    },
    {
      title: "🔐 Real Blockchain Tech",
      content: "This game uses real cryptography:",
      list: [
        "<strong>Blake2s</strong> - Used by Zcash and other cryptocurrencies",
        "<strong>Merkle Trees</strong> - Transaction verification (like Bitcoin)",
        "<strong>Nonces</strong> - The proof-of-work value miners search for",
        "<strong>Frozen Timestamps</strong> - Ensures consistent hashing during mining"
      ]
    }
  ];

  sections.forEach((section) => {
    const sectionDiv = document.createElement("div");
    sectionDiv.classList.add("info-section");

    const title = document.createElement("div");
    title.classList.add("info-section-title");
    title.innerHTML = section.title;
    sectionDiv.appendChild(title);

    const text = document.createElement("div");
    text.classList.add("info-section-text");
    text.innerHTML = section.content;
    sectionDiv.appendChild(text);

    if (section.list) {
      const list = document.createElement("ul");
      list.classList.add("info-section-list");
      section.list.forEach((item) => {
        const li = document.createElement("li");
        li.innerHTML = item;
        list.appendChild(li);
      });
      sectionDiv.appendChild(list);
    }

    modalContent.appendChild(sectionDiv);
  });

  const closeButton = document.createElement("button");
  closeButton.classList.add("info-modal-close");
  closeButton.textContent = "Got It!";
  closeButton.addEventListener("click", () => modal.remove());
  modalContent.appendChild(closeButton);

  modal.appendChild(modalContent);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  document.body.appendChild(modal);
}

document.addEventListener("DOMContentLoaded", (event) => {
  initializeChart();
  setInterval(updateCoinValue, 2000);
  setInterval(updateClicksPerSecond, 1000);
  setInterval(spawnPowerup, 60000);
  updateBlockchainVisualization();
});
