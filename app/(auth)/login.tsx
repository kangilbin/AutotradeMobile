import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { useApiLoading } from '../../contexts/backEndApi';
import LoadingIndicator from "../../components/LoadingIndicator";
import { useGoogleAuth } from '../../hooks/useGoogleAuth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LoginScreen () {
    const loading = useApiLoading();
    const { handleGoogleLogin, isReady: isGoogleReady } = useGoogleAuth();

    return (
        <View style={styles.container}>
            {loading && <LoadingIndicator />}

            {/* 상단 로고 영역 - 화면의 대부분을 차지 */}
            <View style={styles.heroSection}>
                <Image
                    style={styles.logo}
                    source={require('../../assets/main.png')}
                    resizeMode="contain"
                />
                <Text style={styles.tagline}>스마트한 자동 스윙 트레이딩</Text>
            </View>

            {/* 하단 로그인 영역 */}
            <View style={styles.loginSection}>
                <TouchableOpacity
                    style={[styles.googleButton, !isGoogleReady && styles.buttonDisabled]}
                    onPress={handleGoogleLogin}
                    disabled={!isGoogleReady}
                    activeOpacity={0.85}
                >
                    <Image
                        source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                        style={styles.googleLogo}
                    />
                    <Text style={styles.googleButtonText}>Google로 계속하기</Text>
                </TouchableOpacity>
                <Text style={styles.footerText}>
                    계속 진행하면 서비스 이용약관에 동의하게 됩니다.
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    heroSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 40,
    },
    logo: {
        width: SCREEN_WIDTH * 0.55,
        height: SCREEN_WIDTH * 0.55,
    },
    tagline: {
        fontSize: 15,
        fontWeight: '500',
        color: '#999',
        marginTop: 16,
        letterSpacing: 1,
    },
    loginSection: {
        paddingHorizontal: 28,
        paddingBottom: 50,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 28,
        height: 56,
        paddingHorizontal: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.4,
    },
    googleLogo: {
        width: 20,
        height: 20,
        marginRight: 12,
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f1f1f',
    },
    footerText: {
        fontSize: 11,
        color: '#bbb',
        textAlign: 'center',
        marginTop: 20,
    },
});
