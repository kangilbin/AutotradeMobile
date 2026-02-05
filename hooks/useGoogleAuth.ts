import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { googleLogin } from '../contexts/backEndApi';

// 웹 브라우저 세션 완료 처리
WebBrowser.maybeCompleteAuthSession();

// Google OAuth 클라이언트 ID 설정
// TODO: Google Cloud Console에서 실제 클라이언트 ID로 교체 필요
const GOOGLE_CLIENT_ID = {
    webClientId: '824816114114-fqi4gsfbetegd68racm1qd6i4dfpletj.apps.googleusercontent.com',
    iosClientId: '824816114114-b12sk84r4ps9cimgg8pih9n8lfmoc98j.apps.googleusercontent.com',
    androidClientId: '824816114114-31bao15efp0hbps53iksa0qpucjiaunj.apps.googleusercontent.com',
};

export const useGoogleAuth = () => {
    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: GOOGLE_CLIENT_ID.webClientId,
        iosClientId: GOOGLE_CLIENT_ID.iosClientId,
        androidClientId: GOOGLE_CLIENT_ID.androidClientId,
        scopes: ['openid', 'profile', 'email'],
        extraParams: {
            access_type: 'offline',  // refresh_token 요청
            prompt: 'consent',       // 항상 동의 화면 표시 (refresh_token 받기 위해 필요)
        },
    });

    const handleGoogleLogin = useCallback(async () => {
        if (!request) {
            Alert.alert('오류', 'Google 로그인을 초기화하는 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        await promptAsync();
    }, [request, promptAsync]);

    useEffect(() => {
        const processGoogleResponse = async () => {
            if (response?.type === 'success') {
                const { authentication } = response;

                // 디버깅용 로그
                console.log('=== Google OAuth Response ===');
                console.log('accessToken:', authentication?.accessToken ? '있음' : '없음');
                console.log('refreshToken:', authentication?.refreshToken ? '있음' : '없음');
                console.log('expiresIn:', authentication?.expiresIn);
                console.log('Full authentication:', JSON.stringify(authentication, null, 2));
                console.log('=============================');

                if (!authentication?.accessToken) {
                    Alert.alert('오류', 'Google 인증 정보를 가져올 수 없습니다.');
                    return;
                }

                // 백엔드로 Google access_token 전송
                const result = await googleLogin({
                    access_token: authentication.accessToken,
                    refresh_token: authentication.refreshToken,
                    expires_in: authentication.expiresIn ? Number(authentication.expiresIn) : undefined,
                });

                if (result?.access_token) {
                    // 백엔드 JWT 토큰 저장
                    await SecureStore.setItemAsync('access_token', result.access_token);
                    if (result.refresh_token) {
                        await SecureStore.setItemAsync('refresh_token', result.refresh_token);
                    }
                    // Google refresh_token 저장 (나중에 Google API 사용 시 필요)
                    if (authentication.refreshToken) {
                        await SecureStore.setItemAsync('google_refresh_token', authentication.refreshToken);
                    }
                    // 홈 화면으로 이동
                    router.replace('home');
                }
            } else if (response?.type === 'error') {
                Alert.alert('Google 로그인 실패', response.error?.message || '로그인 중 오류가 발생했습니다.');
            }
        };

        if (response) {
            processGoogleResponse();
        }
    }, [response]);

    return {
        handleGoogleLogin,
        isReady: !!request,
    };
};
