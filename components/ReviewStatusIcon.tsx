import { useEffect, useRef } from 'react';
import { Animated, AppState, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AppTouchable from './common/AppTouchable';
import { useStockReviewStore, headerStateOf, ReviewHeaderState } from '../stores/useStockReviewStore';
import { Colors, FontSizes, BorderRadius } from '../constants/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

const ICON: Record<Exclude<ReviewHeaderState, null>, { name: IoniconName; color: string }> = {
    running: { name: 'hourglass-outline', color: Colors.primaryDark },
    done: { name: 'checkmark-circle', color: Colors.success },
    failed: { name: 'alert-circle', color: Colors.warning },
    idle: { name: 'sparkles-outline', color: Colors.textSecondary },
};

/** 모래시계를 뒤집고 잠깐 멈추기를 반복 — 분석 중인 동안 계속 돈다 */
function useHourglassFlip(active: boolean) {
    const flip = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        if (!active) {
            flip.setValue(0);
            return;
        }
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(flip, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.delay(500),
                Animated.timing(flip, { toValue: 2, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.delay(500),
            ])
        );
        flip.setValue(0);
        loop.start();
        return () => loop.stop();
    }, [active, flip]);

    return flip.interpolate({ inputRange: [0, 1, 2], outputRange: ['0deg', '180deg', '360deg'] });
}

/** 점 세 개가 차례로 나타나는 "분석중..." 표시 */
function useDots(active: boolean) {
    const step = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        if (!active) return;
        const loop = Animated.loop(
            Animated.timing(step, { toValue: 4, duration: 1600, easing: Easing.linear, useNativeDriver: true })
        );
        step.setValue(0);
        loop.start();
        return () => loop.stop();
    }, [active, step]);

    return [1, 2, 3].map((i) =>
        step.interpolate({ inputRange: [0, i - 0.01, i, 4], outputRange: [0, 0, 1, 1], extrapolate: 'clamp' })
    );
}

/** 헤더의 AI 분석 상태 — 분석 중엔 애니메이션 배지, 그 외엔 아이콘. 기록이 없으면 렌더하지 않는다 */
export default function ReviewStatusIcon() {
    const reviews = useStockReviewStore((s) => s.reviews);
    const refresh = useStockReviewStore((s) => s.refresh);
    const state = headerStateOf(reviews);
    const running = state === 'running';
    const rotate = useHourglassFlip(running);
    const dots = useDots(running);

    // 앱 시작·포그라운드 복귀 시 1회 조회 — 앱이 꺼진 동안 끝난 분석도 아이콘에 반영
    useEffect(() => {
        refresh();
        const sub = AppState.addEventListener('change', (next) => {
            if (next === 'active') refresh();
        });
        return () => sub.remove();
    }, [refresh]);

    if (!state) return null;

    const onPress = () => router.push('/review');
    const hitSlop = { top: 8, bottom: 8, left: 8, right: 8 };

    if (running) {
        return (
            <AppTouchable style={styles.runningPill} onPress={onPress} hitSlop={hitSlop}>
                <Animated.View style={{ transform: [{ rotate }] }}>
                    <Ionicons name={ICON.running.name} size={14} color={ICON.running.color} />
                </Animated.View>
                <Text style={styles.runningText}>분석중</Text>
                <View style={styles.dots}>
                    {dots.map((opacity, i) => (
                        <Animated.Text key={i} style={[styles.runningText, { opacity }]}>.</Animated.Text>
                    ))}
                </View>
            </AppTouchable>
        );
    }

    return (
        <AppTouchable style={styles.button} onPress={onPress} hitSlop={hitSlop}>
            <Ionicons name={ICON[state].name} size={17} color={ICON[state].color} />
            {state === 'done' && <View style={styles.dot} />}
        </AppTouchable>
    );
}

const styles = StyleSheet.create({
    // 헤더 높이(70)가 고정이라 이름 줄 높이에 맞춘다
    button: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: Colors.error,
    },
    runningPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        height: 24,
        paddingHorizontal: 9,
        borderRadius: BorderRadius.full,
        backgroundColor: '#E6F8F6',
    },
    runningText: {
        fontSize: FontSizes.sm,
        fontWeight: '700',
        color: Colors.primaryDark,
    },
    dots: {
        flexDirection: 'row',
        width: 12,
    },
});
