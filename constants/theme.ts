/**
 * 앱 전체 공통 테마 설정
 */

// 색상 팔레트
export const Colors = {
    // 브랜드 색상
    primary: '#4ECDC4',          // 메인 민트색
    primaryLight: '#B5EAD7',     // 밝은 민트
    primaryDark: '#3DB9B0',      // 어두운 민트

    // 수익/손실 색상
    profit: '#FF6B6B',           // 수익 (빨강)
    loss: '#3498DB',             // 손실 (파랑)

    // 상태 색상
    active: '#4ECDC4',           // 활성화
    inactive: '#95A5A6',         // 비활성화
    warning: '#F39C12',          // 경고
    error: '#E74C3C',            // 에러
    errorLight: '#FEF2F2',       // 에러 배경
    success: '#27AE60',          // 성공

    // 배경 색상
    background: '#F8F9FA',       // 기본 배경
    cardBackground: '#FFFFFF',   // 카드 배경
    overlay: 'rgba(0,0,0,0.3)',  // 오버레이

    // 텍스트 색상
    textPrimary: '#2C3E50',      // 주요 텍스트
    textSecondary: '#7F8C8D',    // 보조 텍스트
    textMuted: '#95A5A6',        // 흐린 텍스트
    textWhite: '#FFFFFF',        // 흰색 텍스트

    // 보더/구분선 색상
    border: '#ECF0F1',           // 기본 보더
    borderLight: '#F0F0F0',      // 밝은 보더
    divider: '#E8F4F8',          // 구분선

    // 입력 필드 색상
    inputBorder: '#E2E8F0',      // 입력 필드 보더
    inputBackground: '#F8FAFC',  // 입력 필드 배경

    // 뱃지 색상
    badgeBackground: '#e3f2fd',  // 뱃지 배경 (밝은 파랑)
    badgeText: '#1976d2',        // 뱃지 텍스트 (파랑)

    // 버튼 색상
    buttonPrimary: '#4ECDC4',
    buttonSecondary: '#667EEA',
    buttonDanger: '#E74C3C',
} as const;

// 그림자 스타일
export const Shadows = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
} as const;

// 폰트 크기
export const FontSizes = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    title: 32,
} as const;

// 간격
export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
} as const;

// 테두리 반경
export const BorderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
} as const;