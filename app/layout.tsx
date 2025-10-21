import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: '언제나 디자인 타입형 리스트1',
    description: 'Professional form management system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko">
            <body>{children}</body>
        </html>
    );
}
