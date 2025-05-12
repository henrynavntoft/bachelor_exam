import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authorize, AuthenticatedRequest } from '../middleware/authMiddleware';
import { forgotPasswordSchema, loginSchema, signupSchema } from '../schemas/authSchema';
import { ZodError, ZodIssue } from 'zod';
import { prisma } from '../config/prisma';
import crypto from 'crypto';
import { Resend } from 'resend';

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

//////////////////////////////////////////////////////////////////////////////////
// POST: Forgot Password
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
    let parsed;
    try {
        parsed = forgotPasswordSchema.parse(req.body);
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

    const { email } = parsed;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            res.json({ message: 'If an account exists with this email, you will receive password reset instructions.' });
            return;
        }

        // Generate token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        // Store token
        await prisma.passwordResetToken.create({
            data: {
                token,
                userId: user.id,
                expiresAt,
            },
        });

        const resend = new Resend(process.env.RESEND_API_KEY);

        const resetUrl = `${process.env.CORS_ORIGINS}/reset-password?token=${token}`;

        res.json({ message: 'If an account exists with this email, you will receive password reset instructions.' });

        resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL!,
            to: user.email,
            subject: 'Password Reset Request',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        .email-container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 30px;
                        }
                        .content {
                            background: #f9f9f9;
                            padding: 30px;
                            border-radius: 8px;
                            margin-bottom: 20px;
                        }
                        .button {
                            display: inline-block;
                            padding: 12px 24px;
                            background-color: #1A6258;
                            color: white;
                            text-decoration: none;
                            border-radius: 6px;
                            font-weight: 500;
                            margin: 20px 0;
                        }
                        .button:hover {
                            opacity: 0.9;
                        }
                        .footer {
                            text-align: center;
                            font-size: 14px;
                            color: #666;
                            margin-top: 30px;
                        }
                        .divider {
                            height: 1px;
                            background-color: #eaeaea;
                            margin: 20px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <div class="header">
                            <h1 style="color: #1A6258; margin: 0;">Password Reset Request</h1>
                        </div>
                        <div class="content">
                            <p style="font-size: 14px; color: #666;">Hello,</p>
                            <p style="font-size: 14px; color: #666;">We received a request to reset your password. To proceed with the password reset, click the button below:</p>
                            
                            <div style="text-align: center;">
                                <a style="text-decoration: none; color: white;" href="${resetUrl}" class="button">Reset Password</a>
                            </div>
                            
                            <div class="divider"></div>
                            
                            <p style="font-size: 14px; color: #666;">
                                If you didn't request this password reset, you can safely ignore this email. The link will expire in 1 hour.
                            </p>
                        </div>
                        <div class="footer">
                            <p>This is an automated message, please do not reply to this email.</p>
                            <p style="color: #1A6258;">© 2024 Meet & Greet | Culture Connect. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        }).then(() => {
            console.log(`✅ Password reset email sent to ${user.email}`);
        }).catch((err) => {
            console.error(`❌ Failed to send password reset email to ${user.email}:`, err);
        });
    } catch (err) {
        next(err as Error);
    }
});

//////////////////////////////////////////////////////////////////////////////////
// POST: Reset Password
router.post('/reset-password', async (req: Request, res: Response, next: NextFunction) => {
    const { token, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        res.status(400).json({ error: 'Passwords do not match' });
        return;
    }

    try {
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!resetToken) {
            res.status(400).json({ error: 'Invalid or expired token' });
            return;
        }

        if (resetToken.expiresAt < new Date()) {
            await prisma.passwordResetToken.delete({ where: { token } });
            res.status(400).json({ error: 'Token has expired' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 14);

        await prisma.user.update({
            where: { id: resetToken.userId },
            data: { hashedPassword },
        });

        await prisma.passwordResetToken.delete({
            where: { token },
        });

        res.json({ message: 'Password has been reset successfully' });
    } catch (err) {
        next(err as Error);
    }
});

export default router;