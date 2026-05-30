export type MarketCode = 'J' | 'NASD';

export type MarketInfo = {
    code: MarketCode;
    label: string;
    currency: string;
    currencySymbol: string;
};

export const MARKETS: Record<MarketCode, MarketInfo> = {
    J: {
        code: 'J',
        label: '국내',
        currency: 'KRW',
        currencySymbol: '\u{20A9}',
    },
    NASD: {
        code: 'NASD',
        label: '미국',
        currency: 'USD',
        currencySymbol: '$',
    },
};
