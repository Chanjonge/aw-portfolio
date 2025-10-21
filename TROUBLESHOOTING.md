# 🔧 문제 해결 가이드

일반적인 문제들과 해결 방법을 정리했습니다.

---

## 📦 설치 관련 문제

### 문제 1: `npm install` 실패

**증상:**

```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**해결 방법:**

```bash
# 1. node_modules와 package-lock.json 삭제
rm -rf node_modules package-lock.json

# 2. npm 캐시 정리
npm cache clean --force

# 3. 재설치
npm install

# 또는 legacy peer deps 사용
npm install --legacy-peer-deps
```

### 문제 2: Node.js 버전 오류

**증상:**

```
error Unsupported engine
```

**해결 방법:**

```bash
# Node.js 버전 확인
node --version

# Node.js 18 이상이 필요합니다
# nvm 사용 시:
nvm install 18
nvm use 18

# 또는 https://nodejs.org 에서 최신 LTS 버전 다운로드
```

### 문제 3: TypeScript 오류

**증상:**

```
Cannot find module 'next' or its corresponding type declarations
```

**해결 방법:**

```bash
# 의존성이 제대로 설치되지 않았을 가능성
npm install

# TypeScript 재컴파일
npx tsc --noEmit
```

---

## 🗄 데이터베이스 관련 문제

### 문제 4: Prisma 초기화 실패

**증상:**

```
Error: P1003: Database does not exist
```

**해결 방법:**

```bash
# Prisma 클라이언트 재생성
npx prisma generate

# 데이터베이스 푸시
npx prisma db push

# Prisma Studio로 확인
npx prisma studio
```

### 문제 5: 데이터베이스 락 오류

**증상:**

```
Error: database is locked
```

**해결 방법:**

```bash
# 개발 서버 중지
# Ctrl+C

# 데이터베이스 파일 확인
ls -la prisma/

# 락 파일이 있다면 삭제
rm prisma/dev.db-journal

# 서버 재시작
npm run dev
```

### 문제 6: Seed 스크립트 실패

**증상:**

```
Error running seed script
```

**해결 방법:**

```bash
# tsx 패키지 확인
npm list tsx

# 없다면 설치
npm install -D tsx

# 수동으로 seed 실행
npx tsx prisma/seed.ts
```

### 문제 7: 데이터베이스 완전 초기화

**모든 데이터를 지우고 새로 시작:**

```bash
# 1. 데이터베이스 파일 삭제
rm prisma/dev.db
rm prisma/dev.db-journal  # 있다면

# 2. Prisma 재설정
npx prisma generate
npx prisma db push

# 3. Seed 재실행
npm run seed

# 4. 서버 재시작
npm run dev
```

---

## 🔐 인증 관련 문제

### 문제 8: 로그인 실패

**증상:**

```
이메일 또는 비밀번호가 올바르지 않습니다
```

**해결 방법:**

1. **기본 계정 확인:**

    - 이메일: `admin@example.com`
    - 비밀번호: `admin123`

2. **데이터베이스 확인:**

    ```bash
    npx prisma studio
    # User 테이블에서 계정 확인
    ```

3. **새로 계정 생성:**
    ```bash
    # 데이터베이스 초기화 후 seed 재실행
    npm run seed
    ```

### 문제 9: 토큰 만료

**증상:**

```
유효하지 않은 토큰입니다
```

**해결 방법:**

```javascript
// 브라우저 개발자 도구 콘솔에서:
localStorage.removeItem('token');
localStorage.removeItem('user');

