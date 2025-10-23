import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// 구글 서비스 계정 키 (환경변수로 설정해야 함)
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID;

// 구글 시트 클라이언트 초기화
async function getGoogleSheetsClient() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: GOOGLE_PRIVATE_KEY,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    return sheets;
}

// POST - 구글 시트에 데이터 추가
export async function POST(request: NextRequest) {
    try {
        const { portfolioTitle, companyName, responses, submittedAt } = await request.json();

        if (!portfolioTitle || !companyName || !responses) {
            return NextResponse.json({ error: '필수 데이터가 누락되었습니다.' }, { status: 400 });
        }

        // 환경변수 확인
        if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHEET_ID) {
            console.error('Google Sheets 환경변수가 설정되지 않았습니다.');
            return NextResponse.json({ error: 'Google Sheets 설정이 필요합니다.' }, { status: 500 });
        }

        const sheets = await getGoogleSheetsClient();

        // 응답 데이터를 문자열로 변환
        const responseText = Object.entries(responses)
            .map(([key, value]) => {
                if (typeof value === 'object') {
                    return `${key}: ${JSON.stringify(value)}`;
                }
                return `${key}: ${value}`;
            })
            .join(' | ');

        // 시트에 추가할 데이터
        const values = [
            [
                new Date().toLocaleString('ko-KR'), // 제출 시간
                portfolioTitle, // 포트폴리오 제목
                companyName, // 상호명
                responseText, // 응답 내용
                request.headers.get('x-forwarded-for') || 'unknown', // IP 주소
            ],
        ];

        // 시트에 데이터 추가
        await sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: 'A:E', // A부터 E열까지
            valueInputOption: 'RAW',
            requestBody: {
                values,
            },
        });

        return NextResponse.json({ success: true, message: '구글 시트에 데이터가 저장되었습니다.' });
    } catch (error) {
        console.error('Google Sheets API 오류:', error);
        return NextResponse.json({ error: '구글 시트 저장 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

// GET - 구글 시트에서 데이터 조회
export async function GET(request: NextRequest) {
    try {
        // 환경변수 확인
        if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHEET_ID) {
            return NextResponse.json({ error: 'Google Sheets 설정이 필요합니다.' }, { status: 500 });
        }

        const sheets = await getGoogleSheetsClient();

        // 시트에서 데이터 읽기
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: 'A:E',
        });

        const rows = response.data.values || [];

        // 헤더가 없으면 추가
        if (rows.length === 0 || rows[0][0] !== '제출시간') {
            await sheets.spreadsheets.values.update({
                spreadsheetId: GOOGLE_SHEET_ID,
                range: 'A1:E1',
                valueInputOption: 'RAW',
                requestBody: {
                    values: [['제출시간', '포트폴리오', '상호명', '응답내용', 'IP주소']],
                },
            });
        }

        // 데이터 포맷팅
        const submissions = rows.slice(1).map((row, index) => ({
            id: index + 1,
            submittedAt: row[0] || '',
            portfolioTitle: row[1] || '',
            companyName: row[2] || '',
            responses: row[3] || '',
            ipAddress: row[4] || '',
        }));

        return NextResponse.json({ submissions });
    } catch (error) {
        console.error('Google Sheets 조회 오류:', error);
        return NextResponse.json({ error: '구글 시트 조회 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
