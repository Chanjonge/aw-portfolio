import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET all submissions (Admin only)
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

        // try-catch로 안전하게 처리
        let submissions: any[] = [];

        try {
            // 먼저 모든 데이터를 가져와 보기
            const allSubmissions = await prisma.formSubmission.findMany({
                orderBy: {
                    updatedAt: 'desc',
                },
            });

            console.log('Total submissions found:', allSubmissions.length);

            // 유효한 제출만 필터링
            const validSubmissions = allSubmissions.filter((sub) => {
                // companyName이 null이거나 빈 문자열이면 제외
                if (!sub.companyName || sub.companyName.trim() === '') {
                    console.log('Filtered out submission with null/empty companyName:', sub.id);
                    return false;
                }
                // portfolioId 필터링
                if (portfolioId && sub.portfolioId !== portfolioId) {
                    return false;
                }
                return true;
            });

            console.log('Valid submissions after filtering:', validSubmissions.length);

            // 포트폴리오 정보 추가
            submissions = await Promise.all(
                validSubmissions.map(async (sub) => {
                    try {
                        const portfolio = await prisma.portfolio.findUnique({
                            where: { id: sub.portfolioId },
                            select: { title: true, slug: true },
                        });
                        return {
                            ...sub,
                            portfolio: portfolio || { title: '알 수 없음', slug: '' },
                        };
                    } catch (error) {
                        console.error('Portfolio fetch error:', error);
                        return {
                            ...sub,
                            portfolio: { title: '알 수 없음', slug: '' },
                        };
                    }
                })
            );
        } catch (dbError) {
            console.error('Database error when fetching submissions:', dbError);
            // 데이터베이스 오류 시 빈 배열 반환
            submissions = [];
        }

        const parsedSubmissions = submissions.map((sub) => ({
            ...sub,
            responses: typeof sub.responses === 'string' ? JSON.parse(sub.responses) : sub.responses,
        }));

        return NextResponse.json({ submissions: parsedSubmissions });
    } catch (error) {
        console.error('Get submissions error:', error);
        return NextResponse.json({ error: '제출 내역을 가져오는 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

// CREATE submission
export async function POST(request: NextRequest) {
    try {
        const { portfolioId, companyName, password, responses, isDraft } = await request.json();

        if (!portfolioId || !companyName || !password || !responses) {
            return NextResponse.json({ error: '모든 필드가 필요합니다.' }, { status: 400 });
        }

        // 비밀번호 해시
        const hashedPassword = await bcrypt.hash(password, 10);

        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

        const submission = await prisma.formSubmission.create({
            data: {
                portfolioId,
                companyName,
                password: hashedPassword,
                responses: JSON.stringify(responses),
                isDraft: isDraft || false,
                ipAddress,
            },
        });

        return NextResponse.json({ submission }, { status: 201 });
    } catch (error) {
        console.error('Create submission error:', error);
        return NextResponse.json({ error: '제출 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
