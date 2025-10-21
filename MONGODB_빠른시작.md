# MongoDB 빠른 시작 가이드 🚀

Vercel에서 MongoDB를 이미 연결하신 상태라면, 아래 단계만 따라하시면 됩니다!

---

## ⚡ 5단계로 완료하기

### 1️⃣ .env 파일 생성 및 설정

프로젝트 루트에 `.env` 파일을 만들고 아래 내용을 입력하세요:

```env
DATABASE_URL="your-mongodb-connection-string"
JWT_SECRET="your-random-secret"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

**MongoDB 연결 문자열 찾는 법:**

-   Vercel Dashboard → 프로젝트 → Storage → MongoDB → Connection String 복사

**시크릿 키 생성:**

```bash
openssl rand -base64 32
```

---

### 2️⃣ Prisma 설정

```bash
npm run prisma:generate
npm run prisma:push
```

---

### 3️⃣ 초기 데이터 생성 (선택사항)

```bash
npm run seed
```

---

### 4️⃣ 개발 서버 실행

```bash
npm run dev
```

→ http://localhost:3000 접속

---

### 5️⃣ Vercel 환경 변수 설정

Vercel Dashboard에서 다음 환경 변수들을 추가:

| 변수명            | 값                             | 환경       |
| ----------------- | ------------------------------ | ---------- |
| `DATABASE_URL`    | MongoDB 연결 문자열            | All        |
| `JWT_SECRET`      | 랜덤 시크릿                    | All        |
| `NEXTAUTH_SECRET` | 랜덤 시크릿                    | All        |
| `NEXTAUTH_URL`    | https://your-domain.vercel.app | Production |
| `NODE_ENV`        | production                     | Production |

설정 후 자동 재배포됩니다!

---

## ✅ 완료 체크리스트

-   [ ] `.env` 파일 생성 및 설정
-   [ ] `npm run prisma:generate` 실행
-   [ ] `npm run prisma:push` 실행
-   [ ] `npm run dev` 로 로컬 서버 실행
-   [ ] Vercel 환경 변수 설정
-   [ ] 로그인 기능 테스트

---

## 🎯 다음 할 일

1. **관리자 계정 생성**

    - `/api/users/create` API 사용
    - 또는 Prisma Studio에서 직접 생성

2. **로그인 테스트**

    - `/admin/login` 페이지 접속
    - 생성한 계정으로 로그인

3. **포트폴리오 관리**
    - `/admin/dashboard` 에서 포트폴리오 관리
    - 질문 추가 및 수정

---

## ⚠️ 자주 발생하는 문제

**문제: Prisma Client 오류**

```bash
npm run prisma:generate
```

**문제: MongoDB 연결 실패**

-   `.env` 파일의 `DATABASE_URL` 확인
-   MongoDB Atlas IP 화이트리스트 확인

**문제: Vercel 빌드 실패**

-   환경 변수 모두 설정했는지 확인
-   Git push로 재배포

---

더 자세한 내용은 `MONGODB_세팅_가이드.md`를 참고하세요!
