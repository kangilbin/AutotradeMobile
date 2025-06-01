import { create } from 'zustand';
import {AccountStore} from "../types/account";

export const useAccountStore = create<AccountStore>((set) => ({
    account: null,
    setAccount: (account) => set({ account }),
}));