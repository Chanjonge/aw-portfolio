import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: '언제나 디자인 타입형 리스트',
    description: 'Professional form management system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko">
            <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests"></meta>
            <body>{children}</body>
        </html>
    );
}
