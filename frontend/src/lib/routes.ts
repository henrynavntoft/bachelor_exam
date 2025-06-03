const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export const routes = {
    auth: {
        login: `${API_BASE}/auth/login`,
        logout: `${API_BASE}/auth/logout`,
        me: `${API_BASE}/auth/me`,
        signup: `${API_BASE}/auth/signup`,
        forgotPassword: `${API_BASE}/auth/forgot-password`,
        resetPassword: `${API_BASE}/auth/reset-password`,
        verifyEmail: `${API_BASE}/auth/verify-email`,
        resendVerification: `${API_BASE}/auth/resend-verification`,
    },
    events: {
        all: `${API_BASE}/events`,
        create: `${API_BASE}/events`,
        one: (id: string) => `${API_BASE}/events/${id}`,
        delete: (id: string) => `${API_BASE}/events/${id}`,
        update: (id: string) => `${API_BASE}/events/${id}`,
        attend: (id: string) => `${API_BASE}/events/${id}/attend`,
        cancelAttend: (id: string) => `${API_BASE}/events/${id}/attend`,
        attendees: (id: string) => `${API_BASE}/events/${id}/attendees`,
        userPastEvents: (id: string) => `${API_BASE}/events/users/${id}/past-events`,
    },
    eventImages: {
        all: (eventId: string) => `${API_BASE}/event-images/${eventId}`,
        create: (eventId: string) => `${API_BASE}/event-images/${eventId}`,
        update: (eventId: string, imageId: string) => `${API_BASE}/event-images/${eventId}/${imageId}`,
        delete: (eventId: string, imageId: string) => `${API_BASE}/event-images/${eventId}/${imageId}`,
    },
    users: {
        all: `${API_BASE}/users`,
        one: (id: string) => `${API_BASE}/users/${id}`,
        publicProfile: (id: string) => `${API_BASE}/users/${id}/public`,
        delete: (id: string) => `${API_BASE}/users/${id}`,
        update: (id: string) => `${API_BASE}/users/${id}`,
        updateProfile: (id: string) => `${API_BASE}/users/${id}`,
        ratings: (id: string) => `${API_BASE}/users/${id}/ratings`,
        averageRating: (id: string) => `${API_BASE}/users/${id}/ratings/average`,
        ratingsGiven: (id: string) => `${API_BASE}/users/${id}/ratings/given`,
    },
    upload: {
        upload: (id: string) => `${API_BASE}/upload/${id}`,
        delete: (id: string) => `${API_BASE}/upload/${id}`,
        profile: (id: string) => `${API_BASE}/upload/profile/${id}`,
    },
};