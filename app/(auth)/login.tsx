import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import AppButton from '../../components/common/AppButton';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LoginScreen () {
    const { handleGoogleLogin, isReady: isGoogleReady } = useGoogleAuth();

    return (
        <View style={styles.container}>
            {/* 로딩 인디케이터는 루트의 ApiLoadingOverlay 가 전역으로 처리한다 */}

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
                {/* 비동기 핸들러라 AppTouchable 이 완료까지 재진입을 막는다 */}
                <AppButton
                    style={[styles.googleButton, !isGoogleReady && styles.buttonDisabled]}
                    textStyle={styles.googleButtonText}
                    onPress={handleGoogleLogin}
                    disabled={!isGoogleReady}
                    title="Google로 계속하기"
                    loadingText="로그인 중..."
                    // 버튼 배경이 흰색이라 기본 흰 스피너는 보이지 않는다. 라벨과 같은 색으로 맞춘다
                    spinnerColor="#1f1f1f"
                    icon={
                        <Image
                            source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                            style={styles.googleLogo}
                        />
                    }
                />
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
        // 라벨과의 간격은 AppButton 이 처리한다
        width: 20,
        height: 20,
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
