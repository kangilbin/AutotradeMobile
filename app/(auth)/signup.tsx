import React, { useState, useEffect, useRef } from 'react';
import {
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Keyboard,
    TouchableWithoutFeedback,
    Platform,
    KeyboardAvoidingView,
    Animated,
    Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import {checkId, signup} from '../../contexts/backEndApi'; // 로그인 API 호출 함수
interface FormState {
    USER_ID: string;
    USER_NAME: string;
    PASSWORD: string;
    confirmPassword: string;
}

const SignupScreen: React.FC = () => {
    const idInputRef = useRef<TextInput | null>(null);
    const nameInputRef = useRef<TextInput | null>(null);
    const passwordInputRef = useRef<TextInput | null>(null);
    const confirmPasswordInputRef = useRef<TextInput | null>(null);
    const [isDuplicate, setIsDuplicate] = useState(false);
    const [form, setForm] = useState<FormState>({
        USER_ID: '',
        USER_NAME: '',
        PASSWORD: '',
        confirmPassword: '',
    });
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    const router = useRouter();
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const keyboardShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            handleKeyboardShow
        );
        const keyboardHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            handleKeyboardHide
        );

        return () => {
            keyboardShowListener.remove();
            keyboardHideListener.remove();
        };
    }, []);

    const handleKeyboardShow = (event: any) => {
        Animated.timing(translateY, {
            toValue: -event.endCoordinates.height / 2,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    };

    const handleKeyboardHide = () => {
        Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    };
    const checkDuplicateId = async () => {
        if (!form.USER_ID) return;

        try {
            const response: { isDuplicate: boolean } = await checkId(form.USER_ID);
            setIsDuplicate(response.isDuplicate); // Assume API returns { isDuplicate: boolean }
        } catch (error) {
            console.error('Error checking duplicate ID:', error);
        }
    };

    const handleInputChange = (field: keyof FormState, value: string) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSignup = async () => {
        if (!form.USER_ID) {
            (idInputRef.current as TextInput)?.focus();
            return;
        }
        if (!form.USER_NAME) {
            (nameInputRef.current as TextInput)?.focus();
            return;
        }
        if (!form.PASSWORD) {
            (passwordInputRef.current as TextInput)?.focus();
            return;
        }
        if (!form.confirmPassword) {
            (confirmPasswordInputRef.current as TextInput)?.focus();
            return;
        }
        if (form.PASSWORD !== form.confirmPassword) {
            Alert.alert('Error', '비밀 번호가 불일치 합니다.');
            return;
        }


        try {
            const response = await signup(form);
            if (response) {
                if (response.code === 1062) {
                    Alert.alert('Error', '중복된 아이디입니다.');
                    return;
                }
                Alert.alert('Signup Successful', '회원 가입 완료.');
                router.dismiss();
            }
        } catch (error) {
            Alert.alert('Signup Failed', 'An error occurred during signup.');
        }
    };

    const isSignupEnabled =
        form.USER_ID.length > 0 &&
        form.USER_NAME.length > 0 &&
        form.PASSWORD.length > 0 &&
        form.confirmPassword.length > 0 &&
        !isDuplicate;

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
                    {isDuplicate && <Text style={styles.errorText}>중복된 아이디입니다.</Text>}
                    <TextInput
                        ref={idInputRef}
                        style={[
                            styles.input,
                            focusedInput === 'USER_ID' && styles.inputFocused,
                            isDuplicate && styles.inputError,
                        ]}
                        placeholder="아이디"
                        value={form.USER_ID}
                        onChangeText={(text) => {
                            handleInputChange('USER_ID', text);
                            setIsDuplicate(false); // Reset duplicate state on text change
                        }}
                        onFocus={() => setFocusedInput('USER_ID')}
                        onBlur={checkDuplicateId}
                    />
                    <TextInput
                        ref={nameInputRef}
                        style={[styles.input, focusedInput === 'USER_NAME' && styles.inputFocused]}
                        placeholder="이름"
                        value={form.USER_NAME}
                        onChangeText={(text) => handleInputChange('USER_NAME', text)}
                        onFocus={() => setFocusedInput('name')}
                        onBlur={() => setFocusedInput(null)}
                    />
                    <TextInput
                        ref={passwordInputRef}
                        style={[styles.input, focusedInput === 'PASSWORD' && styles.inputFocused]}
                        placeholder="비밀번호"
                        value={form.PASSWORD}
                        onChangeText={(text) => handleInputChange('PASSWORD', text)}
                        secureTextEntry
                        onFocus={() => setFocusedInput('PASSWORD')}
                        onBlur={() => setFocusedInput(null)}
                    />
                    <TextInput
                        ref={confirmPasswordInputRef}
                        style={[styles.input, focusedInput === 'confirmPassword' && styles.inputFocused]}
                        placeholder="비밀번호 확인"
                        value={form.confirmPassword}
                        onChangeText={(text) => handleInputChange('confirmPassword', text)}
                        secureTextEntry
                        onFocus={() => setFocusedInput('confirmPassword')}
                        onBlur={() => setFocusedInput(null)}
                    />
                    <TouchableOpacity
                        style={[styles.button, isSignupEnabled ? styles.buttonEnabled : styles.buttonDisabled]}
                        onPress={handleSignup}
                        disabled={!isSignupEnabled}
                    >
                        <Text style={styles.buttonText}>가입 완료</Text>
                    </TouchableOpacity>
                </Animated.View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
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
    inputFocused: {
        borderColor: '#B5EAD7',
        borderWidth: 2,
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
    errorText: {
        color: 'red',
        marginBottom: 5,
    },
    inputError: {
        borderColor: 'red',
        borderWidth: 2,
    },
});

export default SignupScreen;