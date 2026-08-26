# CLAUDE.md

이 문서는 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 개요

자동 주식 매매(스윙 트레이딩) 모바일 앱입니다. Expo 기반 React Native 프로젝트입니다.

## 개발 명령어

```bash
# 개발 서버 시작
npm start

# 플랫폼별 실행
npm run ios
npm run android
npm run web
```

## 기술 스택

- **프레임워크**: Expo SDK 53 + React Native 0.79
- **네비게이션**: expo-router (파일 기반 라우팅)
- **상태 관리**: Zustand
- **HTTP 클라이언트**: Axios (JWT 토큰 자동ㅇ 갱신)
- **보안 저장소**: expo-secure-store
- **언어**: TypeScript

## 프로젝트 구조

```
app/                    # 파일 기반 라우트 (expo-router)
├── (auth)/            # 인증 그룹 - 로그인, 회원가입
├── (tabs)/            # 메인 탭 네비게이션
│   ├── home.tsx       # 홈 대시보드
│   ├── stock/         # 종목 검색, 시세 조회
│   ├── swing/         # 스윙 매매 관리
│   └── user.tsx       # 마이페이지
├── account/           # 계좌 관리 화면
└── _layout.tsx        # 루트 스택 네비게이터

contexts/              # API 레이어
├── backEndApi.ts      # 모든 API 호출 (Axios 인터셉터 포함)

stores/                # Zustand 스토어
├── useAccountStore.ts # 계좌 상태 관리

components/            # 재사용 UI 컴포넌트
types/                 # TypeScript 타입 정의
```

## 주요 기능

- **인증**: JWT 기반 로그인/회원가입 (access + refresh 토큰)
- **종목**: 주식 검색, 호가/시세 조회
- **스윙 매매**: 이동평균선 기반 자동매매 설정
  - 스윙 타입: 일봉('D') / 월봉('M')
  - 단기/중기/장기 이평선 설정
  - 매수/매도 비율 설정
- **백테스팅**: 과거 데이터로 전략 시뮬레이션

## API 레이어 (`contexts/backEndApi.ts`)

- Axios 인스턴스에 인터셉터 설정
- 요청 시 자동으로 JWT 토큰 헤더 추가
- 401 에러 시 refresh 토큰으로 자동 갱신 후 재요청
- `useApiLoading()` 훅으로 전역 로딩 상태 관리
- 백엔드 URL: `http://localhost:8000`

---

## React Native Expo 개발 원칙

### 1. 컴포넌트 설계 원칙 (SOLID 적용)

#### 단일 책임 원칙 (Single Responsibility)
```typescript
// 나쁜 예 - 하나의 컴포넌트가 너무 많은 일을 함
const StockScreen = () => {
  // API 호출, 상태 관리, UI 렌더링 모두 포함
}

// 좋은 예 - 관심사 분리
const useStockData = () => { /* 데이터 로직 */ }  // 커스텀 훅
const StockList = () => { /* UI만 담당 */ }        // 프레젠테이션
const StockScreen = () => { /* 조합만 담당 */ }   // 컨테이너
```

#### 컴포넌트 분리 기준
- **Container 컴포넌트**: 데이터 fetch, 상태 관리, 비즈니스 로직
- **Presentational 컴포넌트**: props만 받아서 UI 렌더링
- **커스텀 훅**: 재사용 가능한 로직 분리

### 2. 성능 최적화 필수 사항

#### 리스트 렌더링
```typescript
// 나쁜 예 - 긴 리스트에 ScrollView 사용
<ScrollView>
  {items.map(item => <Item key={item.id} />)}
</ScrollView>

// 좋은 예 - FlatList 사용 (가상화 지원)
<FlatList
  data={items}
  renderItem={({ item }) => <Item data={item} />}
  keyExtractor={item => item.id}
/>
```

#### 불필요한 리렌더링 방지
```typescript
// useCallback - 함수 메모이제이션
const handlePress = useCallback(() => {
  doSomething(id);
}, [id]);

// useMemo - 값 메모이제이션
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// React.memo - 컴포넌트 메모이제이션
const StockItem = React.memo(({ stock }) => {
  return <View>...</View>;
});
```

#### 이미지 최적화
```typescript
// expo-image 사용 (기본 Image보다 성능 좋음)
import { Image } from 'expo-image';

<Image
  source={{ uri: imageUrl }}
  placeholder={blurhash}  // 로딩 중 플레이스홀더
  contentFit="cover"
  transition={200}
/>
```

