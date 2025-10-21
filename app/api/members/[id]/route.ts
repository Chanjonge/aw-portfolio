import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// PATCH: 회원 정보 수정
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded || (decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'ADMIN')) {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
        }

        const { password, companyName, isActive } = await request.json();

        const updateData: any = {};
        
        if (companyName !== undefined) {
            updateData.companyName = companyName;
        }

        if (isActive !== undefined) {
            updateData.isActive = isActive;
        }

        if (password) {
            if (password.length < 4) {
                return NextResponse.json({ error: '비밀번호는 4자 이상이어야 합니다.' }, { status: 400 });
            }
            updateData.password = await bcrypt.hash(password, 10);
        }

        const member = await prisma.member.update({
            where: { id: params.id },
            data: updateData,
            select: {
                id: true,
                username: true,
                companyName: true,
                isActive: true,
                createdAt: true,
            },
        });

        return NextResponse.json(member);
    } catch (error) {
        console.error('Member update error:', error);
        return NextResponse.json({ error: '회원 수정에 실패했습니다.' }, { status: 500 });
    }
}

// DELETE: 회원 삭제
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded || (decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'ADMIN')) {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
        }

        await prisma.member.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: '회원이 삭제되었습니다.' });
    } catch (error) {
        console.error('Member deletion error:', error);
        return NextResponse.json({ error: '회원 삭제에 실패했습니다.' }, { status: 500 });
    }
}

