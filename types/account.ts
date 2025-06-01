export type AccountStatus = {
    ACCOUNT_ID: number
    ACCOUNT_NO: string
    AUTH_ID: string
    SIMULATION_YN: string
}

export type AccountResponse = {
    data: AccountStatus[];
}

export type AccountStore = {
    account: AccountStatus | null;
    setAccount: (account: AccountStatus) => void;
};