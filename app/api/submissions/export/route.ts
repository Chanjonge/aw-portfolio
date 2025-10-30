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

        // 제출 데이터
        const submissions = await prisma.formSubmission.findMany({
            where: {
                portfolioId: portfolioId,
                isDraft: false,
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

        // 질문 데이터
        const questions = await prisma.question.findMany({
            where: { portfolioId: portfolioId },
            orderBy: [{ step: 'asc' }, { order: 'asc' }],
        });

        const questionsByStep = questions.reduce((groups: { [key: number]: any[] }, question) => {
            if (!groups[question.step]) {
                groups[question.step] = [];
            }
            groups[question.step].push(question);
            return groups;
        }, {});

        // ===== 메인 시트(제출목록) 만들기 =====
        const columnHeaders = ['순번', '상호명'];

        Object.keys(questionsByStep)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .forEach((step) => {
                questionsByStep[parseInt(step)]
                    .sort((a, b) => a.order - b.order)
                    .forEach((question) => {
                        // ✅ 이미지/파일 질문은 제외
                        if (question.questionType === 'file') return;
                        columnHeaders.push(question.title);
                    });
            });

        const excelData: any[] = [];

        submissions.forEach((submission, index) => {
            const responses = JSON.parse(submission.responses || '{}');

            const row: any = {};
            row['순번'] = index + 1;
            row['상호명'] = submission.companyName;

            Object.keys(questionsByStep)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .forEach((step) => {
                    questionsByStep[parseInt(step)]
                        .sort((a, b) => a.order - b.order)
                        .forEach((question) => {
                            if (question.questionType === 'file') return;

                            const response = responses[question.id];
                            let value = '';

                            if (response !== undefined && response !== null) {
                                if (question.questionType === 'checkbox' && Array.isArray(response)) {
                                    value = response.join(', ');
                                } else if (typeof response === 'object') {
                                    if (Array.isArray(response.checked) || response.inputs) {
                                        const checked = Array.isArray(response.checked) ? response.checked.join(', ') : '';
                                        const inputs =
                                            response.inputs && Object.keys(response.inputs).length > 0
                                                ? Object.entries(response.inputs)
                                                      .map(([k, v]) => `${k}: ${v}`)
                                                      .join(', ')
                                                : '';
                                        value = [checked, inputs].filter(Boolean).join(' / ');
                                    } else if (Array.isArray(response)) {
                                        value = response.map((item) => (typeof item === 'object' ? Object.values(item).join(' ') : String(item))).join(', ');
                                    } else {
                                        value = JSON.stringify(response);
                                    }
                                } else {
                                    value = String(response);
                                }
                            }

                            row[question.title] = value;
                        });
                });

            excelData.push(row);
        });

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData, {
            header: columnHeaders,
        });

        // 컬럼 너비
        const colWidths: any[] = [];
        columnHeaders.forEach((header, index) => {
            if (header.includes('===') && header.includes('단계')) {
                colWidths[index] = { wch: 15 };
            } else {
                const maxLength = Math.max(header.length, ...excelData.map((row) => String(row[header] || '').length));
                colWidths[index] = { wch: Math.min(maxLength + 2, 50) };
            }
        });
        worksheet['!cols'] = colWidths;

        // 메인 시트 추가
        XLSX.utils.book_append_sheet(workbook, worksheet, '제출목록');

        // ===== 🔥 추가: 객실 시트 만들기 =====
        // 프론트에서 responses.rooms 로 넣어준 걸 여기서 꺼내서 펼친다
        const roomRows: any[] = [];

        submissions.forEach((submission, index) => {
            const responses = JSON.parse(submission.responses || '{}');
            const rooms = Array.isArray(responses.rooms) ? responses.rooms : [];

            rooms.forEach((room: any, roomIdx: number) => {
                roomRows.push({
                    순번: index + 1,
                    상호명: submission.companyName,
                    객실번호: roomIdx + 1,
                    객실명: room.name || '',
                    '객실 설명': room.desc || '',
                    형태: room.type || '',
                });
            });
        });

        if (roomRows.length > 0) {
            const roomSheet = XLSX.utils.json_to_sheet(roomRows, {
                header: ['순번', '상호명', '객실번호', '객실명', '객실 설명', '형태'],
            });

            roomSheet['!cols'] = [
                { wch: 6 }, // 순번
                { wch: 20 }, // 상호명
                { wch: 8 }, // 객실번호
                { wch: 25 }, // 객실명
                { wch: 40 }, // 객실 설명
                { wch: 25 }, // 형태
            ];

            XLSX.utils.book_append_sheet(workbook, roomSheet, '객실목록');
        }

        // ===== 최종 응답 =====
        const portfolioTitle = submissions[0].portfolio?.title || '알 수 없음';
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        const fileName = `${portfolioTitle}_제출목록_${new Date().toISOString().split('T')[0]}.xlsx`;
        const encodedFileName = encodeURIComponent(fileName);

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
