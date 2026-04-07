export type MarketCode = 'J' | 'NASD';

export type MarketInfo = {
    code: MarketCode;
    label: string;
    flag: string;
    currency: string;
    currencySymbol: string;
};

export const MARKETS: Record<MarketCode, MarketInfo> = {
    J: {
        code: 'J',
        label: '국내',
        flag: '\u{1F1F0}\u{1F1F7}',
        currency: 'KRW',
        currencySymbol: '\u{20A9}',
    },
    NASD: {
        code: 'NASD',
        label: '미국',
        flag: '\u{1F1FA}\u{1F1F8}',
        currency: 'USD',
        currencySymbol: '$',
    },
};
