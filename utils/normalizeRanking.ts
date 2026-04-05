import {
    OverseasFluctuationRawItem,
    OverseasVolumeRawItem,
    FluctuationRankItem,
    VolumeRankItem,
} from '../types/ranking';

export function normalizeOverseasFluctuation(
    items: OverseasFluctuationRawItem[]
): FluctuationRankItem[] {
    return items.map((item, index) => ({
        stck_shrn_iscd: item.symb,
        data_rank: String(index + 1),
        hts_kor_isnm: item.knam,
        stck_prpr: item.last,
        prdy_vrss: item.diff,
        prdy_vrss_sign: item.sign,
        prdy_ctrt: item.rate.replace(/[+\s]/g, ''),
        acml_vol: item.tvol,
    }));
}

export function normalizeOverseasVolume(
    items: OverseasVolumeRawItem[]
): VolumeRankItem[] {
    return items.map((item, index) => ({
        mksc_shrn_iscd: item.symb,
        data_rank: String(index + 1),
        hts_kor_isnm: item.knam,
        stck_prpr: item.last,
        prdy_vrss: item.diff,
        prdy_vrss_sign: item.sign,
        prdy_ctrt: item.rate.replace(/[+\s]/g, ''),
        acml_vol: item.tvol,
        vol_inrt: item.n_rate.replace(/[+\s]/g, ''),
        vol_tnrt: '0',
        acml_tr_pbmn: '0',
    }));
}