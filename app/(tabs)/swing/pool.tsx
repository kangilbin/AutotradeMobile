import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AppTouchable from '../../../components/common/AppTouchable';
import AppButton from '../../../components/common/AppButton';
import LoadingIndicator from '../../../components/LoadingIndicator';
import { getPoolSettings, updatePoolSetting, getParkingStatus, parkIdleCash } from '../../../contexts/backEndApi';
import { useAccountStore } from '../../../stores/useAccountStore';
import { useMarketStore } from '../../../utils/useMarketStore';
import { PoolSetting, ParkingStatus, PARK_ETF_LABEL, poolMarketOf } from '../../../types/pool';
import { formatAmountWithUnit } from '../../../utils/format';
import {
    poolCapacity, derivePoolRules, WIDEST_STOP_PCT, PoolBinding, MIN_POSITIONS, MAX_POSITIONS, DEFAULT_POSITIONS,
} from '../../../utils/poolCapacity';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../../constants';

// 서버는 비율(0.001), 화면은 % (0.1) — 변환은 여기서만 한다
const toPct = (v: number): string => String(Number((v * 100).toFixed(4)));
// 빈 칸은 Number('') === 0 이라 0% 로 읽히므로 유효하지 않은 값(NaN)으로 취급한다
const fromPct = (text: string): number => (text.trim() === '' ? NaN : Number(text.trim()) / 100);

// 사용자가 정하는 값은 동시 보유 종목 수와 파킹 때 남길 현금 비율이다. 종목당 최대 비중·거래당 리스크는 종목 수에서 자동으로
// 정해지고(서버와 같은 식 — derivePoolRules) 미청산 리스크 한도는 고정이라 표시만 한다.
interface FormState {
    maxPositions: number;
    parkReservePct: string;
}

const BINDING_LABEL: Record<PoolBinding, string> = {
    count: '동시 보유 종목 수',
    openRisk: '전체 미청산 리스크 한도',
    cash: '현금 (총자산을 넘는 매수는 하지 않음)',
};

const toForm = (s: PoolSetting): FormState => ({
    // 허용 범위 밖 값(예전 행)이 와도 저장이 422 로 막히지 않도록 범위 안으로 맞춘다
    maxPositions: Math.min(MAX_POSITIONS, Math.max(MIN_POSITIONS, Number(s.MAX_POSITIONS) || DEFAULT_POSITIONS)),
    parkReservePct: toPct(Number(s.PARK_RESERVE_PCT)),
});

/**
 * 매수 규칙(고정)과 현금 파킹 설정 — 계좌 × 현재 선택된 시장(국내/미국) 단위.
 * 자동 매수를 켜는 스위치는 없다: 종목을 활성화(스윙 USE_YN)하면 서버가 이 계좌·시장의 풀을 켜 두고
 * 총자산 대비 리스크 규칙으로 수량을 정해 매수한다 (종목별 금액(배정금)은 없다).
 * 파킹은 스위치가 아니라 '변환' 버튼이다 — 누르는 시점의 현금(추가 입금·분배금 포함)에서 남길 비율을 뺀 만큼 파킹 ETF를
 * 사 둔다. 해제(매도)는 풀 매수에서 현금이 모자랄 때 서버가 알아서 한다.
 */
