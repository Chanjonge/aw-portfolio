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
        return NextResponse.json({ 
            error: '파일 업로드에 실패했습니다.',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
