# ⚡ MongoDB 세팅 완료 - 빠른 가이드

## 🎉 자동으로 완료된 작업

-   ✅ Prisma Schema를 MongoDB용으로 변경
-   ✅ Package.json에 MongoDB 관련 스크립트 추가
-   ✅ `.env` 파일 생성
-   ✅ Prisma Client 생성 (MongoDB용 타입 정의 완료)

---

## 🚀 지금 바로 해야 할 일 (2분 소요)

### 1️⃣ Vercel에서 MongoDB 연결 문자열 복사

```
Vercel Dashboard → 프로젝트 → Storage → MongoDB → Connection String 복사
```

### 2️⃣ `.env` 파일 편집

프로젝트 루트의 `.env` 파일을 열고 아래 내용 붙여넣기:

```env
DATABASE_URL="여기에_복사한_연결_문자열_붙여넣기"
JWT_SECRET="아래_명령어로_생성한_키"
NEXTAUTH_SECRET="아래_명령어로_생성한_키"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

### 3️⃣ 시크릿 키 생성

**PowerShell에서 실행:**

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

-   이 명령어를 **2번** 실행
-   첫 번째 결과 → `JWT_SECRET`에 입력
-   두 번째 결과 → `NEXTAUTH_SECRET`에 입력

### 4️⃣ 명령어 실행

```bash
# MongoDB에 스키마 적용
npm run prisma:push

# 초기 관리자 계정 생성 (선택)
npm run seed

# 개발 서버 시작
npm run dev
```

### 5️⃣ Vercel 환경 변수 설정

```
Vercel Dashboard → Settings → Environment Variables
```

다음 변수들을 추가:

-   `DATABASE_URL` (이미 있을 수 있음)
-   `JWT_SECRET`
-   `NEXTAUTH_SECRET`
-   `NEXTAUTH_URL` (프로덕션: https://your-app.vercel.app)
-   `NODE_ENV` (프로덕션: production)

---

## 📚 상세 가이드 문서

각 단계에 대한 자세한 설명이 필요하면:

| 문서                         | 내용                              |
| ---------------------------- | --------------------------------- |
| **ENV*설정*가이드.md**       | .env 파일 설정 상세 가이드        |
| **MONGODB*세팅*진행상황.md** | 현재까지 진행된 작업 및 다음 단계 |
| **VERCEL*환경변수*설정.md**  | Vercel 환경 변수 설정 방법        |
| **MONGODB\_빠른시작.md**     | 5단계 빠른 시작 가이드            |
| **MONGODB*세팅*가이드.md**   | 전체 세팅 완벽 가이드             |
| **다음\_단계.txt**           | 간단한 체크리스트                 |

---

## ✅ 체크리스트

-   [ ] Vercel에서 MongoDB 연결 문자열 복사
-   [ ] `.env` 파일에 `DATABASE_URL` 입력
-   [ ] PowerShell로 시크릿 키 2개 생성
-   [ ] `.env` 파일에 `JWT_SECRET`, `NEXTAUTH_SECRET` 입력
-   [ ] `npm run prisma:push` 실행
-   [ ] `npm run seed` 실행 (선택)
-   [ ] `npm run dev` 실행 및 테스트
-   [ ] Vercel 환경 변수 설정
-   [ ] 프로덕션에서 테스트

---

## 🆘 문제 발생 시

### MongoDB 연결 실패

```
Error: Connection failed
```

-   `.env`의 `DATABASE_URL` 형식 확인
-   MongoDB Atlas IP 화이트리스트에 `0.0.0.0/0` 추가

### Prisma Client 오류

```
Error: Cannot find module '@prisma/client'
```

```bash
npm run prisma:generate
```

### Vercel 빌드 실패

-   모든 환경 변수가 설정되었는지 확인
-   Deployments → 최신 배포 → Logs 확인

---

## 🎯 완료 후

모든 설정이 완료되면:

1. **로컬 테스트**: http://localhost:3000/admin/login
2. **프로덕션 테스트**: https://your-app.vercel.app/admin/login
3. **포트폴리오 관리**: /admin/dashboard
4. **폼 테스트**: /form

---

**총 소요 시간**: 약 5분  
**난이도**: ⭐⭐☆☆☆

모든 설정이 완료되면 기초 세팅이 끝납니다! 🎉
