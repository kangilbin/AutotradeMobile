import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Alert,
    ScrollView,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { Ionicons } from '@expo/vector-icons';
import { JwtPayload } from '../../../types/auth';
import { updateUserProfile } from '../../../contexts/backEndApi';

export default function EditProfileScreen() {
    const [userName, setUserName] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        const loadUserInfo = async () => {
            const accessToken = await SecureStore.getItemAsync('access_token');
            if (accessToken) {
                const decoded = jwtDecode<JwtPayload>(accessToken);
                setUserName(decoded.user_claims?.USER_NAME || '');
                setPhone(decoded.user_claims?.PHONE || '');
            }
        };
        loadUserInfo();
    }, []);

    const handleSave = async () => {
        if (!userName.trim()) {
            return Alert.alert('알림', '이름을 입력하세요.');
        }
        if (!phone.trim()) {
            return Alert.alert('알림', '핸드폰 번호를 입력하세요.');
        }

        const success = await updateUserProfile({ USER_NAME: userName.trim(), PHONE: phone.trim() });
        if (success) {
            Alert.alert('완료', '프로필이 수정되었습니다.', [
                { text: '확인', onPress: () => router.back() },
            ]);
        }
    };

    const isFormValid = userName.trim().length > 0 && phone.trim().length > 0;

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="person-outline" size={20} color="#4ECDC4" />
                            <Text style={styles.cardTitle}>기본 정보</Text>
                        </View>

                        <Text style={styles.inputLabel}>이름</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="이름을 입력하세요"
                            placeholderTextColor="#95A5A6"
                            value={userName}
                            onChangeText={setUserName}
                        />

                        <Text style={styles.inputLabel}>핸드폰 번호</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="핸드폰 번호를 입력하세요"
                            placeholderTextColor="#95A5A6"
                            value={phone}
                            onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, '').slice(0, 11))}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, isFormValid ? styles.saveEnabled : styles.saveDisabled]}
                        disabled={!isFormValid}
                        onPress={handleSave}
                    >
                        <Text style={styles.saveTxt}>저장</Text>
                    </TouchableOpacity>
                </ScrollView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollContent: {
        paddingTop: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2F3E46',
        marginLeft: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#7F8C8D',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ECF0F1',
        borderRadius: 8,
        height: 48,
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#2C3E50',
        backgroundColor: '#F8F9FA',
        marginBottom: 16,
    },
    saveBtn: {
        marginHorizontal: 16,
        marginTop: 20,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveEnabled: {
        backgroundColor: '#4ECDC4',
    },
    saveDisabled: {
        backgroundColor: '#ECF0F1',
    },
    saveTxt: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
