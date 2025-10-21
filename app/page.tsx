'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}

interface Portfolio {
    id: string;
    title: string;
    description: string;
    slug: string;
    thumbnail?: string;
    isActive: boolean;
    order: number;
    _count: {
        questions: number;
        submissions: number;
    };
}

export default function Home() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                setUser(userData);
            } catch (error) {
                console.error('Failed to parse user data:', error);
            }
        }

        // Fetch portfolios
        fetchPortfolios();
    }, []);

    const fetchPortfolios = async () => {
        try {
            const response = await fetch('/api/portfolios?active=true');
            const data = await response.json();
            if (response.ok) {
                setPortfolios(data.portfolios);
            }
        } catch (error) {
            console.error('Failed to fetch portfolios:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white border-b-2 border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-black">포트폴리오 리스트</h1>
                        <div className="flex items-center gap-4">
                            {user ? (
                                <>
                                    <span className="text-gray-600">
                                        {user.name}님 ({user.role === 'SUPER_ADMIN' ? '최고 관리자' : '관리자'})
                                    </span>
                                    <button onClick={() => router.push(user.role === 'SUPER_ADMIN' ? '/admin/super' : '/admin/dashboard')} className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all">
                                        관리자 페이지
                                    </button>
                                    <button onClick={handleLogout} className="px-4 py-2 bg-white text-black border-2 border-black rounded-lg font-semibold hover:bg-black hover:text-white transition-all">
                                        로그아웃
                                    </button>
                                </>
                            ) : (
                                <Link href="/admin/login" className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all">
                                    관리자 로그인
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-black mb-4">타입을 선택하세요</h2>
                    <p className="text-xl text-gray-600">원하시는 타입을 선택하여 양식을 작성해주세요</p>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="text-xl text-gray-600">로딩 중...</div>
                    </div>
                ) : portfolios.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-xl text-gray-600">아직 활성화된 타입이 없습니다.</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {portfolios.map((portfolio) => (
                            <Link key={portfolio.id} href={`/portfolio/${portfolio.slug}`} className="block border-2 border-black rounded-lg transition-all overflow-hidden group">
                                {portfolio.thumbnail && (
                                    <div className="w-full h-48 bg-gray-200 overflow-hidden">
                                        <img src={portfolio.thumbnail} alt={portfolio.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    </div>
                                )}
                                <div className="p-6">
                                    <h3 className="text-2xl font-bold mb-3 group-hover:text-gray-700">{portfolio.title}</h3>
                                    {portfolio.description && <p className="text-gray-600 mb-4">{portfolio.description}</p>}
                                    {/* <div className="flex gap-4 text-sm">
                                        <span className="text-gray-500">📝 {portfolio._count.questions}개 질문</span>
                                        <span className="text-gray-500">✅ {portfolio._count.submissions}개 제출</span>
                                    </div> */}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
