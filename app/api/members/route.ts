import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET all members (Super Admin only)
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

        const members = await prisma.member.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({ members });
    } catch (error) {
        console.error('Get members error:', error);
        return NextResponse.json({ error: '회원 목록을 가져오는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

// POST - Create or login member
export async function POST(request: NextRequest) {
    try {
        const { companyName, password } = await request.json();

        if (!companyName || !password) {
            return NextResponse.json({ error: '상호명과 비밀번호가 필요합니다.' }, { status: 400 });
        }

        if (password.length !== 4 || !/^\d{4}$/.test(password)) {
            return NextResponse.json({ error: '비밀번호는 4자리 숫자여야 합니다.' }, { status: 400 });
        }

        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

        // 기존 회원인지 확인
        const existingMember = await prisma.member.findUnique({
            where: { companyName },
        });

        if (existingMember) {
            // 기존 회원 - 비밀번호 확인
            if (existingMember.password !== password) {
                return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 401 });
            }

            // 로그인 정보 업데이트
            const updatedMember = await prisma.member.update({
                where: { id: existingMember.id },
                data: {
                    lastLoginAt: new Date(),
                    loginCount: existingMember.loginCount + 1,
                },
            });

            return NextResponse.json({
                member: updatedMember,
                isNewMember: false,
                message: '로그인 성공',
            });
        } else {
            // 신규 회원 - 회원가입 (평문 비밀번호 저장)
            const newMember = await prisma.member.create({
                data: {
                    companyName,
                    password: password, // 평문으로 저장
                    lastLoginAt: new Date(), // 신규 회원도 로그인 시간 설정
                    ipAddress,
                },
            });

            return NextResponse.json({
                member: newMember,
                isNewMember: true,
                message: '회원가입 및 로그인 성공',
            });
        }
    } catch (error) {
        console.error('Member auth error:', error);
        return NextResponse.json({ error: '인증 처리 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
