import React, { useState } from 'react';
import { View, Text, TextInput, TouchableWithoutFeedback, TouchableOpacity, Keyboard, StyleSheet, Alert, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import {login, useApiLoading} from '../../contexts/backEndApi';
import LoadingIndicator from "../../components/LoadingIndicator"; // 로그인 API 호출 함수
import { useRouter } from 'expo-router';
import KeyboardScrollable from "../../components/DismissKeyboardView";


interface FormState {
    USER_ID: string;
    PASSWORD: string;
}

export default function LoginScreen () {
    const loading = useApiLoading();
    const [form, setForm] = useState<FormState>({
        USER_ID: '',
        PASSWORD: '',
    });
    const router = useRouter();

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
        try {
            const response = await login(form);
            if (response?.access_token) {
                await SecureStore.setItemAsync('access_token', response.access_token);
                await SecureStore.setItemAsync('refresh_token', response.refresh_token!);
                router.replace('(tabs)/account');
            }
        } catch (error) {
            Alert.alert('Signup Failed', 'An error occurred during signup.');
        }
    };

    const handleKakaoLogin = () => {
        Alert.alert('Kakao login initiated');
    };

    const handleSignup = () => {
        router.push('signup');
    };

    const isLoginEnabled = form.USER_ID.length > 0 && form.PASSWORD.length > 0;

    return (
        <KeyboardScrollable>
            {loading && <LoadingIndicator />}
            <Image
                style={styles.logo}
                source={require('../../assets/main.png')}
                resizeMode="contain"
            />
            <TextInput
                style={styles.input}
                placeholder="아이디"
                value={form.USER_ID}
                onChangeText={(text) => handleInputChange('USER_ID', text)}
            />
            <TextInput
                style={styles.input}
                placeholder="비밀번호"
                value={form.PASSWORD}
                onChangeText={(text) => handleInputChange('PASSWORD', text)}
                secureTextEntry
            />
            <TouchableOpacity
                style={[styles.button, isLoginEnabled ? styles.buttonEnabled : styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={!isLoginEnabled}
            >
                <Text style={styles.buttonText}>로그인</Text>
            </TouchableOpacity>
            <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>또는</Text>
                <View style={styles.dividerLine} />
            </View>
            <TouchableOpacity style={styles.socialButton} onPress={handleKakaoLogin}>
                <MaterialCommunityIcons name="chat" size={20} color="#3C1E1E" style={styles.socialIcon} />
                <Text style={styles.socialButtonText}>Kakao 계정으로 로그인</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.button, styles.buttonEnabled]}
                onPress={handleSignup}
            >
                <Text style={styles.buttonText}>회원 가입</Text>
            </TouchableOpacity>
        </KeyboardScrollable>
    );
};

const styles = StyleSheet.create({
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
    logo: {
        width: 300,
        height: 300,
        alignSelf: 'center',
        marginBottom: 20,
    },
});

