import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const decoded = verifyToken(token);

        if (!decoded || decoded.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: '최고 관리자 권한이 필요합니다.' }, { status: 403 });
        }

        const { email, password, name, role } = await request.json();

        if (!email || !password || !name || !role) {
            return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 });
        }

        if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: '유효하지 않은 역할입니다.' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: '이미 존재하는 이메일입니다.' }, { status: 400 });
        }

        const hashedPassword = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
                createdBy: decoded.userId,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ user }, { status: 201 });
    } catch (error) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: '사용자 생성 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
