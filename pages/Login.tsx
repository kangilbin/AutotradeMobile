import React, { useState } from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, TouchableWithoutFeedback} from 'react-native';
import { Dimensions } from 'react-native';

const windowHeight = Dimensions.get('window').height;

// 타입 정의
interface FormState {
    id: string;
    password: string;
}

const LoginScreen: React.FC = () => {
    const [login, setLogin] = useState<FormState>({
        id: '',
        password: '',
    });

    const handleInputChange = (field: keyof FormState, value: string) => {
        setLogin((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = () => {
        // 수정하기 버튼 클릭 시 동작 (예: API 호출)
        console.log('Form submitted:', login);
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.container}>
                <TextInput
                    style={styles.input}
                    placeholder="아이디"
                    value={login.id}
                    onChangeText={(text) => handleInputChange('id', text)}
                />
                <TextInput
                    style={styles.input}
                    placeholder="비밀번호"
                    value={login.password}
                    secureTextEntry={true}
                    onChangeText={(text) => handleInputChange('password', text)}
                />
                <TouchableOpacity
                    style={[styles.button, (login.id && login.password) ? styles.buttonActive : styles.buttonInactive]}
                    onPress={handleSubmit}
                    disabled={!(login.id && login.password)}
                >
                    <Text style={styles.buttonText}>로그인</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.buttonText}>회원 가입</Text>
                </TouchableOpacity>
            </View>
        </TouchableWithoutFeedback>
    );
};

// 스타일 정의
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    subHeader: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
        marginBottom: 10,
        height: windowHeight * 0.07,
    },
    inputSmall: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 5,
        fontSize: 16,
        width: 100,
        textAlign: 'right',
    },
    subText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    value: {
        fontSize: 16,
        color: '#666',
    },
    button: {
        backgroundColor: '#87CEEB',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
        justifyContent: 'center',
        height: windowHeight * 0.07,
    },
    buttonText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
    buttonInactive: {
        backgroundColor: '#d3d3d3', // 비활성화된 버튼 색상
    },
    buttonActive: {
        backgroundColor: '#87CEEB', // 활성화 된 버튼 색상
    },
});

export default LoginScreen;