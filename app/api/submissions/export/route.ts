import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import * as XLSX from 'xlsx';

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

        if (!portfolioId) {
            return NextResponse.json({ error: '포트폴리오 ID가 필요합니다.' }, { status: 400 });
        }

        // 해당 포트폴리오의 제출 데이터 가져오기
        const submissions = await prisma.formSubmission.findMany({
            where: {
                portfolioId: portfolioId,
                isDraft: false, // 완료된 제출만
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
                completedAt: 'desc',
            },
        });

        if (submissions.length === 0) {
            return NextResponse.json({ error: '해당 포트폴리오에 제출 데이터가 없습니다.' }, { status: 404 });
        }

        // 포트폴리오의 질문 정보 가져오기
        const questions = await prisma.question.findMany({
            where: { portfolioId: portfolioId },
            orderBy: { order: 'asc' },
        });

        // 엑셀 데이터 준비
        const excelData: any[] = [];

        submissions.forEach((submission, index) => {
            const responses = JSON.parse(submission.responses);
            const row: any = {
                순번: index + 1,
                상호명: submission.companyName,
                제출일시: new Date(submission.completedAt).toLocaleString('ko-KR'),
                수정일시: new Date(submission.updatedAt).toLocaleString('ko-KR'),
            };

            // 각 질문에 대한 응답 추가
            questions.forEach((question) => {
                const response = responses[question.id];
                let value = '';

                if (response !== undefined && response !== null) {
                    if (question.type === 'checkbox' && Array.isArray(response)) {
                        value = response.join(', ');
                    } else if (question.type === 'file' && Array.isArray(response)) {
                        value = response.map((file: any) => file.name || file).join(', ');
                    } else if (typeof response === 'object') {
                        value = JSON.stringify(response);
                    } else {
                        value = String(response);
                    }
                }

                row[question.label] = value;
            });

            excelData.push(row);
        });

        // 엑셀 워크북 생성
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // 컬럼 너비 자동 조정
        const colWidths: any[] = [];
        if (excelData.length > 0) {
            Object.keys(excelData[0]).forEach((key, index) => {
                const maxLength = Math.max(key.length, ...excelData.map((row) => String(row[key] || '').length));
                colWidths[index] = { wch: Math.min(maxLength + 2, 50) };
            });
        }
        worksheet['!cols'] = colWidths;

        // 워크시트를 워크북에 추가
        const portfolioTitle = submissions[0].portfolio?.title || '알 수 없음';
        XLSX.utils.book_append_sheet(workbook, worksheet, '제출목록');

        // 엑셀 파일을 버퍼로 생성
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // 파일명 생성 (한글 포함)
        const fileName = `${portfolioTitle}_제출목록_${new Date().toISOString().split('T')[0]}.xlsx`;
        const encodedFileName = encodeURIComponent(fileName);

        // 응답 헤더 설정
        const headers = new Headers();
        headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);
        headers.set('Content-Length', excelBuffer.length.toString());

        return new NextResponse(excelBuffer, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error('Excel export error:', error);
        return NextResponse.json({ error: '엑셀 파일 생성 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
