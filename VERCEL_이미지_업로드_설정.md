# Vercel 이미지 업로드 설정 가이드

## 🔍 문제점

현재 시스템은 `public/uploads` 폴더에 이미지를 저장합니다.
하지만 **Vercel은 서버리스 환경이라 파일 시스템이 읽기 전용**입니다.

❌ 로컬: 파일 시스템에 저장 가능
❌ Vercel: 파일 시스템 저장 불가능

---

## ✅ 해결 방법: Vercel Blob Storage 사용

### 1단계: Vercel Blob Storage 추가

1. **Vercel Dashboard** 접속
2. 프로젝트 선택
3. **Storage** 탭 클릭
4. **Create Database** 클릭
5. **Blob** 선택
6. 이름 입력 (예: `portfolio-uploads`)
7. Create

→ 자동으로 `BLOB_READ_WRITE_TOKEN` 환경 변수가 추가됩니다.

---

### 2단계: 패키지 설치

```bash
npm install @vercel/blob
```

---

### 3단계: Upload API 수정

`app/api/upload/route.ts` 파일을 다음과 같이 수정:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // 관리자 권한 확인
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded || decoded.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: '파일이 필요합니다.' }, { status: 400 });
        }

        // 파일 타입 확인
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: '이미지 파일만 업로드 가능합니다.' }, { status: 400 });
        }

        // 파일명 생성 (타임스탬프 + 원본 파일명)
        const timestamp = Date.now();
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}_${originalName}`;

        // Vercel Blob에 업로드
        const blob = await put(filename, file, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        // URL 반환
        return NextResponse.json({ url: blob.url }, { status: 200 });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            {
                error: '파일 업로드에 실패했습니다.',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
```

---

### 4단계: 로컬 개발 환경 설정

로컬에서도 테스트하려면 `.env` 파일에 추가:

```env
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

**참고**: Vercel에서는 자동으로 설정되므로 로컬 개발용으로만 필요합니다.

---

### 5단계: 배포

```bash
git add .
git commit -m "Add Vercel Blob storage for image uploads"
git push origin master
```

---

## 🎯 완료 후

1. ✅ 이미지 업로드가 Vercel Blob에 저장됨
2. ✅ 공개 URL로 이미지 접근 가능
3. ✅ 로컬/프로덕션 모두 동일하게 작동

---

## 💰 비용

Vercel Blob Storage:

-   **무료 플랜**: 500MB 저장 공간
-   **Pro 플랜**: 100GB ($0.15/GB 추가)

일반적인 포트폴리오 사이트는 무료 플랜으로 충분합니다.

---

## 🔄 대안 방법

Vercel Blob 외에 다른 옵션들:

### 1. Cloudinary

-   무료 플랜: 25GB 저장, 25GB 대역폭
-   이미지 최적화 자동
-   CDN 포함

### 2. AWS S3

-   가장 저렴
-   설정이 복잡

### 3. Uploadthing

-   Next.js에 최적화
-   무료 플랜: 2GB

---

## 📝 마이그레이션 체크리스트

-   [ ] Vercel Blob Storage 생성
-   [ ] `@vercel/blob` 패키지 설치
-   [ ] `app/api/upload/route.ts` 수정
-   [ ] Git 커밋 및 푸시
-   [ ] 배포 완료 확인
-   [ ] 이미지 업로드 테스트
-   [ ] 기존 `public/uploads` 폴더 정리 (선택)

---

## ⚠️ 기존 이미지 마이그레이션

로컬에 있는 `public/uploads`의 이미지들을 Vercel Blob으로 옮기려면:

1. 이미지들을 다시 업로드
2. 또는 별도 마이그레이션 스크립트 작성

---

더 자세한 내용은:

-   https://vercel.com/docs/storage/vercel-blob
