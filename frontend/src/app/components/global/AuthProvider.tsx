"use client";

import { AuthProvider as AuthProviderContext } from "@/context/AuthContext";

interface Props {
    children: React.ReactNode;
}

export default function AuthProvider({ children }: Props) {
    return <AuthProviderContext>{children}</AuthProviderContext>;
}