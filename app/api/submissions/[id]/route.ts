import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// PUT: 제출 내역 수정
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { companyName, password, responses, isDraft } = await request.json();

        if (!companyName || !password) {
            return NextResponse.json({ error: '상호명과 비밀번호가 필요합니다.' }, { status: 400 });
        }

        // 기존 제출 찾기
        const existing = await prisma.formSubmission.findUnique({
            where: { id: params.id },
        });

        if (!existing) {
            return NextResponse.json({ error: '제출 내역을 찾을 수 없습니다.' }, { status: 404 });
        }

        // 비밀번호 확인
        const isMatch = await bcrypt.compare(password, existing.password);
        if (!isMatch || existing.companyName !== companyName) {
            return NextResponse.json({ error: '상호명 또는 비밀번호가 일치하지 않습니다.' }, { status: 403 });
        }

        // 수정
        const submission = await prisma.formSubmission.update({
            where: { id: params.id },
            data: {
                responses: JSON.stringify(responses),
                isDraft: isDraft !== undefined ? isDraft : existing.isDraft,
            },
        });

        return NextResponse.json({ submission });
    } catch (error) {
        console.error('Update submission error:', error);
        return NextResponse.json({ error: '수정 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

// DELETE: 제출 내역 삭제 (관리자만)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const { verifyToken } = await import('@/lib/auth');
        const decoded = verifyToken(token);

        if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
        }

        await prisma.formSubmission.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: '삭제되었습니다.' });
    } catch (error) {
        console.error('Delete submission error:', error);
        return NextResponse.json({ error: '삭제 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

