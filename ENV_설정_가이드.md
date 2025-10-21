# 환경 변수 설정 가이드

## 📝 .env 파일 설정 방법

프로젝트 루트에 `.env` 파일이 생성되었습니다. 아래 내용을 복사해서 `.env` 파일에 붙여넣으세요:

```env
# ========================================
# MongoDB 연결 설정
# ========================================
# Vercel Dashboard → Storage → MongoDB에서 복사
DATABASE_URL="mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/YOUR_DATABASE?retryWrites=true&w=majority"

# ========================================
# 인증 시크릿 키
# ========================================
JWT_SECRET="YOUR_RANDOM_JWT_SECRET_HERE"
NEXTAUTH_SECRET="YOUR_RANDOM_NEXTAUTH_SECRET_HERE"

# ========================================
# 애플리케이션 설정
# ========================================
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

---

## 🔑 1단계: MongoDB 연결 문자열 가져오기

### Vercel에서 가져오기:

1. [Vercel Dashboard](https://vercel.com) 접속
2. 프로젝트 선택
3. **Storage** 탭 클릭
4. MongoDB 항목 클릭
5. **Connection String** 또는 **MONGODB_URI** 복사
6. `.env` 파일의 `DATABASE_URL`에 붙여넣기

**예시:**

```
mongodb+srv://admin:myP@ssw0rd@cluster0.abc123.mongodb.net/mydb?retryWrites=true&w=majority
```

---

## 🔐 2단계: 시크릿 키 생성

### PowerShell에서 생성 (Windows):

```powershell
# JWT_SECRET 생성
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# NEXTAUTH_SECRET 생성 (다른 값으로)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Git Bash나 WSL에서 생성:

```bash
openssl rand -base64 32
```

### 온라인 생성기 사용:

-   https://generate-secret.vercel.app/32

생성된 키를 `.env` 파일의 `JWT_SECRET`와 `NEXTAUTH_SECRET`에 붙여넣으세요.

---

## ✅ 3단계: 설정 완료 확인

`.env` 파일이 다음과 같이 설정되었는지 확인:

```env
DATABASE_URL="mongodb+srv://actual-username:actual-password@cluster.mongodb.net/database?retryWrites=true"
JWT_SECRET="dGhpc2lzYXJhbmRvbXNlY3JldGtleQ=="
NEXTAUTH_SECRET="YW5vdGhlcnJhbmRvbXNlY3JldGtleQ=="
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

⚠️ **주의**:

-   `YOUR_USERNAME`, `YOUR_PASSWORD` 등은 실제 값으로 변경
-   시크릿 키는 랜덤하게 생성된 값 사용
-   큰따옴표 유지

---

## 🚀 4단계: 다음 명령어 실행

`.env` 파일 설정 완료 후:

```bash
# Prisma Client 생성
npm run prisma:generate

# MongoDB에 스키마 적용
npm run prisma:push

# 개발 서버 실행
npm run dev
```

---

## 🔒 보안 주의사항

-   ✅ `.env` 파일은 절대 Git에 커밋하지 마세요
-   ✅ `.gitignore`에 `.env`가 포함되어 있는지 확인 (이미 포함됨)
-   ✅ 시크릿 키는 프로덕션과 개발 환경에서 다르게 사용
-   ✅ MongoDB 비밀번호에 특수문자가 있으면 URL 인코딩 필요
