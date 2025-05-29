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
import {
    addAccount,
    AddAccountRequest,
    addAuth,
    AddAuthRequest, AuthStatus,
    getAuthList
} from "../../../contexts/backEndApi";
import AuthToggle from "../../../components/AuthToggle";


export default function AddAccountScreen() {
    const router = useRouter();
    const acctRef = useRef<TextInput | null>(null);

    const [form, setForm] = useState<AddAccountRequest>({ACCOUNT_NO: '', AUTH_ID: 0});
    const [authList, setAuthList] = useState<AuthStatus[]>([]);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [isOn, setIsOn] = useState(false);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [newAuth, setNewAuth] = useState<AddAuthRequest>({ SIMULATION_YN: 'N', AUTH_NAME: '', API_KEY: '', SECRET_KEY: '' });

    /* ─ 권한 목록 불러오기 ─ */
    useEffect(() => {
        const fetchAuthList = async () => {
            const response = await getAuthList();
            setAuthList(response || []);
        };
        fetchAuthList();
    }, []);
    const handleChange = (field: keyof AddAccountRequest, value) =>
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
            const response = await addAuth(newAuth);
            setAuthList((prev) => [...prev, response as AuthStatus]);
            handleChange('AUTH_ID', response?.AUTH_ID);
            setNewAuth({SIMULATION_YN:'Y', AUTH_NAME: '', API_KEY: '', SECRET_KEY: '' });
            setIsAddModalVisible(false);
        } catch (error) {
            Alert.alert('오류', error.response?.data || error.message);
        }
    };
    const isAuthEnabled =
        newAuth.AUTH_NAME.length > 0 &&
        newAuth.API_KEY.length > 0 &&
        newAuth.SECRET_KEY.length > 0 &&
        newAuth.SIMULATION_YN.length > 0;
    return (
        <DismissKeyboardView style={styles.container}>
            {/* ① 계좌번호 입력 라인 */}
            <TextInput
                ref={acctRef}
                style={styles.input}
                placeholder="계좌번호"
                value={form.ACCOUNT_NO}
                onChangeText={t => handleChange('ACCOUNT_NO', t)}
                keyboardType="number-pad"
            />

            {/* ② 보안키 선택 + 추가 버튼 라인 */}
            <View style={styles.authRow}>
                {/* 권한 선택 필드 */}
                <Pressable style={[styles.input, {flex: 1}]} onPress={() => setPickerVisible(true)}>
                    <Text style={form.AUTH_ID ? styles.text : styles.placeholder}>
                        {form.AUTH_ID
                            ? authList.find(a => a.AUTH_ID === form.AUTH_ID)?.AUTH_NAME
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
                        <Picker.Item<number> label="보안키 선택" value={0} />
                        {authList.map(a => (
                            <Picker.Item<number> key={a.AUTH_ID} label={a.AUTH_NAME} value={a.AUTH_ID} />
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
                    <Pressable style={styles.backdrop} onPress={() => { setIsAddModalVisible(false); setNewAuth({ SIMULATION_YN: 'N', AUTH_NAME: '', API_KEY: '', SECRET_KEY: '' }); }} />
                    <View style={styles.modalContent}>
                        <View style={{margin: 10, flexDirection: 'row', justifyContent: 'flex-end'}}>
                            <AuthToggle
                                isOn={isOn}
                                onToggle={() => {
                                setIsOn(prev => !prev)
                                setNewAuth((prev) => ({ ...prev, SIMULATION_YN: isOn ? 'Y' : 'N' }))}}
                            />
                        </View>
                        <TextInput
                            style={styles.inputSmall}
                            placeholder="보안키 이름"
                            value={newAuth.AUTH_NAME}
                            onChangeText={(text) => setNewAuth((prev) => ({ ...prev, AUTH_NAME: text }))}
                        />
                        <TextInput
                            style={styles.inputLarge}
                            placeholder="App Key"
                            value={newAuth.API_KEY}
                            onChangeText={(text) => setNewAuth((prev) => ({ ...prev, API_KEY: text }))}
                        />
                        <TextInput
                            style={styles.inputLarge}
                            placeholder="App Secret"
                            value={newAuth.SECRET_KEY}
                            onChangeText={(text) => setNewAuth((prev) => ({ ...prev, SECRET_KEY: text }))}
                        />
                        <TouchableOpacity style={styles.saveBtn} onPress={handleAddAuth}>
                            <Text style={styles.saveTxt}>완료</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.saveBtn,
                                isAuthEnabled ? styles.saveEnabled : styles.saveDisabled,
                            ]}
                            onPress={handleAddAuth}
                        >
                            <Text style={styles.saveTxt}>등록</Text>
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
        zIndex: 1, // Ensure it appears above the backdrop
    },
    inputSmall: {
        borderWidth: 1,
        borderColor: '#ddd',    // SignupScreen input 테두리와 동일톤
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        marginBottom: 15,
        minHeight: 40,
    },
    inputLarge: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
        marginBottom: 15,
        minHeight: 70,
        textAlignVertical: 'top',
    },
});
