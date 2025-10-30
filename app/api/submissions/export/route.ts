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
                portfolioId,
                isDraft: false,
                companyName: { not: '' },
            },
            include: {
                portfolio: {
                    select: { title: true, slug: true },
                },
            },
            orderBy: { completedAt: 'desc' },
        });

        if (submissions.length === 0) {
            return NextResponse.json({ error: '해당 포트폴리오에 제출 데이터가 없습니다.' }, { status: 404 });
        }

        // 질문
        const questions = await prisma.question.findMany({
            where: { portfolioId },
            orderBy: [{ step: 'asc' }, { order: 'asc' }],
        });

        const questionsByStep = questions.reduce((groups: { [key: number]: any[] }, q) => {
            if (!groups[q.step]) groups[q.step] = [];
            groups[q.step].push(q);
            return groups;
        }, {});

        // 1) 기본 헤더
        const columnHeaders: string[] = ['순번', '상호명'];

        // 2) 질문 헤더 (file 제외)
        Object.keys(questionsByStep)
            .sort((a, b) => Number(a) - Number(b))
            .forEach((step) => {
                questionsByStep[Number(step)]
                    .sort((a, b) => a.order - b.order)
                    .forEach((question) => {
                        if (question.questionType === 'file') return;
                        columnHeaders.push(question.title);
                    });
            });

        // =========================
        // 여기부터 rooms / specials 준비
        // =========================

        // 제출들 중에서 rooms / specials 최대 개수 계산
        let maxRooms = 0;
        let maxSpecials = 0;

        const parsedSubmissions = submissions.map((s) => {
            const r = JSON.parse(s.responses || '{}');
            const rooms = Array.isArray(r.rooms) ? r.rooms : [];
            const specials = Array.isArray(r.specials) ? r.specials : [];
            if (rooms.length > maxRooms) maxRooms = rooms.length;
            if (specials.length > maxSpecials) maxSpecials = specials.length;
            return { submission: s, responses: r, rooms, specials };
        });

        // 3) 동적 객실 헤더 만들기
        const dynamicRoomHeaders: string[] = [];
        for (let i = 1; i <= maxRooms; i++) {
            dynamicRoomHeaders.push(`객실${i}명`);
            dynamicRoomHeaders.push(`객실${i}설명`);
            dynamicRoomHeaders.push(`객실${i}형태`);
            dynamicRoomHeaders.push(`객실${i}요금`);
        }

        // 4) 동적 스페셜 헤더 만들기
        const dynamicSpecialHeaders: string[] = [];
        for (let i = 1; i <= maxSpecials; i++) {
            dynamicSpecialHeaders.push(`스페셜${i}명`);
            dynamicSpecialHeaders.push(`스페셜${i}설명`);
        }

        // =========================
        // 헤더 끼워 넣는 위치 계산
        // =========================

        // (1) 객실 헤더 끼울 위치
        // - 네가 폼에서 쓰는 "객실명", "객실 설명", "형태" 같은 기본 질문 뒤에 꽂아야 하니까
        // - "객실"로 시작하는 것들을 찾고, 그 중 마지막 index 뒤에 넣자
        const roomBaseIndexes: number[] = [];
        columnHeaders.forEach((h, idx) => {
            // 필요하면 여기 조건 더 좁혀도 됨 (예: h === '객실명' || h === '객실 설명' ...)
            if (h.startsWith('객실')) {
                roomBaseIndexes.push(idx);
            }
        });

        let insertRoomAt = -1;
        if (roomBaseIndexes.length > 0) {
            insertRoomAt = roomBaseIndexes[roomBaseIndexes.length - 1] + 1;
        }

        // (2) 스페셜 헤더 끼울 위치
        const specialBaseIndexes: number[] = [];
        columnHeaders.forEach((h, idx) => {
            if (h.startsWith('스페셜')) {
                specialBaseIndexes.push(idx);
            }
        });

        let insertSpecialAt = -1;
        if (specialBaseIndexes.length > 0) {
            insertSpecialAt = specialBaseIndexes[specialBaseIndexes.length - 1] + 1;
        }

        // 이제 실제로 끼워넣기
        // 주의: 객실 먼저 넣고, 그 다음 스페셜 넣어야 index 안 꼬임
        // 다만 "객실 뒤 → 객실1..." → "스페셜 뒤 → 스페셜1..." 이 순서라
        // 객실 헤더 먼저 splice 하고, 그 다음 스페셜을 splice 할 때는
        // 객실이 추가된 길이를 고려해서 위치를 다시 계산해줘야 함

        // 1) 객실 헤더 삽입
        if (insertRoomAt !== -1 && dynamicRoomHeaders.length > 0) {
            columnHeaders.splice(insertRoomAt, 0, ...dynamicRoomHeaders);
        } else if (dynamicRoomHeaders.length > 0) {
            // 객실 관련 기본 컬럼이 없으면 맨 끝에
            columnHeaders.push(...dynamicRoomHeaders);
        }

        // 2) 스페셜 헤더 삽입
        if (dynamicSpecialHeaders.length > 0) {
            if (insertSpecialAt !== -1) {
                // 객실을 먼저 넣어버렸으니까
                // 객실이 스페셜보다 앞쪽에 있었다면 index가 밀렸을 수 있음
                // 가장 간단하게는 "지금 columnHeaders에서 다시 스페셜 위치 찾기"
                const reSpecialIndexes: number[] = [];
                columnHeaders.forEach((h, idx) => {
                    if (h.startsWith('스페셜')) {
                        reSpecialIndexes.push(idx);
                    }
                });
                let realInsertSpecialAt = reSpecialIndexes.length > 0 ? reSpecialIndexes[reSpecialIndexes.length - 1] + 1 : columnHeaders.length;
                columnHeaders.splice(realInsertSpecialAt, 0, ...dynamicSpecialHeaders);
            } else {
                columnHeaders.push(...dynamicSpecialHeaders);
            }
        }

        // =========================
        // 실제 데이터 만들기
        // =========================
        const excelData: any[] = [];

        parsedSubmissions.forEach(({ submission, responses, rooms, specials }, index) => {
            const row: any = {};

            // 기본
            row['순번'] = index + 1;
            row['상호명'] = submission.companyName;

            // 질문 채우기
            Object.keys(questionsByStep)
                .sort((a, b) => Number(a) - Number(b))
                .forEach((step) => {
                    questionsByStep[Number(step)]
                        .sort((a, b) => a.order - b.order)
                        .forEach((question) => {
                            if (question.questionType === 'file') return;
                            const resp = responses[question.id];
                            let value = '';

                            if (resp !== undefined && resp !== null) {
                                if (question.questionType === 'checkbox' && Array.isArray(resp)) {
                                    value = resp.join(', ');
                                } else if (typeof resp === 'object') {
                                    if (Array.isArray((resp as any).checked) || (resp as any).inputs) {
                                        const checked = Array.isArray((resp as any).checked) ? (resp as any).checked.join(', ') : '';
                                        const inputs =
                                            (resp as any).inputs && Object.keys((resp as any).inputs).length > 0
                                                ? Object.entries((resp as any).inputs)
                                                      .map(([k, v]) => `${k}: ${v}`)
                                                      .join(', ')
                                                : '';
                                        value = [checked, inputs].filter(Boolean).join(' / ');
                                    } else if (Array.isArray(resp)) {
                                        value = resp.map((item) => (typeof item === 'object' ? Object.values(item).join(' ') : String(item))).join(', ');
                                    } else {
                                        value = JSON.stringify(resp);
                                    }
                                } else {
                                    value = String(resp);
                                }
                            }

                            row[question.title] = value;
                        });
                });

            // 객실 채우기
            for (let i = 0; i < maxRooms; i++) {
                const room = rooms[i];
                const base = `객실${i + 1}`;
                row[`${base}명`] = room ? room.name || '' : '';
                row[`${base}설명`] = room ? room.desc || '' : '';
                row[`${base}형태`] = room ? room.type || '' : '';
                row[`${base}요금`] = room ? room.price || '' : '';
            }

            // 스페셜 채우기
            for (let i = 0; i < maxSpecials; i++) {
                const sp = specials[i];
                const base = `스페셜${i + 1}`;
                row[`${base}명`] = sp ? sp.name || '' : '';
                row[`${base}설명`] = sp ? sp.desc || '' : '';
            }

            excelData.push(row);
        });

        // 워크북
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData, {
            header: columnHeaders,
        });

        // 너비
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
