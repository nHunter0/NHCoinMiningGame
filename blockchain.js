class Blockchain {
  constructor() {
    this.chain = [];
    this.currentTransactions = [];
    this.difficulty = 1; // starts at 1 leading zero
    this.targetBlockTime = 20000; // 20 seconds per block
    this.difficultyAdjustmentInterval = 5; // adjust every 5 blocks
    this.maxDifficulty = 7;
    this.minDifficulty = 1;
    this.createGenesisBlock();
  }

  createGenesisBlock() {
    const genesis = {
      index: 1,
      timestamp: Date.now(),
      transactions: [{ sender: "Genesis", recipient: "Network", amount: 0 }],
      nonce: 0,
      previousHash: "0000000000000000000000000000000000000000000000000000000000000000",
      difficulty: this.difficulty,
      reward: 50,
      merkleRoot: this.calculateMerkleRoot([])
    };
    genesis.hash = this.hashBlock(genesis);
    this.chain.push(genesis);
  }

  newBlock(nonce) {
    const block = {
      index: this.chain.length + 1,
      timestamp: this.miningStartTime || Date.now(),
      transactions: this.currentTransactions,
      nonce: nonce,
      previousHash: this.lastBlock().hash,
      difficulty: this.difficulty,
      reward: this.getBlockReward(),
      merkleRoot: this.miningMerkleRoot || this.calculateMerkleRoot(this.currentTransactions)
    };

    block.hash = this.hashBlock(block);
    this.currentTransactions = [];
    this.chain.push(block);

    if (this.chain.length % this.difficultyAdjustmentInterval === 0 && this.chain.length > 1) {
      this.adjustDifficulty();
    }

    this.miningStartTime = null;
    this.miningMerkleRoot = null;
    return block;
  }

  // calculate merkle root - hashes transaction pairs recursively
  calculateMerkleRoot(transactions) {
    if (transactions.length === 0) {
      return nhcoinHash("empty");
    }

    let hashes = transactions.map(tx => nhcoinHash(JSON.stringify(tx)));

    // keep hashing pairs until one hash remains
    while (hashes.length > 1) {
      const newHashes = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = i + 1 < hashes.length ? hashes[i + 1] : hashes[i];
        newHashes.push(nhcoinHash(left + right));
      }
      hashes = newHashes;
    }

    return hashes[0];
  }

  hashBlock(block) {
    const blockHeader = {
      index: block.index,
      timestamp: block.timestamp,
      merkleRoot: block.merkleRoot,
      previousHash: block.previousHash,
      nonce: block.nonce,
      difficulty: block.difficulty
    };
    return nhcoinHash(JSON.stringify(blockHeader));
  }

  // block reward with halving - starts at 50, halves every 100 blocks
  getBlockReward() {
    const halvings = Math.floor(this.chain.length / 100);
    return 50 / Math.pow(2, halvings);
  }

  adjustDifficulty() {
    const lastAdjustmentBlock =
      this.chain.length - this.difficultyAdjustmentInterval;
    if (lastAdjustmentBlock < 0) return;

    const timeExpected =
      this.targetBlockTime * this.difficultyAdjustmentInterval;
    const timeActual =
      this.chain[this.chain.length - 1].timestamp -
      this.chain[lastAdjustmentBlock].timestamp;

    const avgBlockTime = timeActual / this.difficultyAdjustmentInterval;
    const oldDifficulty = this.difficulty;

    // after first adjustment (block 6+), minimum difficulty becomes 2
    if (this.chain.length > this.difficultyAdjustmentInterval) {
      this.minDifficulty = 2;
    }

    // adjust difficulty based on actual vs expected time
    if (timeActual < timeExpected * 0.75) {
      this.difficulty = Math.min(this.maxDifficulty, this.difficulty + 1);
      console.log(`⬆️ Difficulty increased from ${oldDifficulty} to ${this.difficulty} (blocks too fast: ${(avgBlockTime/1000).toFixed(1)}s avg)`);
    } else if (timeActual > timeExpected * 2.5) {
      this.difficulty = Math.max(this.minDifficulty, this.difficulty - 2);
      console.log(`⬇️⬇️ Difficulty decreased from ${oldDifficulty} to ${this.difficulty} (blocks very slow: ${(avgBlockTime/1000).toFixed(1)}s avg)`);
    } else if (timeActual > timeExpected * 1.5) {
      this.difficulty = Math.max(this.minDifficulty, this.difficulty - 1);
      console.log(`⬇️ Difficulty decreased from ${oldDifficulty} to ${this.difficulty} (blocks too slow: ${(avgBlockTime/1000).toFixed(1)}s avg)`);
    } else {
      console.log(`✓ Difficulty maintained at ${this.difficulty} (avg block time: ${(avgBlockTime/1000).toFixed(1)}s)`);
    }
  }

  newTransaction(sender, recipient, amount) {
    this.currentTransactions.push({ sender, recipient, amount });
    return this.lastBlock().index + 1;
  }

  // freeze timestamp and merkle root for consistent hashing during mining
  startMining() {
    this.miningStartTime = Date.now();
    this.miningMerkleRoot = this.calculateMerkleRoot(this.currentTransactions);
  }

  // check if nonce produces valid hash (starts with N zeros)
  validProof(nonce) {
    const tempBlock = {
      index: this.chain.length + 1,
      timestamp: this.miningStartTime || Date.now(), // uses frozen timestamp
      merkleRoot: this.miningMerkleRoot,
      previousHash: this.lastBlock().hash,
      nonce: nonce,
      difficulty: this.difficulty
    };

    const hash = this.hashBlock(tempBlock);
    const target = "0".repeat(this.difficulty);
    return hash.startsWith(target);
  }

  getDifficulty() {
    return this.difficulty;
  }

  getTotalSupply() {
    return this.chain.reduce((total, block) => total + (block.reward || 0), 0);
  }

  getHashrate() {
    if (this.chain.length < 2) return 0;
    const recentBlocks = this.chain.slice(-10);
    const avgBlockTime =
      (recentBlocks[recentBlocks.length - 1].timestamp - recentBlocks[0].timestamp) /
      recentBlocks.length / 1000;
    const expectedAttempts = Math.pow(16, this.difficulty);
    return Math.floor(expectedAttempts / avgBlockTime);
  }

  lastBlock() {
    return this.chain[this.chain.length - 1];
  }
}

const blockchain = new Blockchain();
