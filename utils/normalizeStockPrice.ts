import { MarketCode } from '../types/market';
import {
    StockPriceResponse,
    NasdStockPriceResponse,
    UnifiedStockPrice,
    OrderBookEntry,
} from '../types/stock';

function calcRate(price: number, basePrice: number): string {
    if (price <= 0 || basePrice <= 0) return '0.00';
    return (((price - basePrice) / basePrice) * 100).toFixed(2);
}

function normalizeKrx(data: StockPriceResponse): UnifiedStockPrice {
    const currentPrice = parseFloat(data.output2.stck_prpr);
    const basePrice = parseFloat(data.output2.stck_sdpr);
    const changeAmount = currentPrice - basePrice;

    const asks: OrderBookEntry[] = Array.from({ length: 10 }, (_, i) => {
        const price = parseFloat(data.output1[`askp${10 - i}` as keyof typeof data.output1] as string) || 0;
        const quantity = parseInt(data.output1[`askp_rsqn${10 - i}` as keyof typeof data.output1] as string, 10) || 0;
        return { price, quantity, rate: calcRate(price, basePrice) };
    });

    const bids: OrderBookEntry[] = Array.from({ length: 10 }, (_, i) => {
        const price = parseFloat(data.output1[`bidp${i + 1}` as keyof typeof data.output1] as string) || 0;
        const quantity = parseInt(data.output1[`bidp_rsqn${i + 1}` as keyof typeof data.output1] as string, 10) || 0;
        return { price, quantity, rate: calcRate(price, basePrice) };
    });

    return {
        currentPrice,
        basePrice,
        openPrice: parseFloat(data.output2.stck_oprc) || 0,
        highPrice: parseFloat(data.output2.stck_hgpr) || 0,
        lowPrice: parseFloat(data.output2.stck_lwpr) || 0,
        changeAmount,
        changeRate: calcRate(currentPrice, basePrice),
        asks,
        bids,
        estimatedPrice: data.output2.antc_cnpr ? parseFloat(data.output2.antc_cnpr) || undefined : undefined,
        estimatedChange: data.output2.antc_cntg_vrss ? parseInt(data.output2.antc_cntg_vrss) || undefined : undefined,
    };
}

function normalizeNasd(data: NasdStockPriceResponse): UnifiedStockPrice {
    const currentPrice = parseFloat(data.output1.last);
    const basePrice = parseFloat(data.output1.base);
    const changeAmount = currentPrice - basePrice;

    const asks: OrderBookEntry[] = Array.from({ length: 10 }, (_, i) => {
        const price = parseFloat(data.output2[`pask${10 - i}` as keyof typeof data.output2] as string) || 0;
        const quantity = parseInt(data.output2[`vask${10 - i}` as keyof typeof data.output2] as string, 10) || 0;
        return { price, quantity, rate: calcRate(price, basePrice) };
    });

    const bids: OrderBookEntry[] = Array.from({ length: 10 }, (_, i) => {
        const price = parseFloat(data.output2[`pbid${i + 1}` as keyof typeof data.output2] as string) || 0;
        const quantity = parseInt(data.output2[`vbid${i + 1}` as keyof typeof data.output2] as string, 10) || 0;
        return { price, quantity, rate: calcRate(price, basePrice) };
    });

    return {
        currentPrice,
        basePrice,
        openPrice: parseFloat(data.output1.open) || 0,
        highPrice: parseFloat(data.output1.high) || 0,
        lowPrice: parseFloat(data.output1.low) || 0,
        changeAmount,
        changeRate: data.output1.rclose,
        asks,
        bids,
        estimatedPrice: data.output3.iep ? parseFloat(data.output3.iep) || undefined : undefined,
        estimatedChange: undefined,
    };
}

export function normalizeStockPrice(
    data: StockPriceResponse | NasdStockPriceResponse,
    mrktCode: MarketCode,
): UnifiedStockPrice {
    if (mrktCode === 'NASD') {
        return normalizeNasd(data as NasdStockPriceResponse);
    }
    return normalizeKrx(data as StockPriceResponse);
}
