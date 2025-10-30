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

        // 제출 목록
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

        // 질문 목록
        const questions = await prisma.question.findMany({
            where: { portfolioId: portfolioId },
            orderBy: [{ step: 'asc' }, { order: 'asc' }],
        });

        // 단계별 그룹
        const questionsByStep = questions.reduce((groups: { [key: number]: any[] }, question) => {
            if (!groups[question.step]) {
                groups[question.step] = [];
            }
            groups[question.step].push(question);
            return groups;
        }, {});

        // 1. 기본 헤더
        const columnHeaders: string[] = ['순번', '상호명'];

        // 2. 질문 헤더 (file 타입은 제외)
        Object.keys(questionsByStep)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .forEach((step) => {
                questionsByStep[parseInt(step)]
                    .sort((a, b) => a.order - b.order)
                    .forEach((question) => {
                        if (question.questionType === 'file') return;
                        columnHeaders.push(question.title);
                    });
            });

        // 👇 여기서부터 동적 필드(rooms, specials) 추가 준비
        // 모든 제출에서 rooms/specials 최대 개수 계산 (열 개수 맞추려고)
        let maxRooms = 0;
        let maxSpecials = 0;

        submissions.forEach((submission) => {
            const responses = JSON.parse(submission.responses || '{}');

            const rooms = Array.isArray(responses.rooms) ? responses.rooms : [];
            const specials = Array.isArray(responses.specials) ? responses.specials : [];

            if (rooms.length > maxRooms) maxRooms = rooms.length;
            if (specials.length > maxSpecials) maxSpecials = specials.length;
        });

        // 3. 객실 헤더 추가
        // 객실1명, 객실1설명, 객실1형태, 객실1요금, 객실2..., ...
        for (let i = 1; i <= maxRooms; i++) {
            columnHeaders.push(`객실${i}명`);
            columnHeaders.push(`객실${i}설명`);
            columnHeaders.push(`객실${i}형태`);
            columnHeaders.push(`객실${i}요금`);
        }

        // 4. 스페셜 헤더 추가
        // 스페셜1명, 스페셜1설명, 스페셜2명, ...
        for (let i = 1; i <= maxSpecials; i++) {
            columnHeaders.push(`스페셜${i}명`);
            columnHeaders.push(`스페셜${i}설명`);
        }

        // 엑셀 데이터
        const excelData: any[] = [];

        submissions.forEach((submission, index) => {
            const responses = JSON.parse(submission.responses || '{}');

            const row: any = {};

            // 기본
            row['순번'] = index + 1;
            row['상호명'] = submission.companyName;

            // 질문 값
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
                                    // 체크박스+입력
                                    if (Array.isArray((response as any).checked) || (response as any).inputs) {
                                        const checked = Array.isArray((response as any).checked) ? (response as any).checked.join(', ') : '';
                                        const inputs =
                                            (response as any).inputs && Object.keys((response as any).inputs).length > 0
                                                ? Object.entries((response as any).inputs)
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

            // ✅ 객실 데이터 채우기
            const rooms = Array.isArray(responses.rooms) ? responses.rooms : [];
            for (let i = 0; i < maxRooms; i++) {
                const room = rooms[i];
                const base = `객실${i + 1}`;
                row[`${base}명`] = room ? room.name || '' : '';
                row[`${base}설명`] = room ? room.desc || '' : '';
                row[`${base}형태`] = room ? room.type || '' : '';
                row[`${base}요금`] = room ? room.price || '' : '';
            }

            // ✅ 스페셜 데이터 채우기
            const specials = Array.isArray(responses.specials) ? responses.specials : [];
            for (let i = 0; i < maxSpecials; i++) {
                const sp = specials[i];
                const base = `스페셜${i + 1}`;
                row[`${base}명`] = sp ? sp.name || '' : '';
                row[`${base}설명`] = sp ? sp.desc || '' : '';
            }

            excelData.push(row);
        });

        // 워크북 생성
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData, {
            header: columnHeaders,
        });

        // 컬럼 너비
        const colWidths: any[] = [];
        columnHeaders.forEach((header, index) => {
            const maxLength = Math.max(header.length, ...excelData.map((row) => String(row[header] || '').length));
            colWidths[index] = { wch: Math.min(maxLength + 2, 50) };
        });
        worksheet['!cols'] = colWidths;

        const portfolioTitle = submissions[0].portfolio?.title || '알 수 없음';
        XLSX.utils.book_append_sheet(workbook, worksheet, '제출목록');

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
