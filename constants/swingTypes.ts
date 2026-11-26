// 스윙 전략 타입 — 서버 SWING_TYPE 과 같은 값. 종목 추가(add.tsx)·스윙 설정(SettingsTab.tsx)이 같이 쓴다.
//
// 앱에서 고를 수 있는 전략은 서버 실전 팩토리에 등록된 'S'(단일 이평선)와 'I'(일목균형표)다.
// 'A'(이동평균선)·'B'(예전 일목 백테스트 규칙)는 실전에 없어 선택지로 내지 않는다 (GET /swing/strategies 가 목록의 기준).
export const SWING_TYPES = {
    SINGLE_MA: 'S',      // 단일 20EMA
    MULTI_MA: 'A',       // 이동평균선 (단기/중기/장기) — 앱에서 미사용
    ICHIMOKU: 'I',       // 일목균형표
} as const;

export type SwingTypeValue = typeof SWING_TYPES[keyof typeof SWING_TYPES];

export const SWING_TYPE_LABELS: Record<SwingTypeValue, string> = {
    [SWING_TYPES.SINGLE_MA]: '단일 이평선',
    [SWING_TYPES.MULTI_MA]: '이동평균선',
    [SWING_TYPES.ICHIMOKU]: '일목균형표',
};

// 선택한 전략 한 줄 설명 (서버 describe() 와 같은 규칙).
// 일목은 과거 검증에서 같은 낙폭의 지수 보유보다 수익이 낮았다 — 그 사실을 숨기지 않고 함께 알린다.
export const SWING_TYPE_HINTS: Partial<Record<SwingTypeValue, string>> = {
    [SWING_TYPES.SINGLE_MA]: '20일 이동평균선을 막 넘어선 추세 초입에 수급이 쌓이면 매수하고, 청산선을 이탈하면 매도합니다.',
    [SWING_TYPES.ICHIMOKU]: '종가가 구름 위에서 전환선이 기준선 위인 상승 상태가 막 시작되면 매수하고, 종가가 구름 하단 아래로 마감하면 매도합니다. 과거 검증에서 지수 보유보다 수익이 낮았던 검증 미통과 전략이니 소액으로 확인하세요.',
};

// 설정 화면에서 고를 수 있는 전략 (표시 순서)
export const SELECTABLE_SWING_TYPES: SwingTypeValue[] = [SWING_TYPES.SINGLE_MA, SWING_TYPES.ICHIMOKU];
