// blake2s implementation - used by Zcash and Nano
class Blake2s {
  constructor() {
    // initialization vector - fractional parts of sqrt of primes
    this.IV = new Uint32Array([
      0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
      0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19
    ]);

    // message schedule permutation for 8 rounds
    this.SIGMA = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
      [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
      [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
      [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
      [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
      [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 11, 6, 3, 9, 2, 8],
      [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10]
    ];
  }

  // mixing function - mixes 4 words using addition, XOR, and rotation
  G(v, a, b, c, d, x, y) {
    v[a] = (v[a] + v[b] + x) >>> 0;
    v[d] = this.rotr32(v[d] ^ v[a], 16);
    v[c] = (v[c] + v[d]) >>> 0;
    v[b] = this.rotr32(v[b] ^ v[c], 12);
    v[a] = (v[a] + v[b] + y) >>> 0;
    v[d] = this.rotr32(v[d] ^ v[a], 8);
    v[c] = (v[c] + v[d]) >>> 0;
    v[b] = this.rotr32(v[b] ^ v[c], 7);
  }

  // 32-bit right rotation
  rotr32(x, n) {
    return ((x >>> n) | (x << (32 - n))) >>> 0;
  }

  // compression function - takes hash state and message block, produces new state
  compress(h, m, t, f) {
    const v = new Uint32Array(16);

    // initialize working variables
    for (let i = 0; i < 8; i++) {
      v[i] = h[i];
      v[i + 8] = this.IV[i];
    }

    // mix in counter and finalization flag
    v[12] ^= t;
    v[13] ^= 0;
    if (f) v[14] = ~v[14];

    // 8 rounds of cryptographic mixing
    for (let round = 0; round < 8; round++) {
      const s = this.SIGMA[round % 10];
      this.G(v, 0, 4, 8, 12, m[s[0]], m[s[1]]);
      this.G(v, 1, 5, 9, 13, m[s[2]], m[s[3]]);
      this.G(v, 2, 6, 10, 14, m[s[4]], m[s[5]]);
      this.G(v, 3, 7, 11, 15, m[s[6]], m[s[7]]);
      this.G(v, 0, 5, 10, 15, m[s[8]], m[s[9]]);
      this.G(v, 1, 6, 11, 12, m[s[10]], m[s[11]]);
      this.G(v, 2, 7, 8, 13, m[s[12]], m[s[13]]);
      this.G(v, 3, 4, 9, 14, m[s[14]], m[s[15]]);
    }

    // XOR the two halves
    for (let i = 0; i < 8; i++) {
      h[i] ^= v[i] ^ v[i + 8];
    }
  }

  // main hash function - converts string to 256-bit hash
  hash(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const dataLen = data.length;

    // initialize hash state
    const h = new Uint32Array(this.IV);
    h[0] ^= 0x01010020; // parameter block for 32-byte output

    let offset = 0;
    let counter = 0;

    // process 64-byte blocks
    while (offset < dataLen) {
      const blockSize = Math.min(64, dataLen - offset);
      const block = new Uint8Array(64);
      block.set(data.subarray(offset, offset + blockSize));

      // convert bytes to 32-bit words (little-endian)
      const m = new Uint32Array(16);
      for (let i = 0; i < 16; i++) {
        m[i] = block[i * 4] | (block[i * 4 + 1] << 8) |
               (block[i * 4 + 2] << 16) | (block[i * 4 + 3] << 24);
      }

      counter += blockSize;
      const isLast = offset + blockSize === dataLen;

      this.compress(h, m, counter, isLast);
      offset += blockSize;
    }

    // convert final state to hex string (little-endian)
    let result = '';
    for (let i = 0; i < 8; i++) {
      const word = h[i];
      result += ((word) & 0xFF).toString(16).padStart(2, '0');
      result += ((word >>> 8) & 0xFF).toString(16).padStart(2, '0');
      result += ((word >>> 16) & 0xFF).toString(16).padStart(2, '0');
      result += ((word >>> 24) & 0xFF).toString(16).padStart(2, '0');
    }

    return result;
  }
}

const blake2s = new Blake2s();

function nhcoinHash(input) {
  return blake2s.hash(input);
}
