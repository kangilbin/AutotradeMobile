import {useEffect, useRef} from 'react';
import { Text, Animated, StyleSheet } from 'react-native';
import AppTouchable from './common/AppTouchable';

interface AuthToggleProps {
    isOn: boolean;
    onToggle: () => void;
    onText?: string;
    offText?: string;
}

export default function AuthToggle({ isOn, onText, offText, onToggle}: AuthToggleProps){
    const animation = useRef(new Animated.Value(isOn ? 1 : 0)).current;
    useEffect(() => {
        Animated.timing(animation, {
            toValue: isOn ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [isOn]);

    const translateX = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 50], // 원 이동 거리 (toggleContainer width - 원 크기 - padding 고려)
    });

    const backgroundColor = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['#ccc', '#B5EAD7'],
    });

    return (
        // 토글 자체가 슬라이드 애니메이션을 가지므로 scale/ripple 은 끄고 투명도 변화만 준다
        // 토글은 ON→OFF 즉시 정정이 정상 동작이라 쿨다운을 두지 않는다
        // (실제 중복 요청은 onToggle 이 Promise 라 재진입 가드가 막는다)
        <AppTouchable onPress={onToggle} pressedScale={1} ripple={false} cooldownMs={0}>
            <Animated.View style={[styles.toggleContainer, { backgroundColor }]}>
                {/* ON 텍스트는 왼쪽에 */}
                <Text style={[styles.text, isOn ? styles.leftText : styles.rightText]}>{isOn ? onText : offText}</Text>
                <Animated.View style={[styles.circle, { transform: [{ translateX }] }]} />
            </Animated.View>
        </AppTouchable>
    );
};
const styles = StyleSheet.create({
    toggleContainer: {
        width: 90,
        height: 40,
        borderRadius: 30,
        padding: 5,
        justifyContent: 'center',
        position: 'relative',
    },
    circle: {
        width: 30,
        height: 30,
        borderRadius: 20,
        backgroundColor: '#fff',
        position: 'absolute',
        left: 5,
        top: 5,
        zIndex: 2,
    },
    text: {
        position: 'absolute',
        fontWeight: 'bold',
        color: '#fff',
        fontSize: 16,
        zIndex: 1,
    },
    leftText: {
        left: 15,
    },
    rightText: {
        right: 15,
    },
});