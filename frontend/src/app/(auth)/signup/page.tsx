'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import axios from 'axios'; // Keep for isAxiosError type guard
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FieldErrors } from 'react-hook-form';
import { toast } from "sonner";
import Link from 'next/link';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Eye, EyeOff, Loader2, UserRound, Users } from 'lucide-react';

import { routes } from '@/lib/routes'; // Assuming this contains your API routes
import axiosInstance from '@/lib/axios'; // Your configured axios instance

interface ErrorResponse {
    error: string;
}

const signupSchema = z.object({
    firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
    lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
    email: z.string().email("Invalid email address"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character (e.g., !@#$%^&*)"),
    confirmPassword: z.string(),
    role: z.enum(['GUEST', 'HOST'], { required_error: "Please select a role" }),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // Show error on confirmPassword field
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: "GUEST",
        },
    });

    const signupMutation = useMutation<void, Error, SignupFormValues>({
        mutationFn: async (data) => {
            await axiosInstance.post(
                routes.auth.signup,
                data,
                {
                    withCredentials: true
                }
            );
        },
        onSuccess: () => {
            toast.success("Account created! Please check your email to verify your account.");
            form.reset();
            router.push('/login?verification=pending');
        },
        onError: (err: unknown) => {
            if (axios.isAxiosError<ErrorResponse>(err)) {
                toast.error(err.response?.data?.error || err.message || 'Signup failed. Please try again.');
            } else if (err instanceof Error) {
                toast.error(err.message);
            } else {
                toast.error('An unknown error occurred during signup.');
            }
        },
    });

    const handleValidSubmit = (values: SignupFormValues) => {
        signupMutation.mutate(values);
    };

    const handleInvalidSubmit = (errors: FieldErrors<SignupFormValues>) => {
        const fieldOrder: (keyof SignupFormValues)[] = ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'role'];
        for (const fieldName of fieldOrder) {
            if (errors[fieldName]) {
                form.setFocus(fieldName);
                break;
            }
        }
    };

    return (
        <div className="flex items-center justify-center h-full w-full py-8 min-h-[calc(100vh-120px)]">
            <div className="w-full max-w-md px-4">
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleValidSubmit, handleInvalidSubmit)}
                        className="flex flex-col gap-4"
                    >
                        <h1 className="text-2xl font-bold mb-4 text-center">Create an Account</h1>
                        <div className="flex flex-row gap-4 w-full">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>First Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Last Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="your@email.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <div className="relative">
                                        <FormControl>
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                {...field}
                                                className="pr-10"
                                            />
                                        </FormControl>
                                        <Button
                                            type="button" variant="ghost" size="icon"
                                            onClick={() => setShowPassword(prev => !prev)}
                                            className="absolute inset-y-0 right-0 h-full px-3 flex items-center text-muted-foreground hover:text-primary"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <div className="relative">
                                        <FormControl>
                                            <Input
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                {...field}
                                                className="pr-10"
                                            />
                                        </FormControl>
                                        <Button
                                            type="button" variant="ghost" size="icon"
                                            onClick={() => setShowConfirmPassword(prev => !prev)}
                                            className="absolute inset-y-0 right-0 h-full px-3 flex items-center text-muted-foreground hover:text-primary"
                                            aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <FormControl>
                                        <div className="flex gap-3 w-full">
                                            <Button
                                                type="button"
                                                onClick={() => field.onChange("GUEST")}
                                                variant="outline"
                                                className={`flex-1 gap-2 ${field.value === "GUEST" ? "border-2 border-brand" : ""}`}
                                            >
                                                <UserRound size={18} />
                                                Guest
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={() => field.onChange("HOST")}
                                                variant="outline"
                                                className={`flex-1 gap-2 ${field.value === "HOST" ? "border-2 border-brand" : ""}`}
                                            >
                                                <Users size={18} />
                                                Host
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full mt-2" disabled={signupMutation.isPending}>
                            {signupMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </Button>

                        <p className="text-sm text-muted-foreground text-center mt-2">
                            By creating an account, you will receive a verification email.
                            Please verify your email before logging in.
                        </p>
                    </form>
                </Form>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-primary hover:underline">
                        Log in
                    </Link>
                </div>
            </div>
        </div>
    );
}