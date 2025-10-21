# 프로젝트 구조

```
기초자료/
│
├── app/                          # Next.js App Router
│   ├── admin/                    # 관리자 페이지
│   │   ├── dashboard/
│   │   │   └── page.tsx         # 일반 관리자 대시보드
│   │   ├── login/
│   │   │   └── page.tsx         # 관리자 로그인 페이지
│   │   └── super/
│   │       └── page.tsx         # 최고 관리자 페이지
│   │
│   ├── api/                      # API Routes
│   │   ├── auth/                 # 인증 관련
│   │   │   ├── login/
│   │   │   │   └── route.ts     # 로그인 API
│   │   │   └── verify/
│   │   │       └── route.ts     # 토큰 검증 API
│   │   ├── users/                # 사용자 관리
│   │   │   ├── create/
│   │   │   │   └── route.ts     # 사용자 생성 API (최고 관리자 전용)
│   │   │   └── list/
│   │   │       └── route.ts     # 사용자 목록 API (최고 관리자 전용)
│   │   ├── questions/
│   │   │   └── route.ts         # 질문 CRUD API
│   │   └── submissions/
│   │       └── route.ts         # 양식 제출 및 조회 API
│   │
│   ├── form/
│   │   └── page.tsx             # 양식 작성 페이지
│   ├── thank-you/
│   │   └── page.tsx             # 제출 완료 페이지
│   │
│   ├── globals.css              # 전역 스타일
│   ├── layout.tsx               # 루트 레이아웃
│   └── page.tsx                 # 메인 홈페이지
│
├── components/                   # React 컴포넌트
│   └── MultiStepForm.tsx        # 다단계 양식 메인 컴포넌트
│
├── lib/                          # 유틸리티 라이브러리
│   ├── auth.ts                  # 인증 헬퍼 (JWT, 비밀번호 해싱)
│   └── prisma.ts                # Prisma 클라이언트 인스턴스
│
├── prisma/                       # 데이터베이스
│   ├── schema.prisma            # 데이터베이스 스키마 정의
│   ├── seed.ts                  # 초기 데이터 시드 스크립트
│   └── dev.db                   # SQLite 데이터베이스 파일 (생성됨)
│
├── next.config.js               # Next.js 설정
├── tailwind.config.js           # Tailwind CSS 설정
├── postcss.config.js            # PostCSS 설정
├── tsconfig.json                # TypeScript 설정
├── package.json                 # 의존성 및 스크립트
│
├── README.md                    # 프로젝트 전체 개요
├── SETUP.md                     # 상세 설치 가이드
├── 시작하기.md                   # 빠른 시작 가이드 (한글)
└── .gitignore                   # Git 제외 파일 목록
```

## 주요 파일 설명

### 📱 Frontend (User Interface)

#### `app/page.tsx`

-   **역할**: 메인 랜딩 페이지
-   **기능**: 양식 작성 및 관리자 로그인 링크 제공

#### `app/form/page.tsx`

-   **역할**: 양식 작성 페이지
-   **기능**: MultiStepForm 컴포넌트 렌더링

#### `components/MultiStepForm.tsx`

-   **역할**: 핵심 양식 컴포넌트
-   **기능**:
    -   단계별 진행
    -   실시간 유효성 검증
    -   글자 수 표시
    -   진행률 바
    -   API와 통신하여 질문 로드 및 제출

### 🔐 Admin Pages

#### `app/admin/login/page.tsx`

-   **역할**: 관리자 로그인
-   **기능**: JWT 토큰 발급 및 localStorage 저장

#### `app/admin/dashboard/page.tsx`

-   **역할**: 일반 관리자 대시보드
-   **기능**: 제출된 양식 조회 및 상세 보기

#### `app/admin/super/page.tsx`

-   **역할**: 최고 관리자 페이지
-   **기능**:
    -   사용자 생성 및 관리
    -   질문 CRUD
    -   탭 기반 인터페이스

### 🔌 API Routes

#### `app/api/auth/*`

-   **login**: 이메일/비밀번호 인증, JWT 발급
-   **verify**: JWT 토큰 검증

#### `app/api/users/*`

-   **create**: 새 관리자 계정 생성 (SUPER_ADMIN 전용)
-   **list**: 모든 사용자 목록 조회 (SUPER_ADMIN 전용)

#### `app/api/questions/route.ts`

