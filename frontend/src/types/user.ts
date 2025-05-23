export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isDeleted?: boolean;
    profilePicture?: string;
} 