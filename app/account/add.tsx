import React, {useEffect, useRef, useState} from 'react';
import {
    Alert,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ScrollView,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import DismissKeyboardView from '../../components/DismissKeyboardView';
import {
    addAccount,
    AddAccountRequest,
    addAuth,
    getAuthList
} from "../../contexts/backEndApi";
import {AddAuthRequest, AuthStatus} from "../../types/auth";
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors, Shadows, FontSizes, Spacing, BorderRadius} from '../../constants/theme';


export default function AddAccountScreen() {
    const router = useRouter();
    const acctRef = useRef<TextInput | null>(null);

    const [form, setForm] = useState<AddAccountRequest>({ACCOUNT_NO: '', AUTH_ID: 0});
    const [authList, setAuthList] = useState<AuthStatus[]>([]);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [newAuth, setNewAuth] = useState<AddAuthRequest>({ SIMULATION_YN: 'N', AUTH_NAME: '', API_KEY: '', SECRET_KEY: '' });
    const [focusedField, setFocusedField] = useState<string | null>(null);

    /* ─ 권한 목록 불러오기 ─ */
    useEffect(() => {
        const fetchAuthList = async () => {
            const response = await getAuthList();
            setAuthList(response || []);
        };
        fetchAuthList();
    }, []);

    const handleChange = (field: keyof AddAccountRequest, value: string | number) =>
        setForm(prev => ({...prev, [field]: value}));

    /* ─ 계좌 저장 ─ */
    const handleSave = async () => {
        if (!form.ACCOUNT_NO) return (acctRef.current as TextInput)?.focus();
        if (!form.AUTH_ID) return Alert.alert('알림', '보안 키를 선택하세요.');

        await addAccount(form);
        Alert.alert('완료', '계좌가 추가되었습니다.');
        router.back();
    };

    const handleAddAuth = async () => {
        if (!newAuth.SIMULATION_YN || !newAuth.API_KEY || !newAuth.SECRET_KEY) {
            return Alert.alert('알림', '모든 필드를 입력하세요.');
        }

        try {
            const response = await addAuth(newAuth);
            if (!response) return;
            setAuthList((prev) => [...prev, response as AuthStatus]);
            handleChange('AUTH_ID', response.AUTH_ID);
            setNewAuth({SIMULATION_YN: 'Y', AUTH_NAME: '', API_KEY: '', SECRET_KEY: ''});
            setIsAddModalVisible(false);
        } catch (error: any) {
            Alert.alert('오류', error.response?.data || error.message);
        }
    };

    const isFormValid = form.ACCOUNT_NO.length > 0 && form.AUTH_ID > 0;
    const isAuthEnabled =
        newAuth.AUTH_NAME.length > 0 &&
        newAuth.API_KEY.length > 0 &&
        newAuth.SECRET_KEY.length > 0;

    return (
        <DismissKeyboardView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* 계좌번호 입력 */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="card-outline" size={18} color={Colors.primary} />
                        <Text style={styles.sectionTitle}>계좌 정보</Text>
                    </View>
                    <Text style={styles.inputLabel}>계좌번호</Text>
                    <TextInput
                        ref={acctRef}
                        style={[
                            styles.input,
                            focusedField === 'ACCOUNT_NO' && styles.inputFocused,
                        ]}
                        placeholder="계좌번호를 입력하세요"
                        placeholderTextColor={Colors.textMuted}
                        value={form.ACCOUNT_NO}
                        onChangeText={t => handleChange('ACCOUNT_NO', t)}
                        keyboardType="number-pad"
                        onFocus={() => setFocusedField('ACCOUNT_NO')}
                        onBlur={() => setFocusedField(null)}
                    />
                </View>

                {/* 보안키 선택 */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="key-outline" size={18} color={Colors.primary} />
                        <Text style={styles.sectionTitle}>보안키 설정</Text>
                    </View>
                    <Text style={styles.inputLabel}>보안키</Text>
                    <View style={styles.authRow}>
                        <Pressable style={styles.selectField} onPress={() => setPickerVisible(true)}>
                            <Text style={form.AUTH_ID ? styles.selectText : styles.selectPlaceholder}>
                                {form.AUTH_ID
                                    ? authList.find(a => a.AUTH_ID === form.AUTH_ID)?.AUTH_NAME
                                    : '보안키를 선택하세요'}
                            </Text>
                            <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
                        </Pressable>
                        <TouchableOpacity style={styles.authAddBtn} onPress={() => setIsAddModalVisible(true)}>
                            <Ionicons name="add" size={20} color={Colors.textWhite} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 등록 버튼 */}
                <TouchableOpacity
                    style={[styles.submitButton, isFormValid ? styles.submitEnabled : styles.submitDisabled]}
                    disabled={!isFormValid}
                    onPress={handleSave}
                    activeOpacity={0.8}
                >
                    <Ionicons
                        name="checkmark-circle-outline"
                        size={20}
                        color={Colors.textWhite}
                        style={styles.submitIcon}
                    />
                    <Text style={styles.submitText}>계좌 등록</Text>
                </TouchableOpacity>

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </SafeAreaView>

            {/* Picker 모달 */}
            <Modal
                transparent
                visible={pickerVisible}
                animationType="slide"
                onRequestClose={() => setPickerVisible(false)}
            >
                <Pressable style={styles.backdrop} onPress={() => setPickerVisible(false)} />
                <View style={styles.pickerBox}>
                    <View style={styles.pickerHeader}>
                        <Text style={styles.pickerHeaderTitle}>보안키 선택</Text>
                        <TouchableOpacity onPress={() => setPickerVisible(false)}>
                            <Ionicons name="close" size={24} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <Picker
                        selectedValue={form.AUTH_ID}
                        onValueChange={v => {
                            handleChange('AUTH_ID', v);
                            setPickerVisible(false);
                        }}
                    >
                        <Picker.Item label="보안키 선택" value={0} />
                        {authList.map(a => (
                            <Picker.Item key={a.AUTH_ID} label={a.AUTH_NAME} value={a.AUTH_ID} />
                        ))}
                    </Picker>
                </View>
            </Modal>

            {/* 권한 추가 모달 */}
            <Modal
                transparent
                visible={isAddModalVisible}
                animationType="fade"
                onRequestClose={() => setIsAddModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <Pressable style={styles.backdrop} onPress={() => {
                        setIsAddModalVisible(false);
                        setNewAuth({SIMULATION_YN: 'N', AUTH_NAME: '', API_KEY: '', SECRET_KEY: ''});
                    }} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>보안키 추가</Text>
                            <TouchableOpacity onPress={() => {
                                setIsAddModalVisible(false);
                                setNewAuth({SIMULATION_YN: 'N', AUTH_NAME: '', API_KEY: '', SECRET_KEY: ''});
                            }}>
                                <Ionicons name="close" size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* 투자 모드 - 세그먼트 칩 */}
                        <Text style={styles.inputLabel}>투자 모드</Text>
                        <View style={styles.chipContainer}>
                            <TouchableOpacity
                                style={[styles.chip, newAuth.SIMULATION_YN === 'N' && styles.chipSelected]}
                                onPress={() => setNewAuth(prev => ({...prev, SIMULATION_YN: 'N'}))}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name="trending-up-outline"
                                    size={16}
                                    color={newAuth.SIMULATION_YN === 'N' ? Colors.textWhite : Colors.textSecondary}
                                />
                                <Text style={[styles.chipText, newAuth.SIMULATION_YN === 'N' && styles.chipTextSelected]}>
                                    실전
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.chip, newAuth.SIMULATION_YN === 'Y' && styles.chipSelected]}
                                onPress={() => setNewAuth(prev => ({...prev, SIMULATION_YN: 'Y'}))}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name="flask-outline"
                                    size={16}
                                    color={newAuth.SIMULATION_YN === 'Y' ? Colors.textWhite : Colors.textSecondary}
                                />
                                <Text style={[styles.chipText, newAuth.SIMULATION_YN === 'Y' && styles.chipTextSelected]}>
                                    모의
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>보안키 이름</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="보안키 이름을 입력하세요"
                            placeholderTextColor={Colors.textMuted}
                            value={newAuth.AUTH_NAME}
                            onChangeText={(text) => setNewAuth((prev) => ({...prev, AUTH_NAME: text}))}
                        />

                        <Text style={styles.inputLabel}>App Key</Text>
                        <TextInput
                            style={[styles.modalInput, styles.modalInputLarge]}
                            placeholder="App Key를 입력하세요"
                            placeholderTextColor={Colors.textMuted}
                            value={newAuth.API_KEY}
                            onChangeText={(text) => setNewAuth((prev) => ({...prev, API_KEY: text}))}
                        />

                        <Text style={styles.inputLabel}>App Secret</Text>
                        <TextInput
                            style={[styles.modalInput, styles.modalInputSecret]}
                            placeholder="App Secret을 입력하세요"
                            placeholderTextColor={Colors.textMuted}
                            value={newAuth.SECRET_KEY}
                            onChangeText={(text) => setNewAuth((prev) => ({...prev, SECRET_KEY: text}))}
                            multiline
                        />

                        <TouchableOpacity
                            style={[styles.submitButton, isAuthEnabled ? styles.submitEnabled : styles.submitDisabled]}
                            disabled={!isAuthEnabled}
                            onPress={handleAddAuth}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={20}
                                color={Colors.textWhite}
                                style={styles.submitIcon}
                            />
                            <Text style={styles.submitText}>등록</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </DismissKeyboardView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.xl,
    },

    // 카드 공통 (stock/add.tsx 패턴)
    card: {
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        marginBottom: Spacing.lg,
        ...Shadows.small,
    },

    // 섹션 헤더 (stock/add.tsx 패턴)
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: FontSizes.md,
        fontWeight: '700',
        color: Colors.textPrimary,
    },

    inputLabel: {
        fontSize: FontSizes.md,
        fontWeight: '500',
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
    },
    input: {
        borderWidth: 1.5,
        borderColor: Colors.inputBorder,
        borderRadius: BorderRadius.sm,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        fontSize: FontSizes.lg,
        color: Colors.textPrimary,
        backgroundColor: Colors.inputBackground,
    },
    inputFocused: {
        borderColor: Colors.primary,
        backgroundColor: Colors.cardBackground,
    },
    authRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    selectField: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: Colors.inputBorder,
        borderRadius: BorderRadius.sm,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        backgroundColor: Colors.inputBackground,
    },
    selectText: {
        fontSize: FontSizes.lg,
        color: Colors.textPrimary,
    },
    selectPlaceholder: {
        fontSize: FontSizes.lg,
        color: Colors.textMuted,
    },
    authAddBtn: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // 등록 버튼 (stock/add.tsx 패턴)
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.sm,
        ...Platform.select({
            ios: {
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    submitEnabled: {
        backgroundColor: Colors.primary,
    },
    submitDisabled: {
        backgroundColor: Colors.inactive,
        ...Platform.select({
            ios: { shadowOpacity: 0 },
            android: { elevation: 0 },
        }),
    },
    submitIcon: {
        marginRight: Spacing.sm,
    },
    submitText: {
        color: Colors.textWhite,
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
    },
    bottomSpacing: {
        height: Spacing.xxl,
    },

    /* Picker 모달 */
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    pickerBox: {
        backgroundColor: Colors.cardBackground,
        borderTopLeftRadius: BorderRadius.lg,
        borderTopRightRadius: BorderRadius.lg,
        paddingBottom: Spacing.xl,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    pickerHeaderTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.textPrimary,
    },

    /* 권한 추가 모달 */
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        width: '90%',
        zIndex: 1,
        ...Shadows.medium,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    modalTitle: {
        fontSize: FontSizes.xl,
        fontWeight: 'bold',
        color: Colors.textPrimary,
    },

    // 칩 스타일 (stock/add.tsx 패턴)
    chipContainer: {
        flexDirection: 'row',
        gap: Spacing.sm + 2,
        marginBottom: Spacing.lg,
    },
    chip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm + 2,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.background,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    chipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    chipText: {
        fontSize: FontSizes.md,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    chipTextSelected: {
        color: Colors.textWhite,
    },

    modalInput: {
        borderWidth: 1.5,
        borderColor: Colors.inputBorder,
        borderRadius: BorderRadius.sm,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        fontSize: FontSizes.md,
        color: Colors.textPrimary,
        backgroundColor: Colors.inputBackground,
        marginBottom: Spacing.md,
    },
    modalInputLarge: {
        minHeight: 60,
        textAlignVertical: 'top',
    },
    modalInputSecret: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
});
