import React, { useRef, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import DismissKeyboardView from "../../../components/DismissKeyboardView";

interface FormState {
    accountNumber: string;
    permission: string | null;
}

export default function AddScreen() {
    const accountInputRef = useRef<TextInput | null>(null);
    const [form, setForm] = useState<FormState>({
        accountNumber: '',
        permission: null,
    });
    const [permissions, setPermissions] = useState<string[]>([]); // List of available permissions
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newPermission, setNewPermission] = useState('');
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    const router = useRouter();

    const handleInputChange = (field: keyof FormState, value: string) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleAddPermission = () => {
        if (!newPermission.trim()) {
            Alert.alert('Error', '권한 이름을 입력하세요.');
            return;
        }
        setPermissions((prev) => [...prev, newPermission.trim()]);
        setNewPermission('');
        setIsModalVisible(false);
    };

    const handleAddAccount = () => {
        if (!form.accountNumber) {
            (accountInputRef.current as TextInput)?.focus();
            return;
        }
        if (!form.permission) {
            Alert.alert('Error', '권한을 선택하세요.');
            return;
        }

        // Add account logic here
        Alert.alert('Success', '계좌가 추가되었습니다.');
        router.dismiss();
    };

    return (
        <DismissKeyboardView>
            <TextInput
                ref={accountInputRef}
                style={[
                    styles.input,
                    focusedInput === 'accountNumber' && styles.inputFocused,
                ]}
                placeholder="계좌번호"
                value={form.accountNumber}
                onChangeText={(text) => handleInputChange('accountNumber', text.replace(/[^0-9]/g, ''))} // 숫자만 필터링
                keyboardType="numeric"
                onFocus={() => setFocusedInput('accountNumber')}
                onBlur={() => setFocusedInput(null)}
            />
            {permissions.length > 0 ? (
                <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => {
                        // Logic to show dropdown and select permission
                        const selectedPermission = permissions[0]; // Example: select the first permission
                        handleInputChange('permission', selectedPermission);
                    }}
                >
                    <Text style={styles.dropdownText}>
                        {form.permission || '권한 선택'}
                    </Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={styles.addPermissionButton}
                    onPress={() => setIsModalVisible(true)}
                >
                    <Text style={styles.addPermissionText}>권한 등록</Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity
                style={[
                    styles.button,
                    form.accountNumber && form.permission
                        ? styles.buttonEnabled
                        : styles.buttonDisabled,
                ]}
                onPress={handleAddAccount}
                disabled={!form.accountNumber || !form.permission}
            >
                <Text style={styles.buttonText}>계좌 추가</Text>
            </TouchableOpacity>

            {/* Modal for adding new permission */}
            <Modal
                visible={isModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>새 권한 등록</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="권한 이름"
                            value={newPermission}
                            onChangeText={setNewPermission}
                        />
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleAddPermission}
                        >
                            <Text style={styles.buttonText}>등록</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={() => setIsModalVisible(false)}
                        >
                            <Text style={styles.buttonText}>취소</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </DismissKeyboardView>
    );
}

const styles = StyleSheet.create({
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
    dropdown: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        backgroundColor: '#f9f9f9',
    },
    dropdownText: {
        fontSize: 16,
        color: '#333',
    },
    addPermissionButton: {
        padding: 15,
        borderRadius: 10,
        backgroundColor: '#B5EAD7',
        alignItems: 'center',
        marginBottom: 15,
    },
    addPermissionText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
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
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    cancelButton: {
        backgroundColor: '#ff6b6b',
    },
});