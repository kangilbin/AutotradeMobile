import { useWindowDimensions } from 'react-native';
import {Props} from "expo-system-ui/plugin/build/withAndroidUserInterfaceStyle";
import React, { useState, useCallback } from 'react';
import { Animated, Pressable, StyleSheet, View, Text } from 'react-native';

export default function AuthToggle({ initial = true, onChange }: Props) {
  const { width: screenW } = useWindowDimensions();

  const TOGGLE_W = screenW * 0.4;
  const KNOB_W   = TOGGLE_W * 0.6;
    const [isPractice, setIsPractice] = useState(initial);
    const translateX = React.useRef(new Animated.Value(initial ? 0 : 1)).current;

    /** 애니메이션 길이(px) = 토글 폭 - 담요(버튼) 지름 */
    const SLIDE_DISTANCE = TOGGLE_W - KNOB_W;

    const toggle = useCallback(() => {
        const next = !isPractice;
        setIsPractice(next);
        Animated.timing(translateX, {
            toValue: next ? 0 : SLIDE_DISTANCE,
            duration: 180,
            useNativeDriver: true,
        }).start();
        onChange?.(next);
    }, [isPractice, SLIDE_DISTANCE]);

    const knobStyle = {
        transform: [{ translateX }],
    };
    return (
        <Pressable onPress={toggle}>
            <View style={styles.container}>
                <Animated.View style={[styles.knob, knobStyle]}>
                    <Text style={styles.label}>{isPractice ? '실전' : '모의'}</Text>
                </Animated.View>
            </View>
        </Pressable>
  );
}

const styles = StyleSheet.create({
    container: {
        width: 140,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: '#B5EAD7',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    knob: {
        position: 'absolute',
        width: 84,            // 글자 양쪽 padding 포함
        height: 40,
        borderRadius: 22,
        backgroundColor: '#B5EAD7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontWeight: '700',
        fontSize: 16,
        color: '#000',
    },
});
