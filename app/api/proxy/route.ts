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

        // 외부 사이트 요청 (타임아웃 설정)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

        try {
            const response = await fetch(targetUrl, {
                signal: controller.signal,
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

            clearTimeout(timeoutId);

            if (!response.ok) {
                let errorMessage = '';
                switch (response.status) {
                    case 404:
                        errorMessage = '페이지를 찾을 수 없습니다. 웹사이트 주소가 변경되었거나 삭제되었을 수 있습니다.';
                        break;
                    case 403:
                        errorMessage = '접근이 거부되었습니다. 웹사이트에서 외부 접근을 차단하고 있습니다.';
                        break;
                    case 500:
                    case 502:
                    case 503:
                    case 504:
                        errorMessage = '웹사이트 서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
                        break;
                    default:
                        errorMessage = `웹사이트에 연결할 수 없습니다. (오류 코드: ${response.status})`;
                }

                return NextResponse.json(
                    {
                        error: errorMessage,
                        details: `${response.status} ${response.statusText}`,
                        originalUrl: targetUrl,
                    },
                    { status: response.status }
                );
            }

            return response;
        } catch (fetchError) {
            clearTimeout(timeoutId);

            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
                return NextResponse.json(
                    {
                        error: '웹사이트 응답 시간이 초과되었습니다. 사이트가 느리거나 일시적으로 접근할 수 없는 상태입니다.',
                        details: 'Request timeout',
                        originalUrl: targetUrl,
                    },
                    { status: 408 }
                );
            }

            throw fetchError;
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

        // 네트워크 오류에 대한 더 자세한 메시지
        let errorMessage = '웹사이트에 연결할 수 없습니다.';
        let details = 'Network error';

        if (error instanceof Error) {
            if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
                errorMessage = '웹사이트 주소를 찾을 수 없습니다. 도메인이 존재하지 않거나 DNS 문제가 발생했습니다.';
                details = 'DNS resolution failed';
            } else if (error.message.includes('ECONNREFUSED')) {
                errorMessage = '웹사이트 서버가 연결을 거부했습니다. 서버가 다운되었거나 방화벽에 의해 차단되었을 수 있습니다.';
                details = 'Connection refused';
            } else if (error.message.includes('ETIMEDOUT')) {
                errorMessage = '웹사이트 연결 시간이 초과되었습니다. 서버가 응답하지 않거나 네트워크가 불안정합니다.';
                details = 'Connection timeout';
            } else if (error.message.includes('certificate')) {
                errorMessage = 'SSL 인증서 문제가 발생했습니다. 웹사이트의 보안 인증서가 유효하지 않습니다.';
                details = 'SSL certificate error';
            }
        }

        return NextResponse.json(
            {
                error: errorMessage,
                details: details,
                originalUrl: targetUrl || 'Unknown URL',
            },
            { status: 500 }
        );
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
