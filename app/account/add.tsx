import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    Alert,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    useWindowDimensions,
    View,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import AppTouchable from '../../components/common/AppTouchable';
import AppButton from '../../components/common/AppButton';
import {useRouter} from 'expo-router';
import {
    addAccount,
    AddAccountRequest,
    addAuth,
    deleteAuth,
    getAuthDeleteImpact,
    getAuthList,
    verifyAccount,
} from "../../contexts/backEndApi";
import {AddAuthRequest, AuthStatus} from "../../types/auth";
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {Colors, Shadows, FontSizes, Spacing, BorderRadius} from '../../constants/theme';
import {buildDeleteImpactAlert} from '../../utils/deleteImpact';

/* 보안키 입력 폼 초기값 — 초기 상태와 리셋 경로가 어긋나지 않도록 한 곳에서 관리 */
const EMPTY_AUTH: AddAuthRequest = {SIMULATION_YN: 'N', AUTH_NAME: '', API_KEY: '', SECRET_KEY: ''};

/* 하단 시트 높이 비율 (고정 px 대신 화면 높이 기준 — 반응형) */
const PICKER_MIN_RATIO = 0.4;
const PICKER_MAX_RATIO = 0.75;
const ADD_SHEET_MAX_RATIO = 0.9;

export default function AddAccountScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const {height: screenHeight} = useWindowDimensions();
    const acctRef = useRef<TextInput | null>(null);

    const [form, setForm] = useState<AddAccountRequest>({ACCOUNT_NO: '', AUTH_ID: 0});
    const [authList, setAuthList] = useState<AuthStatus[]>([]);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [newAuth, setNewAuth] = useState<AddAuthRequest>(EMPTY_AUTH);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    /* ─ 권한 목록 불러오기 ─ */
    useEffect(() => {
        const fetchAuthList = async () => {
            const response = await getAuthList();
            setAuthList(response || []);
        };
        fetchAuthList();
    }, []);

    /* ─ 반응형 치수: 화면 높이·safe area에 따라 매 렌더가 아닌 값 변경 시에만 재계산 ─ */
    const pickerSheetSize = useMemo(() => ({
        minHeight: screenHeight * PICKER_MIN_RATIO,
        maxHeight: screenHeight * PICKER_MAX_RATIO,
        paddingBottom: Math.max(insets.bottom, Spacing.xl),
    }), [screenHeight, insets.bottom]);

    const addSheetSize = useMemo(() => ({
        maxHeight: screenHeight * ADD_SHEET_MAX_RATIO,
    }), [screenHeight]);

    const sheetFooterPadding = useMemo(() => ({
        paddingBottom: Math.max(insets.bottom, Spacing.lg),
    }), [insets.bottom]);

    const handleChange = (field: keyof AddAccountRequest, value: string | number) =>
        setForm(prev => ({...prev, [field]: value}));

    /* ─ 계좌 저장 ─ */
    const handleSave = async () => {
        if (!form.ACCOUNT_NO) return (acctRef.current as TextInput)?.focus();
        if (!form.AUTH_ID) return Alert.alert('알림', '보안 키를 선택하세요.');

        setIsSubmitting(true);
        try {
            const isValid = await verifyAccount(form);
            if (!isValid) {
                Alert.alert('검증 실패', '계좌번호 또는 보안키를 확인해주세요.');
                return;
            }

            await addAccount(form);
            Alert.alert('완료', '계좌가 추가되었습니다.');
            router.back();
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ─ 보안키 추가 시트 닫기 (backdrop·X버튼·Android 뒤로가기 공통 경로) ─ */
    const closeAddModal = useCallback(() => {
        setIsAddModalVisible(false);
        setNewAuth(EMPTY_AUTH);
    }, []);

    /* 부분 입력도 잡아야 하므로 isAuthEnabled(전 필드 충족)와 별도로 판별한다 */
    const hasAuthInput =
        newAuth.AUTH_NAME.length > 0 ||
        newAuth.API_KEY.length > 0 ||
        newAuth.SECRET_KEY.length > 0;

    /* ─ 시트 바깥 탭의 의도를 3단계로 해석 ─ */
    const handleBackdropPress = useCallback(() => {
        // 1) 키보드를 내리려는 탭 — 시트와 입력값은 그대로 둔다
        if (Keyboard.isVisible()) {
            Keyboard.dismiss();
            return;
        }
        // 2) 작성 중인 내용이 있으면 실수로 날리지 않도록 확인받는다
        if (hasAuthInput) {
            Alert.alert('입력 취소', '작성 중인 내용이 사라집니다. 닫을까요?', [
                {text: '계속 입력', style: 'cancel'},
                {text: '닫기', style: 'destructive', onPress: closeAddModal},
            ]);
            return;
        }
        // 3) 빈 상태면 바로 닫는다
        closeAddModal();
    }, [hasAuthInput, closeAddModal]);

    const handleAddAuth = async () => {
        if (!newAuth.SIMULATION_YN || !newAuth.API_KEY || !newAuth.SECRET_KEY) {
            return Alert.alert('알림', '모든 필드를 입력하세요.');
        }

        try {
            const response = await addAuth(newAuth);
            if (!response) return;
            setAuthList((prev) => [...prev, response as AuthStatus]);
            handleChange('AUTH_ID', response.AUTH_ID);
            closeAddModal();
        } catch (error: any) {
            Alert.alert('오류', error.response?.data || error.message);
        }
    };

    const handleDeleteAuth = async (auth: AuthStatus) => {
        // 보안키를 지우면 그 키로 등록한 계좌 전체와 그 계좌들의 자동매매까지 사라진다.
        // 영향도를 모른 채 확인창을 띄우면 경고 없이 보유 포지션이 방치되므로, 실패 시 중단한다.
        const impact = await getAuthDeleteImpact(auth.AUTH_ID);
        if (!impact) return;

        const {title, message} = buildDeleteImpactAlert(
            {kind: 'auth', label: auth.AUTH_NAME},
            impact,
        );

        Alert.alert(title, message, [
            {text: '취소', style: 'cancel'},
            {
                text: '삭제',
                style: 'destructive',
                onPress: async () => {
                    const success = await deleteAuth(auth.AUTH_ID);
                    if (success) {
                        setAuthList(prev => prev.filter(a => a.AUTH_ID !== auth.AUTH_ID));
                        if (form.AUTH_ID === auth.AUTH_ID) {
                            handleChange('AUTH_ID', 0);
                        }
                    }
                },
            },
        ]);
    };

    const isFormValid = form.ACCOUNT_NO.length > 0 && form.AUTH_ID > 0;
    const isAuthEnabled =
        newAuth.AUTH_NAME.length > 0 &&
        newAuth.API_KEY.length > 0 &&
        newAuth.SECRET_KEY.length > 0;

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            {/* 헤더가 없는 화면이므로 keyboardVerticalOffset은 0 */}
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    style={styles.flex}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* 빈 영역 탭으로 키보드 내리기 */}
                    <Pressable onPress={Keyboard.dismiss} accessible={false}>
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
                                <AppTouchable style={styles.selectField} onPress={() => setPickerVisible(true)}>
                                    <Text style={form.AUTH_ID ? styles.selectText : styles.selectPlaceholder}>
                                        {form.AUTH_ID
                                            ? authList.find(a => a.AUTH_ID === form.AUTH_ID)?.AUTH_NAME
                                            : '보안키를 선택하세요'}
                                    </Text>
                                    <Ionicons name="chevron-down" size={18} color={Colors.textSecondary} />
                                </AppTouchable>
                                <AppTouchable style={styles.authAddBtn} onPress={() => setIsAddModalVisible(true)}>
                                    <Ionicons name="add" size={20} color={Colors.textWhite} />
                                </AppTouchable>
                            </View>
                        </View>
                    </Pressable>
                </ScrollView>

                {/* 하단 고정 등록 버튼 — absolute가 아닌 형제 플렉스라 키보드와 함께 밀린다 */}
                <View style={[styles.bottomBar, sheetFooterPadding]}>
                    {/* 기존 isSubmitting 상태를 그대로 loading 으로 넘긴다 (모래시계 → 스피너) */}
                    <AppButton
                        style={[styles.submitButton, isFormValid && !isSubmitting ? styles.submitEnabled : styles.submitDisabled]}
                        textStyle={styles.submitText}
                        disabled={!isFormValid}
                        loading={isSubmitting}
                        onPress={handleSave}
                        title="계좌 등록"
                        loadingText="검증 중..."
                        icon={
                            <Ionicons
                                name="checkmark-circle-outline"
                                size={20}
                                color={Colors.textWhite}
                            />
                        }
                    />
                </View>
            </KeyboardAvoidingView>

            {/* 보안키 선택 시트 */}
            <Modal
                transparent
                visible={pickerVisible}
                animationType="slide"
                onRequestClose={() => setPickerVisible(false)}
            >
                <View style={styles.sheetContainer}>
                    <Pressable style={styles.backdrop} onPress={() => setPickerVisible(false)} />
                    <View style={[styles.sheet, pickerSheetSize]}>
                        <View style={styles.sheetHandle} />
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerHeaderTitle}>보안키 선택</Text>
                            <AppTouchable onPress={() => setPickerVisible(false)}>
                                <Ionicons name="close" size={24} color={Colors.textSecondary} />
                            </AppTouchable>
                        </View>
                        <FlatList
                            data={authList}
                            keyExtractor={item => String(item.AUTH_ID)}
                            style={styles.sheetList}
                            contentContainerStyle={styles.pickerListContent}
                            renderItem={({item}) => (
                                <AppTouchable
                                    style={[
                                        styles.authListItem,
                                        form.AUTH_ID === item.AUTH_ID && styles.authListItemSelected,
                                    ]}
                                    onPress={() => {
                                        handleChange('AUTH_ID', item.AUTH_ID);
                                        setPickerVisible(false);
                                    }}
                                >
                                    <View style={styles.authListItemLeft}>
                                        {form.AUTH_ID === item.AUTH_ID && (
                                            <Ionicons name="checkmark" size={18} color={Colors.primary} />
                                        )}
                                        <Text style={[
                                            styles.authListItemText,
                                            form.AUTH_ID === item.AUTH_ID && styles.authListItemTextSelected,
                                        ]}>
                                            {item.AUTH_NAME}
                                        </Text>
                                    </View>
                                    <AppTouchable
                                        onPress={() => handleDeleteAuth(item)}
                                        hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
                                    >
                                        <Ionicons name="trash-outline" size={18} color={Colors.error} />
                                    </AppTouchable>
                                </AppTouchable>
                            )}
                            ListEmptyComponent={
                                <View style={styles.authListEmptyBox}>
                                    <Ionicons name="key-outline" size={32} color={Colors.textMuted} />
                                    <Text style={styles.authListEmpty}>등록된 보안키가 없습니다</Text>
                                </View>
                            }
                        />
                    </View>
                </View>
            </Modal>

            {/* 보안키 추가 시트 — 중앙 다이얼로그는 키보드에 구조적으로 가려지므로 하단 시트로 둔다 */}
            <Modal
                transparent
                visible={isAddModalVisible}
                animationType="slide"
                onRequestClose={closeAddModal}
            >
                <KeyboardAvoidingView
                    style={styles.sheetContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={0}
                >
                    <Pressable style={styles.backdrop} onPress={handleBackdropPress} />
                    <View style={[styles.sheet, addSheetSize]}>
                        <View style={styles.sheetHandle} />
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>보안키 추가</Text>
                            <AppTouchable onPress={closeAddModal}>
                                <Ionicons name="close" size={24} color={Colors.textSecondary} />
                            </AppTouchable>
                        </View>

                        {/* 입력부만 스크롤 — 등록 버튼은 항상 시트 하단에 남는다 */}
                        <ScrollView
                            style={styles.sheetScroll}
                            contentContainerStyle={styles.sheetScrollContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            {/* 투자 모드 - 세그먼트 칩 */}
                            <Text style={styles.inputLabel}>투자 모드</Text>
                            <View style={styles.chipContainer}>
                                <AppTouchable
                                    style={[styles.chip, newAuth.SIMULATION_YN === 'N' && styles.chipSelected]}
                                    onPress={() => setNewAuth(prev => ({...prev, SIMULATION_YN: 'N'}))}
                                    // 선택 컨트롤 — 빠른 정정(눌렀다 바로 다른 값 선택)까지 삼키면 안 되므로 쿨다운 없음
                                    cooldownMs={0}
                                >
                                    <Ionicons
                                        name="trending-up-outline"
                                        size={16}
                                        color={newAuth.SIMULATION_YN === 'N' ? Colors.textWhite : Colors.textSecondary}
                                    />
                                    <Text style={[styles.chipText, newAuth.SIMULATION_YN === 'N' && styles.chipTextSelected]}>
                                        실전
                                    </Text>
                                </AppTouchable>
                                <AppTouchable
                                    style={[styles.chip, newAuth.SIMULATION_YN === 'Y' && styles.chipSelected]}
                                    onPress={() => setNewAuth(prev => ({...prev, SIMULATION_YN: 'Y'}))}
                                    // 선택 컨트롤 — 빠른 정정(눌렀다 바로 다른 값 선택)까지 삼키면 안 되므로 쿨다운 없음
                                    cooldownMs={0}
                                >
                                    <Ionicons
                                        name="flask-outline"
                                        size={16}
                                        color={newAuth.SIMULATION_YN === 'Y' ? Colors.textWhite : Colors.textSecondary}
                                    />
                                    <Text style={[styles.chipText, newAuth.SIMULATION_YN === 'Y' && styles.chipTextSelected]}>
                                        모의
                                    </Text>
                                </AppTouchable>
                            </View>

                            <Text style={styles.inputLabel}>보안키 이름</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="보안키 이름을 입력하세요"
                                placeholderTextColor={Colors.textMuted}
                                value={newAuth.AUTH_NAME}
                                onChangeText={(text) => setNewAuth((prev) => ({...prev, AUTH_NAME: text}))}
                            />

                            {/* App Key/Secret은 대소문자를 구분하는 자격증명 — iOS 자동 보정을 모두 끈다 */}
                            <Text style={styles.inputLabel}>App Key</Text>
                            <TextInput
                                style={[styles.modalInput, styles.modalInputLarge]}
                                placeholder="App Key를 입력하세요"
                                placeholderTextColor={Colors.textMuted}
                                value={newAuth.API_KEY}
                                onChangeText={(text) => setNewAuth((prev) => ({...prev, API_KEY: text}))}
                                autoCapitalize="none"
                                autoCorrect={false}
                                spellCheck={false}
                                textContentType="none"
                            />

                            <Text style={styles.inputLabel}>App Secret</Text>
                            <TextInput
                                style={[styles.modalInput, styles.modalInputSecret]}
                                placeholder="App Secret을 입력하세요"
                                placeholderTextColor={Colors.textMuted}
                                value={newAuth.SECRET_KEY}
                                onChangeText={(text) => setNewAuth((prev) => ({...prev, SECRET_KEY: text}))}
                                multiline
                                autoCapitalize="none"
                                autoCorrect={false}
                                spellCheck={false}
                                textContentType="none"
                            />
                        </ScrollView>

                        <View style={[styles.sheetFooter, sheetFooterPadding]}>
                            <AppButton
                                style={[styles.submitButton, isAuthEnabled ? styles.submitEnabled : styles.submitDisabled]}
                                textStyle={styles.submitText}
                                disabled={!isAuthEnabled}
                                onPress={handleAddAuth}
                                title="등록"
                                loadingText="등록 중..."
                                icon={
                                    <Ionicons
                                        name="checkmark-circle-outline"
                                        size={20}
                                        color={Colors.textWhite}
                                    />
                                }
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    flex: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: Spacing.xl,
        paddingBottom: Spacing.xxl,
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

    /* 화면 하단 고정 버튼 바 */
    bottomBar: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
        backgroundColor: Colors.cardBackground,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
    },

    // 등록 버튼 (stock/add.tsx 패턴)
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.md,
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

    /* 하단 시트 공통 */
    sheetContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
        backgroundColor: Colors.cardBackground,
        borderTopLeftRadius: BorderRadius.lg,
        borderTopRightRadius: BorderRadius.lg,
    },
    sheetHandle: {
        width: 40,
        height: 4,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.border,
        alignSelf: 'center',
        marginTop: Spacing.md,
    },
    // RN(Yoga)은 flexShrink 기본값이 0이라, 명시하지 않으면 스크롤 영역이
    // 시트의 maxHeight를 무시하고 그대로 넘친다.
    sheetScroll: {
        flexShrink: 1,
    },
    // 리스트는 시트 minHeight의 남는 공간까지 채워야 하므로 grow도 함께 준다.
    sheetList: {
        flexGrow: 1,
        flexShrink: 1,
    },
    sheetScrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
    },
    sheetFooter: {
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
    },

    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        // 좌우 여백을 리스트 항목과 맞춘다
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    pickerHeaderTitle: {
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    pickerListContent: {
        flexGrow: 1,
    },

    /* 보안키 리스트 항목 */
    authListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        // 행 자체를 높인다. minHeight로 글자 길이와 무관하게 높이를 보장한다.
        minHeight: 72,
        paddingVertical: Spacing.xl,
        paddingHorizontal: Spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    authListItemSelected: {
        backgroundColor: 'rgba(59,130,246,0.08)',
    },
    authListItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        flex: 1,
    },
    authListItemText: {
        fontSize: FontSizes.lg,
        color: Colors.textPrimary,
    },
    authListItemTextSelected: {
        color: Colors.primary,
        fontWeight: '600',
    },
    authListEmptyBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.xxl,
    },
    authListEmpty: {
        textAlign: 'center',
        color: Colors.textSecondary,
        fontSize: FontSizes.md,
    },
    /* 보안키 추가 시트 */
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.lg,
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