export default function PoolSettingScreen() {
    const router = useRouter();
    const account = useAccountStore((state) => state.account);
    const mrktCode = useMarketStore((s) => s.mrktCode);
    const market = poolMarketOf(mrktCode);
    const marketLabel = market === 'KR' ? '국내' : '미국';

    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState<PoolSetting | null>(null);
    const [form, setForm] = useState<FormState | null>(null);
    const [parking, setParking] = useState<ParkingStatus | null>(null);
    // 시장·계좌를 바꾸거나 저장 직후 다시 읽을 때 먼저 보낸 요청의 늦은 응답이 최신 값을 덮어쓰지 않게 한다
    const loadSeq = useRef(0);

    // 입력 중인 종목 수 기준으로 비중·리스크를 미리 계산하고, '실제로 몇 종목까지 들어가는지'도 보여준다 (저장 전에도 즉시 반영)
    const rules = useMemo(() => (form ? derivePoolRules(form.maxPositions) : null), [form?.maxPositions]);
    const capacity = useMemo(() => {
        if (!saved || !rules || !form) return null;
        return poolCapacity(rules.riskPct, rules.maxPositionPct, Number(saved.MAX_OPEN_RISK_PCT), form.maxPositions);
    }, [saved, rules, form?.maxPositions]);

    const load = useCallback(async () => {
        if (!account?.ACCOUNT_NO) return;
        const seq = ++loadSeq.current;
        setLoading(true);
        const list = await getPoolSettings(account.ACCOUNT_NO);
        if (seq !== loadSeq.current) return;
        const current = list?.find(s => s.MARKET === market) ?? null;
        setSaved(current);
        setForm(current ? toForm(current) : null);
        setLoading(false);
        // 풀이 켜져 있을 때만 파킹 보유 현황을 읽는다 (아니면 서버가 400)
        setParking(null);
        if (current?.USE_YN === 'Y') {
            const status = (await getParkingStatus(account.ACCOUNT_NO, market)) ?? null;
            if (seq === loadSeq.current) setParking(status);
        }
    }, [account?.ACCOUNT_NO, market]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const update = (patch: Partial<FormState>) => setForm(prev => (prev ? { ...prev, ...patch } : prev));

    const persist = async () => {
        if (!account?.ACCOUNT_NO || !form) return;
        const reserve = fromPct(form.parkReservePct);
        if (!Number.isFinite(reserve)) {
            Alert.alert('입력 오류', '숫자만 입력해주세요.');
            return;
        }
        const result = await updatePoolSetting({
            ACCOUNT_NO: account.ACCOUNT_NO,
            MARKET: market,
            MAX_POSITIONS: form.maxPositions,
            PARK_RESERVE_PCT: reserve,
        });
        if (result) {
            setSaved(result);
            setForm(toForm(result));
            load();   // 파킹 현황 갱신
            Alert.alert('완료', '풀 설정을 저장했습니다.');
        }
    };

    // 현금 → 파킹 ETF 변환 — 입력한 남길 비율을 먼저 저장해(바뀐 경우만) 서버가 그 값으로 계산하게 한다.
    // 풀이 아직 꺼져 있으면(처음 들어온 계좌) 같은 저장에서 켜 둔다 — 서버는 풀이 꺼진 계좌의 파킹을 거절한다
    const handlePark = () => {
        if (!account?.ACCOUNT_NO || !form) return;
        const reserve = fromPct(form.parkReservePct);
        if (!Number.isFinite(reserve)) {
            Alert.alert('입력 오류', '남길 현금 비율을 숫자로 입력해주세요.');
            return;
        }
        const poolOff = saved?.USE_YN !== 'Y';
        Alert.alert(
            '현금 파킹',
            `${marketLabel} 계좌의 현재 현금에서 총자산의 ${form.parkReservePct}%를 남기고 나머지를 ${PARK_ETF_LABEL[market]}로 변환합니다.\n` +
            '이미 보유한 파킹 ETF는 그대로 두고, 남는 현금만큼 추가로 매수합니다.\n' +
            '매수 신호가 나면 필요한 만큼 자동으로 매도해 현금을 만듭니다.' +
            (poolOff ? '\n풀 설정이 아직 꺼져 있어 함께 저장(켜기)합니다.' : ''),
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '변환',
                    onPress: async () => {
                        if (!saved || poolOff || Number(reserve.toFixed(6)) !== Number(Number(saved.PARK_RESERVE_PCT).toFixed(6))) {
                            const result = await updatePoolSetting({
                                ACCOUNT_NO: account.ACCOUNT_NO,
                                MARKET: market,
                                PARK_RESERVE_PCT: reserve,
                                ...(poolOff && { USE_YN: 'Y' as const }),
                            });
                            if (!result) return;
                            setSaved(result);
                        }
                        const parked = await parkIdleCash(account.ACCOUNT_NO, market);
                        if (!parked) return;
                        const title = parked.STATUS === 'parked' ? '완료' : '알림';
                        const message = parked.STATUS === 'parked'
                            ? `${parked.QTY}주를 매수했습니다.`
                            : parked.MESSAGE || '파킹하지 못했습니다.';
                        Alert.alert(title, message);
                        load();
                    },
                },
            ],
        );
    };

    const handleSave = async () => {
        if (!form || !saved) return;
        await persist();
    };

    if (loading) return <LoadingIndicator />;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <AppTouchable style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
                </AppTouchable>
                <Text style={styles.headerTitle}>풀 설정 · {marketLabel}</Text>
            </View>

            {!form ? (
                <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>풀 설정을 불러오지 못했습니다.</Text>
                    <AppButton style={styles.saveButton} textStyle={styles.saveText} title="다시 시도" onPress={load} />
                </View>
            ) : (
                // iOS: 키보드 높이만큼 스크롤 인셋을 늘리고 포커스된 입력창이 보이게 스크롤한다 (탭바 높이도 알아서 반영).
                // Android 는 기본 adjustResize 로 창이 줄어들어 따로 처리할 필요가 없다.
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"
                            automaticallyAdjustKeyboardInsets>
                    <View style={styles.card}>
                        <Text style={styles.label}>매수 규칙</Text>
                        <View style={styles.field}>
                            <View style={styles.fieldText}>
                                <Text style={styles.label}>동시 보유 종목 수</Text>
                                <Text style={styles.hint}>
                                    {MIN_POSITIONS}~{MAX_POSITIONS}종목. 관심 종목이 아무리 많아도 실제 보유는 이 수까지입니다.
                                </Text>
                            </View>
                            <View style={styles.stepper}>
                                <AppTouchable
                                    style={[styles.stepButton, form.maxPositions <= MIN_POSITIONS && styles.stepButtonDisabled]}
                                    onPress={() => update({ maxPositions: Math.max(MIN_POSITIONS, form.maxPositions - 1) })}
                                    cooldownMs={0}
                                >
                                    <Ionicons name="remove" size={18} color={Colors.textPrimary} />
                                </AppTouchable>
                                <Text style={styles.stepValue}>{form.maxPositions}</Text>
                                <AppTouchable
                                    style={[styles.stepButton, form.maxPositions >= MAX_POSITIONS && styles.stepButtonDisabled]}
                                    onPress={() => update({ maxPositions: Math.min(MAX_POSITIONS, form.maxPositions + 1) })}
                                    cooldownMs={0}
                                >
                                    <Ionicons name="add" size={18} color={Colors.textPrimary} />
                                </AppTouchable>
                            </View>
                        </View>
                        <FixedRow label="종목당 최대 비중 (자동)"
                                  value={`${toPct(rules?.maxPositionPct ?? 0)}%`}
                                  hint="총자산의 95% ÷ 종목 수" />
                        <FixedRow label="손절 시 한 종목 손실 (최대)"
                                  value={`약 ${toPct((rules?.maxPositionPct ?? 0) * WIDEST_STOP_PCT)}%`}
                                  hint={`총자산 대비, 비중 × 손절폭 ${Math.round(WIDEST_STOP_PCT * 100)}% — 종목 수가 많을수록 작아집니다`} />
                        <FixedRow label="전체 미청산 리스크 한도 (고정)" value={`${toPct(Number(saved?.MAX_OPEN_RISK_PCT))}%`}
                                  hint="보유 전체가 손절될 때의 총 손실 한도" last />
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.label}>실제 최대 보유 (계산)</Text>
                        {capacity ? (
                            <View style={styles.capacityBody}>
                                <Text style={styles.capacityMain}>최대 {capacity.maxCount}종목까지 보유</Text>
                                <Text style={styles.hint}>
                                    {`${capacity.maxCount}종목을 모두 채우면 총자산의 약 ${Math.round(capacity.exposurePct * 100)}%가 주식에 들어가고, `
                                        + (capacity.exposurePct < 1 ? '나머지는 현금으로 남습니다.' : '현금은 거의 남지 않습니다.')}
                                </Text>
                                <Text style={styles.hint}>
                                    종목 수를 막는 한도: {BINDING_LABEL[capacity.binding]}
                                </Text>
                                <Text style={styles.hint}>
                                    한 종목에는 총자산의 약 {(capacity.avgPositionPct * 100).toFixed(1)}%씩 같은 비중으로 넣습니다.
                                </Text>
                                {capacity.exceedsAssets && (
                                    <Text style={styles.hint}>
                                        최대 비중만 곱하면 총자산을 넘어 보이지만, 위처럼 실제 한 종목은 훨씬 작고
                                        현금이 없으면 매수하지 않으므로 총자산을 넘지 않습니다.
                                    </Text>
                                )}
                            </View>
                        ) : (
                            <Text style={styles.hint}>계산할 수 없습니다.</Text>
                        )}
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.label}>현금 파킹</Text>
                        <Text style={styles.hint}>
                            놀고 있는 현금을 {PARK_ETF_LABEL[market]}로 옮겨 두고, 매수 신호가 나면 필요한 만큼만 자동으로 팝니다.
                            추가로 입금하거나 분배금이 들어오면 버튼을 다시 눌러 늘어난 현금을 변환하세요.
                        </Text>
                        <View style={styles.parkFields}>
                            <Field label="남길 현금 (%)" hint="변환할 때 총자산 대비 현금으로 남길 비율" value={form.parkReservePct}
                                   onChange={(t) => update({ parkReservePct: t })} last />
                        </View>
                        <View style={styles.parkStatus}>
                            {/* 보유 현황은 풀이 켜져 있을 때만 읽을 수 있다. 버튼은 항상 보여주고 꺼져 있으면 변환 때 켠다 */}
                            {saved?.USE_YN === 'Y' && (
                                <Text style={styles.hint}>
                                    {parking && parking.QTY != null
                                        ? `보유 ${parking.QTY}주 · 평가 ${formatAmountWithUnit(parking.VALUE ?? 0, market === 'KR' ? 'J' : 'NAS')}`
                                        : '보유 현황을 읽지 못했습니다'}
                                </Text>
                            )}
                            <AppButton
                                style={styles.parkButton}
                                textStyle={styles.saveText}
                                title="현금 → 파킹 ETF 변환"
                                loadingText="처리 중..."
                                onPress={handlePark}
                            />
                        </View>
                    </View>

                    <Text style={styles.footnote}>
                        한도에 걸리면 신규 매수만 건너뛰고, 보유 종목은 강제로 매도하지 않습니다.
                        국내·미국은 각각 따로 설정합니다 (상단 시장 선택에 따라 전환).
                    </Text>

                    <AppButton
                        style={styles.saveButton}
                        textStyle={styles.saveText}
                        title="저장"
                        loadingText="저장 중..."
                        onPress={handleSave}
                    />
                </ScrollView>
            )}
        </View>
    );
}

