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
    // 마지막으로 시작한 요청의 순번. 포커스 복귀와 당겨서 새로고침처럼
    // 조회가 겹칠 때, 늦게 도착한 옛 응답이 최신 응답을 덮어쓰는 것을 막는다.
    const latestRequestId = useRef(0);

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

        const requestId = ++latestRequestId.current;
        // 이 요청이 아직 최신인지. 뒤에 더 새 요청이 시작됐으면 이 응답은 버린다.
        const isStale = () => requestId !== latestRequestId.current;

        try {
            if (isInitialLoad.current) {
                setLoading(true);
            }
            const listData = await getSwingList(accountNo, mrktCode);

            if (isStale()) return;

            if (listData) {
                setSwingList(listData.list);
                setSummary(listData.summary);
            }
        } catch (error) {
            console.error('스윙 데이터 로드 실패:', error);
        } finally {
            // return 으로 빠져나와도 finally 는 실행되므로 여기서도 최신 여부를 확인한다.
            // 옛 요청이 로딩을 먼저 끄면 아직 응답 대기 중인 최신 요청이 빈 화면으로 보인다.
            if (!isStale()) {
                setLoading(false);
                isInitialLoad.current = false;
            }
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