import { z } from 'zod';
import { Role } from '@/lib/types/role'; // Corrected import path for Role enum

// --- Base Schemas ---
export const emailSchema = z.string().email("Invalid email address");

export const passwordSchema = z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character (e.g., !@#$%^&*)");

// --- Specific Auth Schemas ---

export const forgotPasswordSchema = z.object({
    email: emailSchema,
});

export const loginSchema = z.object({
    email: emailSchema,
    password: passwordSchema, // Use the base password schema
});

export const resetPasswordSchema = z.object({
    password: passwordSchema,
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don\'t match",
    path: ["confirmPassword"],
});

export const signupSchema = z.object({
    firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
    lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    role: z.nativeEnum(Role, { required_error: "Please select a role" }), // Use nativeEnum for TS enums
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

// --- Inferred Types ---
// (Useful if you want to use these types directly without re-inferring in each file)

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>; 