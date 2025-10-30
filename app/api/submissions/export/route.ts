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

        // 1) 제출 데이터
        const submissions = await prisma.formSubmission.findMany({
            where: {
                portfolioId,
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

        // 2) 질문 데이터
        const questions = await prisma.question.findMany({
            where: { portfolioId },
            orderBy: [{ step: 'asc' }, { order: 'asc' }],
        });

        const questionsByStep = questions.reduce((groups: { [key: number]: any[] }, q) => {
            if (!groups[q.step]) groups[q.step] = [];
            groups[q.step].push(q);
            return groups;
        }, {});

        // 3) rooms 최대 개수 구하기
        let maxRooms = 0;
        submissions.forEach((submission) => {
            const responses = JSON.parse(submission.responses || '{}');
            const rooms = Array.isArray(responses.rooms) ? responses.rooms : [];
            if (rooms.length > maxRooms) maxRooms = rooms.length;
        });

        // 4) 헤더 만들기
        const columnHeaders: string[] = ['순번', '상호명'];

        // (1) 질문 헤더
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

        // (2) 객실 확장 헤더
        // 기본적으로 질문 안에 '객실명', '객실 설명', '형태' 가 있다고 가정
        // 여기 바로 뒤에 '요금' 을 넣고, 그 다음 객실2...를 붙임
        const extraRoomHeaders: string[] = [];
        for (let i = 2; i <= maxRooms; i++) {
            extraRoomHeaders.push(`객실${i}명`);
            extraRoomHeaders.push(`객실${i}설명`);
            extraRoomHeaders.push(`객실${i}형태`);
            extraRoomHeaders.push(`객실${i}요금`);
        }

        // 기준 컬럼 위치 찾기
        const roomNameIdx = columnHeaders.findIndex((h) => h === '객실명');
        const roomDescIdx = columnHeaders.findIndex((h) => h === '객실 설명');
        const roomTypeIdx = columnHeaders.findIndex((h) => h === '형태');

        const hasRoomBase = roomNameIdx !== -1 && roomDescIdx !== -1 && roomTypeIdx !== -1 && roomNameIdx < roomDescIdx && roomDescIdx < roomTypeIdx;

        if (hasRoomBase) {
            // ✅ 1번 객실의 '형태' 바로 뒤에 '요금' 을 먼저 끼운다
            columnHeaders.splice(roomTypeIdx + 1, 0, '요금');

            // 그리고 그 다음에 객실2~N 삽입
            if (extraRoomHeaders.length > 0) {
                // '형태' 하나 넣으면서 인덱스가 1 증가했으니 다시 위치 재계산
                const newRoomTypeIdx = columnHeaders.findIndex((h) => h === '형태');
                const insertPos = newRoomTypeIdx + 2; // 형태 다음(요금 다음) 위치
                columnHeaders.splice(insertPos, 0, ...extraRoomHeaders);
            }
        } else {
            // 객실 관련 3개가 연속이 아니면 그냥 뒤에 붙임
            columnHeaders.push('요금');
            columnHeaders.push(...extraRoomHeaders);
        }

        // 5) 행 데이터 만들기
        const excelData: any[] = [];

        submissions.forEach((submission, index) => {
            const responses = JSON.parse(submission.responses || '{}');
            const row: any = {};

            row['순번'] = index + 1;
            row['상호명'] = submission.companyName;

            // (1) 질문 응답
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

            // (2) 객실 데이터
            const rooms = Array.isArray(responses.rooms) ? responses.rooms : [];

            // 객실1 요금
            // 만약 프론트에서 rooms[0].price 로 저장했다면 여기서 읽힘
            // 질문으로 '요금'이 이미 있었다면 그 값이 우선이겠지만, 여기서도 한 번 더 덮어써줄 수 있음
            if (rooms[0]) {
                row['요금'] = rooms[0].price || '';
            } else {
                row['요금'] = row['요금'] || '';
            }

            // 객실2~N
            for (let i = 2; i <= maxRooms; i++) {
                const room = rooms[i - 1] || {};
                row[`객실${i}명`] = room.name || '';
                row[`객실${i}설명`] = room.desc || '';
                row[`객실${i}형태`] = room.type || '';
                row[`객실${i}요금`] = room.price || '';
            }

            excelData.push(row);
        });

        // 6) 워크북/시트 생성
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData, {
            header: columnHeaders,
        });

        // 7) 컬럼 너비
        const colWidths: any[] = [];
        columnHeaders.forEach((header, index) => {
            const maxLength = Math.max(header.length, ...excelData.map((row) => String(row[header] || '').length));
            colWidths[index] = { wch: Math.min(maxLength + 2, 60) };
        });
        worksheet['!cols'] = colWidths;

        // 8) 시트 추가
        const portfolioTitle = submissions[0].portfolio?.title || '알 수 없음';
        XLSX.utils.book_append_sheet(workbook, worksheet, '제출목록');

        // 9) 파일로 반환
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
