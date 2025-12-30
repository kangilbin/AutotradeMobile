import { useState, useEffect, useCallback, useRef } from 'react';
import { searchStock } from '../contexts/backEndApi';
import { StockStatus } from '../types/stock';

interface UseStockSearchReturn {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    stocks: StockStatus[];
    isSearching: boolean;
}

/**
 * 주식 검색을 위한 커스텀 훅 (디바운스 적용)
 * @param debounceMs 디바운스 시간 (ms)
 */
export const useStockSearch = (debounceMs: number = 300): UseStockSearchReturn => {
    const [searchQuery, setSearchQuery] = useState('');
    const [stocks, setStocks] = useState<StockStatus[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const fetchStocks = useCallback(async (query: string) => {
        if (!query.trim()) {
            setStocks([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await searchStock(query);
            setStocks(response || []);
        } catch (error) {
            console.error('주식 검색 실패:', error);
            setStocks([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        // 이전 타이머 클리어
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // 새 타이머 설정 (디바운스)
        debounceRef.current = setTimeout(() => {
            fetchStocks(searchQuery);
        }, debounceMs);

        // 클린업
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [searchQuery, debounceMs, fetchStocks]);

    return {
        searchQuery,
        setSearchQuery,
        stocks,
        isSearching,
    };
};