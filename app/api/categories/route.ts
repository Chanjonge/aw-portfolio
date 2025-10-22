import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET all categories
export async function GET(request: NextRequest) {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { order: 'asc' },
            include: {
                _count: {
                    select: { portfolios: true },
                },
            },
        });

        return NextResponse.json({ categories });
    } catch (error) {
        console.error('Get categories error:', error);
        return NextResponse.json({ error: '카테고리를 가져오는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

// CREATE category (Admin only)
export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const decoded = verifyToken(token);

        if (!decoded || (decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'ADMIN')) {
            return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
        }

        const { name, slug, order } = await request.json();

        if (!name || !slug) {
            return NextResponse.json({ error: '필수 필드를 입력해주세요.' }, { status: 400 });
        }

        const category = await prisma.category.create({
            data: {
                name,
                slug,
                order: order || 0,
            },
        });

        return NextResponse.json({ category }, { status: 201 });
    } catch (error) {
        console.error('Create category error:', error);
        return NextResponse.json({ error: '카테고리 생성 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

// UPDATE category (Admin only)
export async function PUT(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const decoded = verifyToken(token);

        if (!decoded || (decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'ADMIN')) {
            return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
        }

        const { id, name, slug, order } = await request.json();

        if (!id) {
            return NextResponse.json({ error: '카테고리 ID가 필요합니다.' }, { status: 400 });
        }

        const category = await prisma.category.update({
            where: { id },
            data: {
                name,
                slug,
                order,
            },
        });

        return NextResponse.json({ category });
    } catch (error) {
        console.error('Update category error:', error);
        return NextResponse.json({ error: '카테고리 수정 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

// DELETE category (Admin only)
export async function DELETE(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const decoded = verifyToken(token);

        if (!decoded || (decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'ADMIN')) {
            return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: '카테고리 ID가 필요합니다.' }, { status: 400 });
        }

        await prisma.category.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete category error:', error);
        return NextResponse.json({ error: '카테고리 삭제 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

