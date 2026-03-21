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
    fetch: (rankSort: FluctuationSortCode, prcCls: FluctuationPriceCode) => Promise<void>;
}

interface UseVolumeReturn {
    data: VolumeRankItem[];
    loading: boolean;
    fetch: (blngCls: VolumeBlngCode) => Promise<void>;
}

interface UseVolumePowerReturn {
    data: VolumePowerRankItem[];
    loading: boolean;
    fetch: (inputIscd: VolumePowerMarketCode) => Promise<void>;
}

export const useFluctuationRank = (): UseFluctuationReturn => {
    const [data, setData] = useState<FluctuationRankItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async (rankSort: FluctuationSortCode, prcCls: FluctuationPriceCode) => {
        setLoading(true);
        const result = await getFluctuationRank(rankSort, prcCls);
        setData(result ?? []);
        setLoading(false);
    }, []);

    return { data, loading, fetch };
};

export const useVolumeRank = (): UseVolumeReturn => {
    const [data, setData] = useState<VolumeRankItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async (blngCls: VolumeBlngCode) => {
        setLoading(true);
        const result = await getVolumeRank(blngCls);
        setData(result ?? []);
        setLoading(false);
    }, []);

    return { data, loading, fetch };
};

export const useVolumePowerRank = (): UseVolumePowerReturn => {
    const [data, setData] = useState<VolumePowerRankItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async (inputIscd: VolumePowerMarketCode) => {
        setLoading(true);
        const result = await getVolumePowerRank(inputIscd);
        setData(result ?? []);
        setLoading(false);
    }, []);

    return { data, loading, fetch };
};
