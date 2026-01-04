/**
 * 공통 포맷팅 유틸리티 함수들
 */

import { Colors } from '../constants';

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
export const formatNumber = (num: number): string => {
    return num.toLocaleString('ko-KR');
};

/**
 * 수익/손실 금액에 따른 색상 반환
 * @param amount 금액
 * @returns 색상 코드 (양수: 빨강, 음수: 파랑)
 */
export const getProfitLossColor = (amount: number): string => {
    return amount >= 0 ? Colors.profit : Colors.loss;
};

/**
 * 수익률 포맷팅 (부호 포함)
 * @param rate 수익률
 * @returns 포맷팅된 문자열 (예: "+5.00%", "-3.50%")
 */
export const formatProfitRate = (rate: number): string => {
    const sign = rate >= 0 ? '+' : '';
    return `${sign}${rate.toFixed(2)}%`;
};

/**
 * 스윙 타입 텍스트 변환
 * @param type 스윙 타입 코드 ('D' | 'M')
 * @returns 표시용 텍스트
 */
export const getSwingTypeText = (type: string): string => {
    return type === 'D' ? 'Day' : 'Minute';
};

/**
 * 활성화 상태에 따른 배지 색상 반환
 * @param isActive 활성화 여부
 * @returns 색상 코드
 */
export const getActiveBadgeColor = (isActive: boolean): string => {
    return isActive ? Colors.active : Colors.inactive;
};