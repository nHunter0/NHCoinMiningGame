class Blockchain {
  constructor() {
    this.chain = [];
    this.currentTransactions = [];
    this.newBlock(100, "1"); // Genesis block
  }

  newBlock(proof, previousHash) {
    const block = {
      index: this.chain.length + 1,
      timestamp: Date.now(),
      transactions: this.currentTransactions,
      proof: proof,
      previous_hash:
        previousHash || this.hash(this.chain[this.chain.length - 1]),
    };

    this.currentTransactions = [];
    this.chain.push(block);

    return block;
  }

  newTransaction(sender, recipient, amount) {
    this.currentTransactions.push({ sender, recipient, amount });
    return this.lastBlock().index + 1;
  }

  hash(block) {
    const blockString = JSON.stringify(block);
    return CryptoJS.SHA256(blockString).toString();
  }

  proofOfWork(lastProof) {
    let proof = 0;
    while (!this.validProof(lastProof, proof)) {
      proof++;
    }
    return proof;
  }

  validProof(lastProof, proof) {
    const guess = `${lastProof}${proof}`;
    const guessHash = CryptoJS.SHA256(guess).toString();
    return guessHash.startsWith("0000");
  }

  lastBlock() {
    return this.chain[this.chain.length - 1];
  }
}

const blockchain = new Blockchain();
