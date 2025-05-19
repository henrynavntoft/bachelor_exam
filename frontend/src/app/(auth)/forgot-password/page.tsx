'use client';

import axios from 'axios';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FieldErrors } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from "sonner";
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { routes } from '@/lib/routes';

interface ErrorResponse {
    error: string;
}

const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const form = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: '',
        },
    });

    const onSubmit = async (values: ForgotPasswordFormValues) => {
        try {
            await axios.post(routes.auth.forgotPassword, values);
            toast.success("Password reset instructions have been sent to your email");
            form.reset();
        } catch (err) {
            if (axios.isAxiosError<ErrorResponse>(err)) {
                toast.error(err.response?.data?.error || err.message || "Failed to send reset instructions.");
            } else {
                toast.error("An unknown error occurred.");
            }
        }
    };

    const onInvalidSubmit = (errors: FieldErrors<ForgotPasswordFormValues>) => {
        if (errors.email) {
            form.setFocus('email');
        }
    };

    return (
        <article className="max-w-xl mx-auto mt-10 p-4 sm:p-6 md:p-8">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="flex flex-col gap-4">
                    <h1 className="text-2xl font-bold mb-4 text-center">Forgot Password</h1>
                    <p className="text-center text-muted-foreground mb-4">
                        Enter your email address and well send you instructions to reset your password.
                    </p>

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

                    <Button type="submit" className="w-full mt-2" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin text-brand-foreground" />
                                Sending...
                            </>
                        ) : (
                            'Send Reset Instructions'
                        )}
                    </Button>
                </form>
            </Form>
            <div className="flex flex-col gap-2 mt-4">
                <p className="text-center text-sm text-muted-foreground">
                    Remember your password?{' '}
                    <Link href="/login" className="font-medium text-primary hover:underline">
                        Back to login
                    </Link>
                </p>
            </div>
        </article>
    );
} 