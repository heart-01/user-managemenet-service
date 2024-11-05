import rateLimit from 'express-rate-limit';

const TIME_PER_REQUEST = 1 * 60 * 1000; // 1 minutes
const REQUEST_LIMIT = 100;

const limiter = rateLimit({
  windowMs: TIME_PER_REQUEST,
  max: REQUEST_LIMIT,
  message: 'Too many requests, please try again in 10 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

export { limiter };
