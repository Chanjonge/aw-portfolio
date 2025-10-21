'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Portfolio {
    id: string;
    title: string;
    description: string;
    slug: string;
    thumbnail?: string;
    isActive: boolean;
    _count: {
        questions: number;
        submissions: number;
    };
}

export default function MemberPortfoliosPage() {
    const router = useRouter();
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initPage = async () => {
            // Check auth
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');

            if (!token || !userStr) {
                router.push('/member/login');
                return;
            }

            try {
                const userData = JSON.parse(userStr);
                if (userData.role !== 'MEMBER') {
                    alert('회원 권한이 필요합니다.');
                    router.push('/member/login');
                    return;
                }
            } catch (error) {
                router.push('/member/login');
                return;
            }

            // Fetch portfolios
            try {
                const response = await fetch('/api/portfolios?active=true');
                if (response.ok) {
                    const data = await response.json();
                    // API returns { portfolios: [...] }
                    setPortfolios(data.portfolios || data);
                }
            } catch (error) {
                console.error('Failed to fetch portfolios:', error);
            } finally {
                setLoading(false);
            }
        };

        initPage();
    }, [router]);

    const handleLogout = () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/member/login');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-gray-600">로딩 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header with Navigation */}
            <header className="bg-white border-b-2 border-black">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-8">
                            <Link href="/member/dashboard" className="text-2xl font-bold text-black hover:text-gray-700">
                                회원 페이지
                            </Link>
                            <nav className="flex gap-6">
                                <Link href="/member/dashboard" className="text-gray-600 hover:text-black font-medium transition-colors">
                                    대시보드
                                </Link>
                                <Link href="/member/portfolios" className="text-black font-bold border-b-2 border-black">
                                    포트폴리오
                                </Link>
                                <Link href="/member/submissions" className="text-gray-600 hover:text-black font-medium transition-colors">
                                    내 제출내역
                                </Link>
                                <Link href="/member/mypage" className="text-gray-600 hover:text-black font-medium transition-colors">
                                    마이페이지
                                </Link>
                            </nav>
                        </div>
                        <button onClick={handleLogout} className="px-4 py-2 border-2 border-black rounded-lg font-semibold hover:bg-black hover:text-white transition-all">
                            로그아웃
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-black mb-2">포트폴리오</h1>
                    <p className="text-gray-600">등록된 포트폴리오를 확인하고 신청서를 작성하세요</p>
                </div>

                {portfolios.length === 0 ? (
                    <div className="bg-white border-2 border-gray-200 rounded-lg p-12 text-center">
                        <span className="text-6xl mb-4 block">📁</span>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">등록된 포트폴리오가 없습니다</h3>
                        <p className="text-gray-600">관리자가 포트폴리오를 등록하면 여기에 표시됩니다.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {portfolios.map((portfolio) => (
                            <Link key={portfolio.id} href={`/portfolio/${portfolio.slug}`} className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-black hover:shadow-xl transition-all group">
                                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                    {portfolio.thumbnail ? (
                                        <img src={portfolio.thumbnail} alt={portfolio.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-6xl">📁</span>
                                    )}
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-black mb-2 group-hover:text-gray-700">
                                        {portfolio.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                        {portfolio.description}
                                    </p>
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <span>질문 {portfolio._count.questions}개</span>
                                        <span className="text-black font-semibold group-hover:underline">
                                            신청하기 →
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

