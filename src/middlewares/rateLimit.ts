import rateLimit from 'express-rate-limit';

const reqLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
});

export { reqLimiter, authLimiter };