### 3. 상태 관리 원칙

#### 상태 위치 결정
- **로컬 상태 (useState)**: 해당 컴포넌트에서만 사용
- **전역 상태 (Zustand)**: 여러 화면에서 공유 필요
- **서버 상태**: API 응답 데이터 (캐싱 고려)

#### Zustand 스토어 패턴
```typescript
// 스토어는 기능별로 분리
stores/
├── useAccountStore.ts   // 계좌 관련
├── useAuthStore.ts      // 인증 관련
├── useSwingStore.ts     // 스윙 매매 관련
```

### 4. expo-router 네비게이션 규칙

#### 파일 구조 = URL 구조
```
app/
├── index.tsx           → /
├── (auth)/
│   ├── login.tsx       → /login
│   └── signup.tsx      → /signup
├── (tabs)/
│   ├── home.tsx        → /home
│   └── stock/
│       ├── index.tsx   → /stock
│       └── [id].tsx    → /stock/005930
```

#### 네비게이션 방법
```typescript
import { router } from 'expo-router';

// 이동
router.push('/stock/005930');

// 교체 (뒤로가기 불가)
router.replace('/(auth)/login');

// 뒤로가기
router.back();
```

### 5. 플랫폼별 코드 처리

```typescript
import { Platform } from 'react-native';

// 방법 1: Platform.select
const styles = {
  shadow: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 } },
    android: { elevation: 4 },
  }),
};

// 방법 2: 파일 분리
// Component.ios.tsx
// Component.android.tsx
```

### 6. 타입 안전성

#### API 응답 타입 정의 필수
```typescript
// types/ 폴더에 모든 타입 정의
export type StockItem = {
  ST_CODE: string;
  ST_NM: string;
  PRICE: number;
};

// API 함수에 반환 타입 명시
export const getStock = async (code: string): Promise<StockItem | undefined> => {
  // ...
};
```

### 7. 에러 처리 패턴

```typescript
// API 에러는 중앙에서 처리 (backEndApi.ts의 handleApiError)
// 컴포넌트에서는 undefined 체크만
const data = await getStockPrice(code);
if (!data) return; // 에러는 이미 Alert로 표시됨
```

### 8. Expo 프레임워크 고려사항

#### 개발 환경 종류
| 환경 | 설명 | 사용 시점 |
|------|------|----------|
| **Expo Go** | Expo 앱에서 바로 실행 | 빠른 프로토타이핑, 네이티브 모듈 없을 때 |
| **Development Build** | 커스텀 네이티브 코드 포함 빌드 | 네이티브 모듈 필요할 때 |
| **EAS Build** | 클라우드 빌드 서비스 | 프로덕션 배포 |

```bash
# Development Build 생성
npx expo install expo-dev-client
npx expo prebuild
npx expo run:ios  # 또는 run:android

# EAS Build (클라우드)
eas build --platform ios
eas build --platform android
```

#### 라이브러리 설치 규칙
```bash
# 항상 expo install 사용 (호환 버전 자동 설치)
npx expo install react-native-reanimated

# 일반 npm install은 버전 충돌 위험
npm install react-native-reanimated  # 비추천
```

