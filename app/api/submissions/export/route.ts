import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
    try {
        // 1. 토큰 검사
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
        }

        // 2. 파라미터
        const { searchParams } = new URL(request.url);
        const portfolioId = searchParams.get('portfolioId');
        if (!portfolioId) {
            return NextResponse.json({ error: '포트폴리오 ID가 필요합니다.' }, { status: 400 });
        }

        // 3. 제출 데이터 조회
        const submissions = await prisma.formSubmission.findMany({
            where: {
                portfolioId,
                isDraft: false,
                companyName: { not: '' },
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

        // 4. 질문 정보 조회
        const questions = await prisma.question.findMany({
            where: { portfolioId },
            orderBy: [{ step: 'asc' }, { order: 'asc' }],
        });

        // step별 그룹
        const questionsByStep = questions.reduce((groups: { [key: number]: any[] }, q) => {
            if (!groups[q.step]) groups[q.step] = [];
            groups[q.step].push(q);
            return groups;
        }, {});

        // 5. 먼저 모든 제출을 훑어서 rooms 최대 개수 구함
        let maxRooms = 0;
        submissions.forEach((submission) => {
            const responses = JSON.parse(submission.responses || '{}');
            const rooms = Array.isArray(responses.rooms) ? responses.rooms : [];
            if (rooms.length > maxRooms) maxRooms = rooms.length;
        });

        // 6. 엑셀 헤더 만들기
        // 기본
        const columnHeaders: string[] = ['순번', '상호명'];

        // 질문들 먼저 넣기
        Object.keys(questionsByStep)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .forEach((step) => {
                questionsByStep[parseInt(step)]
                    .sort((a, b) => a.order - b.order)
                    .forEach((question) => {
                        // 파일 질문은 제외
                        if (question.questionType === 'file') return;
                        columnHeaders.push(question.title);
                    });
            });

        // 🔥 객실 헤더를 '객실명' 바로 뒤에 끼워 넣기
        // maxRooms가 1이면(객실1만 있으면) 안 넣어도 됨. 2개 이상일 때만 추가
        const extraRoomHeaders: string[] = [];
        for (let i = 2; i <= maxRooms; i++) {
            extraRoomHeaders.push(`객실${i}명`);
            extraRoomHeaders.push(`객실${i}설명`);
            extraRoomHeaders.push(`객실${i}형태`);
        }

        if (extraRoomHeaders.length > 0) {
            // '객실명' 헤더 위치 찾기
            const baseRoomIndex = columnHeaders.findIndex((h) => h === '객실명');

            if (baseRoomIndex !== -1) {
                // 객실명 바로 뒤에 추가 객실 컬럼들 끼워넣기
                columnHeaders.splice(baseRoomIndex + 1, 0, ...extraRoomHeaders);
            } else {
                // 질문에 '객실명'이 아예 없는 경우에는 그냥 뒤에 붙임
                columnHeaders.push(...extraRoomHeaders);
            }
        }

        // 7. 행 데이터 만들기
        const excelData: any[] = [];

        submissions.forEach((submission, index) => {
            const responses = JSON.parse(submission.responses || '{}');
            const row: any = {};

            // 기본
            row['순번'] = index + 1;
            row['상호명'] = submission.companyName;

            // 질문 응답
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
                                    // 체크박스 + 입력 조합
                                    if (Array.isArray(response.checked) || response.inputs) {
                                        const checked = Array.isArray(response.checked) ? response.checked.join(', ') : '';
                                        const inputs =
                                            response.inputs && Object.keys(response.inputs).length > 0
                                                ? Object.entries(response.inputs)
                                                      .map(([k, v]) => `${k}: ${v}`)
                                                      .join(', ')
                                                : '';
                                        value = [checked, inputs].filter(Boolean).join(' / ');
                                    }
                                    // 배열형 응답
                                    else if (Array.isArray(response)) {
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

            // 🔥 객실 데이터 채우기
            const rooms = Array.isArray(responses.rooms) ? responses.rooms : [];

            // 객실1은 폼 질문으로 이미 들어가 있을 가능성이 높으니
            // 2번부터 maxRooms까지 채운다
            for (let i = 2; i <= maxRooms; i++) {
                const room = rooms[i - 1] || {}; // rooms[0] = 객실1, rooms[1] = 객실2 ...
                row[`객실${i}명`] = room.name || '';
                row[`객실${i}설명`] = room.desc || '';
                row[`객실${i}형태`] = room.type || '';
            }

            excelData.push(row);
        });

        // 8. 워크북/시트 생성
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData, {
            header: columnHeaders,
        });

        // 9. 컬럼 너비 설정
        const colWidths: any[] = [];
        columnHeaders.forEach((header, index) => {
            const maxLength = Math.max(header.length, ...excelData.map((row) => String(row[header] || '').length));
            colWidths[index] = { wch: Math.min(maxLength + 2, 60) };
        });
        worksheet['!cols'] = colWidths;

        // 10. 시트 추가
        const portfolioTitle = submissions[0].portfolio?.title || '알 수 없음';
        XLSX.utils.book_append_sheet(workbook, worksheet, '제출목록');

        // 11. 버퍼로 변환
        const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // 12. 응답
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