// 그 다음 재로그인
```

### 문제 10: 권한 오류

**증상:**

```
최고 관리자 권한이 필요합니다
```

**해결 방법:**

1. 로그아웃 후 재로그인
2. localStorage 확인:
    ```javascript
    // 브라우저 콘솔
    JSON.parse(localStorage.getItem('user'));
    // role이 'SUPER_ADMIN'인지 확인
    ```
3. 계정의 역할 확인:
    ```bash
    npx prisma studio
    # User 테이블에서 role 확인
    ```

---

## 🌐 서버 관련 문제

### 문제 11: 포트 충돌

**증상:**

```
Port 3000 is already in use
```

**해결 방법:**

**방법 1: 다른 포트 사용**

```bash
PORT=3001 npm run dev
```

**방법 2: 기존 프로세스 종료 (Windows)**

```powershell
# 포트 사용 프로세스 찾기
netstat -ano | findstr :3000

# PID로 프로세스 종료
taskkill /PID <PID번호> /F
```

**방법 3: 기존 프로세스 종료 (Mac/Linux)**

```bash
# 포트 사용 프로세스 찾기
lsof -i :3000

# 프로세스 종료
kill -9 <PID>
```

### 문제 12: Hot Reload 작동 안 함

**증상:**
코드 변경 시 자동으로 새로고침되지 않음

**해결 방법:**

```bash
# 1. 서버 재시작
# Ctrl+C로 중지 후
npm run dev

# 2. .next 폴더 삭제
rm -rf .next
npm run dev

# 3. 브라우저 캐시 삭제
# Ctrl+Shift+R (강력 새로고침)
```

### 문제 13: API 응답 없음

**증상:**
API 호출 시 무한 로딩

**해결 방법:**

```javascript
// 브라우저 개발자 도구 → Network 탭 확인
// Console 탭에서 오류 확인

// API 경로 확인
console.log('API 호출:', '/api/questions');

// fetch 오류 처리 추가
try {
    const response = await fetch('/api/questions');
    console.log('응답:', response);
    const data = await response.json();
    console.log('데이터:', data);
} catch (error) {
    console.error('오류:', error);
}
```

---

## 💻 프론트엔드 문제

### 문제 14: 페이지 404 오류

**증상:**

```
404 | This page could not be found
```

**해결 방법:**

1. **URL 확인:**

    - `/form` ✅
    - `/Form` ❌ (대소문자 구분)
    - `/forms` ❌ (복수형)

2. **파일 구조 확인:**

    ```bash
    ls app/form/page.tsx  # 파일이 있는지 확인
    ```

3. **서버 재시작:**
    ```bash
    # Ctrl+C로 중지
    npm run dev
    ```

### 문제 15: 스타일이 적용되지 않음

**증상:**
페이지가 스타일 없이 표시됨

**해결 방법:**

```bash
# 1. Tailwind 설정 확인
cat tailwind.config.js

# 2. globals.css import 확인
# app/layout.tsx에 import './globals.css' 있는지 확인

# 3. 캐시 삭제
rm -rf .next
npm run dev

# 4. 브라우저 강력 새로고침
# Ctrl+Shift+R
```

### 문제 16: 컴포넌트 렌더링 오류

**증상:**

```
Hydration failed because the initial UI does not match...
```

**해결 방법:**

```javascript
// 1. useEffect 사용하여 클라이언트 전용 렌더링
const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])

if (!mounted) return null

// 2. suppressHydrationWarning 사용 (필요시)
<html suppressHydrationWarning>
```

---

## 📱 양식 관련 문제

### 문제 17: 다음 단계로 넘어가지 않음

**증상:**
"다음" 버튼 클릭 시 반응 없음

**해결 방법:**

1. **최소 글자 수 확인:**

    - 각 질문의 최소 글자 수를 충족해야 합니다
    - 글자 수 카운터 확인

2. **필수 항목 확인:**

    - 빨간 별표(\*)가 있는 항목은 필수입니다

3. **에러 메시지 확인:**
    - 입력 필드 아래 빨간 텍스트 확인

### 문제 18: 제출 실패

**증상:**

```
제출 중 오류가 발생했습니다
```

**해결 방법:**

```javascript
// 브라우저 콘솔 확인
// 1. Network 탭에서 API 응답 확인
// 2. Console 탭에서 오류 메시지 확인

