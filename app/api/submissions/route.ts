import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET all submissions (Admin only, 포트폴리오별로 필터링 가능)
export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const decoded = verifyToken(token);

        if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const portfolioId = searchParams.get('portfolioId');

        const submissions = await prisma.formSubmission.findMany({
            where: portfolioId ? { portfolioId } : undefined,
            include: {
                portfolio: {
                    select: {
                        title: true,
                        slug: true,
                    },
                },
            },
            orderBy: {
                completedAt: 'desc',
            },
        });

        const parsedSubmissions = submissions.map((sub) => ({
            ...sub,
            responses: JSON.parse(sub.responses),
        }));

        return NextResponse.json({ submissions: parsedSubmissions });
    } catch (error) {
        console.error('Get submissions error:', error);
        return NextResponse.json({ error: '제출 내역을 가져오는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

// CREATE submission (public)
export async function POST(request: NextRequest) {
    try {
        const { portfolioId, responses, submittedBy } = await request.json();

        if (!portfolioId || !responses) {
            return NextResponse.json({ error: '포트폴리오 ID와 응답 데이터가 필요합니다.' }, { status: 400 });
        }

        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

        const submission = await prisma.formSubmission.create({
            data: {
                portfolioId,
                responses: JSON.stringify(responses),
                submittedBy,
                ipAddress,
            },
        });

        return NextResponse.json({ submission }, { status: 201 });
    } catch (error) {
        console.error('Create submission error:', error);
        return NextResponse.json({ error: '제출 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
