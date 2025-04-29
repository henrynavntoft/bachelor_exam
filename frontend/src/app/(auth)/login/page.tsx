'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { routes } from '@/lib/routes';
import axios from 'axios';
import axiosInstance from '@/lib/axios';

interface ErrorResponse {
    error: string;
}

export default function LoginPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const loginMutation = useMutation({
        mutationFn: async () => {
            await axiosInstance.post(
                routes.auth.login,
                { email, password },
                { withCredentials: true }
            );

            const me = await axiosInstance.get(routes.auth.me, { withCredentials: true });
            if (!me.data.user) {
                throw new Error('User verification failed');
            }
            return me.data.user;
        },
        onMutate: async () => {
            // Optimistically assume login will succeed
            queryClient.setQueryData(['me'], { email });
        },
        onSuccess: async (user) => {
            queryClient.setQueryData(['me'], user);
            router.push('/');
        },
        onError: (err: unknown) => {
            if (axios.isAxiosError<ErrorResponse>(err)) {
                setError(err.response?.data?.error || err.message || 'Login failed.');
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
        loginMutation.mutate();
    };

    return (
        <main className="">
            <form
                onSubmit={handleSubmit}
                className="p-4"
            >
                <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>

                {error && <p className="text-red-500 mb-4">{error}</p>}

                <input
                    type="email"
                    placeholder="Email"
                    className="w-full mb-3 px-3 py-2 border rounded"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Password"
                    className="w-full mb-4 px-3 py-2 border rounded"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                    disabled={loginMutation.isPending}
                >
                    {loginMutation.isPending ? 'Logging in...' : 'Log in'}
                </button>
            </form>
        </main>
    );
}