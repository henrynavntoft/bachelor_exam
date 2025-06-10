import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authorize, AuthenticatedRequest } from '../middleware/authMiddleware';
import { forgotPasswordSchema, loginSchema, signupSchema } from '../schemas/authSchema';
import { ZodError, ZodIssue } from 'zod';
import { prisma } from '../config/prisma';
import crypto from 'crypto';
import { emailService } from '../services/emailService';

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
    if (!user.isVerified) {
        res.status(403).json({ error: 'Please verify your email before logging in' });
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

        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { firstName, lastName, email, hashedPassword: hashed, role, isVerified: false },
        });

        // Generate verification token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 3600000); // 24 hours

        // Store verification token
        await prisma.emailVerificationToken.create({
            data: {
                token,
                userId: user.id,
                expiresAt,
            },
        });

        const verificationUrl = `${process.env.CORS_ORIGINS}/verify-email?token=${token}`;

        res.status(201).json({
            user,
            message: 'Account created. Please check your email to verify your account.'
        });

        // Use emailService instead of direct Resend usage
        emailService.sendVerificationEmail(user.email, {
            firstName: user.firstName,
            verificationUrl
        }).then(result => {
            if (result.success) {
                console.log(`✅ Verification email sent to ${user.email}`);
            } else {
                console.error(`❌ Failed to send verification email to ${user.email}:`, result.error);
            }
        });
    } catch (err) {
        next(err as Error);
    }
});

//////////////////////////////////////////////////////////////////////////////////
// POST: Verify Email
router.post('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.body;

    try {
        const verificationToken = await prisma.emailVerificationToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!verificationToken) {
            res.status(400).json({ error: 'Invalid or expired token' });
            return;
        }

        if (verificationToken.expiresAt < new Date()) {
            await prisma.emailVerificationToken.delete({ where: { token } });
            res.status(400).json({ error: 'Token has expired' });
            return;
        }

        // Update user to verified
        await prisma.user.update({
            where: { id: verificationToken.userId },
            data: { isVerified: true },
        });

        // Delete the verification token
        await prisma.emailVerificationToken.delete({
            where: { token },
        });

        res.json({ message: 'Email verified successfully. You can now log in.' });
    } catch (err) {
        next(err as Error);
    }
});

//////////////////////////////////////////////////////////////////////////////////
// POST: Resend Verification Email
router.post('/resend-verification', async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            res.json({ message: 'If an account exists with this email, a new verification link will be sent.' });
            return;
        }

        if (user.isVerified) {
            res.status(400).json({ error: 'This email is already verified' });
            return;
        }

        // Delete any existing verification tokens
        await prisma.emailVerificationToken.deleteMany({
            where: { userId: user.id }
        });

        // Generate new verification token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 3600000); // 24 hours

        // Store verification token
        await prisma.emailVerificationToken.create({
            data: {
                token,
                userId: user.id,
                expiresAt,
            },
        });

        const verificationUrl = `${process.env.CORS_ORIGINS}/verify-email?token=${token}`;

        res.json({ message: 'If an account exists with this email, a new verification link will be sent.' });

        // Use emailService instead of direct Resend usage
        emailService.sendVerificationEmail(user.email, {
            firstName: user.firstName,
            verificationUrl
        }).then(result => {
            if (result.success) {
                console.log(`✅ Verification email resent to ${user.email}`);
            } else {
                console.error(`❌ Failed to resend verification email to ${user.email}:`, result.error);
            }
        });
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

        const resetUrl = `${process.env.CORS_ORIGINS}/reset-password?token=${token}`;

        res.json({ message: 'If an account exists with this email, you will receive password reset instructions.' });

        // Use emailService instead of direct Resend usage
        emailService.sendPasswordResetEmail(user.email, {
            firstName: user.firstName,
            resetUrl
        }).then(result => {
            if (result.success) {
                console.log(`✅ Password reset email sent to ${user.email}`);
            } else {
                console.error(`❌ Failed to send password reset email to ${user.email}:`, result.error);
            }
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

        const hashedPassword = await bcrypt.hash(password, 10);

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