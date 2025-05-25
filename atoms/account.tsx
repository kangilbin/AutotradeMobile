import { atom } from "recoil";
import {AccountStatus} from "../contexts/backEndApi";

export const accountAtom = atom<AccountStatus>({
    key: 'account',
    default: null,
});