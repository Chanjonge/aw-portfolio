import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET: 회원 목록 조회 (관리자만)
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded || (decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'ADMIN')) {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
        }

        const members = await prisma.member.findMany({
            select: {
                id: true,
                username: true,
                companyName: true,
                isActive: true,
                createdAt: true,
                lastLogin: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(members);
    } catch (error) {
        console.error('Members fetch error:', error);
        return NextResponse.json({ error: '회원 목록을 가져오는데 실패했습니다.' }, { status: 500 });
    }
}

// POST: 새 회원 생성 (관리자만)
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded || (decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'ADMIN')) {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
        }

        const { username, password, companyName } = await request.json();

        // 입력 검증
        if (!username || !password || !companyName) {
            return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 });
        }

        if (username.length < 3) {
            return NextResponse.json({ error: '아이디는 3자 이상이어야 합니다.' }, { status: 400 });
        }

        if (password.length < 4) {
            return NextResponse.json({ error: '비밀번호는 4자 이상이어야 합니다.' }, { status: 400 });
        }

        // 중복 확인
        const existing = await prisma.member.findUnique({
            where: { username },
        });

        if (existing) {
            return NextResponse.json({ error: '이미 존재하는 아이디입니다.' }, { status: 400 });
        }

        // 비밀번호 해시
        const hashedPassword = await bcrypt.hash(password, 10);

        // 회원 생성
        const member = await prisma.member.create({
            data: {
                username,
                password: hashedPassword,
                companyName,
                createdBy: decoded.userId,
            },
            select: {
                id: true,
                username: true,
                companyName: true,
                isActive: true,
                createdAt: true,
            },
        });

        return NextResponse.json(member, { status: 201 });
    } catch (error) {
        console.error('Member creation error:', error);
        return NextResponse.json({ error: '회원 생성에 실패했습니다.' }, { status: 500 });
    }
}

