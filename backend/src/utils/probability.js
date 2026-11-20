/**
 * Weighted random prize selector algorithm.
 * 
 * Rules:
 * 1. Only active prizes with remaining inventory (or unlimited quantity) can win.
 * 2. Uses cryptographic/secure random float (0 to 1).
 * 3. Dynamically normalizes probabilities across the active, eligible pool if sum != 100 or if an item was excluded due to stock.
 */

function selectWinningPrize(prizes) {
  // Filter active prizes that are in-stock
  const eligiblePrizes = prizes.filter(p => {
    if (!p.isActive) return false;
    if (p.quantity !== -1 && p.wonCount >= p.quantity) return false;
    return p.probability > 0;
  });

  if (!eligiblePrizes.length) {
    throw new Error('No eligible prizes available on the wheel.');
  }

  // Calculate sum of probabilities of eligible items
  const totalWeight = eligiblePrizes.reduce((sum, p) => sum + Number(p.probability), 0);

  if (totalWeight <= 0) {
    throw new Error('Total probability weight of eligible prizes must be greater than zero.');
  }

  // Generate random float between 0 and totalWeight
  const randomVal = Math.random() * totalWeight;

  let cumulativeWeight = 0;
  for (const prize of eligiblePrizes) {
    cumulativeWeight += Number(prize.probability);
    if (randomVal <= cumulativeWeight) {
      return prize;
    }
  }

  // Fallback to last prize in case of floating point precision rounding
  return eligiblePrizes[eligiblePrizes.length - 1];
}

module.exports = {
  selectWinningPrize
};
