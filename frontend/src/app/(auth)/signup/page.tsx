'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { routes } from '@/lib/routes';
import axiosInstance from '@/lib/axios';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface ErrorResponse {
    error: string;
}

export default function Signup() {
    const router = useRouter();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('GUEST');
    const [error, setError] = useState('');

    const signupMutation = useMutation({
        mutationFn: async () => {
            await axiosInstance.post(
                routes.auth.signup,
                { firstName, lastName, email, password, confirmPassword, role },
                { withCredentials: true }
            );
        },
        onSuccess: () => {
            router.push('/login'); // after signup, redirect to login page
        },
        onError: (err: unknown) => {
            if (axios.isAxiosError<ErrorResponse>(err)) {
                setError(err.response?.data?.error || err.message || 'Signup failed.');
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred.');
            }
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        signupMutation.mutate();
    };

    return (
        <main className="">
            <form
                onSubmit={handleSubmit}
                className="p-4 flex flex-col gap-4"
            >
                <h1 className="text-2xl font-bold text-center">Sign Up</h1>

                {error && <p className="text-red-500 text-center">{error}</p>}

                <Input
                    type="text"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                />
                <Input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                />
                <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <Input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full mb-4 px-3 py-2 border rounded"
                    required
                >
                    <option value="GUEST">Guest</option>
                    <option value="HOST">Host</option>
                </select>
                <Button type="submit" className="w-full" disabled={signupMutation.isPending}>
                    {signupMutation.isPending ? 'Creating Account...' : 'Create Account'}
                </Button>
            </form>
        </main>
    );
}