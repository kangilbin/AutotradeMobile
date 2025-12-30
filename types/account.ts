export type AccountStatus = {
    ACCOUNT_ID: number
    ACCOUNT_NO: string
    AUTH_ID: number
    SIMULATION_YN: string
}

export type AccountStore = {
    account: AccountStatus | null;
    setAccount: (account: AccountStatus) => void;
};

export type ChooseAccountRequest = {
    AUTH_ID: number,
    ACCOUNT_NO: string
}