// 서버 로그 확인
// 터미널에서 오류 메시지 확인
```

### 문제 19: 질문이 표시되지 않음

**증상:**
"아직 설정된 질문이 없습니다"

**해결 방법:**

```bash
# 1. 질문 데이터 확인
npx prisma studio
# Question 테이블 확인

# 2. 질문이 없다면 seed 재실행
npm run seed

# 3. API 응답 확인
# 브라우저에서 http://localhost:3000/api/questions 직접 접속
```

---

## 🔨 개발 환경 문제

### 문제 20: Windows 경로 오류

**증상:**

```
Error: ENOENT: no such file or directory
```

**해결 방법:**

```javascript
// Windows에서 경로 구분자 문제
// package.json에서 cross-env 사용

// 설치
npm install -D cross-env

// package.json 수정
"scripts": {
  "dev": "cross-env NODE_ENV=development next dev"
}
```

### 문제 21: Git Bash 오류

**증상:**
명령어 실행 시 오류 발생

**해결 방법:**

```bash
# PowerShell 또는 CMD 사용 권장
# 또는 WSL(Windows Subsystem for Linux) 사용

# WSL 설치:
wsl --install
```

---

## 🚀 프로덕션 배포 문제

### 문제 22: 빌드 실패

**증상:**

```
npm run build
Error: Build failed
```

**해결 방법:**

```bash
# 1. 타입 오류 확인
npx tsc --noEmit

# 2. Linter 오류 확인
npm run lint

# 3. 의존성 재설치
rm -rf node_modules .next
npm install
npm run build
```

### 문제 23: 데이터베이스 연결 오류 (프로덕션)

**증상:**

```
Can't reach database server
```

**해결 방법:**

1. **환경 변수 확인:**

    ```bash
    # .env 파일 또는 배포 환경 변수
    DATABASE_URL="postgresql://..."
    NEXTAUTH_SECRET="..."
    NEXTAUTH_URL="https://yourdomain.com"
    ```

2. **데이터베이스 마이그레이션:**
    ```bash
    npx prisma migrate deploy
    ```

---

## 📞 추가 도움말

### 로그 확인하기

**서버 로그:**

```bash
# 터미널에서 실행 중인 npm run dev 출력 확인
```

**브라우저 콘솔:**

```
F12 → Console 탭
```

**네트워크 요청:**

```
F12 → Network 탭
```

**데이터베이스:**

```bash
npx prisma studio
# http://localhost:5555 에서 확인
```

### 디버깅 팁

1. **단계별 확인:**

    ```javascript
    console.log('1. 함수 시작');
    console.log('2. 데이터:', data);
    console.log('3. 조건:', condition);
    ```

2. **API 테스트:**

    - Postman 또는 Thunder Client 사용
    - 브라우저에서 직접 API URL 접속

3. **상태 확인:**
    ```javascript
    console.log('현재 상태:', {
        user,
        questions,
        formData,
    });
    ```

### 완전 초기화 (최후의 수단)

```bash
# ⚠️ 모든 데이터가 삭제됩니다!

# 1. 모든 생성된 파일 삭제
rm -rf node_modules
rm -rf .next
rm -rf prisma/dev.db
rm -rf prisma/dev.db-journal
rm package-lock.json

# 2. 처음부터 재설치
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

---

## 📚 유용한 링크

-   **Next.js 문서**: https://nextjs.org/docs
-   **Prisma 문서**: https://www.prisma.io/docs
-   **Tailwind CSS**: https://tailwindcss.com/docs
-   **React 문서**: https://react.dev

---

문제가 계속 발생하면:

1. 오류 메시지 전체 복사
2. 실행한 명령어 기록
3. 환경 정보 (OS, Node 버전) 확인
4. 개발팀에 문의

Happy Coding! 🎉
