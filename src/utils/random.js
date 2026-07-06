export function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

export function choice(items) {
  if (!items.length) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

export function weightedChoice(items, weightFn) {
  if (!items.length) return undefined;
  const weights = items.map((item) => Math.max(0, Number(weightFn(item)) || 0));
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return choice(items);
  let cursor = Math.random() * total;
  for (let index = 0; index < items.length; index += 1) {
    cursor -= weights[index];
    if (cursor <= 0) return items[index];
  }
  return items[items.length - 1];
}

export function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}
