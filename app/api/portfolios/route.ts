import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET - 모든 포트폴리오 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('active') === 'true';

        const portfolios = await prisma.portfolio.findMany({
            where: activeOnly ? { isActive: true } : undefined,
            orderBy: { order: 'asc' },
            include: {
                _count: {
                    select: {
                        questions: true,
                        submissions: true,
                    },
                },
            },
        });

        return NextResponse.json({ portfolios }, { status: 200 });
    } catch (error) {
        console.error('Get portfolios error:', error);
        return NextResponse.json({ error: '포트폴리오 조회에 실패했습니다.' }, { status: 500 });
    }
}

// POST - 새 포트폴리오 생성 (관리자만)
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded || decoded.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
        }

        const body = await request.json();
        const { title, description, slug, thumbnail, isActive, order } = body;

        if (!title || !slug) {
            return NextResponse.json({ error: '제목과 슬러그는 필수입니다.' }, { status: 400 });
        }

        const portfolio = await prisma.portfolio.create({
            data: {
                title,
                description,
                slug,
                thumbnail,
                isActive: isActive ?? true,
                order: order ?? 0,
            },
        });

        return NextResponse.json({ portfolio }, { status: 201 });
    } catch (error: any) {
        console.error('Create portfolio error:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: '이미 존재하는 슬러그입니다.' }, { status: 400 });
        }
        return NextResponse.json({ error: '포트폴리오 생성에 실패했습니다.' }, { status: 500 });
    }
}

// PUT - 포트폴리오 수정 (관리자만)
export async function PUT(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded || decoded.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
        }

        const body = await request.json();
        const { id, title, description, slug, thumbnail, isActive, order } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID가 필요합니다.' }, { status: 400 });
        }

        const portfolio = await prisma.portfolio.update({
            where: { id },
            data: {
                title,
                description,
                slug,
                thumbnail,
                isActive,
                order,
            },
        });

        return NextResponse.json({ portfolio }, { status: 200 });
    } catch (error: any) {
        console.error('Update portfolio error:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: '이미 존재하는 슬러그입니다.' }, { status: 400 });
        }
        return NextResponse.json({ error: '포트폴리오 수정에 실패했습니다.' }, { status: 500 });
    }
}

// DELETE - 포트폴리오 삭제 (관리자만)
export async function DELETE(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded || decoded.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID가 필요합니다.' }, { status: 400 });
        }

        await prisma.portfolio.delete({
            where: { id },
        });

        return NextResponse.json({ message: '포트폴리오가 삭제되었습니다.' }, { status: 200 });
    } catch (error) {
        console.error('Delete portfolio error:', error);
        return NextResponse.json({ error: '포트폴리오 삭제에 실패했습니다.' }, { status: 500 });
    }
}