-   **GET**: 모든 질문 조회 (공개)
-   **POST**: 새 질문 생성 (SUPER_ADMIN 전용)
-   **PUT**: 질문 수정 (SUPER_ADMIN 전용)
-   **DELETE**: 질문 삭제 (SUPER_ADMIN 전용)

#### `app/api/submissions/route.ts`

-   **GET**: 모든 제출 내역 조회 (ADMIN, SUPER_ADMIN)
-   **POST**: 새 양식 제출 (공개)

### 🛠 Utilities

#### `lib/auth.ts`

-   **hashPassword**: bcrypt로 비밀번호 해싱
-   **verifyPassword**: 비밀번호 검증
-   **generateToken**: JWT 토큰 생성
-   **verifyToken**: JWT 토큰 검증

#### `lib/prisma.ts`

-   Prisma Client 싱글톤 인스턴스
-   개발 환경에서 Hot Reload 대응

### 🗄 Database

#### `prisma/schema.prisma`

데이터베이스 스키마 정의:

**User 모델**

```prisma
- id: 고유 ID
- email: 이메일 (unique)
- password: 해시된 비밀번호
- name: 이름
- role: 'SUPER_ADMIN' | 'ADMIN'
- createdAt: 생성일
- createdBy: 생성자 ID
```

**Question 모델**

```prisma
- id: 고유 ID
- step: 단계 번호
- title: 질문 제목
- description: 설명 (optional)
- minLength: 최소 글자 수
- order: 순서
- isRequired: 필수 여부
- createdAt, updatedAt: 타임스탬프
```

**FormSubmission 모델**

```prisma
- id: 고유 ID
- submittedBy: 제출자 식별자 (optional)
- responses: JSON 형태의 응답
- completedAt: 제출 완료 시간
- ipAddress: IP 주소 (optional)
```

#### `prisma/seed.ts`

초기 데이터 생성:

-   최고 관리자 계정 (admin@example.com)
-   5단계에 걸친 9개의 샘플 질문

## 🔄 데이터 흐름

### 1. 양식 제출 Flow

```
사용자 → MultiStepForm → API /submissions → Prisma → Database
                          ↓
                     thank-you page
```

### 2. 관리자 로그인 Flow

```
로그인 페이지 → API /auth/login → JWT 생성 → localStorage 저장
                                              ↓
                                    역할에 따라 대시보드 이동
```

### 3. 질문 관리 Flow

```
최고 관리자 → 질문 폼 → API /questions → Prisma → Database
                                         ↓
                                   실시간 UI 업데이트
```

## 🎯 권한 시스템

```
┌─────────────────┐
│  SUPER_ADMIN    │ (최고 관리자)
│  ---------------│
│  • 사용자 생성   │
│  • 질문 CRUD    │
│  • 제출 내역 조회│
│  • 모든 기능     │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
┌────────▼────────┐ ┌──────▼──────────┐
│     ADMIN       │ │   일반 사용자    │
│  --------------│ │  --------------│
│  • 제출 내역 조회│ │  • 양식 작성    │
└─────────────────┘ └─────────────────┘
```

## 🎨 스타일링

-   **Tailwind CSS**: 유틸리티 기반 스타일링
-   **테마**: 블랙 & 화이트
-   **반응형**: 모바일/태블릿/데스크톱 지원
-   **커스텀**: `app/globals.css`에서 전역 스타일 정의

## 📊 상태 관리

-   **클라이언트 상태**: React useState, useEffect
-   **인증 상태**: localStorage (JWT 토큰)
-   **서버 상태**: API 호출을 통한 실시간 데이터 페칭

## 🔒 보안 고려사항

1. **비밀번호**: bcrypt 해싱 (salt rounds: 12)
2. **인증**: JWT 토큰 (7일 만료)
3. **권한 검증**: 모든 관리자 API에서 role 확인
4. **환경 변수**: 민감한 정보는 .env 파일로 관리

## 🚀 개발 워크플로우

1. **코드 수정** → Hot Reload 자동 반영
2. **API 변경** → Prisma Schema 수정 → `prisma db push`
3. **새 페이지** → `app/` 폴더에 추가 → 자동 라우팅
4. **컴포넌트** → `components/` 폴더에 추가 → import 사용

이 구조를 이해하면 프로젝트 전체를 쉽게 파악하고 수정할 수 있습니다! 🎉
