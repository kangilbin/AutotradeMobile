import React, { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';
import LoadingIndicator from './LoadingIndicator';
import { useApiLoading } from '../contexts/backEndApi';

/**
 * 전역 API 로딩 오버레이
 *
 * 루트 레이아웃에 한 번만 배치하면 모든 화면이 자동으로 커버된다.
 * 쓰기 요청(POST/PUT/PATCH/DELETE)이 진행 중일 때만 뜬다 — 판단 로직은 backEndApi 의 어댑터에 있다.
 *
 * 지연 표시: 250ms 안에 끝나는 빠른 요청은 아예 띄우지 않는다.
 * 안 그러면 응답이 빠른 환경에서 화면이 번쩍이기만 하고 더 거슬린다.
 */

const SHOW_DELAY_MS = 250;

export default function ApiLoadingOverlay() {
    const loading = useApiLoading();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!loading) {
            setVisible(false);
            return;
        }

        const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
        // 250ms 안에 loading 이 false 가 되면 타이머가 취소되어 오버레이는 뜨지 않는다
        return () => clearTimeout(timer);
    }, [loading]);

    // 오버레이가 떠 있는 동안 Android 하드웨어 뒤로가기 차단
    // (요청 진행 중에 화면을 벗어나면 결과 알럿이 엉뚱한 화면에서 뜬다)
    useEffect(() => {
        if (!visible) return;
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
        return () => subscription.remove();
    }, [visible]);

    if (!visible) return null;

    return <LoadingIndicator />;
}