function FixedRow({ label, value, hint, last }: { label: string; value: string; hint: string; last?: boolean }) {
    return (
        <View style={[styles.field, last && styles.fieldLast]}>
            <View style={styles.fieldText}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.hint}>{hint}</Text>
            </View>
            <Text style={styles.fixedValue}>{value}</Text>
        </View>
    );
}

interface FieldProps {
    label: string;
    hint: string;
    value: string;
    onChange: (text: string) => void;
    last?: boolean;
}

function Field({ label, hint, value, onChange, last }: FieldProps) {
    return (
        <View style={[styles.field, last && styles.fieldLast]}>
            <View style={styles.fieldText}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.hint}>{hint}</Text>
            </View>
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                keyboardType="decimal-pad"
                // 누르면 기존 값이 전체 선택돼 바로 덮어쓸 수 있다 (작은 칸에서 커서를 옮겨 지우기 어려움)
                selectTextOnFocus
                clearButtonMode="while-editing"
                placeholder="-"
                placeholderTextColor={Colors.textMuted}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    backButton: { marginRight: Spacing.sm, padding: Spacing.xs },
    headerTitle: { fontSize: FontSizes.xl, fontWeight: 'bold', color: Colors.textPrimary },
    content: { padding: Spacing.lg },
    card: {
        backgroundColor: Colors.cardBackground,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    field: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: Spacing.md,
        marginBottom: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.textMuted,
    },
    fieldLast: { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 },
    fieldText: { flex: 1, marginRight: Spacing.md },
    label: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.textPrimary },
    hint: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
    input: {
        minWidth: 72,
        textAlign: 'right',
        fontSize: FontSizes.lg,
        fontWeight: '600',
        color: Colors.textPrimary,
        borderBottomWidth: 1,
        borderBottomColor: Colors.primary,
        paddingVertical: Spacing.xs,
    },
    footnote: { fontSize: FontSizes.sm, color: Colors.textMuted, marginBottom: Spacing.lg },
    saveButton: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.sm,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    capacityBody: { marginTop: Spacing.sm },
    capacityMain: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.xs },
    stepper: { flexDirection: 'row', alignItems: 'center' },
    stepButton: {
        width: 34,
        height: 34,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
        borderColor: Colors.textMuted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepButtonDisabled: { opacity: 0.3 },
    stepValue: {
        minWidth: 44,
        textAlign: 'center',
        fontSize: FontSizes.lg,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    fixedHint: { marginTop: Spacing.xs, marginBottom: Spacing.md },
    fixedValue: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.textPrimary },
    parkFields: { marginTop: Spacing.lg },
    parkStatus: { marginTop: Spacing.lg },
    parkButton: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.sm,
        paddingVertical: Spacing.sm,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.sm,
    },
    saveText: { color: Colors.textWhite, fontSize: FontSizes.md, fontWeight: '700' },
    emptyBox: { padding: Spacing.xl, alignItems: 'center' },
    emptyText: { color: Colors.textSecondary, marginBottom: Spacing.lg },
});
