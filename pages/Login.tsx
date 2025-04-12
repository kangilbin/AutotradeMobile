import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableWithoutFeedback, TouchableOpacity, Keyboard, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import {useNavigation} from '@react-navigation/native';


interface FormState {
    username: string;
    password: string;
    autoLogin: boolean;
}

const LoginScreen: React.FC = () => {
    const [form, setForm] = useState<FormState>({
        username: '',
        password: '',
        autoLogin: false,
    });

    useEffect(() => {
        checkBiometricSupport();
    }, []);
    const navigation = useNavigation();

    const checkBiometricSupport = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            if (hasHardware && isEnrolled) {
                const savedAccessToken = await SecureStore.getItemAsync('access_token');
                if (savedAccessToken) {
                    // ✅ Access Token이 유효한지 확인
                    const isValid = await validateAccessToken(savedAccessToken);
                    if (isValid) {
                        await handleBiometricLogin(savedAccessToken);
                    } else {
                        // ✅ Access Token 만료 시 Refresh Token 사용
                        const newAccessToken = await refreshAccessToken();
                        if (newAccessToken) {
                            await SecureStore.setItemAsync('access_token', newAccessToken);
                            await handleBiometricLogin(newAccessToken);
                        } else {
                            Alert.alert('세션 만료', '다시 로그인해주세요.');
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Biometric support check failed', error);
        }
    };
    // Access Token 유효성 검사 (서버 API 호출)
    const validateAccessToken = async (token: string) => {
        try {
            // 여기에 실제 API 요청을 추가하여 Access Token 유효성 검사
            return true; // 유효하면 true 반환
        } catch {
            return false;
        }
    };
    // Refresh Token을 이용한 Access Token 갱신
    const refreshAccessToken = async () => {
        try {
            const refreshToken = await SecureStore.getItemAsync('refresh_token');
            if (!refreshToken) return null;

            // 서버에 Refresh Token을 보내서 새 Access Token을 받음
            const newAccessToken = 'new-dummy-access-token'; // 실제 API 호출 후 받은 값
            return newAccessToken;
        } catch {
            return null;
        }
    };
    const handleBiometricLogin = async (token: string) => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Face ID로 로그인',
                fallbackLabel: '비밀번호 입력',
            });
            if (result.success) {
                Alert.alert('로그인 성공', '자동 로그인 완료!');
                // 해당 토큰을 서버로 보내 인증
            } else {
                Alert.alert('로그인 실패', '다시 시도하세요.');
                }
        } catch (error) {
            console.error('생체 인식 로그인 실패', error);
        }
    };

    const handleInputChange = (field: keyof FormState, value: string | boolean) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleLogin = async () => {
        console.log('Login attempted:', form);
        const access_token = 'dummy-jwt-token'; // 실제 로그인 API 호출 후 반환받은 토큰
        const refresh_token = 'dummy-jwt-token'; // 실제 로그인 API 호출 후 반환받은 토큰
        await SecureStore.setItemAsync('access_token', access_token);
        await SecureStore.setItemAsync('refresh_token', refresh_token);

        Alert.alert('로그인 성공', '생체인식을 통한 자동 로그인이 활성화됩니다.');
    };

    const handleKakaoLogin = () => {
        console.log('Kakao login initiated');
    };

    const handleSignup = () => {
        navigation.navigate('Signup');
    };

    const isLoginEnabled = form.username.length > 0 && form.password.length > 0;

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <TextInput
                    style={styles.input}
                    placeholder="아이디"
                    value={form.username}
                    onChangeText={(text) => handleInputChange('username', text)}
                />
                <TextInput
                    style={styles.input}
                    placeholder="비밀번호"
                    value={form.password}
                    onChangeText={(text) => handleInputChange('password', text)}
                    secureTextEntry
                />
                <TouchableOpacity
                    style={[styles.button, isLoginEnabled ? styles.buttonEnabled : styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={!isLoginEnabled}
                >
                    <Text style={styles.buttonText}>로그인</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => handleInputChange('autoLogin', !form.autoLogin)}
                >
                    <Icon
                        name={form.autoLogin ? 'check-circle' : 'check-circle-outline'}
                        size={20}
                        color={form.autoLogin ? '#B5EAD7' : '#d3d3d3'}
                    />
                    <Text style={styles.checkboxText}>자동 로그인</Text>
                </TouchableOpacity>
                <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>또는</Text>
                    <View style={styles.dividerLine} />
                </View>
                <TouchableOpacity style={styles.socialButton} onPress={handleKakaoLogin}>
                    <Icon name="chat" size={20} color="#3C1E1E" style={styles.socialIcon} />
                    <Text style={styles.socialButtonText}>Kakao 계정으로 로그인</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.buttonEnabled]}
                    onPress={handleSignup}
                >
                    <Text style={styles.buttonText}>회원 가입</Text>
                </TouchableOpacity>
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        marginBottom: 15,
    },
    button: {
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 15,
    },
    buttonDisabled: {
        backgroundColor: '#d3d3d3',
    },
    buttonEnabled: {
        backgroundColor: '#B5EAD7',
    },
    buttonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    checkboxText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 5,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#ddd',
    },
    dividerText: {
        marginHorizontal: 10,
        fontSize: 14,
        color: '#666',
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
    },
    socialIcon: {
        marginRight: 10,
    },
    socialButtonText: {
        fontSize: 16,
        justifyContent: 'center',
    },
});

export default LoginScreen;