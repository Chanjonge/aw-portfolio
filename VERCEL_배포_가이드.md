# Vercel 배포 가이드

이 프로젝트를 Vercel에 배포하는 방법입니다.

## 1단계: GitHub에 코드 푸시

먼저 프로젝트를 GitHub 리포지토리에 올려야 합니다.

```bash
# Git 초기화 (아직 안했다면)
git init

# 파일 추가
git add .

# 커밋
git commit -m "Initial commit"

# GitHub 리포지토리 연결 (YOUR_USERNAME과 YOUR_REPO를 실제 값으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 푸시
git push -u origin main
```

## 2단계: 데이터베이스 준비 (PostgreSQL)

Vercel에서는 SQLite를 사용할 수 없으므로 PostgreSQL을 사용해야 합니다.

### 추천 무료 PostgreSQL 호스팅:

#### 옵션 1: Vercel Postgres (가장 쉬움)

1. Vercel 대시보드에서 프로젝트 생성 시 "Storage" 탭에서 Postgres 추가
2. 자동으로 `DATABASE_URL` 환경변수가 설정됨

#### 옵션 2: Neon (추천)

1. https://neon.tech 방문
2. 무료 계정 생성
3. 새 프로젝트 생성
4. Connection String 복사 (예: `postgresql://user:pass@host.neon.tech/dbname`)

#### 옵션 3: Supabase

1. https://supabase.com 방문
2. 무료 계정 생성
3. 새 프로젝트 생성
4. Settings > Database에서 Connection String 복사

## 3단계: Vercel에 배포

### 방법 1: Vercel 웹사이트 사용 (쉬움)

1. https://vercel.com 방문 및 로그인
2. "Add New Project" 클릭
3. GitHub 리포지토리 연결 및 선택
4. 환경 변수 설정:
    ```
    DATABASE_URL=postgresql://your-connection-string
    JWT_SECRET=your-random-secret-key
    NEXTAUTH_SECRET=your-nextauth-secret
    NEXTAUTH_URL=https://your-project.vercel.app
    ```
5. "Deploy" 클릭

### 방법 2: Vercel CLI 사용

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 프로젝트 배포
vercel

# 프로덕션 배포
vercel --prod
```

## 4단계: 데이터베이스 마이그레이션

배포 후 데이터베이스를 초기화해야 합니다.

### Prisma Schema를 PostgreSQL용으로 수정

`prisma/schema.prisma` 파일을 수정:

```prisma
datasource db {
  provider = "postgresql"  // sqlite에서 postgresql로 변경
  url      = env("DATABASE_URL")
}
```

### 로컬에서 마이그레이션 실행

```bash
# 환경변수 설정 (임시)
$env:DATABASE_URL="your-postgresql-connection-string"

# Prisma 마이그레이션 생성 및 실행
npx prisma migrate dev --name init

# 시드 데이터 추가
npm run seed
```

또는 Vercel 대시보드에서:

1. 프로젝트 > Settings > Functions
2. "Run Command" 기능 사용
3. `npx prisma migrate deploy` 실행

## 5단계: 환경 변수 확인

Vercel 대시보드에서 다음 환경 변수가 설정되었는지 확인:

-   ✅ `DATABASE_URL` - PostgreSQL 연결 문자열
-   ✅ `JWT_SECRET` - JWT 토큰 암호화 키
-   ✅ `NEXTAUTH_SECRET` - NextAuth 암호화 키
-   ✅ `NEXTAUTH_URL` - 배포된 URL (예: https://your-app.vercel.app)

## 6단계: 파일 업로드 처리

현재 프로젝트는 로컬 파일 시스템에 파일을 저장합니다 (`/public/uploads/`).
Vercel은 서버리스 환경이므로 파일 저장이 영구적이지 않습니다.

### 해결 방법:

#### 옵션 1: Vercel Blob Storage

```bash
npm install @vercel/blob
```

#### 옵션 2: AWS S3 또는 Cloudinary

외부 스토리지 서비스를 사용하여 이미지를 저장합니다.

## 트러블슈팅

### 빌드 실패 시

-   Prisma가 제대로 생성되지 않았을 수 있습니다
-   `package.json`의 `postinstall` 스크립트 확인
-   Vercel 빌드 로그 확인

### 데이터베이스 연결 오류

-   `DATABASE_URL` 환경변수가 올바른지 확인
-   PostgreSQL 호스팅 서비스의 연결 제한 확인
-   `?schema=public` 쿼리 파라미터 추가 필요할 수 있음

### 파일 업로드 안됨

-   Vercel은 읽기 전용 파일 시스템입니다
-   Vercel Blob 또는 외부 스토리지 사용 필요

## 유용한 명령어

```bash
# 로컬에서 프로덕션 빌드 테스트
npm run build
npm start

# Prisma Studio로 데이터베이스 확인
npx prisma studio

# 배포 로그 확인
vercel logs
```

## 참고 링크

-   Vercel 문서: https://vercel.com/docs
-   Prisma + Vercel: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel
-   Neon (PostgreSQL): https://neon.tech
-   Vercel Blob: https://vercel.com/docs/storage/vercel-blob
