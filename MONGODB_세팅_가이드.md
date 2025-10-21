# MongoDB 세팅 가이드

## 📋 개요

Vercel에서 MongoDB를 연결한 후 필요한 로컬 및 배포 환경 설정 가이드입니다.

---

## ✅ 완료된 작업

### 1. Prisma Schema 변경 완료

-   ✅ SQLite → MongoDB로 전환
-   ✅ 모든 모델에 `@db.ObjectId` 추가
-   ✅ ID 필드에 `@default(auto()) @map("_id")` 설정

### 2. Package.json 스크립트 추가

-   ✅ `prisma:generate` - Prisma Client 생성
-   ✅ `prisma:push` - MongoDB에 스키마 푸시
-   ✅ `prisma:studio` - Prisma Studio 실행

---

## 🔧 로컬 환경 세팅 단계

### 1단계: 환경 변수 파일 생성

프로젝트 루트에 `.env` 파일을 생성하세요:

```bash
# .env 파일 생성
touch .env  # Mac/Linux
# 또는 Windows에서 직접 파일 생성
```

### 2단계: Vercel에서 MongoDB 연결 문자열 복사

1. **Vercel Dashboard** 접속
2. 프로젝트 선택
3. **Storage** 탭 클릭
4. MongoDB 연결 클릭
5. **Connection String** 복사

연결 문자열 형식:

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

### 3단계: .env 파일 작성

복사한 연결 문자열을 `.env` 파일에 추가:

```env
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority"

# JWT Secret (새로운 시크릿 키 생성)
JWT_SECRET="your-random-secret-key-here"

# NextAuth (선택사항)
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
```

**🔐 시크릿 키 생성 방법:**

```bash
# Mac/Linux에서 랜덤 키 생성
openssl rand -base64 32

# 또는 온라인 생성기 사용
# https://generate-secret.vercel.app/
```

### 4단계: Prisma 설정 및 DB 동기화

```bash
# 1. Prisma Client 생성
npm run prisma:generate

# 2. MongoDB에 스키마 적용 (마이그레이션 대신 push 사용)
npm run prisma:push

# 3. 초기 데이터 시드 (선택사항)
npm run seed
```

### 5단계: 로컬 개발 서버 실행

```bash
npm run dev
```

---

## 🚀 Vercel 배포 환경 세팅

### 1단계: Vercel 환경 변수 설정

1. **Vercel Dashboard** → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 다음 변수들을 추가:

```
DATABASE_URL = mongodb+srv://...  (Storage에서 자동 추가됨)
JWT_SECRET = [생성한 시크릿 키]
NEXTAUTH_SECRET = [생성한 시크릿 키]
NEXTAUTH_URL = https://your-domain.vercel.app
NODE_ENV = production
```

**중요**: 각 환경별로 설정 가능

-   ✅ Production
-   ✅ Preview
-   ✅ Development

### 2단계: 재배포

환경 변수 설정 후 자동으로 재배포되거나, 수동으로 재배포:

```bash
# Git push로 자동 배포
git add .
git commit -m "MongoDB 설정 완료"
git push origin main

# 또는 Vercel CLI 사용
vercel --prod
```

### 3단계: 배포 후 데이터베이스 초기화

Vercel 배포 후 초기 관리자 계정 생성:

**방법 1: Prisma Studio 사용 (로컬에서)**

```bash
npm run prisma:studio
```

-   User 모델에서 직접 관리자 생성
-   비밀번호는 bcrypt로 해시해야 함

**방법 2: API 엔드포인트 사용**
배포된 사이트에서 `/api/users/create` 호출

---

## 🔍 문제 해결

### 문제 1: "Prisma Client not found" 오류

```bash
npm run prisma:generate
```

### 문제 2: MongoDB 연결 실패

-   `.env` 파일의 `DATABASE_URL` 확인
-   MongoDB Atlas에서 IP 화이트리스트 확인 (0.0.0.0/0 허용)
-   비밀번호에 특수문자가 있으면 URL 인코딩 필요

### 문제 3: Vercel 빌드 실패

-   환경 변수가 제대로 설정되었는지 확인
-   `vercel.json`의 buildCommand 확인: `prisma generate && next build`

---

## 📊 데이터베이스 관리

### Prisma Studio로 데이터 확인

```bash
npm run prisma:studio
```

브라우저에서 `http://localhost:5555` 열림

### MongoDB Atlas 직접 접속

1. MongoDB Atlas 대시보드 접속
2. Database → Browse Collections
3. 데이터 직접 확인/수정 가능

---

## 🔐 보안 체크리스트

-   [ ] `.env` 파일이 `.gitignore`에 포함됨
-   [ ] Git에 `.env` 파일이 커밋되지 않았는지 확인
-   [ ] JWT_SECRET 랜덤 키로 생성
-   [ ] MongoDB 비밀번호 강력하게 설정
-   [ ] Vercel 환경 변수에 모든 필수 값 입력

---

## 📝 다음 단계

1. ✅ MongoDB 연결 완료
2. 🔄 초기 관리자 계정 생성
3. 🔄 로그인 기능 테스트
4. 🔄 포트폴리오 데이터 입력
5. 🔄 폼 제출 테스트

---

## 💡 유용한 명령어

```bash
# Prisma Client 재생성
npm run prisma:generate

# 스키마를 DB에 적용
npm run prisma:push

# Prisma Studio 열기
npm run prisma:studio

# 시드 데이터 추가
npm run seed

# 로컬 개발 서버
npm run dev

# 프로덕션 빌드 테스트
npm run build
npm run start
```

---

## 🆘 추가 도움이 필요하면

-   Prisma 문서: https://www.prisma.io/docs
-   MongoDB Atlas 문서: https://docs.atlas.mongodb.com/
-   Vercel 문서: https://vercel.com/docs
