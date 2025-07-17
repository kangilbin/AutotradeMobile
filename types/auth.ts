export type LoginResponse = {
    access_token: string;
    refresh_token?: string;
};
export type LoginRequest = {
    USER_ID: string;
    PASSWORD: string;
}

export type SignupRequest = {
    USER_ID: string;
    PASSWORD: string;
    USER_NAME?: string;
    PHONE?: string;
    confirmPassword?: string;
}

export type AuthStatus = {
    AUTH_ID: number
    AUTH_NAME: string
}

export type AddAuthRequest = {
    SIMULATION_YN: string
    AUTH_NAME: string
    API_KEY: string
    SECRET_KEY: string
}

export type JwtPayload = {
    sub?: string;
    aud?: string;
    exp?: number;
    iat?: number;
    user_claims?: {
        PHONE?: string;
        USER_NAME?: string;
    };
};
