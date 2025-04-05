import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // 아이콘 사용

// 타입 정의
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

    const handleInputChange = (field: keyof FormState, value: string | boolean) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleLogin = () => {
        // 로그인 버튼 클릭 시 동작 (예: API 호출)
        console.log('Login attempted:', form);
    };


    const handleKakaoLogin = () => {
        // Kakao 로그인 버튼 클릭 시 동작
        console.log('Kakao login initiated');
    };

    const handleSubmit = () => {
        console.log('회원 가입 버튼 클릭');
    };

    // 로그인 버튼 활성화 여부 (아이디와 비밀번호가 모두 입력되었을 때 활성화)
    const isLoginEnabled = form.username.length > 0 && form.password.length > 0;

    return (
        <View style={styles.container}>
            {/* 아이디 입력 */}
            <TextInput
                style={styles.input}
                placeholder="아이디"
                value={form.username}
                onChangeText={(text) => handleInputChange('username', text)}
            />

            {/* 비밀번호 입력 */}
            <TextInput
                style={styles.input}
                placeholder="비밀번호"
                value={form.password}
                onChangeText={(text) => handleInputChange('password', text)}
                secureTextEntry // 비밀번호 입력 시 마스킹 처리
            />

            {/* 로그인 버튼 */}
            <TouchableOpacity
                style={[styles.button, isLoginEnabled ? styles.buttonEnabled : styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={!isLoginEnabled}
            >
                <Text style={styles.buttonText}>로그인</Text>
            </TouchableOpacity>

            {/* 자동 로그인 체크박스 */}
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

            {/* 구분선 */}
            <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>또는</Text>
                <View style={styles.dividerLine} />
            </View>
            {/* Kakao 로그인 버튼 */}
            <TouchableOpacity style={styles.socialButton} onPress={handleKakaoLogin}>
                <Icon name="chat" size={20} color="#3C1E1E" style={styles.socialIcon} />
                <Text style={styles.socialButtonText}>Kakao 계정으로 로그인</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.button, styles.buttonEnabled]}
                onPress={handleSubmit}
            >
                <Text style={styles.buttonText}>회원 가입</Text>
            </TouchableOpacity>
        </View>
    );
};

// 스타일 정의
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
        backgroundColor: '#d3d3d3', // 비활성화 상태 (회색)
    },
    buttonEnabled: {
        backgroundColor: '#B5EAD7', // 활성화 상태 (보라색)
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