import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface CsrfBody {
    _csrf?: string;
}

const CSRF_SECRET = process.env.CSRF_SECRET;
if (!CSRF_SECRET) {
    throw new Error('CSRF_SECRET is not defined in .env');
}

//////////////////////////////////////////////////////////////////////////////////
// Middleware to generate and validate CSRF tokens
export const generateSignedCSRFToken = () => {
    const token = crypto.randomBytes(32).toString('hex');
    const signature = crypto.createHmac('sha256', CSRF_SECRET).update(token).digest('hex');
    return `${token}.${signature}`;
};

//////////////////////////////////////////////////////////////////////////////////
// Middleware to validate CSRF tokens
const validateSignedCSRFToken = (signedToken: string) => {
    const [token, signature] = signedToken.split('.');
    if (!token || !signature) return false;

    const expectedSig = crypto.createHmac('sha256', CSRF_SECRET).update(token).digest('hex');
    return signature === expectedSig;
};

//////////////////////////////////////////////////////////////////////////////////
// Middleware to attach CSRF token to response cookies
export const attachCSRFToken = (req: Request, res: Response, next: NextFunction) => {
    if (!req.cookies['csrf-token']) {
        const signed = generateSignedCSRFToken();
        res.cookie('csrf-token', signed, {
            httpOnly: true,
            secure: process.env.RTE === 'prod',
            sameSite: 'none',
            path: '/',
        });
    }
    next();
};

//////////////////////////////////////////////////////////////////////////////////
// Middleware to validate CSRF tokens
export const validateCSRFToken = (req: Request, res: Response, next: NextFunction) => {
    if (['GET', 'HEAD'].includes(req.method)) return next();

    // Safely extract CSRF token from body or header
    const rawBody = req.body as unknown;
    let bodyToken: string | undefined;
    if (rawBody && typeof rawBody === 'object') {
        const { _csrf } = rawBody as CsrfBody;
        if (typeof _csrf === 'string') {
            bodyToken = _csrf;
        }
    }
    const headerTokenRaw = req.headers['x-csrf-token'];
    const headerToken = Array.isArray(headerTokenRaw) ? headerTokenRaw[0] : headerTokenRaw;
    const csrfToken = bodyToken || headerToken;

    const cookieToken = req.cookies['csrf-token'];

    if (!csrfToken || !cookieToken || !validateSignedCSRFToken(cookieToken)) {
        res.status(403).json({ message: 'Invalid CSRF token' });
        return;
    }

    const [tokenValue] = cookieToken.split('.');
    if (csrfToken !== tokenValue) {
        res.status(403).json({ message: 'CSRF token mismatch' });
        return;
    }

    next();
};