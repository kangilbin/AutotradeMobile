import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { searchStock } from '../contexts/backEndApi';
import { StockStatus } from '../types/stock';

interface UseStockSearchReturn {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    stocks: StockStatus[];
    isSearching: boolean;
    /** 현재 stocks 를 만들어낸 검색어. 입력 중인 searchQuery 와 달라질 수 있다. */
    matchedQuery: string;
}

/**
 * 주식 검색을 위한 커스텀 훅 (디바운스 적용)
 * @param debounceMs 디바운스 시간 (ms)
 */
export const useStockSearch = (debounceMs: number = 300, mrktCode: string = 'J'): UseStockSearchReturn => {
    const [searchQuery, setSearchQuery] = useState('');
    const [stocks, setStocks] = useState<StockStatus[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    // 결과와 짝이 맞는 검색어. 디바운스 때문에 입력값이 먼저 앞서가므로,
    // 하이라이트는 '입력 중인 글자'가 아니라 '결과를 만든 글자'를 기준으로 그려야 한다.
    const [matchedQuery, setMatchedQuery] = useState('');
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    // 마지막으로 시작한 요청 순번. 디바운스는 '아직 안 나간 타이머'만 취소할 뿐,
    // 이미 나간 요청은 취소하지 못한다. 느린 옛 응답이 최신 결과를 덮는 것을 막는다.
    const latestRequestId = useRef(0);
    // 실제로 조회를 마친 조건('시장|검색어'). 포커스 복귀 때 같은 조건을 다시 쏘지 않기 위한 표식.
    const searchedKey = useRef<string | null>(null);

    // 검색 화면은 탭이라 언마운트되지 않는다. 포커스 상태를 상태값으로 들고 있어야
    // 다른 탭에서 시장을 토글할 때 보이지 않는 이 화면이 검색 API 를 쏘는 일이 없고,
    // 복귀 시점에는 effect 가 다시 돌아 밀린 검색을 이어받을 수 있다.
    const [isFocused, setIsFocused] = useState(true);
    useFocusEffect(
        useCallback(() => {
            setIsFocused(true);
            return () => setIsFocused(false);
        }, [])
    );

    // 마켓 전환 시 이전 시장의 검색 결과는 무효 → 비운다(재검색은 아래 effect 담당)
    useEffect(() => {
        // 이전 시장으로 이미 날아간 요청도 무효화한다. 비우기만 하면 늦게 도착한 옛 응답이
        // 새 시장 화면에 이전 시장 종목을 다시 채워 넣는다.
        // 무효화한 요청은 finally 에서 스피너를 끄지 못하므로(isStale) 여기서 직접 끈다.
        latestRequestId.current++;
        setStocks([]);
        setMatchedQuery('');
        setIsSearching(false);
    }, [mrktCode]);

    /** 성공 시 true. 실패한 검색을 '조회 완료'로 기록하면 재시도가 막히므로 결과를 돌려준다. */
    const fetchStocks = useCallback(async (query: string): Promise<boolean> => {
        if (!query.trim()) {
            // 검색창을 비운 순간, 아직 응답이 안 온 요청도 함께 무효화한다.
            // 안 그러면 빈 검색창 위로 옛 결과가 되돌아와 그대로 굳는다
            // (searchedKey 는 이미 '조회 완료'라 effect 가 바로잡아 주지 못한다).
            // 무효화한 요청은 finally 에서 스피너를 끄지 못하므로(isStale) 여기서 직접 끈다.
            latestRequestId.current++;
            setStocks([]);
            setMatchedQuery('');
            setIsSearching(false);
            return true;
        }

        const requestId = ++latestRequestId.current;
        const isStale = () => requestId !== latestRequestId.current;

        setIsSearching(true);
        try {
            const response = await searchStock(query, mrktCode);
            if (isStale()) return false;

            // searchStock 은 실패해도 예외를 던지지 않고 handleApiError 를 거쳐 undefined 를
            // 돌려준다. 그래서 실패 판정은 아래 catch 가 아니라 여기서 해야 한다.
            // (여기서 true 를 반환하면 실패한 검색이 '조회 완료'로 기록돼 재시도가 막힌다)
            if (response === undefined) {
                setStocks([]);
                setMatchedQuery('');
                return false;
            }

            setStocks(response);
            // 결과와 같은 렌더에서 검색어도 함께 갱신 → 강조 구간이 결과와 어긋나지 않는다
            setMatchedQuery(query.trim());
            return true;
        } catch (error) {
            console.error('주식 검색 실패:', error);
            if (!isStale()) {
                setStocks([]);
                setMatchedQuery('');
            }
            return false;
        } finally {
            // 옛 요청이 먼저 끝났다고 스피너를 끄면, 대기 중인 최신 검색이 '결과 없음'으로 보인다.
            if (!isStale()) setIsSearching(false);
        }
    }, [mrktCode]);

    useEffect(() => {
        // 백그라운드에서는 검색하지 않는다. 복귀하면 이 effect 가 다시 돌면서 이어받는다.
        if (!isFocused) return;

        const key = `${mrktCode}|${searchQuery.trim()}`;
        // 이미 이 조건으로 조회를 마쳤다 → 탭 왕복만으로 재검색되지 않도록 무동작
        if (searchedKey.current === key) return;

        // 이전 타이머 클리어
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // 새 타이머 설정 (디바운스)
        debounceRef.current = setTimeout(async () => {
            const succeeded = await fetchStocks(searchQuery);
            searchedKey.current = succeeded ? key : null;
        }, debounceMs);

        // 클린업
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [searchQuery, debounceMs, fetchStocks, mrktCode, isFocused]);

    return {
        searchQuery,
        setSearchQuery,
        stocks,
        isSearching,
        matchedQuery,
    };
};