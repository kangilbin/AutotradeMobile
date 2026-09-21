import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Pressable,
    PressableProps,
    StyleProp,
    ViewStyle,
    GestureResponderEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * 앱 전체 공통 터치 컴포넌트
 *
 * TouchableOpacity 를 대체한다. 세 가지 문제를 한 번에 해결한다.
 *  1) 눌림 피드백 — opacity + scale + Android ripple 로 "눌렸다"를 확실히 보여준다
 *  2) 연타 차단(동기) — cooldownMs 동안 후속 탭을 무시한다
 *  3) 연타 차단(비동기) — onPress 가 Promise 를 반환하면 완료될 때까지 재진입을 막고 비활성 처리한다
 */

type PressResult = void | Promise<unknown>;

export type AppTouchableProps = Omit<PressableProps, 'style' | 'onPress'> & {
    style?: StyleProp<ViewStyle>;
    /** Promise 를 반환하면 완료 시점까지 자동으로 재진입이 차단된다 */
    onPress?: (event: GestureResponderEvent) => PressResult;
    /** 눌렸을 때 투명도 (기본 0.6 — TouchableOpacity 기본 0.2 보다 눈에 띈다) */
    pressedOpacity?: number;
    /** 눌렸을 때 축소 배율 (0 또는 1 이면 축소 안 함) */
    pressedScale?: number;
    /** 동기 핸들러 연타 차단 시간(ms) */
    cooldownMs?: number;
    /** 외부에서 주입하는 로딩 상태 — true 면 비활성 */
    busy?: boolean;
    /** 비활성 상태 투명도 (호출부에 자체 disabled 스타일이 있으면 맞춰서 조정) */
    disabledOpacity?: number;
    /** 터치 시 햅틱 피드백 */
    haptic?: boolean;
    /** Android ripple 사용 여부 */
    ripple?: boolean;
    rippleColor?: string;
};

const DEFAULT_COOLDOWN_MS = 400;

export default function AppTouchable({
    style,
    onPress,
    disabled = false,
    pressedOpacity = 0.6,
    pressedScale = 0.98,
    cooldownMs = DEFAULT_COOLDOWN_MS,
    busy = false,
    disabledOpacity = 0.5,
    haptic = true,
    ripple = true,
    rippleColor = 'rgba(0, 0, 0, 0.08)',
    children,
    ...rest
}: AppTouchableProps) {
    // 비동기 핸들러 진행 여부. ref 는 즉시 반영(연타 차단용), state 는 화면 갱신(비활성 표시용)
    const inFlightRef = useRef(false);
    const [pending, setPending] = useState(false);
    const lastPressAtRef = useRef(0);
    const mountedRef = useRef(true);

    useEffect(() => () => {
        mountedRef.current = false;
    }, []);

    const isBlocked = disabled || busy || pending;

    // handlePress 는 useCallback 으로 묶여 있어 isBlocked 를 직접 읽으면 오래된 값을 볼 수 있다
    const disabledRef = useRef(isBlocked);
    disabledRef.current = isBlocked;

    const handlePress = useCallback((event: GestureResponderEvent) => {
        if (!onPress) return;

        // 0) 비활성 상태에서도 Pressable 자체는 살아 있다(아래 주석 참고). 여기서 삼킨다.
        if (disabledRef.current) return;

        // 1) 비동기 작업이 아직 끝나지 않았으면 무시
        if (inFlightRef.current) return;

        // 2) 쿨다운 — 동기 핸들러(화면 이동, 탭 전환 등) 연타 차단
        const now = Date.now();
        if (now - lastPressAtRef.current < cooldownMs) return;
        lastPressAtRef.current = now;

        if (haptic) {
            // 햅틱 실패(미지원 기기 등)가 터치 자체를 막으면 안 된다
            Haptics.selectionAsync().catch(() => {});
        }

        const result = onPress(event);

        // 3) Promise 를 반환했다면 완료될 때까지 잠금
        if (result && typeof (result as Promise<unknown>).then === 'function') {
            inFlightRef.current = true;
            setPending(true);

            const release = () => {
                inFlightRef.current = false;
                // 언마운트 후 setState 경고 방지
                if (mountedRef.current) setPending(false);
            };

            // finally 가 아니라 then(release, release) 인 이유:
            // finally 는 거부를 다시 던져서 아무도 받지 않는 unhandled rejection 을 만든다.
            // 여기서 흡수해야 핸들러가 throw 해도 버튼이 영구 잠김 상태로 남지 않는다.
            (result as Promise<unknown>).then(release, release);
        }
    }, [onPress, cooldownMs, haptic]);

    return (
        <Pressable
            {...rest}
            // 일부러 disabled 를 넘기지 않는다.
            // Pressable 을 disabled 로 만들면 터치 responder 를 포기해서, 중첩된 경우
            // (예: 보안키 목록 행 안의 삭제 버튼) 진행 중인 안쪽 버튼을 누른 터치가
            // 바깥 행으로 흘러가 엉뚱한 동작을 한다. 대신 handlePress 에서 삼킨다.
            accessibilityState={{ disabled: isBlocked }}
            onPress={handlePress}
            android_ripple={ripple && !isBlocked ? { color: rippleColor } : undefined}
            style={({ pressed }) => [
                style,
                isBlocked && { opacity: disabledOpacity },
                pressed && !isBlocked && {
                    opacity: pressedOpacity,
                    transform: pressedScale && pressedScale !== 1
                        ? [{ scale: pressedScale }]
                        : undefined,
                },
            ]}
        >
            {children}
        </Pressable>
    );
}
