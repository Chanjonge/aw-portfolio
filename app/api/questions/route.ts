import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET all questions (포트폴리오별로 필터링 가능)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const portfolioId = searchParams.get('portfolioId');

        const questions = await prisma.question.findMany({
            where: portfolioId ? { portfolioId } : undefined,
            orderBy: [{ step: 'asc' }, { order: 'asc' }],
        });

        return NextResponse.json({ questions });
    } catch (error) {
        console.error('Get questions error:', error);
        return NextResponse.json({ error: '질문을 가져오는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

// CREATE or UPDATE questions (Super Admin only)
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

        const { portfolioId, step, title, description, thumbnail, minLength, order, isRequired } = await request.json();

        if (!portfolioId || !step || !title || minLength === undefined || order === undefined) {
            return NextResponse.json({ error: '필수 필드를 입력해주세요.' }, { status: 400 });
        }

        const question = await prisma.question.create({
            data: {
                portfolioId,
                step,
                title,
                description: description || '',
                thumbnail,
                minLength,
                order,
                isRequired: isRequired !== false,
            },
        });

        return NextResponse.json({ question }, { status: 201 });
    } catch (error) {
        console.error('Create question error:', error);
        return NextResponse.json({ error: '질문 생성 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

// UPDATE question
export async function PUT(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const decoded = verifyToken(token);

        if (!decoded || decoded.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: '최고 관리자 권한이 필요합니다.' }, { status: 403 });
        }

        const { id, step, title, description, thumbnail, minLength, order, isRequired } = await request.json();

        if (!id) {
            return NextResponse.json({ error: '질문 ID가 필요합니다.' }, { status: 400 });
        }

        const question = await prisma.question.update({
            where: { id },
            data: {
                step,
                title,
                description,
                thumbnail,
                minLength,
                order,
                isRequired,
            },
        });

        return NextResponse.json({ question });
    } catch (error) {
        console.error('Update question error:', error);
        return NextResponse.json({ error: '질문 수정 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

// DELETE question
export async function DELETE(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const decoded = verifyToken(token);

        if (!decoded || decoded.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: '최고 관리자 권한이 필요합니다.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: '질문 ID가 필요합니다.' }, { status: 400 });
        }

        await prisma.question.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete question error:', error);
        return NextResponse.json({ error: '질문 삭제 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
