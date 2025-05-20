import React, {useEffect, useRef} from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';

export default function AuthToggle({ isOn, onToggle }){
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
        outputRange: ['#B5EAD7', '#ccc'],
    });

    return (
        <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
            <Animated.View style={[styles.toggleContainer, { backgroundColor }]}>
                {/* ON 텍스트는 왼쪽에 */}
                <Text style={[styles.text, isOn ? styles.leftText : styles.rightText]}>{isOn ? '모의' : '실전'}</Text>
                <Animated.View style={[styles.circle, { transform: [{ translateX }] }]} />
            </Animated.View>
        </TouchableOpacity>
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