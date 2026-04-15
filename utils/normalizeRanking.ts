import {
    OverseasFluctuationRawItem,
    OverseasVolumeRawItem,
    OverseasVolumePowerRawItem,
    FluctuationRankItem,
    VolumeRankItem,
    VolumePowerRankItem,
} from '../types/ranking';

export function normalizeOverseasFluctuation(
    items: OverseasFluctuationRawItem[],
    descending: boolean = true,
): FluctuationRankItem[] {
    const filtered = items.filter((item) => {
        const r = parseFloat(item.rate) || 0;
        return descending ? r > 0 : r < 0;
    });
    const sorted = filtered.sort((a, b) => {
        const aRate = parseFloat(a.rate) || 0;
        const bRate = parseFloat(b.rate) || 0;
        return descending ? bRate - aRate : aRate - bRate;
    });
    return sorted.map((item, index) => ({
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

export function normalizeOverseasVolumePower(
    items: OverseasVolumePowerRawItem[]
): VolumePowerRankItem[] {
    return items.map((item, index) => {
        const tvol = parseFloat(item.tvol) || 0;
        const powx = parseFloat(item.powx) || 100;
        // 체결강도 = 매수/매도 × 100 → 역산
        const sellVol = Math.round(tvol / (1 + powx / 100));
        const buyVol = tvol - sellVol;
        return {
            stck_shrn_iscd: item.symb,
            data_rank: String(index + 1),
            hts_kor_isnm: item.name,
            stck_prpr: item.last,
            prdy_vrss: item.diff,
            prdy_vrss_sign: item.sign,
            prdy_ctrt: item.rate.replace(/[+\s]/g, ''),
            tday_rltv: item.powx,
            seln_cnqn_smtn: String(sellVol),
            shnu_cnqn_smtn: String(buyVol),
        };
    });
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