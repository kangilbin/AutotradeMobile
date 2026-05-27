import { useState, useCallback, useRef } from 'react';
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
export const useSwingData = (accountNo: string | undefined, mrktCode: string = 'J'): UseSwingDataReturn => {
    const [swingList, setSwingList] = useState<SwingItem[]>([]);
    const [summary, setSummary] = useState<SwingSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dataMrktCode, setDataMrktCode] = useState(mrktCode);
    const isInitialLoad = useRef(true);

    // 마켓이 바뀌면 이전 마켓 데이터가 새 마켓 포맷으로 잠깐 렌더링되는 것을 막기 위해 즉시 초기화
    if (dataMrktCode !== mrktCode) {
        setDataMrktCode(mrktCode);
        setSwingList([]);
        setSummary(null);
        setLoading(true);
    }

    const loadData = useCallback(async () => {
        if (!accountNo) {
            setLoading(false);
            return;
        }

        try {
            if (isInitialLoad.current) {
                setLoading(true);
            }
            const listData = await getSwingList(accountNo, mrktCode);

            if (listData) {
                setSwingList(listData.list);
                setSummary(listData.summary);
            }
        } catch (error) {
            console.error('스윙 데이터 로드 실패:', error);
        } finally {
            setLoading(false);
            isInitialLoad.current = false;
        }
    }, [accountNo, mrktCode]);

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