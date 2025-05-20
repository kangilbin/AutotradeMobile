import React, {useEffect, useRef, useState} from 'react';
import {
    Alert,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {useRouter} from 'expo-router';
import DismissKeyboardView from '../../../components/DismissKeyboardView';
import {addAccount, AddAccountRequest, addAuth, AddAuthRequest} from "../../../contexts/backEndApi";
import AuthToggle from "../../../components/AuthToggle";


export default function AddAccountScreen() {
    const router = useRouter();
    const acctRef = useRef<TextInput | null>(null);

    const [form, setForm] = useState<AddAccountRequest>({ACCOUNT_NO: '', AUTH_ID: 0});
    const [authList, setAuthList] = useState<{code: string; name: string}[]>([]);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [isOn, setIsOn] = useState(true);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [newAuth, setNewAuth] = useState<AddAuthRequest>({ SIMULATION_YN: 'Y', AUTH_NAME: '', API_KEY: '', SECRET_KEY: '' });

    /* ─ 권한 목록 불러오기 ─ */
    useEffect(() => {
        (async () => {
            try {
                setAuthList([{code: 'ALL', name: '전체'}]);
                // setAuthList(await fetchAuthList());
            } catch {
                Alert.alert('오류', '권한 목록을 가져오지 못했습니다.');
            }
        })();
    }, []);

    const handleChange = (field: keyof AddAccountRequest, value: string) =>
        setForm(prev => ({...prev, [field]: value}));

    /* ─ 계좌 저장 ─ */
    const handleSave = async () => {
        if (!form.ACCOUNT_NO) return (acctRef.current as TextInput)?.focus();
        if (!form.AUTH_ID) return Alert.alert('알림', '보안 키를 선택하세요.');

        await addAccount(form);
        Alert.alert('완료', '계좌가 추가되었습니다.');
        router.replace('account');
    };

    const handleAddAuth = async () => {
        if (!newAuth.SIMULATION_YN || !newAuth.API_KEY || !newAuth.SIMULATION_YN) {
            return Alert.alert('오류', '모든 필드를 입력하세요.');
        }

        try {
            // Example API request to add a new permission
            const response = await addAuth(newAuth);
            setAuthList((prev) => [...prev, response.data]); // Add new permission to authList
            setNewAuth({SIMULATION_YN:'Y', AUTH_NAME: '', API_KEY: '', SECRET_KEY: '' }); // Reset fields
            setIsAddModalVisible(false); // Close modal
            Alert.alert('완료', '보안 키가 추가되었습니다.');
        } catch (error) {
            Alert.alert('오류', error.response?.data || error.message);
        }
    };
    return (
        <DismissKeyboardView style={styles.container}>
            {/* ① 계좌번호 입력 라인 */}
            <TextInput
                ref={acctRef}
                style={styles.input}
                placeholder="계좌번호"
                value={form.ACCOUNT_NO}
                onChangeText={t => handleChange('ACCOUNT_NO', t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
            />

            {/* ② 보안키 선택 + 추가 버튼 라인 */}
            <View style={styles.authRow}>
                {/* 권한 선택 필드 */}
                <Pressable style={[styles.input, {flex: 1}]} onPress={() => setPickerVisible(true)}>
                    <Text style={form.AUTH_ID ? styles.text : styles.placeholder}>
                        {form.AUTH_ID
                            ? authList.find(a => a.code === form.AUTH_ID)?.name
                            : '보안키 선택'}
                    </Text>
                </Pressable>

                {/* 추가 버튼 */}
                <TouchableOpacity style={styles.addBtn} onPress={() => setIsAddModalVisible(true)}>
                    <Text style={styles.addBtnTxt}>추가</Text>
                </TouchableOpacity>
            </View>

            {/* ③ 등록 버튼 */}
            <TouchableOpacity
                style={[
                    styles.saveBtn,
                    form.ACCOUNT_NO && form.AUTH_ID? styles.saveEnabled : styles.saveDisabled,
                ]}
                disabled={!form.ACCOUNT_NO || !form.AUTH_ID}
                onPress={handleSave}
            >
                <Text style={styles.saveTxt}>등록</Text>
            </TouchableOpacity>

            {/* ④ Picker 모달 */}
            <Modal
                transparent
                visible={pickerVisible}
                animationType="slide"
                onRequestClose={() => setPickerVisible(false)}
            >
                {/* 배경 클릭 → 닫기 */}
                <Pressable style={styles.backdrop} onPress={() => setPickerVisible(false)} />

                {/* 하단 시트 */}
                <View style={styles.pickerBox}>
                    <Picker
                        selectedValue={form.AUTH_ID}
                        onValueChange={v => {
                            handleChange('AUTH_ID', v);
                            setPickerVisible(false);
                        }}
                        style={styles.picker}
                    >
                        <Picker.Item label="보안키 선택" value="" />
                        {authList.map(a => (
                            <Picker.Item key={a.code} label={a.name} value={a.code} />
                        ))}
                    </Picker>
                </View>
            </Modal>

            {/* Add 권한 추가 */}
            <Modal
                transparent
                visible={isAddModalVisible}
                animationType="fade"
                onRequestClose={() => setIsAddModalVisible(false)}
            >
                <View style={styles.popupContainer}>
                    <Pressable style={styles.backdrop} onPress={() => setIsAddModalVisible(false)} />
                    <View style={styles.modalContent}>
                        <AuthToggle isOn={isOn} onToggle={() => setIsOn(prev => !prev)} />
                        <Text style={styles.modalTitle}>보안키 추가</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="보안키 이름"
                            value={newAuth.AUTH_NAME}
                            onChangeText={(text) => setNewAuth((prev) => ({ ...prev, AUTH_NAME: text }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="App Key"
                            value={newAuth.API_KEY}
                            onChangeText={(text) => setNewAuth((prev) => ({ ...prev, API_KEY: text }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="App Secret"
                            value={newAuth.SECRET_KEY}
                            onChangeText={(text) => setNewAuth((prev) => ({ ...prev, SECRET_KEY: text }))}
                        />
                        <TouchableOpacity style={styles.saveBtn} onPress={handleAddAuth}>
                            <Text style={styles.saveTxt}>완료</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveBtn, styles.cancelBtn]}
                            onPress={() => setIsAddModalVisible(false)}
                        >
                            <Text style={styles.saveTxt}>취소</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </DismissKeyboardView>
    );
}

/* ─ 스타일 ─ */
const styles = StyleSheet.create({
    container: {padding: 20},
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingVertical: 14,
        paddingHorizontal: 12,
        marginBottom: 15,
    },
    placeholder: {color: '#999'},
    text: {color: '#000'},
    /* 보안키 라인 */
    authRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 15},
    addBtn: {
        borderWidth: 1,
        borderColor: '#B5EAD7',
        marginLeft: 10,
        paddingHorizontal: 14,
        paddingVertical: 14,
        backgroundColor: '#B5EAD7',
        borderRadius: 10,
        marginBottom: 15,

},
    addBtnTxt: {color: '#fff', fontWeight: 'bold'},
    /* 저장 버튼 */
    saveBtn: {padding: 15, borderRadius: 10, alignItems: 'center'},
    saveEnabled: {backgroundColor: '#B5EAD7'},
    saveDisabled: {backgroundColor: '#d3d3d3'},
    saveTxt: {color: '#fff', fontWeight: 'bold'},
    /* 모달 */
    backdrop: {
        ...StyleSheet.absoluteFillObject, // Covers the entire screen
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    pickerBox: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: 20,
        position: 'absolute', // Ensure it stays at the bottom
        bottom: 0, // Align to the bottom of the screen
        left: 0,
        right: 0,
    },
    picker: {
        width: '100%', // Ensure it spans the container
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    cancelBtn: {
        backgroundColor: '#ff6b6b',
        marginTop: 10,
    },
    popupContainer: {
        flex: 1,
        justifyContent: 'center', // Centers the modal vertically
        alignItems: 'center', // Centers the modal horizontally
        backgroundColor: 'rgba(0,0,0,0.4)', // Dimmed background
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        width: '80%', // Adjust width as needed
        alignItems: 'center',
        zIndex: 1, // Ensure it appears above the backdrop
    },
});
