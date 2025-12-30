import { useState, useCallback } from 'react';
import { getSwingList } from '../contexts/backEndApi';
import { SwingItem, SwingSummary } from '../types/swing';

interface UseSwingDataReturn {
    swingList: SwingItem[];
    summary: SwingSummary | null;
    loading: boolean;
    refreshing: boolean;
    loadData: () => Promise<void>;
    onRefresh: () => Promise<void>;
}

/**
 * 스윙 데이터를 관리하는 커스텀 훅
 * @param accountNo 계좌번호
 */
export const useSwingData = (accountNo: string | undefined): UseSwingDataReturn => {
    const [swingList, setSwingList] = useState<SwingItem[]>([]);
    const [summary, setSummary] = useState<SwingSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        if (!accountNo) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const [listData] = await Promise.all([
                getSwingList(accountNo),
                // getSwingSummary()
            ]);

            if (listData) {
                setSwingList(listData);
            }
        } catch (error) {
            console.error('스윙 데이터 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    }, [accountNo]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    return {
        swingList,
        summary,
        loading,
        refreshing,
        loadData,
        onRefresh,
    };
};