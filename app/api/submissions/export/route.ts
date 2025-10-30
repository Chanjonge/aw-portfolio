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

        // 해당 포트폴리오의 제출 데이터 가져오기 (유효한 제출만)
        const submissions = await prisma.formSubmission.findMany({
            where: {
                portfolioId: portfolioId,
                isDraft: false, // 완료된 제출만
                companyName: {
                    not: '',
                },
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

        // 포트폴리오의 질문 정보 가져오기 (단계별, 순서별로 정렬)
        const questions = await prisma.question.findMany({
            where: { portfolioId: portfolioId },
            orderBy: [{ step: 'asc' }, { order: 'asc' }],
        });

        // 단계별로 질문 그룹화
        const questionsByStep = questions.reduce((groups: { [key: number]: any[] }, question) => {
            if (!groups[question.step]) {
                groups[question.step] = [];
            }
            groups[question.step].push(question);
            return groups;
        }, {});

        // 엑셀 컬럼 헤더 순서 정의 (기본 정보 + 단계별 질문들)
        const columnHeaders = ['순번', '상호명'];

        // 단계별로 컬럼 헤더 추가
        Object.keys(questionsByStep)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .forEach((step) => {
                // 단계 구분자 추가 (예: "=== 1단계 ===")
                columnHeaders.push(`=== ${step}단계 ===`);

                // 해당 단계의 질문들 추가
                questionsByStep[parseInt(step)]
                    .sort((a, b) => a.order - b.order)
                    .forEach((question) => {
                        columnHeaders.push(question.title);
                    });
            });

        // 엑셀 데이터 준비
        const excelData: any[] = [];

        submissions.forEach((submission, index) => {
            const responses = JSON.parse(submission.responses);

            // 순서가 보장된 행 객체 생성
            const row: any = {};

            // 1. 기본 정보 먼저 추가
            row['순번'] = index + 1;
            row['상호명'] = submission.companyName;

            // 2. 단계별로 질문들 추가
            Object.keys(questionsByStep)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .forEach((step) => {
                    // 단계 구분자 컬럼에는 빈 값 추가
                    row[`=== ${step}단계 ===`] = '';

                    // 해당 단계의 질문들에 대한 응답 추가
                    questionsByStep[parseInt(step)]
                        .sort((a, b) => a.order - b.order)
                        .forEach((question) => {
                            const response = responses[question.id];
                            let value = '';

                            if (response !== undefined && response !== null) {
                                if (question.questionType === 'checkbox' && Array.isArray(response)) {
                                    value = response.join(', ');
                                } else if (question.questionType === 'file' && Array.isArray(response)) {
                                    value = response.map((file: any) => file.name || file).join(', ');
                                } else if (typeof response === 'object') {
                                    value = JSON.stringify(response);
                                } else {
                                    value = String(response);
                                }
                            }

                            row[question.title] = value;
                        });
                });

            excelData.push(row);
        });

        // 엑셀 워크북 생성 (컬럼 순서 지정)
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData, {
            header: columnHeaders, // 명시적으로 컬럼 순서 지정
        });

        // 컬럼 너비 자동 조정 (정의된 헤더 순서대로)
        const colWidths: any[] = [];
        columnHeaders.forEach((header, index) => {
            // 단계 구분자 컬럼은 더 넓게 설정
            if (header.includes('===') && header.includes('단계')) {
                colWidths[index] = { wch: 15 };
            } else {
                const maxLength = Math.max(header.length, ...excelData.map((row) => String(row[header] || '').length));
                colWidths[index] = { wch: Math.min(maxLength + 2, 50) };
            }
        });
        worksheet['!cols'] = colWidths;

        // 단계 구분자 헤더 셀에 배경색 추가 (선택사항)
        const headerRowIndex = 0;
        columnHeaders.forEach((header, colIndex) => {
            if (header.includes('===') && header.includes('단계')) {
                const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c: colIndex });
                if (!worksheet[cellAddress]) worksheet[cellAddress] = { t: 's', v: header };

                // 셀 스타일 설정 (배경색)
                worksheet[cellAddress].s = {
                    fill: {
                        fgColor: { rgb: 'FFE6F3FF' }, // 연한 파란색 배경
                    },
                    font: {
                        bold: true,
                        color: { rgb: 'FF0066CC' }, // 진한 파란색 글자
                    },
                    alignment: {
                        horizontal: 'center',
                    },
                };
            }
        });

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
