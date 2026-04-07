import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { MarketCode } from '../types/market';

type MarketStore = {
    mrktCode: MarketCode;
    isOverseas: boolean;
    setMrktCode: (code: MarketCode) => void;
    loadSavedMarket: () => Promise<void>;
};

const MARKET_STORAGE_KEY = 'selected_market';

export const useMarketStore = create<MarketStore>((set) => ({
    mrktCode: 'J',
    isOverseas: false,
    setMrktCode: (code) => {
        set({ mrktCode: code, isOverseas: code === 'NASD' });
        SecureStore.setItemAsync(MARKET_STORAGE_KEY, code);
    },
    loadSavedMarket: async () => {
        const saved = await SecureStore.getItemAsync(MARKET_STORAGE_KEY);
        if (saved === 'J' || saved === 'NASD') {
            set({ mrktCode: saved, isOverseas: saved === 'NASD' });
        }
    },
}));
