// app/api/sheet/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// 반드시 Node 런타임 (googleapis는 Edge 미지원)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // (선택) Vercel 캐시 회피

// ENV
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Sheet1';
const RANGE = `${SHEET_NAME}!A:E`;

async function getGoogleSheetsClient() {
    if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHEET_ID) {
        throw new Error('Google Sheets 환경변수가 설정되지 않았습니다.');
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: GOOGLE_PRIVATE_KEY,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return google.sheets({ version: 'v4', auth });
}

function getClientIp(req: NextRequest) {
    const xff = req.headers.get('x-forwarded-for');
    if (!xff) return 'unknown';
    // 첫 번째 IP
    return xff.split(',')[0].trim();
}

function nowSeoulISO() {
    // 사람이 읽기 쉬운 포맷 (서울 고정)
    const fmt = new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
    return fmt.format(new Date());
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const { portfolioTitle, companyName, responses, submittedAt } = body || {};

        if (!portfolioTitle || !companyName || !responses) {
            return NextResponse.json({ error: '필수 데이터가 누락되었습니다.' }, { status: 400 });
        }

        const sheets = await getGoogleSheetsClient();

        // 응답 문자열 직렬화 (null/array/object 안전 처리)
        const responseText = Object.entries(responses)
            .map(([key, value]) => {
                if (value === null || value === undefined) return `${key}: `;
                if (typeof value === 'object') return `${key}: ${JSON.stringify(value)}`;
                return `${key}: ${String(value)}`;
            })
            .join(' | ');

        const values = [
            [
                submittedAt || nowSeoulISO(), // 제출 시간(클라이언트가 보냈으면 우선)
                portfolioTitle, // 포트폴리오 제목
                companyName, // 상호명
                responseText, // 응답 내용
                getClientIp(request), // IP 주소
            ],
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEET_ID!,
            range: RANGE, // 시트명 포함
            valueInputOption: 'USER_ENTERED', // 날짜/숫자 자동 파싱
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values },
        });

        return NextResponse.json({ success: true, message: '구글 시트에 데이터가 저장되었습니다.' });
    } catch (error) {
        console.error('Google Sheets API 오류:', error);
        return NextResponse.json({ error: '구글 시트 저장 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

export async function GET(_request: NextRequest) {
    try {
        const sheets = await getGoogleSheetsClient();

        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: GOOGLE_SHEET_ID!,
            range: RANGE,
        });

        const rows = res.data.values || [];

        // 헤더 가정: A1:E1 = ['제출시간','포트폴리오','상호명','응답내용','IP주소']
        // GET에서는 시트를 수정하지 않습니다(멱등성 유지).
        const hasHeader = rows.length > 0 && rows[0][0] === '제출시간' && rows[0][1] === '포트폴리오' && rows[0][2] === '상호명' && rows[0][3] === '응답내용' && rows[0][4] === 'IP주소';

        const dataRows = hasHeader ? rows.slice(1) : rows;

        const submissions = dataRows.map((row, index) => ({
            id: index + 1,
            submittedAt: row[0] || '',
            portfolioTitle: row[1] || '',
            companyName: row[2] || '',
            responses: row[3] || '',
            ipAddress: row[4] || '',
        }));

        return NextResponse.json({ submissions, hasHeader });
    } catch (error) {
        console.error('Google Sheets 조회 오류:', error);
        return NextResponse.json({ error: '구글 시트 조회 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
