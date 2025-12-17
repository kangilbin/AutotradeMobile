# AutoTrade Mobile

이동평균선 기반 주식 자동 스윙 매매 모바일 앱

## 소개

AutoTrade Mobile은 한국 주식 시장을 위한 자동 스윙 매매 앱입니다. 이동평균선(MA) 전략을 기반으로 자동 매수/매도 설정을 할 수 있으며, 백테스팅을 통해 전략을 사전에 검증할 수 있습니다.

## 주요 기능

### 스윙 매매 설정
- **일봉/월봉 기반 매매**: 단기(D) 또는 중장기(M) 스윙 전략 선택
- **이동평균선 설정**: 단기/중기/장기 이평선 기간 커스터마이징
- **매수/매도 비율 설정**: 분할 매수/매도 비율 조절
- **자동 매매 On/Off**: 종목별 자동 매매 활성화/비활성화

### 백테스팅
- 과거 데이터 기반 전략 시뮬레이션
- 수익률, 승률, 최대 손실률 등 통계 제공
- 차트로 매매 시점 시각화

### 종목 관리
- 종목 검색 및 추가
- 실시간 호가/시세 조회
- 포트폴리오 현황 대시보드

### 계좌 관리
- 증권사 계좌 연동
- 다중 계좌 지원
- 생체 인증 (Face ID / 지문)

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Expo SDK 53 + React Native 0.79 |
| 언어 | TypeScript |
| 네비게이션 | expo-router (파일 기반 라우팅) |
| 상태 관리 | Zustand |
| HTTP 클라이언트 | Axios |
| 인증 | JWT (Access + Refresh Token) |
| 보안 저장소 | expo-secure-store |
| 차트 | react-native-chart-kit |

## 시작하기

### 요구 사항

- Node.js 18+
- npm 또는 yarn
- Expo CLI
- iOS: Xcode (Mac 전용)
- Android: Android Studio

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-username/AutotradeMobile.git
cd AutotradeMobile

# 의존성 설치
npm install

# 개발 서버 시작
npm start
```

### 실행

```bash
# iOS 시뮬레이터
npm run ios

# Android 에뮬레이터
npm run android

# 웹 브라우저
npm run web
```

## 프로젝트 구조

```
AutotradeMobile/
├── app/                    # 화면 (expo-router)
│   ├── (auth)/            # 로그인, 회원가입
│   ├── (tabs)/            # 메인 탭
│   │   ├── home.tsx       # 홈 대시보드
│   │   ├── stock/         # 종목 검색/시세
│   │   ├── swing/         # 스윙 매매 관리
│   │   └── user.tsx       # 마이페이지
│   └── account/           # 계좌 관리
├── components/            # 재사용 컴포넌트
├── contexts/              # API 레이어
│   └── backEndApi.ts      # 백엔드 API 호출
├── stores/                # Zustand 스토어
├── types/                 # TypeScript 타입
└── assets/                # 이미지, 폰트
```

## 화면 구성

| 탭 | 설명 |
|----|------|
| HOME | 투자 현황 대시보드, 총 수익률 |
| STOCK | 종목 검색, 호가 조회, 스윙 설정 추가 |
| SWING | 스윙 매매 목록, 상세 설정, 백테스팅 |
| MY | 계좌 관리, 설정 |

## 백엔드 API

이 앱은 별도의 백엔드 서버가 필요합니다.

- 기본 URL: `http://localhost:8000`
- 인증: JWT 기반 (Bearer Token)

### 주요 API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /login | 로그인 |
| POST | /signup | 회원가입 |
| GET | /stock | 종목 검색 |
| GET | /stock/price | 호가/시세 조회 |
| POST | /swing | 스윙 설정 추가 |
| GET | /swing/list | 스윙 목록 조회 |
| POST | /backtesting | 백테스팅 실행 |

## 스윙 매매 전략

### 이동평균선 기반 매매
- **매수 신호**: 단기 이평선이 중기/장기 이평선을 상향 돌파
- **매도 신호**: 단기 이평선이 중기/장기 이평선을 하향 돌파

### 설정 옵션
| 항목 | 설명 | 예시 |
|------|------|------|
| SWING_TYPE | 일봉(D) / 월봉(M) | 'D' |
| SHORT_TERM | 단기 이평선 기간 | 5 |
| MEDIUM_TERM | 중기 이평선 기간 | 20 |
| LONG_TERM | 장기 이평선 기간 | 60 |
| BUY_RATIO | 매수 비율 (%) | 30 |
| SELL_RATIO | 매도 비율 (%) | 50 |

## 빌드

### Development Build
```bash
npx expo install expo-dev-client
npx expo prebuild
npx expo run:ios
```

### Production Build (EAS)
```bash
# EAS CLI 설치
npm install -g eas-cli

# 빌드
eas build --platform ios
eas build --platform android
```

## 라이선스

이 프로젝트는 개인 프로젝트입니다.

## 문의
