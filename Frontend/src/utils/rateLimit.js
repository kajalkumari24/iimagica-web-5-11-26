const rateLimitMap = new Map();

export const rateLimit = (key, limitMs = 30000) => {
  const now = Date.now();
  const lastCall = rateLimitMap.get(key);
  
  if (lastCall && now - lastCall < limitMs) {
    const remaining = Math.ceil((limitMs - (now - lastCall)) / 1000);
    return { allowed: false, remaining };
  }
  
  rateLimitMap.set(key, now);
  return { allowed: true, remaining: 0 };
};

setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of rateLimitMap.entries()) {
    if (now - timestamp > 60000) rateLimitMap.delete(key);
  }
}, 60000);
