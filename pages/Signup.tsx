import React, { useState, useEffect, useRef } from 'react';
import {
    View,
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
import { useNavigation } from '@react-navigation/native';

interface FormState {
    id: string;
    name: string;
    password: string;
    confirmPassword: string;
}

const SignupScreen: React.FC = () => {
    const idInputRef = useRef<TextInput | null>(null);
    const nameInputRef = useRef<TextInput | null>(null);
    const passwordInputRef = useRef<TextInput | null>(null);
    const confirmPasswordInputRef = useRef<TextInput | null>(null);

    const [form, setForm] = useState<FormState>({
        id: '',
        name: '',
        password: '',
        confirmPassword: '',
    });
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    const navigation = useNavigation();
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

    const handleInputChange = (field: keyof FormState, value: string) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSignup = () => {
        if (!form.id) {
            idInputRef.current?.focus();
            return;
        }
        if (!form.name) {
            nameInputRef.current?.focus();
            return;
        }
        if (!form.password) {
            passwordInputRef.current?.focus();
            return;
        }
        if (!form.confirmPassword) {
            confirmPasswordInputRef.current?.focus();
            return;
        }
        if (form.password !== form.confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }

        Alert.alert('Signup Successful', 'Your account has been created.');
        navigation.navigate('Login');
    };

    const isSignupEnabled =
        form.id.length > 0 &&
        form.name.length > 0 &&
        form.password.length > 0 &&
        form.confirmPassword.length > 0;

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
                    <TextInput
                        ref={idInputRef}
                        style={[styles.input, focusedInput === 'id' && styles.inputFocused]}
                        placeholder="아이디"
                        value={form.id}
                        onChangeText={(text) => handleInputChange('id', text)}
                        onFocus={() => setFocusedInput('id')}
                        onBlur={() => setFocusedInput(null)}
                    />
                    <TextInput
                        ref={nameInputRef}
                        style={[styles.input, focusedInput === 'name' && styles.inputFocused]}
                        placeholder="이름"
                        value={form.name}
                        onChangeText={(text) => handleInputChange('name', text)}
                        onFocus={() => setFocusedInput('name')}
                        onBlur={() => setFocusedInput(null)}
                    />
                    <TextInput
                        ref={passwordInputRef}
                        style={[styles.input, focusedInput === 'password' && styles.inputFocused]}
                        placeholder="비밀번호"
                        value={form.password}
                        onChangeText={(text) => handleInputChange('password', text)}
                        secureTextEntry
                        onFocus={() => setFocusedInput('password')}
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
});

export default SignupScreen;