# MongoDB 세팅 진행 상황 📊

## ✅ 완료된 작업 (자동 실행됨)

### 1. Prisma Schema 변경 ✅

-   SQLite → MongoDB로 전환 완료
-   모든 모델에 `@db.ObjectId` 추가
-   ID 필드 MongoDB 형식으로 변경

### 2. Package.json 스크립트 추가 ✅

-   `prisma:generate` - Prisma Client 생성
-   `prisma:push` - MongoDB 스키마 푸시
-   `prisma:studio` - 데이터베이스 GUI

### 3. .env 파일 생성 ✅

-   프로젝트 루트에 `.env` 파일 생성 완료
-   빈 파일로 생성됨 (설정 필요)

### 4. Prisma Client 생성 ✅

```bash
✔ Generated Prisma Client (v5.22.0)
```

MongoDB용 Prisma Client가 성공적으로 생성되었습니다!

---

## 🔄 지금 해야 할 작업

### ⭐ 중요: MongoDB 연결 문자열 설정

`.env` 파일에 MongoDB 연결 정보를 입력해야 합니다:

#### 1단계: Vercel에서 연결 문자열 가져오기

1. [Vercel Dashboard](https://vercel.com) 접속
2. 프로젝트 선택
3. **Storage** 탭
4. MongoDB 클릭
5. **Connection String** 복사

#### 2단계: .env 파일 편집

프로젝트 루트의 `.env` 파일을 열고 다음 내용을 입력하세요:

```env
# MongoDB 연결 (Vercel Storage에서 복사)
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority"

# JWT 시크릿 (아래 명령어로 생성)
JWT_SECRET="랜덤키"
NEXTAUTH_SECRET="랜덤키"

# 앱 설정
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

#### 3단계: 시크릿 키 생성

**PowerShell에서:**

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**또는 Git Bash에서:**

```bash
openssl rand -base64 32
```

생성된 값을 `JWT_SECRET`과 `NEXTAUTH_SECRET`에 붙여넣으세요 (서로 다른 값 사용).

---

## 🚀 .env 설정 완료 후 실행할 명령어

`.env` 파일 설정이 완료되면 아래 명령어를 실행하세요:

```bash
# 1. MongoDB에 스키마 적용
npm run prisma:push

# 2. 초기 관리자 계정 생성 (선택)
npm run seed

# 3. 개발 서버 실행
npm run dev
```

---

## 📋 체크리스트

-   [x] Prisma Schema MongoDB로 변경
-   [x] .env 파일 생성
-   [x] Prisma Client 생성
-   [ ] ⭐ `.env` 파일에 MongoDB 연결 문자열 입력
-   [ ] ⭐ `.env` 파일에 시크릿 키 입력
-   [ ] `npm run prisma:push` 실행
-   [ ] `npm run seed` 실행 (선택)
-   [ ] `npm run dev` 실행

---

## 💡 추가 참고 문서

-   **ENV*설정*가이드.md** - 환경 변수 상세 설정 가이드
-   **MONGODB\_빠른시작.md** - 빠른 시작 가이드
-   **MONGODB*세팅*가이드.md** - 전체 세팅 가이드

---

## ⚠️ 문제 발생 시

### MongoDB 연결 실패

-   `.env` 파일의 `DATABASE_URL` 형식 확인
-   MongoDB Atlas IP 화이트리스트에 `0.0.0.0/0` 추가
-   비밀번호에 특수문자가 있으면 URL 인코딩 필요

### Prisma Client 오류

```bash
npm run prisma:generate
```

### 빌드 실패

-   모든 환경 변수가 설정되었는지 확인
-   `node_modules` 삭제 후 `npm install` 재실행

---

**다음 단계**: `.env` 파일을 설정한 후 위의 명령어들을 실행하시면 됩니다! 🎉
