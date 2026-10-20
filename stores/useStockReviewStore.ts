import { create } from 'zustand';
import { getStockReviews } from '../contexts/backEndApi';
import { StockReviewItem } from '../types/stockReview';

// AI 종목 분석 목록 — 헤더 아이콘·분석 목록·결과 화면·시세 화면이 같은 상태를 본다.
// 분석은 백엔드 백그라운드 작업이라, 분석 중인 항목이 있을 때만 목록을 폴링한다.
// 폴링은 이 스토어 한 곳에서만 한다 (화면별로 따로 돌리면 요청이 겹치고 상태가 엇갈린다).
const POLL_MS = 5000;

type StockReviewStore = {
    reviews: StockReviewItem[];
    /** 서버 목록으로 갱신 (분석 중이 있으면 폴링 시작, 없으면 중단) */
    refresh: () => Promise<void>;
    /** 요청 직후·상세 조회 결과를 목록에 반영 — 다음 폴링 전에도 헤더가 바로 바뀌게 */
    upsert: (item: StockReviewItem) => void;
    /** 로그아웃 — 폴링을 멈추고 이전 사용자 목록을 지운다 */
    reset: () => void;
};

let pollTimer: ReturnType<typeof setInterval> | null = null;
let refreshing = false;
// 조회 중에 들어온 refresh 요청 — 버리면 상세에서 확인(SEEN) 처리한 직후의 갱신이 사라진다
let refreshQueued = false;
// upsert·reset 마다 올린다. 조회를 시작한 뒤 로컬 상태가 바뀌었으면 그 응답은 낡은 것이다
// (예: 폴링 중에 새 분석을 요청 → 늦게 온 목록에 새 항목이 없어 RUNNING 이 지워지고 폴링이 멈춤)
let localVersion = 0;

const stopPolling = () => {
    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
    }
};

const syncPolling = (reviews: StockReviewItem[]) => {
    const running = reviews.some((r) => r.STATUS === 'RUNNING');
    if (running && !pollTimer) {
        pollTimer = setInterval(() => {
            useStockReviewStore.getState().refresh();
        }, POLL_MS);
    } else if (!running) {
        stopPolling();
    }
};

export const useStockReviewStore = create<StockReviewStore>((set, get) => ({
    reviews: [],
    refresh: async () => {
        if (refreshing) {
            refreshQueued = true;
            return;
        }
        refreshing = true;
        const startedVersion = localVersion;
        try {
            const list = await getStockReviews();
            if (!list) {
                // 실패(로그아웃 후 401, 서버 장애 등)면 폴링을 멈춘다. 계속 돌리면 로그인 화면이
                // 5초마다 다시 열린다. 포그라운드 복귀·화면 진입·새 요청 때 다시 시작된다.
                stopPolling();
                return;
            }
            if (startedVersion !== localVersion) return;  // 그 사이 로컬이 더 최신 — 다음 폴링에 맡긴다
            set({ reviews: list });
            syncPolling(list);
        } finally {
            refreshing = false;
            if (refreshQueued) {
                refreshQueued = false;
                get().refresh();
            }
        }
    },
    upsert: (item) => {
        localVersion++;
        const reviews = [item, ...get().reviews.filter((r) => r.ST_CODE !== item.ST_CODE)];
        set({ reviews });
        syncPolling(reviews);
    },
    reset: () => {
        localVersion++;
        refreshQueued = false;
        stopPolling();
        set({ reviews: [] });
    },
}));

export type ReviewHeaderState = 'running' | 'done' | 'failed' | 'idle' | null;

/** 헤더 아이콘 상태 — 분석 중 > 미확인 완료 > 최근 실패 > 지난 결과만 있음 > 기록 없음(숨김) */
export const headerStateOf = (reviews: StockReviewItem[]): ReviewHeaderState => {
    if (reviews.length === 0) return null;
    if (reviews.some((r) => r.STATUS === 'RUNNING')) return 'running';
    if (reviews.some((r) => r.STATUS === 'DONE' && !r.SEEN)) return 'done';
    // 목록은 최근 요청 먼저 — 가장 최근 요청이 실패면 알린다 (다시 시도할 수 있게)
    if (reviews[0].STATUS === 'FAILED') return 'failed';
    return 'idle';
};
