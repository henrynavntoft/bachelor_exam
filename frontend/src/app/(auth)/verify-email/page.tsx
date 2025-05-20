'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { routes } from '@/lib/routes';
import Link from 'next/link';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [email, setEmail] = useState<string>('');
    const hasAttemptedVerification = useRef(false);

    const verifyMutation = useMutation({
        mutationFn: async () => {
            if (!token) throw new Error('No verification token provided');
            try {
                const response = await axiosInstance.post(routes.auth.verifyEmail, { token });
                return response.data;
            } catch (error) {
                console.error('Verification error details:', error);
                throw error;
            }
        },
        onSuccess: () => {
            setStatus('success');
            toast.success('Email verified successfully! You can now log in.');
        },
        onError: (err) => {
            setStatus('error');
            toast.error('Failed to verify email. The link may be invalid or expired.');
            console.error('Verification error:', err);
        }
    });

    const resendMutation = useMutation({
        mutationFn: async () => {
            if (!email) throw new Error('No email provided');
            try {
                const response = await axiosInstance.post(routes.auth.resendVerification, { email });
                return response.data;
            } catch (error) {
                console.error('Resend verification error details:', error);
                throw error;
            }
        },
        onSuccess: () => {
            toast.success('Verification email has been resent. Please check your inbox.');
        },
        onError: (err) => {
            toast.error('Failed to resend verification email.');
            console.error('Resend verification error:', err);
        }
    });

    useEffect(() => {
        if (token && !hasAttemptedVerification.current) {
            hasAttemptedVerification.current = true;
            verifyMutation.mutate();
        } else if (!token && status === 'loading') {
            setStatus('error');
        }
    }, [token, status, verifyMutation]);

    const handleResendVerification = () => {
        if (email) {
            resendMutation.mutate();
        } else {
            toast.error('Please enter your email address.');
        }
    };

    return (
        <article className="flex items-center justify-center h-full w-full py-8 min-h-[calc(100vh-120px)]">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl text-brand">Email Verification</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center gap-6 pt-6">
                    {status === 'loading' && (
                        <>
                            <Loader2 className="h-16 w-16 text-brand animate-spin" />
                            <CardDescription className="text-base">
                                Verifying your email address...
                            </CardDescription>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <CheckCircle className="h-16 w-16 text-green-500" />
                            <CardDescription className="text-base">
                                Your email has been verified successfully! You can now log in to your account.
                            </CardDescription>
                        </>
                    )}

                    {status === 'error' && !token && (
                        <>
                            <AlertCircle className="h-16 w-16 text-amber-500" />
                            <CardDescription className="text-base">
                                No verification token was provided. If you need to verify your email, please check the link in your email or request a new verification link.
                            </CardDescription>
                            <div className="w-full mt-2 space-y-4">
                                <Input
                                    type="email"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <Button
                                    onClick={handleResendVerification}
                                    disabled={resendMutation.isPending}
                                    className="w-full bg-brand hover:bg-brand/90"
                                >
                                    {resendMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Resend Verification Email'
                                    )}
                                </Button>
                            </div>
                        </>
                    )}

                    {status === 'error' && token && (
                        <>
                            <AlertCircle className="h-16 w-16 text-red-500" />
                            <CardDescription className="text-base">
                                The verification link is invalid or has expired. Please request a new verification link.
                            </CardDescription>
                            <div className="w-full mt-2 space-y-4">
                                <Input
                                    type="email"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <Button
                                    onClick={handleResendVerification}
                                    disabled={resendMutation.isPending}
                                    className="w-full bg-brand hover:bg-brand/90"
                                >
                                    {resendMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Resend Verification Email'
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center pt-2 pb-6">
                    {status === 'success' && (
                        <Button asChild className="bg-brand hover:bg-brand/90">
                            <Link href="/login">Go to Login</Link>
                        </Button>
                    )}
                    {status !== 'success' && status !== 'loading' && (
                        <Button asChild variant="outline">
                            <Link href="/login">Back to Login</Link>
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </article>
    );
} 