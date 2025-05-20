'use client';

import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FieldErrors } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from "sonner";
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useState } from 'react';
import { Eye, EyeOff, Loader2, Info } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorResponse {
    error: string;
}

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const searchParams = useSearchParams();
    const verificationStatus = searchParams.get('verification');

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (values: LoginFormValues) => {
        try {
            await login(values.email, values.password);
            toast.success("Login successful");
            form.reset();
        } catch (err) {
            if (axios.isAxiosError<ErrorResponse>(err)) {
                toast.error(err.response?.data?.error || err.message || "Login failed.");
            } else {
                toast.error("An unknown error occurred.");
            }
        }
    };

    const onInvalidSubmit = (errors: FieldErrors<LoginFormValues>) => {
        const fieldOrder: (keyof LoginFormValues)[] = ['email', 'password'];
        for (const fieldName of fieldOrder) {
            if (errors[fieldName]) {
                form.setFocus(fieldName);
                break;
            }
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    return (
        <article className="flex items-center justify-center h-full w-full py-8 min-h-[calc(100vh-120px)]">
            <div className="w-full max-w-md px-4">
                {verificationStatus === 'pending' && (
                    <Card className="mb-6 border-amber-200 bg-amber-50">
                        <CardContent className="p-4 flex items-start gap-3">
                            <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div className="text-amber-800 text-sm">
                                Please check your email to verify your account before logging in.{' '}
                                <Link href="/verify-email" className="font-medium underline">
                                    Need a new verification link?
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="flex flex-col gap-4">
                        <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
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
                                                placeholder="Password"
                                                {...field}
                                                className="pr-10" // Padding for the icon button
                                            />
                                        </FormControl>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={togglePasswordVisibility}
                                            className="absolute inset-y-0 right-0 flex items-center justify-center h-full px-3 text-muted-foreground hover:text-primary"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full mt-2" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-brand-foreground" />
                                    Logging in...
                                </>
                            ) : (
                                'Log in'
                            )}
                        </Button>
                    </form>
                </Form>
                <div className="flex flex-col gap-2 mt-4">
                    <p className="text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <Link href="/signup" className="font-medium text-primary hover:underline">
                            Sign up
                        </Link>
                    </p>
                    <p className="text-center text-sm text-muted-foreground">
                        <Link
                            href="/forgot-password"
                            className="font-medium text-primary hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </p>
                </div>
            </div>
        </article>
    );
}