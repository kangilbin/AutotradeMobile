export type LoginResponse = {
    access_token: string;
    refresh_token?: string;
};
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

export type GoogleLoginRequest = {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
};

export type GoogleTokenRefreshRequest = {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
};
