import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: '아이디와 비밀번호를 입력해주세요.' }, { status: 400 });
        }

        // 회원 찾기
        const member = await prisma.member.findUnique({
            where: { username },
        });

        if (!member) {
            return NextResponse.json({ error: '아이디 또는 비밀번호가 잘못되었습니다.' }, { status: 401 });
        }

        // 활성 상태 확인
        if (!member.isActive) {
            return NextResponse.json({ error: '비활성화된 계정입니다. 관리자에게 문의하세요.' }, { status: 403 });
        }

        // 비밀번호 확인
        const isValid = await bcrypt.compare(password, member.password);
        if (!isValid) {
            return NextResponse.json({ error: '아이디 또는 비밀번호가 잘못되었습니다.' }, { status: 401 });
        }

        // 마지막 로그인 시간 업데이트
        await prisma.member.update({
            where: { id: member.id },
            data: { lastLogin: new Date() },
        });

        // JWT 토큰 생성
        const token = jwt.sign(
            {
                id: member.id,
                username: member.username,
                companyName: member.companyName,
                role: 'MEMBER', // 일반 회원 역할
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return NextResponse.json({
            token,
            user: {
                id: member.id,
                username: member.username,
                companyName: member.companyName,
                role: 'MEMBER',
            },
        });
    } catch (error) {
        console.error('Member login error:', error);
        return NextResponse.json({ error: '로그인 처리 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

