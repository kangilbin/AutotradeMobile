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
// import {fetchAuthList, addAccount} from '../../../contexts/backEndApi';
import DismissKeyboardView from '../../../components/DismissKeyboardView';

interface FormState {
    ACCOUNT_NO: string;
    AUTH_CODE: string;
}

export default function AddAccountScreen() {
    const router = useRouter();
    const acctRef = useRef<TextInput | null>(null);

    const [form, setForm] = useState<FormState>({ACCOUNT_NO: '', AUTH_CODE: ''});
    const [authList, setAuthList] = useState<{code: string; name: string}[]>([]);
    const [pickerVisible, setPickerVisible] = useState(false);

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

    const handleChange = (field: keyof FormState, value: string) =>
        setForm(prev => ({...prev, [field]: value}));

    /* ─ 계좌 저장 ─ */
    const handleSave = async () => {
        if (!form.ACCOUNT_NO) return acctRef.current?.focus();
        if (!form.AUTH_CODE) return Alert.alert('알림', '권한을 선택하세요.');

        try {
            // const {success} = await addAccount(form);
            // if (success) {
            //     Alert.alert('완료', '계좌가 추가되었습니다.');
            //     router.back();
            // }
        } catch (e: any) {
            Alert.alert('실패', e?.message ?? '오류가 발생했습니다.');
        }
    };

    /* ─ JSX ─ */
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

            {/* ② 권한 선택 + 추가 버튼 라인 */}
            <View style={styles.authRow}>
                {/* 권한 선택 필드 */}
                <Pressable style={[styles.input, {flex: 1}]} onPress={() => setPickerVisible(true)}>
                    <Text style={form.AUTH_CODE ? styles.text : styles.placeholder}>
                        {form.AUTH_CODE
                            ? authList.find(a => a.code === form.AUTH_CODE)?.name
                            : '권한 선택'}
                    </Text>
                </Pressable>

                {/* 추가 버튼 */}
                <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/addAuth')}>
                    <Text style={styles.addBtnTxt}>추가</Text>
                </TouchableOpacity>
            </View>

            {/* ③ 저장 버튼 */}
            <TouchableOpacity
                style={[
                    styles.saveBtn,
                    form.ACCOUNT_NO && form.AUTH_CODE ? styles.saveEnabled : styles.saveDisabled,
                ]}
                disabled={!form.ACCOUNT_NO || !form.AUTH_CODE}
                onPress={handleSave}
            >
                <Text style={styles.saveTxt}>계좌 추가</Text>
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
                        selectedValue={form.AUTH_CODE}
                        onValueChange={v => {
                            handleChange('AUTH_CODE', v);
                            setPickerVisible(false);
                        }}
                    >
                        <Picker.Item label="권한 선택" value="" />
                        {authList.map(a => (
                            <Picker.Item key={a.code} label={a.name} value={a.code} />
                        ))}
                    </Picker>
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
    /* 권한 라인 */
    authRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 15},
    addBtn: {
        marginLeft: 10,
        paddingHorizontal: 14,
        paddingVertical: 14,
        backgroundColor: '#B5EAD7',
        borderRadius: 10,
    },
    addBtnTxt: {color: '#fff', fontWeight: 'bold'},
    /* 저장 버튼 */
    saveBtn: {padding: 15, borderRadius: 10, alignItems: 'center'},
    saveEnabled: {backgroundColor: '#B5EAD7'},
    saveDisabled: {backgroundColor: '#d3d3d3'},
    saveTxt: {color: '#fff', fontWeight: 'bold'},
    /* 모달 */
    backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)'},
    pickerBox: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingBottom: 20,
    },
});
