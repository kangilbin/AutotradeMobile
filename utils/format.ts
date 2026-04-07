/**
 * 공통 포맷팅 유틸리티 함수들
 */

import { Colors } from '../constants';
import { MarketCode } from '../types/market';

/**
 * 숫자를 한국어 통화 형식으로 포맷팅
 * @param num 포맷팅할 숫자
 * @returns 포맷팅된 문자열 (예: "1,234,567")
 */
export const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('ko-KR').format(num);
};

/**
 * 숫자를 천 단위 구분자와 함께 포맷팅
 * @param num 포맷팅할 숫자
 * @returns 포맷팅된 문자열
 */
export const formatNumber = (num: number | string | undefined | null): string => {
    if (num === undefined || num === null) return '0';
    const n = typeof num === 'string' ? Number(num) : num;
    if (isNaN(n)) return '0';
    return n.toLocaleString('ko-KR');
};

/**
 * 수익/손실 금액에 따른 색상 반환
 * @param amount 금액
 * @returns 색상 코드 (양수: 빨강, 음수: 파랑)
 */
export const getProfitLossColor = (amount: number | undefined | null): string => {
    return (amount ?? 0) >= 0 ? Colors.profit : Colors.loss;
};

/**
 * 수익률 포맷팅 (부호 포함)
 * @param rate 수익률
 * @returns 포맷팅된 문자열 (예: "+5.00%", "-3.50%")
 */
export const formatProfitRate = (rate: number | undefined | null): string => {
    const value = rate ?? 0;
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
};

/**
 * 스윙 타입 텍스트 변환
 * @param type 스윙 타입 코드 ('A' | 'S' | 'B')
 * @returns 표시용 텍스트
 */
export const getSwingTypeText = (type: string): string => {
    switch (type) {
        case 'A': return '이평선';
        case 'S': return '단일이평선';
        case 'B': return '일목균형표';
        default: return type;
    }
};

/**
 * 활성화 상태에 따른 배지 색상 반환
 * @param isActive 활성화 여부
 * @returns 색상 코드
 */
export const getActiveBadgeColor = (isActive: string): string => {
    return isActive === 'Y' ? Colors.active : Colors.inactive;
};

/**
 * 마켓에 맞는 가격 포맷
 * 국내: 정수 + 천단위 구분 (10,500)
 * 미국: 소수점 2자리 ($150.25)
 */
export const formatPrice = (price: number | string, mrktCode: MarketCode): string => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(num)) return '-';

    if (mrktCode === 'NASD') {
        return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return Math.round(num).toLocaleString('ko-KR');
};

/**
 * 통화 기호 반환
 */
export const getCurrencySymbol = (mrktCode: MarketCode): string => {
    return mrktCode === 'NASD' ? '$' : '\u{20A9}';
};