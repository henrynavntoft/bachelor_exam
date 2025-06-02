import { Role } from './role';

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: Role;
    profilePicture?: string | null;
    isVerified?: boolean;
    isDeleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
} 