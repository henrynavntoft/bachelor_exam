'use client';

import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ErrorResponse {
    error: string;
}

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
        } catch (err) {
            if (axios.isAxiosError<ErrorResponse>(err)) {
                setError(err.response?.data?.error || err.message || 'Login failed.');
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred.');
            }
        }
    };

    return (
        <main>
            <form
                onSubmit={handleSubmit}
                className="p-4 flex flex-col gap-4"
            >
                <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>

                {error && <p className="text-red-500 mb-4">{error}</p>}

                <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    required
                />

                <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    required
                />

                <Button
                    type="submit"
                    className="w-full"
                    disabled={false}
                >
                    Log in
                </Button>
            </form>
        </main>
    );
}