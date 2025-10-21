import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST: 기존 제출 확인 (상호명 + 비밀번호)
export async function POST(request: NextRequest) {
    try {
        const { portfolioId, companyName, password } = await request.json();

        if (!portfolioId || !companyName || !password) {
            return NextResponse.json({ error: '모든 필드가 필요합니다.' }, { status: 400 });
        }

        // 해당 포트폴리오에서 상호명으로 제출 찾기
        const submissions = await prisma.formSubmission.findMany({
            where: {
                portfolioId,
                companyName,
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        // 비밀번호 확인
        for (const submission of submissions) {
            const isMatch = await bcrypt.compare(password, submission.password);
            if (isMatch) {
                // 비밀번호가 일치하는 제출 찾음
                return NextResponse.json({
                    submission: {
                        id: submission.id,
                        responses: JSON.parse(submission.responses),
                        isDraft: submission.isDraft,
                        completedAt: submission.completedAt,
                    },
                });
            }
        }

        // 일치하는 제출 없음
        return NextResponse.json({ submission: null });
    } catch (error) {
        console.error('Check submission error:', error);
        return NextResponse.json({ error: '제출 확인 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

