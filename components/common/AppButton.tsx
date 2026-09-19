import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    GestureResponderEvent,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    View,
} from 'react-native';
import AppTouchable, { AppTouchableProps } from './AppTouchable';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

/**
 * API 를 호출하는 액션 버튼
 *
 * AppTouchable 위에 "인라인 스피너"를 얹은 것뿐이다.
 * loading 이 true 면 아이콘 자리에 스피너가 돌고, 라벨이 loadingText 로 바뀌며, 버튼이 비활성화된다.
 * 기존 app/account/add.tsx 의 isSubmitting → "검증 중..." 패턴을 일반화했다.
 *
 * onPress 가 Promise 를 반환하면 loading 을 넘기지 않아도 스피너가 자동으로 돈다.
 * 호출부에서 isSubmitting 같은 state 를 따로 만들 필요가 없다.
 *
 * 레이아웃/색은 호출부의 style 을 그대로 얹기 때문에 기존 버튼 디자인이 바뀌지 않는다.
 */

export type AppButtonProps = Omit<AppTouchableProps, 'children' | 'busy'> & {
    title: string;
    /** 진행 중 표시 — 스피너 + 비활성화 */
    loading?: boolean;
    /** 진행 중 라벨 (미지정 시 title 유지) */
    loadingText?: string;
    /** 평상시 라벨 왼쪽에 놓을 아이콘. loading 중에는 스피너로 대체된다 */
    icon?: React.ReactNode;
    textStyle?: StyleProp<TextStyle>;
    /** 스피너 색 (기본 흰색 — 대부분의 액션 버튼이 컬러 배경) */
    spinnerColor?: string;
};

export default function AppButton({
    title,
    loading = false,
    loadingText,
    icon,
    style,
    textStyle,
    spinnerColor = Colors.textWhite,
    disabled = false,
    onPress,
    ...rest
}: AppButtonProps) {
    // onPress 가 Promise 를 반환할 때 스피너를 자동으로 돌리기 위한 내부 상태
    const [autoLoading, setAutoLoading] = useState(false);
    const mountedRef = useRef(true);

    useEffect(() => () => {
        mountedRef.current = false;
    }, []);

    const handlePress = useCallback((event: GestureResponderEvent) => {
        const result = onPress?.(event);

        if (result && typeof (result as Promise<unknown>).then === 'function') {
            setAutoLoading(true);

            const stop = () => {
                // 등록 성공 후 화면을 떠나는 경우가 많아 언마운트 가드가 필요하다
                if (mountedRef.current) setAutoLoading(false);
            };

            // then(stop, stop) 이라 거부돼도 다시 던지지 않는다 (unhandled rejection 방지).
            // 반환한 Promise 는 AppTouchable 의 재진입 차단을 푸는 신호로도 쓰인다.
            return (result as Promise<unknown>).then(stop, stop);
        }

        return result;
    }, [onPress]);

    const isLoading = loading || autoLoading;
    const label = isLoading ? (loadingText ?? title) : title;

    return (
        <AppTouchable
            {...rest}
            onPress={handlePress}
            style={[styles.base, style]}
            disabled={disabled}
            busy={isLoading}
        >
            {isLoading ? (
                <ActivityIndicator size="small" color={spinnerColor} />
            ) : icon ? (
                <View>{icon}</View>
            ) : null}
            <Text style={[styles.text, textStyle]}>{label}</Text>
        </AppTouchable>
    );
}

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        // margin 이 아니라 gap 이라 호출부 style 의 gap 이 그대로 우선한다
        gap: Spacing.sm,
    },
    text: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
        color: Colors.textWhite,
    },
});
