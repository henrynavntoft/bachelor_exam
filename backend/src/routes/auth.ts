import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/authMiddleware';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not defined.');
}

const isProduction = process.env.NODE_ENV === 'production';

// Login
router.post('/login', (req: Request, res: Response, next: NextFunction) => {
    (async () => {
        const { email, password } = req.body;

        try {
            if (!email || !password) {
                res.status(400).json({ error: 'Email and password are required' });
                return;
            }

            const user = await prisma.user.findUnique({ where: { email } });
            if (!user || !user.hashedPassword) {
                res.status(400).json({ error: 'Invalid email or password' });
                return;
            }

            const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
            if (!passwordMatch) {
                res.status(400).json({ error: 'Invalid email or password' });
                return;
            }

            const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET!, {
                expiresIn: '1h',
            });

            res.cookie('authToken', token, {
                httpOnly: true,
                secure: isProduction,
                maxAge: 3600000,
                sameSite: isProduction ? 'none' : 'lax',
                path: '/',
            });

            res.json({
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                },
            });
        } catch (error) {
            console.error('Login error:', error);
            next(error);
        }
    })();
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
    try {
        res.clearCookie('authToken', {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            path: '/',
        });
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed. Please try again.' });
    }
});

// Get user details
router.get('/me', authenticateJWT(), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    (async () => {
        if (!req.user) {
            res.status(200).json(null);
            return;
        }

        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user.userId },
                select: { id: true, firstName: true, lastName: true, email: true, role: true },
            });

            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            res.json({ user });
        } catch (error) {
            console.error('Fetch user error:', error);
            next(error);
        }
    })();
});

// Create a new user (Signup)
router.post('/signup', (async (req: Request, res: Response) => {
    const { firstName, lastName, email, password, confirmPassword, role } = req.body;

    // Input validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        return res.status(400).json({ error: "All fields are required." });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        return res.status(400).json({ error: "Invalid email format." });
    }

    const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordPattern.test(password)) {
        return res.status(400).json({
            error: "Password must be at least 8 characters long, include uppercase, lowercase, digit, and special character.",
        });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match." });
    }

    const validRoles = ['GUEST', 'HOST'];
    if (!role || !validRoles.includes(role)) {
        return res.status(400).json({ error: "Role must be either 'GUEST' or 'HOST'." });
    }

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: "Email already in use." });
        }

        const saltRounds = 14;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                hashedPassword,
                role
            },
        });

        res.status(201).json({ message: "User created successfully.", user });
    } catch (error) {
        console.error("Error creating user:", error);
        if (error instanceof Error && 'code' in error && error.code === "P2002") {
            return res.status(409).json({ error: "Email already in use." });
        }
        res.status(500).json({ error: "Failed to create user. Please try again." });
    }
}) as RequestHandler);

export default router;