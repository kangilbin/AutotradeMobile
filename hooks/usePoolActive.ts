import { useEffect, useState } from 'react';
import { getPoolSettings } from '../contexts/backEndApi';
import { poolMarketOf } from '../types/pool';

export type PoolStatus = 'loading' | 'on' | 'off' | 'unknown';

/**
 * 이 계좌·시장의 풀(총자산 공유) 상태 — 풀은 스윙을 등록·활성화할 때 서버가 켜 두며 앱에 스위치는 없다.
 * - loading: 조회 중
 * - on / off: 풀 사용 설정
 * - unknown: 조회 실패 — 화면은 '켜짐/꺼짐'을 단정하지 않는다
 */
export function usePoolStatus(accountNo?: string, mrktCode?: string): PoolStatus {
    const [status, setStatus] = useState<PoolStatus>('loading');

    useEffect(() => {
        let alive = true;
        setStatus('loading');
        if (!accountNo) return;
        getPoolSettings(accountNo, true).then(settings => {
            if (!alive) return;
            if (!settings) { setStatus('unknown'); return; }
            const market = poolMarketOf(mrktCode);
            setStatus(settings.some(s => s.MARKET === market && s.USE_YN === 'Y') ? 'on' : 'off');
        });
        return () => { alive = false; };
    }, [accountNo, mrktCode]);

    return status;
}

/** 풀이 켜져 있을 때만 true — 조회 중이거나 실패하면 false (켜짐을 단정하지 않는다) */
export function usePoolActive(accountNo?: string, mrktCode?: string): boolean {
    return usePoolStatus(accountNo, mrktCode) === 'on';
}
