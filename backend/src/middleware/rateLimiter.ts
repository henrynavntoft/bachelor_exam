import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    handler: (req, res) => {
        res.status(429).json({ error: 'Too many requests, please try again later.' });
    },
});