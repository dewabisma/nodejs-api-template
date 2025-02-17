/* eslint-disable no-constant-condition */
export function generateUniqueID() {
  const minInclusive = 1n;
  const maxExclusive = 9_000_000_000_000_000_000n;

  const maxInclusive = maxExclusive - minInclusive - BigInt(1);
  let x = BigInt(1);
  let y = BigInt(0);
  while (true) {
    x = x * BigInt(2);
    const randomBit = BigInt(Math.random() < 0.5 ? 1 : 0);
    y = y * BigInt(2) + randomBit;
    if (x > maxInclusive) {
      if (y <= maxInclusive) {
        return y + minInclusive;
      }
      // Rejection
      x = x - maxInclusive - BigInt(1);
      y = y - maxInclusive - BigInt(1);
    }
  }
}
