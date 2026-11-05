export function parseDurationToMs(str, fallbackMs = 0) {
  if (!str) return fallbackMs;
  if (typeof str === 'number') return Number(str);
  const s = String(str).trim();
  const match = s.match(/^([0-9]+)\s*(ms|s|m|h|d)?$/i);
  if (!match) return fallbackMs;
  const value = parseInt(match[1], 10);
  const unit = (match[2] || 'ms').toLowerCase();
  switch (unit) {
    case 'ms': return value;
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return fallbackMs;
  }
}
