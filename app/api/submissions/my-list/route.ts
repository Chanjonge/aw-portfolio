import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST: 상호명 + 비밀번호로 제출 내역 조회
export async function POST(request: NextRequest) {
    try {
        const { companyName, password } = await request.json();

        if (!companyName || !password) {
            return NextResponse.json({ error: '상호명과 비밀번호를 입력해주세요.' }, { status: 400 });
        }

        // 해당 상호명의 모든 제출 찾기 (유효한 제출만)
        const allSubmissions = await prisma.formSubmission.findMany({
            where: {
                companyName: companyName,
            },
            include: {
                portfolio: {
                    select: {
                        title: true,
                        slug: true,
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        // 비밀번호가 일치하는 제출만 필터링
        const matchedSubmissions = [];
        for (const submission of allSubmissions) {
            const isMatch = await bcrypt.compare(password, submission.password);
            if (isMatch) {
                matchedSubmissions.push({
                    ...submission,
                    responses: JSON.parse(submission.responses),
                    password: undefined, // 비밀번호는 응답에서 제외
                });
            }
        }

        return NextResponse.json({ submissions: matchedSubmissions });
    } catch (error) {
        console.error('My list error:', error);
        return NextResponse.json({ error: '조회 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