#### Expo SDK 버전 업그레이드
```bash
# SDK 업그레이드 (주의: breaking changes 확인 필수)
npx expo install expo@latest

# 업그레이드 후 모든 expo 패키지 동기화
npx expo install --fix
```
- 업그레이드 전 반드시 [Expo 변경로그](https://docs.expo.dev/changelog/) 확인
- 메이저 버전 업그레이드 시 테스트 필수

#### app.json 설정 주의사항
```json
{
  "expo": {
    "newArchEnabled": true,  // New Architecture 활성화 (SDK 51+)
    "plugins": [
      "expo-router",
      "expo-secure-store",
      // 네이티브 설정이 필요한 라이브러리는 여기에 추가
      ["expo-local-authentication", { "faceIDPermission": "앱에서 생체 인증을 사용합니다" }]
    ]
  }
}
```
- plugins 변경 시 `npx expo prebuild` 재실행 필요
- Expo Go에서 지원 안 되는 플러그인은 Development Build 필요

#### 환경 변수 관리
```typescript
// 방법 1: __DEV__ 플래그 (권장)
const API_URL = __DEV__
  ? 'http://localhost:8000'
  : 'https://api.production.com';

// 방법 2: app.config.js에서 환경별 설정
// app.config.js
export default {
  expo: {
    extra: {
      apiUrl: process.env.API_URL || 'http://localhost:8000',
    },
  },
};

// 사용
import Constants from 'expo-constants';
const apiUrl = Constants.expoConfig?.extra?.apiUrl;
```

#### OTA (Over-The-Air) 업데이트
- **가능**: JavaScript 코드, 이미지, 폰트 등 번들 리소스
- **불가능**: 네이티브 코드, app.json의 plugins 변경
- 네이티브 변경 시 반드시 새 빌드 후 스토어 재배포 필요

```bash
# EAS Update로 OTA 배포
eas update --branch production --message "버그 수정"
```

#### Expo 모듈 vs 서드파티 라이브러리
```typescript
// Expo 모듈 우선 사용 (안정성, 호환성 보장)
import * as SecureStore from 'expo-secure-store';  // 권장
import AsyncStorage from '@react-native-async-storage/async-storage';  // 대안

// Expo 모듈 목록: https://docs.expo.dev/versions/latest/
```

#### 자주 겪는 문제 해결

| 문제 | 해결책 |
|------|--------|
| Metro 번들러 캐시 문제 | `npx expo start --clear` |
| 네이티브 모듈 에러 | `npx expo prebuild --clean` 후 재빌드 |
| 패키지 버전 충돌 | `npx expo install --fix` |
| iOS 시뮬레이터 안 뜸 | `xcrun simctl list` 로 시뮬레이터 확인 |
| Android 에뮬레이터 연결 안 됨 | `adb devices` 로 연결 상태 확인 |

#### 디버깅 도구
```bash
# React DevTools 열기 (컴포넌트 트리 확인)
# 개발 서버에서 j 키 누르기

# 네트워크 요청 확인
# Flipper 또는 React Native Debugger 사용
```

---

## 로직 작성 및 설명 원칙 (중요)

사용자가 전체적인 방향성만 정해주고 로직 구현을 요청하는 경우가 많다.
이때 코드를 작성/추가한 뒤 **사용자가 accept를 누르기 전에 반드시 로직을 설명**한다.
사용자가 accept 화면(diff)을 직접 보면서 코드를 이해할 시간을 갖는 것이 목적이다.

### 작업 파이프라인 (반드시 이 순서로)
1. **방향성 확정** — 사용자가 정한 전체 방향성을 확인한다
2. **로직 구현** — 방향성에 맞게 코드를 작성/추가한다
3. **로직 설명 (accept 전)** — 작성한 로직을 설명하되, **개발자 관점의 실제 코드 설명을 함께 참조**한다:
   - **무엇을** 만들었는지 (어떤 동작을 하는 코드인지)
   - **왜 이렇게 짰는지** (이 구조/방식을 선택한 이유, 기존 패턴 재사용 여부, 고려한 대안)
   - **코드 레벨 설명** — 실제 작성한 코드를 짚어가며 설명한다. 주요 함수/변수/분기가 무엇을 하는지, 어떤 파일·위치(`file_path:line`)에 있는지, 데이터가 코드상에서 어떻게 흐르는지 구체적으로 참조한다
   - **영향 범위** (어떤 화면/기능에 영향을 주는지)
4. **사용자 이해 및 판단** — 사용자가 accept 화면을 보며 코드를 이해한 뒤 accept 여부를 직접 판단한다

### 설명 시 주의사항
- diff만 던지고 끝내지 않는다. 의사결정 근거 + 개발자 관점의 코드 설명을 항상 함께 전달한다
- 추상적 요약에 그치지 말고, 실제 코드를 인용·참조하며 "이 줄이 왜 이렇게 동작하는지"까지 설명한다
- 사용자가 코드를 보면서 따라올 수 있도록, 설명과 실제 코드가 1:1로 매칭되게 한다
- 단순 반복/기계적 수정이 아닌, 로직이 들어간 변경에는 반드시 설명을 붙인다

---

## 코드 작성 시 체크리스트

- [ ] 컴포넌트가 하나의 책임만 가지는가?
- [ ] 긴 리스트에 FlatList를 사용했는가?
- [ ] 불필요한 리렌더링을 방지했는가? (useCallback, useMemo)
- [ ] 타입이 제대로 정의되어 있는가?
- [ ] 에러 처리가 되어 있는가?
- [ ] iOS/Android 양쪽에서 테스트했는가?
