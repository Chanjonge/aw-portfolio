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

        let response: Response;

        try {
            response = await fetch(targetUrl, {
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

        const contentType = response.headers.get('content-type') || 'text/html';
        let content = await response.text();

        // HTML인 경우 모든 리소스를 프록시를 통해 로드하도록 변환
        if (contentType.includes('text/html')) {
            const baseUrl = `${url.protocol}//${url.host}`;
            const proxyBaseUrl = `/api/proxy?url=`;

            // 1. 절대 경로 (/)로 시작하는 리소스들을 프록시로 변환
            content = content
                .replace(/href="\/([^"]*?)"/g, (match, path) => {
                    const fullUrl = `${baseUrl}/${path}`;
                    return `href="${proxyBaseUrl}${encodeURIComponent(fullUrl)}"`;
                })
                .replace(/src="\/([^"]*?)"/g, (match, path) => {
                    const fullUrl = `${baseUrl}/${path}`;
                    return `src="${proxyBaseUrl}${encodeURIComponent(fullUrl)}"`;
                })
                .replace(/url\(\/([^)]*?)\)/g, (match, path) => {
                    const fullUrl = `${baseUrl}/${path}`;
                    return `url(${proxyBaseUrl}${encodeURIComponent(fullUrl)})`;
                })
                .replace(/url\("\/([^"]*?)"\)/g, (match, path) => {
                    const fullUrl = `${baseUrl}/${path}`;
                    return `url("${proxyBaseUrl}${encodeURIComponent(fullUrl)}")`;
                })
                .replace(/url\('\/([^']*?)'\)/g, (match, path) => {
                    const fullUrl = `${baseUrl}/${path}`;
                    return `url('${proxyBaseUrl}${encodeURIComponent(fullUrl)}')`;
                });

            // 2. 상대 경로 리소스들도 프록시로 변환
            content = content
                .replace(/href="(?!http|\/\/|#|mailto:|tel:|javascript:)([^"]*?)"/g, (match, path) => {
                    const fullUrl = new URL(path, targetUrl).href;
                    return `href="${proxyBaseUrl}${encodeURIComponent(fullUrl)}"`;
                })
                .replace(/src="(?!http|\/\/|data:|javascript:)([^"]*?)"/g, (match, path) => {
                    const fullUrl = new URL(path, targetUrl).href;
                    return `src="${proxyBaseUrl}${encodeURIComponent(fullUrl)}"`;
                });

            // 3. HTTP/HTTPS 절대 URL도 프록시로 변환 (같은 도메인이 아닌 경우만)
            content = content
                .replace(/href="(https?:\/\/[^"]*?)"/g, (match, fullUrl) => {
                    try {
                        const resourceUrl = new URL(fullUrl);
                        // 같은 도메인이거나 HTTPS인 경우는 그대로, HTTP 외부 도메인은 프록시 사용
                        if (resourceUrl.host === url.host || resourceUrl.protocol === 'https:') {
                            return match;
                        }
                        return `href="${proxyBaseUrl}${encodeURIComponent(fullUrl)}"`;
                    } catch {
                        return match;
                    }
                })
                .replace(/src="(https?:\/\/[^"]*?)"/g, (match, fullUrl) => {
                    try {
                        const resourceUrl = new URL(fullUrl);
                        // 같은 도메인이거나 HTTPS인 경우는 그대로, HTTP 외부 도메인은 프록시 사용
                        if (resourceUrl.host === url.host || resourceUrl.protocol === 'https:') {
                            return match;
                        }
                        return `src="${proxyBaseUrl}${encodeURIComponent(fullUrl)}"`;
                    } catch {
                        return match;
                    }
                });

            // 4. CSS 내부의 @import와 url() 처리
            content = content.replace(/@import\s+url\(["']?([^"')]*?)["']?\)/g, (match, path) => {
                try {
                    const fullUrl = new URL(path, targetUrl).href;
                    return `@import url("${proxyBaseUrl}${encodeURIComponent(fullUrl)}")`;
                } catch {
                    return match;
                }
            });

            // 5. Base tag 추가로 상대 경로 기준점 설정
            if (!content.includes('<base')) {
                content = content.replace(/<head>/i, `<head>\n<base href="${targetUrl}">`);
            }
        }

        // CSS 파일인 경우 내부 리소스 경로 처리
        if (contentType.includes('text/css')) {
            const baseUrl = `${url.protocol}//${url.host}`;
            const proxyBaseUrl = `/api/proxy?url=`;

            // CSS 내의 url() 함수들을 프록시로 변환
            content = content
                .replace(/url\(["']?\/([^"')]*?)["']?\)/g, (match, path) => {
                    const fullUrl = `${baseUrl}/${path}`;
                    return `url("${proxyBaseUrl}${encodeURIComponent(fullUrl)}")`;
                })
                .replace(/url\(["']?(?!http|\/\/|data:)([^"')]*?)["']?\)/g, (match, path) => {
                    try {
                        const fullUrl = new URL(path, targetUrl).href;
                        return `url("${proxyBaseUrl}${encodeURIComponent(fullUrl)}")`;
                    } catch {
                        return match;
                    }
                })
                .replace(/@import\s+["']?\/([^"']*)["']?/g, (match, path) => {
                    const fullUrl = `${baseUrl}/${path}`;
                    return `@import "${proxyBaseUrl}${encodeURIComponent(fullUrl)}"`;
                })
                .replace(/@import\s+["']?(?!http|\/\/)([^"']*)["']?/g, (match, path) => {
                    try {
                        const fullUrl = new URL(path, targetUrl).href;
                        return `@import "${proxyBaseUrl}${encodeURIComponent(fullUrl)}"`;
                    } catch {
                        return match;
                    }
                });
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

        // 캐싱 헤더 (리소스 로딩 성능 향상)
        if (!contentType.includes('text/html')) {
            headers.set('Cache-Control', 'public, max-age=3600'); // 1시간 캐시
        }

        // 원본 서버의 일부 헤더 복사
        const originalHeaders = ['last-modified', 'etag', 'expires'];
        originalHeaders.forEach((headerName) => {
            const value = response.headers.get(headerName);
            if (value) {
                headers.set(headerName, value);
            }
        });

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
