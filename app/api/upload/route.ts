import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
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

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 파일명 생성 (타임스탬프 + 원본 파일명)
        const timestamp = Date.now();
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}_${originalName}`;

        // public/uploads 폴더에 저장
        const path = join(process.cwd(), 'public', 'uploads', filename);
        await writeFile(path, buffer);

        // URL 반환
        const url = `/uploads/${filename}`;

        return NextResponse.json({ url }, { status: 200 });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: '파일 업로드에 실패했습니다.' }, { status: 500 });
    }
}
