import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET member by ID (Super Admin only)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const decoded = verifyToken(token);

        if (!decoded || decoded.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: '최고 관리자 권한이 필요합니다.' }, { status: 403 });
        }

        const member = await prisma.member.findUnique({
            where: { id: params.id },
        });

        if (!member) {
            return NextResponse.json({ error: '회원을 찾을 수 없습니다.' }, { status: 404 });
        }

        return NextResponse.json({ member });
    } catch (error) {
        console.error('Get member error:', error);
        return NextResponse.json({ error: '회원 정보를 가져오는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

// DELETE member (Super Admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const decoded = verifyToken(token);

        if (!decoded || decoded.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: '최고 관리자 권한이 필요합니다.' }, { status: 403 });
        }

        const member = await prisma.member.findUnique({
            where: { id: params.id },
        });

        if (!member) {
            return NextResponse.json({ error: '회원을 찾을 수 없습니다.' }, { status: 404 });
        }

        await prisma.member.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: '회원이 삭제되었습니다.' });
    } catch (error) {
        console.error('Delete member error:', error);
        return NextResponse.json({ error: '회원 삭제 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
