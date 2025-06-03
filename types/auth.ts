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
    USER_NAME?: string;
    PHONE?: string;
};
