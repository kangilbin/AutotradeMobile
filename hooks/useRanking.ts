import { useState, useCallback } from 'react';
import {
    FluctuationRankItem,
    VolumeRankItem,
    VolumePowerRankItem,
    FluctuationSortCode,
    FluctuationPriceCode,
    VolumeBlngCode,
    VolumePowerMarketCode,
} from '../types/ranking';
import { getFluctuationRank, getVolumeRank, getVolumePowerRank } from '../contexts/backEndApi';

interface UseFluctuationReturn {
    data: FluctuationRankItem[];
    loading: boolean;
    fetch: (rankSort: FluctuationSortCode, prcCls: FluctuationPriceCode, mrktCode?: string) => Promise<void>;
}

interface UseVolumeReturn {
    data: VolumeRankItem[];
    loading: boolean;
    fetch: (blngCls: VolumeBlngCode, mrktCode?: string) => Promise<void>;
}

interface UseVolumePowerReturn {
    data: VolumePowerRankItem[];
    loading: boolean;
    fetch: (inputIscd: VolumePowerMarketCode, mrktCode?: string) => Promise<void>;
}

export const useFluctuationRank = (): UseFluctuationReturn => {
    const [data, setData] = useState<FluctuationRankItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async (rankSort: FluctuationSortCode, prcCls: FluctuationPriceCode, mrktCode: string = 'J') => {
        setLoading(true);
        try {
            const result = await getFluctuationRank(rankSort, prcCls, mrktCode);
            setData(result ?? []);
        } finally {
            setLoading(false);
        }
    }, []);

    return { data, loading, fetch };
};

export const useVolumeRank = (): UseVolumeReturn => {
    const [data, setData] = useState<VolumeRankItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async (blngCls: VolumeBlngCode, mrktCode: string = 'J') => {
        setLoading(true);
        try {
            const result = await getVolumeRank(blngCls, mrktCode);
            setData(result ?? []);
        } finally {
            setLoading(false);
        }
    }, []);

    return { data, loading, fetch };
};

export const useVolumePowerRank = (): UseVolumePowerReturn => {
    const [data, setData] = useState<VolumePowerRankItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async (inputIscd: VolumePowerMarketCode, mrktCode: string = 'J') => {
        setLoading(true);
        try {
            const result = await getVolumePowerRank(inputIscd, mrktCode);
            setData(result ?? []);
        } finally {
            setLoading(false);
        }
    }, []);

    return { data, loading, fetch };
};
