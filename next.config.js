/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // 보안 헤더 설정
    async headers() {
        return [
            {
                source: '/api/proxy',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'ALLOWALL',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: 'frame-ancestors *; frame-src *; child-src *;',
                    },
                ],
            },
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: 'frame-src *; child-src *; connect-src * data: blob:; img-src * data: blob:;',
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
