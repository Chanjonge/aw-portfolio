# Vercel 환경 변수 설정 가이드 🔐

로컬 개발 환경 설정이 완료되면, Vercel 배포 환경에도 같은 환경 변수를 설정해야 합니다.

---

## 📋 설정해야 할 환경 변수

| 변수명            | 설명                | 예시                          |
| ----------------- | ------------------- | ----------------------------- |
| `DATABASE_URL`    | MongoDB 연결 문자열 | `mongodb+srv://...`           |
| `JWT_SECRET`      | JWT 토큰 시크릿     | `dGhpc2lzYXJhbmRvbQ==`        |
| `NEXTAUTH_SECRET` | NextAuth 시크릿     | `YW5vdGhlcnJhbmRvbQ==`        |
| `NEXTAUTH_URL`    | 프로덕션 URL        | `https://your-app.vercel.app` |
| `NODE_ENV`        | 환경 모드           | `production`                  |

---

## 🚀 Vercel Dashboard에서 설정하기

### 1단계: Vercel 프로젝트 열기

1. https://vercel.com 접속
2. 로그인
3. 프로젝트 선택

### 2단계: Settings로 이동

-   상단 메뉴에서 **Settings** 클릭

### 3단계: Environment Variables 선택

-   왼쪽 사이드바에서 **Environment Variables** 클릭

### 4단계: 환경 변수 추가

각 변수를 하나씩 추가:

#### DATABASE_URL

```
Key: DATABASE_URL
Value: mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
Environment: Production, Preview, Development (모두 체크)
```

**참고**: Storage 탭에서 MongoDB를 연결했다면 이미 자동으로 설정되어 있을 수 있습니다.

#### JWT_SECRET

```
Key: JWT_SECRET
Value: (로컬 .env 파일과 동일한 값 또는 새로운 랜덤 값)
Environment: Production, Preview, Development (모두 체크)
```

#### NEXTAUTH_SECRET

```
Key: NEXTAUTH_SECRET
Value: (로컬 .env 파일과 동일한 값 또는 새로운 랜덤 값)
Environment: Production, Preview, Development (모두 체크)
```

#### NEXTAUTH_URL (Production만)

```
Key: NEXTAUTH_URL
Value: https://your-project-name.vercel.app
Environment: Production만 체크
```

#### NODE_ENV

```
Key: NODE_ENV
Value: production
Environment: Production만 체크
```

---

## 🔄 환경별 설정 권장사항

### Production (프로덕션)

```env
DATABASE_URL=mongodb+srv://... (프로덕션 DB)
JWT_SECRET=강력한_랜덤_키
NEXTAUTH_SECRET=강력한_랜덤_키
NEXTAUTH_URL=https://your-app.vercel.app
NODE_ENV=production
```

### Preview (미리보기 - PR용)

```env
DATABASE_URL=mongodb+srv://... (같은 DB 또는 테스트 DB)
JWT_SECRET=로컬과_동일
NEXTAUTH_SECRET=로컬과_동일
```

### Development (개발)

```env
(로컬 .env와 동일하게 설정 - 선택사항)
```

---

## ⚙️ Vercel CLI로 설정하기 (대안)

명령줄을 선호한다면:

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 프로젝트 링크
vercel link

# 환경 변수 추가
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add NODE_ENV production
```

---

## ✅ 설정 완료 후

### 1. 재배포 트리거

환경 변수를 추가/수정하면 자동으로 재배포가 트리거됩니다.

### 2. 배포 상태 확인

-   Vercel Dashboard → Deployments 탭
-   최신 배포가 "Ready" 상태인지 확인

### 3. 프로덕션 테스트

```
https://your-app.vercel.app/admin/login
```

로그인 기능이 정상 작동하는지 테스트

---

## 🔍 문제 해결

### 환경 변수가 적용되지 않음

-   재배포 필요: `git push` 또는 Vercel Dashboard에서 "Redeploy"
-   빌드 로그 확인: Deployments → 최신 배포 → "View Function Logs"

### 빌드 실패

```
Error: Environment variable not found: DATABASE_URL
```

→ 환경 변수가 제대로 설정되지 않음. 다시 확인하고 재배포.

### MongoDB 연결 실패

-   MongoDB Atlas IP 화이트리스트 확인
    -   Atlas Dashboard → Network Access
    -   `0.0.0.0/0` (모든 IP 허용) 추가
-   연결 문자열 형식 확인

---

## 🔐 보안 팁

1. **시크릿 키 관리**

    - 프로덕션과 개발 환경에서 다른 키 사용 권장
    - 최소 32자 이상의 랜덤 문자열
    - 정기적으로 변경

2. **DATABASE_URL 보호**

    - 절대 Git에 커밋하지 않기
    - 팀원과 공유 시 안전한 방법 사용 (1Password, LastPass 등)

3. **IP 화이트리스트**

    - 가능하면 특정 IP만 허용
    - Vercel은 동적 IP이므로 `0.0.0.0/0` 필요

4. **환경 변수 로그**
    - 환경 변수 값이 로그에 출력되지 않도록 주의
    - `console.log(process.env.JWT_SECRET)` 같은 코드 제거

---

## 📊 환경 변수 확인 체크리스트

Vercel Dashboard에서 확인:

-   [ ] DATABASE_URL 설정됨 (Production, Preview, Development)
-   [ ] JWT_SECRET 설정됨 (Production, Preview, Development)
-   [ ] NEXTAUTH_SECRET 설정됨 (Production, Preview, Development)
-   [ ] NEXTAUTH_URL 설정됨 (Production에 프로덕션 URL)
-   [ ] NODE_ENV=production 설정됨 (Production만)
-   [ ] 최신 배포가 성공적으로 완료됨
-   [ ] 프로덕션에서 로그인 기능 테스트 완료

---

## 🎯 다음 단계

환경 변수 설정이 완료되면:

1. **초기 데이터 생성**

    - Prisma Studio로 관리자 계정 생성
    - 또는 API로 관리자 계정 생성

2. **기능 테스트**

    - 로그인/로그아웃
    - 포트폴리오 CRUD
    - 폼 제출

3. **모니터링 설정**
    - Vercel Analytics 확인
    - 에러 로그 모니터링

---

더 자세한 내용은:

-   **VERCEL*배포*가이드.md**
-   **MONGODB*세팅*가이드.md**
