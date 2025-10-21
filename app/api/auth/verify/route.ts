import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: '인증 토큰이 필요합니다.' }, { status: 401 });
        }

        const decoded = verifyToken(token);

        if (!decoded) {
            return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Verify error:', error);
        return NextResponse.json({ error: '인증 확인 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
