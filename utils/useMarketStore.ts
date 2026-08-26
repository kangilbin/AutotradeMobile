import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { MarketCode, isOverseasMarket } from '../types/market';

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
        set({ mrktCode: code, isOverseas: isOverseasMarket(code) });
        SecureStore.setItemAsync(MARKET_STORAGE_KEY, code);
    },
    loadSavedMarket: async () => {
        const saved = await SecureStore.getItemAsync(MARKET_STORAGE_KEY);
        if (!saved) return;
        // 글로벌 토글은 국내(J)/미국(US) 2단만 사용.
        // 구 저장분(NASD/NAS/NYS/AMS 등 개별 거래소) → 미국 그룹('US')으로 통합
        const code: MarketCode = saved === 'J' ? 'J' : 'US';
        set({ mrktCode: code, isOverseas: isOverseasMarket(code) });
    },
}));