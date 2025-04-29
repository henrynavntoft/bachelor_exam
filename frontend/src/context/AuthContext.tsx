'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { routes } from '@/lib/routes';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    email: string;
    name: string;
}

interface AuthContextProps {
    user: User;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const router = useRouter();

    const { data: user } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const res = await axiosInstance.get(routes.auth.me, { withCredentials: true });
            return res.data.user;
        },
    });

    const login = async (email: string, password: string) => {
        await axiosInstance.post(routes.auth.login, { email, password }, { withCredentials: true });
        await queryClient.invalidateQueries({ queryKey: ['me'] });
        router.push('/');
    };

    const logout = async () => {
        await axiosInstance.post(routes.auth.logout, {}, { withCredentials: true });
        queryClient.setQueryData(['me'], null);
        queryClient.invalidateQueries({ queryKey: ['me'] });
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// easy hook
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}