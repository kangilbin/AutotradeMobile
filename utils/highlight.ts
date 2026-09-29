/**
 * 검색어 하이라이트용 유틸리티
 */

export type HighlightSegment = {
    text: string;
    matched: boolean;
};

/**
 * 원문을 검색어와 일치하는 구간 기준으로 잘라서 돌려준다.
 * 대소문자는 무시하고, 일치 구간이 여러 번 나오면 모두 잘라낸다.
 * @param text 원문 (종목명, 종목코드 등)
 * @param query 검색어
 * @returns 순서대로 이어 붙이면 원문이 되는 조각 배열
 */
export const splitByQuery = (text: string, query: string): HighlightSegment[] => {
    const source = text ?? '';
    const keyword = query.trim();
    if (!keyword || !source) return [{ text: source, matched: false }];

    // 비교용 소문자 사본. 원문은 그대로 잘라 써야 화면 표기가 바뀌지 않는다.
    // 사본의 인덱스로 원문을 자르므로 '소문자 변환이 길이를 바꾸지 않는다'를 전제한다.
    // 한글·숫자·영문 티커에서는 항상 성립한다(예외: 'İ' 같은 일부 특수 문자).
    const haystack = source.toLowerCase();
    const needle = keyword.toLowerCase();

    const segments: HighlightSegment[] = [];
    let cursor = 0;

    // indexOf 로 앞에서부터 훑는다. 정규식을 쓰면 검색어에 들어올 수 있는
    // 특수문자(. * ( 등)를 매번 이스케이프해야 해서 쓰지 않는다.
    while (cursor < source.length) {
        const found = haystack.indexOf(needle, cursor);
        if (found === -1) break;

        if (found > cursor) {
            segments.push({ text: source.slice(cursor, found), matched: false });
        }
        segments.push({ text: source.slice(found, found + needle.length), matched: true });
        cursor = found + needle.length;
    }

    // 마지막 일치 구간 뒤에 남은 꼬리(일치 자체가 없으면 원문 전체)
    if (cursor < source.length) {
        segments.push({ text: source.slice(cursor), matched: false });
    }

    return segments;
};
