# 멀티 스텝 폼 시스템

단계별 양식 작성 및 관리 시스템입니다. 구글 폼과 유사한 인터페이스로 다단계 양식을 만들고 제출받을 수 있습니다.

## 주요 기능

-   ✅ **단계별 양식**: 5단계 이상의 다단계 양식 지원
-   ✅ **유효성 검증**: 각 질문별 최소 글자 수 요구사항 설정
-   ✅ **관리자 시스템**: 최고 관리자와 일반 관리자 권한 분리
-   ✅ **질문 관리**: 최고 관리자가 질문을 자유롭게 추가/수정/삭제
-   ✅ **제출 내역 조회**: 제출된 양식을 관리자 페이지에서 확인
-   ✅ **깔끔한 디자인**: 블랙 앤 화이트 테마

## 기술 스택

-   **Frontend**: Next.js 14 (App Router), React, TypeScript
-   **Styling**: Tailwind CSS
-   **Database**: SQLite (Prisma ORM)
-   **Authentication**: JWT

## 설치 방법

1. 의존성 설치:

```bash
npm install
```

2. 데이터베이스 초기화:

```bash
npx prisma generate
npx prisma db push
```

3. 초기 데이터 생성 (최고 관리자 계정 및 샘플 질문):

```bash
npx tsx prisma/seed.ts
```

4. 개발 서버 실행:

```bash
npm run dev
```

5. 브라우저에서 http://localhost:3000 접속

## 기본 계정 정보

초기 설정 후 다음 계정으로 로그인할 수 있습니다:

-   **이메일**: admin@example.com
-   **비밀번호**: admin123
-   **역할**: 최고 관리자

⚠️ **프로덕션 환경에서는 반드시 비밀번호를 변경하세요!**

## 사용 방법

### 최고 관리자

1. `/admin/login`에서 로그인
2. 최고 관리자 페이지에서:
    - 새로운 관리자 계정 생성
    - 질문 추가/수정/삭제
    - 단계별 질문 구성

### 일반 관리자

1. 최고 관리자가 생성한 계정으로 로그인
2. 대시보드에서 제출된 양식 확인

### 일반 사용자

1. 메인 페이지에서 "양식 작성하기" 클릭
2. 단계별로 질문에 답변 (최소 글자 수 충족 필요)
3. 마지막 단계에서 제출

## 프로젝트 구조

```
├── app/
│   ├── admin/
│   │   ├── dashboard/     # 일반 관리자 대시보드
│   │   ├── login/         # 관리자 로그인
│   │   └── super/         # 최고 관리자 페이지
│   ├── api/               # API 라우트
│   ├── form/              # 양식 작성 페이지
│   └── thank-you/         # 제출 완료 페이지
├── components/
│   └── MultiStepForm.tsx  # 다단계 양식 컴포넌트
├── lib/
│   ├── auth.ts            # 인증 유틸리티
│   └── prisma.ts          # Prisma 클라이언트
└── prisma/
    ├── schema.prisma      # 데이터베이스 스키마
    └── seed.ts            # 초기 데이터 시드
```

## 데이터베이스 스키마

### User

-   관리자 계정 정보 (이메일, 비밀번호, 이름, 역할)

### Question

-   양식 질문 (단계, 제목, 설명, 최소 글자 수, 순서, 필수 여부)

### FormSubmission

-   제출된 양식 데이터 (응답 내용, 제출일시, IP 주소)

## 환경 변수

`.env` 파일에 다음 변수들이 필요합니다:

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

## 배포

프로덕션 배포 시:

1. 데이터베이스를 PostgreSQL 등으로 변경 권장
2. `.env` 파일의 `NEXTAUTH_SECRET` 변경
3. 초기 관리자 비밀번호 변경
4. HTTPS 사용 필수

## 라이선스

MIT
