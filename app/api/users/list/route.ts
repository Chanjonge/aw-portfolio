import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const decoded = verifyToken(token);

        if (!decoded || decoded.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: '최고 관리자 권한이 필요합니다.' }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({ users });
    } catch (error) {
        console.error('List users error:', error);
        return NextResponse.json({ error: '사용자 목록을 가져오는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
