import rateLimit from 'express-rate-limit';

//////////////////////////////////////////////////////////////////////////////////
// Middleware to limit the rate of requests
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    handler: (req, res) => {
        res.status(429).json({ error: 'Too many requests, please try again later.' });
    },
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    handler: (req, res) => {
        res.status(429).json({ error: 'Too many login attempts, please try again later.' });
    },
});
