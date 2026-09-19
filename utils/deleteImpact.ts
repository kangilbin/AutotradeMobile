/**
 * 계좌·보안키 삭제 영향도 경고 문구 생성
 *
 * 계좌 삭제와 보안키 삭제는 연쇄 삭제 범위만 다를 뿐 사용자가 알아야 할 내용은 같다.
 * 문구를 화면마다 따로 쓰면 한쪽만 고쳐지는 표류가 생기므로 한 곳에 모은다.
 *
 * 영향도 응답에는 종목명(ST_NM)이 없다. 따라서 종목을 나열하지 않고 개수로만 알린다.
 */

import { DeleteImpactResponse } from '../types/account';

export type DeleteTarget = {
    kind: 'account' | 'auth';
    /** 계좌: 포맷된 계좌번호("50123456-01"), 보안키: 보안키 이름 */
    label: string;
};

export type DeleteImpactAlert = {
    title: string;
    message: string;
};

/* 보유 포지션 경고의 핵심 — "주식은 남고 자동 매도만 멈춘다"는 오해 지점을 짚는다 */
const POSITION_NOTICE =
    '삭제해도 주식은 증권사 계좌에 그대로 남습니다.\n' +
    '다만 손절·익절 자동 매도가 멈추므로, 이후에는 직접 매도하셔야 합니다.';

export const buildDeleteImpactAlert = (
    target: DeleteTarget,
    impact: DeleteImpactResponse,
): DeleteImpactAlert => {
    const swings = impact.SWINGS ?? [];
    const swingCount = swings.length;
    const accountCount = impact.ACCOUNT_NOS?.length ?? 0;
    const positionCount = swings.filter(s => s.HAS_POSITION).length;

    const isAuth = target.kind === 'auth';
    const subject = isAuth ? `'${target.label}'` : `${target.label} 계좌`;

    /* 함께 사라지는 것들 — 개수가 0인 절은 문장에서 뺀다 */
    const cascade: string[] = [];
    if (isAuth && accountCount > 0) cascade.push(`계좌 ${accountCount}개`);
    if (swingCount > 0) cascade.push(`자동매매 설정 ${swingCount}개`);
    const cascadeText = cascade.join('와 ');

    /* C. 보유 포지션 있음 — 경고 */
    if (impact.HAS_POSITION) {
        return {
            title: '⚠️ 보유 중인 종목이 있습니다',
            message:
                `${subject}를 삭제하면 ${cascadeText}가 함께 삭제됩니다.\n` +
                `그중 ${positionCount}개는 지금 주식을 보유 중입니다.\n\n` +
                POSITION_NOTICE,
        };
    }

    const title = isAuth ? '보안키 삭제' : '계좌 삭제';

    /* A. 딸린 것 없음 — 대상만 확인 */
    if (cascade.length === 0) {
        return { title, message: `${subject}를 삭제합니다.` };
    }

    /* B. 딸린 것은 있으나 보유 포지션 없음 — 연쇄 삭제 범위만 알림 */
    const cascadePrefix = isAuth ? '이 보안키로 등록한' : '이 계좌의';
    return {
        title,
        message:
            `${subject}를 삭제합니다.\n\n` +
            `${cascadePrefix} ${cascadeText}도 함께 삭제됩니다.`,
    };
};
