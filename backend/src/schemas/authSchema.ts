import { z } from 'zod';

// Login input validation
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, { message: 'Password is required' }),
});
export type LoginInput = z.infer<typeof loginSchema>;

// Signup input validation
export const signupSchema = z
    .object({
        firstName: z.string().min(1, { message: 'First name is required' }),
        lastName: z.string().min(1, { message: 'Last name is required' }),
        email: z.string().email({ message: 'Invalid email address' }),
        password: z
            .string()
            .min(8, { message: 'Password must be at least 8 characters' })
            .regex(
                /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/,
                { message: 'Password must include upper, lower, digit, and special character' }
            ),
        confirmPassword: z.string(),
        role: z.enum(['GUEST', 'HOST'], { required_error: 'Role is required' }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });
export type SignupInput = z.infer<typeof signupSchema>;