'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';
import { routes } from '@/lib/routes';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'HOST' | 'GUEST';
}

interface AuthContextProps {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axiosInstance.get(routes.auth.me, { withCredentials: true });
                setUser(res.data.user);
            } catch {
                setUser(null);
            } finally {
                setIsLoading(false); // 🛑 SET loading to false
            }
        };
        fetchUser();
    }, []);

    const login = async (email: string, password: string) => {
        await axiosInstance.post(routes.auth.login, { email, password }, { withCredentials: true });
        const res = await axiosInstance.get(routes.auth.me, { withCredentials: true });
        setUser(res.data.user);

        if (res.data.user.role === 'ADMIN') {
            router.push('/dashboard');
        } else {
            router.push('/profile');
        }
    };

    const logout = async () => {
        await axiosInstance.post(routes.auth.logout, {}, { withCredentials: true });
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return {
        ...context,
        isAdmin: context.user?.role === 'ADMIN',
        isHost: context.user?.role === 'HOST',
        isGuest: context.user?.role === 'GUEST',
    };
}