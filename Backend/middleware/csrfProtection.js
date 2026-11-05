import crypto from 'crypto';

const tokens = new Map();

export const generateCsrfToken = (req, res, next) => {
  const token = crypto.randomBytes(32).toString('hex');
  const sessionId = req.sessionID || req.ip;
  tokens.set(sessionId, token);
  res.locals.csrfToken = token;
  next();
};

export const verifyCsrfToken = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionId = req.sessionID || req.ip;
  
  if (!token || tokens.get(sessionId) !== token) {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }
  
  next();
};

export const getCsrfToken = (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  const sessionId = req.sessionID || req.ip;
  tokens.set(sessionId, token);
  res.json({ csrfToken: token });
};

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of tokens.entries()) {
    if (now - value.timestamp > 3600000) tokens.delete(key);
  }
}, 3600000);
