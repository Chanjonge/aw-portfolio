import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    try {
        // URL 유효성 검사
        const url = new URL(targetUrl);

        // 허용된 프로토콜만 허용 (보안)
        if (!['http:', 'https:'].includes(url.protocol)) {
            return NextResponse.json({ error: 'Invalid protocol' }, { status: 400 });
        }

        // 외부 사이트 요청
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                DNT: '1',
                Connection: 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            },
        });

        if (!response.ok) {
            return NextResponse.json({ error: `Failed to fetch: ${response.status} ${response.statusText}` }, { status: response.status });
        }

        const contentType = response.headers.get('content-type') || 'text/html';
        let content = await response.text();

        // HTML인 경우 상대 경로를 절대 경로로 변환
        if (contentType.includes('text/html')) {
            const baseUrl = `${url.protocol}//${url.host}`;

            // CSS, JS, 이미지 등의 상대 경로를 절대 경로로 변환
            content = content
                .replace(/href="\/([^"]*?)"/g, `href="${baseUrl}/$1"`)
                .replace(/src="\/([^"]*?)"/g, `src="${baseUrl}/$1"`)
                .replace(/url\(\/([^)]*?)\)/g, `url(${baseUrl}/$1)`)
                .replace(/url\("\/([^"]*?)"\)/g, `url("${baseUrl}/$1")`)
                .replace(/url\('\/([^']*?)'\)/g, `url('${baseUrl}/$1')`);

            // 상대 경로 링크도 처리
            content = content.replace(/href="(?!http|\/\/|#)([^"]*?)"/g, `href="${baseUrl}/$1"`).replace(/src="(?!http|\/\/|data:)([^"]*?)"/g, `src="${baseUrl}/$1"`);
        }

        // 응답 헤더 설정
        const headers = new Headers();
        headers.set('Content-Type', contentType);
        headers.set('X-Frame-Options', 'ALLOWALL');
        headers.set('Content-Security-Policy', 'frame-ancestors *;');

        // CORS 헤더 추가
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        return new NextResponse(content, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error('Proxy error:', error);
        return NextResponse.json({ error: 'Failed to proxy request' }, { status: 500 });
    }
}

// OPTIONS 요청 처리 (CORS preflight)
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
