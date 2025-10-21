# Vercel 프로덕션 데이터베이스 초기화 가이드

## 🎯 문제

-   로컬: 데이터 있음 ✅ (로그인 가능)
-   Vercel: 데이터 없음 ❌ (로그인 불가)

---

## 🚀 해결 방법 1: Vercel CLI로 Seed 실행 (권장)

### 1단계: Vercel CLI 설치 (이미 있으면 스킵)

```bash
npm install -g vercel
```

### 2단계: Vercel 로그인

```bash
vercel login
```

### 3단계: 프로젝트 링크

```bash
vercel link
```

-   프로젝트를 선택하고 연결합니다

### 4단계: 프로덕션 환경 변수로 Seed 실행

```bash
vercel env pull .env.production
```

-   프로덕션 환경 변수를 로컬로 가져옵니다

### 5단계: 프로덕션 DB에 Seed 실행

```bash
# 환경 변수를 프로덕션으로 설정
$env:NODE_ENV="production"

# Seed 실행
npm run seed

# 환경 변수 원복
$env:NODE_ENV="development"
```

---

## 🚀 해결 방법 2: API 엔드포인트로 관리자 생성

### 1단계: Vercel에 Seed API 엔드포인트 추가

`app/api/seed/route.ts` 파일을 생성:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        // 보안을 위해 비밀 키 확인
        const { secretKey } = await request.json();

        if (secretKey !== process.env.SEED_SECRET_KEY) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Super Admin 생성
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const admin = await prisma.user.create({
            data: {
                email: 'admin@example.com',
                password: hashedPassword,
                name: 'Super Admin',
                role: 'SUPER_ADMIN',
            },
        });

        // 샘플 포트폴리오 생성
        const portfolios = await Promise.all([
            prisma.portfolio.create({
                data: {
                    title: '웹 개발 포트폴리오',
                    description: '웹 개발 프로젝트 신청서',
                    slug: 'web-dev',
                    isActive: true,
                    order: 1,
                },
            }),
            prisma.portfolio.create({
                data: {
                    title: '디자인 포트폴리오',
                    description: '디자인 프로젝트 신청서',
                    slug: 'design',
                    isActive: true,
                    order: 2,
                },
            }),
        ]);

        return NextResponse.json({
            success: true,
            message: 'Database seeded successfully',
            admin: { email: admin.email },
        });
    } catch (error: any) {
        console.error('Seed error:', error);
        return NextResponse.json(
            {
                error: 'Seed failed',
                details: error.message,
            },
            { status: 500 }
        );
    }
}
```

### 2단계: Vercel 환경 변수에 SEED_SECRET_KEY 추가

Vercel Dashboard → Settings → Environment Variables:

```
SEED_SECRET_KEY="your-random-secret-key-here"
```

### 3단계: 배포 후 API 호출

```bash
curl -X POST https://aw-portfolio-chi.vercel.app/api/seed \
  -H "Content-Type: application/json" \
  -d '{"secretKey":"your-random-secret-key-here"}'
```

또는 브라우저 콘솔에서:

```javascript
fetch('https://aw-portfolio-chi.vercel.app/api/seed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secretKey: 'your-random-secret-key-here' }),
})
    .then((r) => r.json())
    .then(console.log);
```

---

## 🚀 해결 방법 3: MongoDB Atlas에서 직접 생성 (수동)

### 1단계: MongoDB Atlas 접속

1. https://cloud.mongodb.com 로그인
2. Clusters → Browse Collections

### 2단계: User 컬렉션에 관리자 추가

데이터 추가 (JSON):

```json
{
    "email": "admin@example.com",
    "password": "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890ABCD",
    "name": "Super Admin",
    "role": "SUPER_ADMIN",
    "createdAt": { "$date": "2025-01-01T00:00:00.000Z" },
    "createdBy": null
}
```

**참고**: `password` 필드는 bcrypt 해시값이어야 합니다.

비밀번호 해시 생성 (로컬에서):

```javascript
const bcrypt = require('bcryptjs');
console.log(bcrypt.hashSync('admin123', 10));
```

---

## ✅ 권장 순서

1. **가장 쉬운 방법**: 해결 방법 2 (API 엔드포인트)
2. **CLI 선호**: 해결 방법 1 (Vercel CLI)
3. **수동 작업**: 해결 방법 3 (MongoDB Atlas 직접)

---

## 🔐 생성될 관리자 계정

```
Email:    admin@example.com
Password: admin123
```

---

## 📝 확인 방법

1. https://aw-portfolio-chi.vercel.app/admin/login 접속
2. 위 계정으로 로그인 시도
3. 성공하면 /admin/dashboard로 리디렉션

---

## ⚠️ 중요 사항

-   **로컬 DB ≠ 프로덕션 DB**: 각각 별도의 MongoDB 인스턴스입니다
-   **환경 변수 확인**: Vercel에 모든 환경 변수가 설정되었는지 확인
-   **보안**: Seed API는 한 번 실행 후 삭제하거나 비활성화하세요

---

어떤 방법을 사용하시겠습니까?
