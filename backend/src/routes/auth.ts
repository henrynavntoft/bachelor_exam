import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authorize, AuthenticatedRequest } from '../middleware/authMiddleware';
import { loginSchema, signupSchema } from '../schemas/authSchema';
import { ZodError, ZodIssue } from 'zod';
import { prisma } from '../config/prisma';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;
const isProduction = process.env.RTE === 'prod';

interface CookieOptions {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'none' | 'lax' | 'strict';
    path: string;
    maxAge: number;
}

const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: 60 * 60 * 1000,
};


//////////////////////////////////////////////////////////////////////////////////
// POST: Login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    // 1) Validate input
    let parsed;
    try {
        parsed = loginSchema.parse(req.body);
    } catch (err: unknown) {
        if (err instanceof ZodError) {
            const errorMessage = err.errors
                .map((issue: ZodIssue) => issue.message)
                .join(', ');
            res.status(400).json({ error: errorMessage });
            return;
        }
        return next(err as Error);
    }

    // 2) Authenticate
    const { email, password } = parsed;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.hashedPassword) {
        res.status(400).json({ error: 'Invalid email or password' });
        return;
    }
    if (user.isDeleted) {
        res.status(403).json({ error: 'Account is deactivated' });
        return;
    }
    if (!(await bcrypt.compare(password, user.hashedPassword))) {
        res.status(400).json({ error: 'Invalid email or password' });
        return;
    }

    // 3) Issue token & set cookie
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.cookie('authToken', token, cookieOptions as CookieOptions);

    // 4) Return user profile
    res.json({
        user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            profilePicture: user.profilePicture,
        },
    });
});

//////////////////////////////////////////////////////////////////////////////////
// POST: Logout
router.post('/logout', (req, res) => {
    res.clearCookie('authToken', cookieOptions as CookieOptions);
    res.json({ message: 'Logged out successfully' });
});

//////////////////////////////////////////////////////////////////////////////////
// GET: Me
router.get('/me', authorize(), async (req: AuthenticatedRequest, res, next) => {
    if (!req.user) {
        res.json(null);
        return;
    }
    const { userId } = req.user;
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, firstName: true, lastName: true, email: true, role: true, isDeleted: true, profilePicture: true },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        if (user.isDeleted) {
            res.status(403).json({ error: 'Account is deactivated' });
            return;
        }
        res.json({ user });
    } catch (err) {
        next(err as Error);
    }
});

//////////////////////////////////////////////////////////////////////////////////
// POST: Signup
router.post('/signup', async (req: Request, res, next) => {
    let parsed;
    try {
        parsed = signupSchema.parse(req.body);
    } catch (err: unknown) {
        if (err instanceof ZodError) {
            const errorMessage = err.errors
                .map((issue: ZodIssue) => issue.message)
                .join(', ');
            res.status(400).json({ error: errorMessage });
            return;
        }
        return next(err as Error);
    }

    const { firstName, lastName, email, password, role } = parsed;
    try {
        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) {
            res.status(409).json({ error: 'Email already in use.' });
            return;
        }

        const hashed = await bcrypt.hash(password, 14);
        const user = await prisma.user.create({
            data: { firstName, lastName, email, hashedPassword: hashed, role },
        });

        res.status(201).json({ user });
    } catch (err) {
        next(err as Error);
    }
});

export default router;