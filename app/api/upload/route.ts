import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // 관리자는 인증 확인 (썸네일 업로드용)
        // 일반 사용자는 인증 없이 파일 업로드 가능 (폼 제출용)
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        const isAdmin = token && verifyToken(token);

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: '파일이 필요합니다.' }, { status: 400 });
        }

        // 파일 타입 확인 (이미지 및 PDF 허용)
        const allowedTypes = ['image/', 'application/pdf'];
        const isAllowedType = allowedTypes.some((type) => file.type.startsWith(type) || file.type === 'application/pdf');

        if (!isAllowedType) {
            return NextResponse.json({ error: '이미지 또는 PDF 파일만 업로드 가능합니다.' }, { status: 400 });
        }

        // 파일 크기 제한 (10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return NextResponse.json({ error: '파일 크기는 10MB를 초과할 수 없습니다.' }, { status: 400 });
        }

        // 파일명 생성 (타임스탬프 + 원본 파일명)
        const timestamp = Date.now();
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `uploads/${timestamp}_${originalName}`;

        console.log('📤 Uploading to Vercel Blob:', filename);

        // Vercel Blob에 업로드
        const blob = await put(filename, file, {
            access: 'public',
        });

        console.log('✅ Upload successful:', blob.url);

        // URL 반환
        return NextResponse.json({ url: blob.url }, { status: 200 });
    } catch (error) {
        console.error('❌ Upload error:', error);
        return NextResponse.json(
            {
                error: '파일 업로드에 실패했습니다.',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
