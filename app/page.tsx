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

interface Category {
    id: string;
    name: string;
    slug: string;
    order: number;
    _count?: {
        portfolios: number;
    };
}

interface Portfolio {
    id: string;
    title: string;
    description: string;
    slug: string;
    thumbnail?: string;
    categoryId?: string;
    category?: Category;
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
    const [categories, setCategories] = useState<Category[]>([]);
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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

        // Fetch categories and portfolios
        fetchCategories();
        fetchPortfolios();
    }, []);

    useEffect(() => {
        fetchPortfolios();
    }, [selectedCategory]);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();
            if (response.ok) {
                setCategories(data.categories);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchPortfolios = async () => {
        try {
            const url = selectedCategory ? `/api/portfolios?active=true&categoryId=${selectedCategory}` : '/api/portfolios?active=true';
            const response = await fetch(url);
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
                                <Link href="/my-submissions" className="px-4 py-2 border-2 border-black rounded-lg font-semibold hover:bg-black hover:text-white transition-all">
                                    내 제출 내역
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-black mb-4">타입형 리스트</h2>
                    {/* <p className="text-xl text-gray-600">원하시는 타입을 선택하여 양식을 작성해주세요</p> */}
                </div>

                {/* Category Filter */}
                {categories.length > 0 && (
                    <div className="mb-8">
                        <div className="flex justify-center gap-3 flex-wrap">
                            <button onClick={() => setSelectedCategory(null)} className={`px-6 py-3 rounded-lg font-semibold transition-all ${selectedCategory === null ? 'bg-black text-white' : 'bg-white text-black border-2 border-gray-300 hover:border-black'}`}>
                                전체
                            </button>
                            {categories.map((category) => (
                                <button key={category.id} onClick={() => setSelectedCategory(category.id)} className={`px-6 py-3 rounded-lg font-semibold transition-all ${selectedCategory === category.id ? 'bg-black text-white' : 'bg-white text-black border-2 border-gray-300 hover:border-black'}`}>
                                    {category.name}
                                    {category._count && category._count.portfolios > 0 && <span className="ml-2 text-sm opacity-75">({category._count.portfolios})</span>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

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
                            <Link key={portfolio.id} href={`/portfolio/${portfolio.slug}`} className="block border-1 border-black transition-all overflow-hidden group">
                                {portfolio.thumbnail && (
                                    <div className="portfolio-list w-full h-48 h-50 bg-gray-200 overflow-hidden">
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

                {/* Admin Login Link at Bottom */}
                {!user && (
                    <div className="text-center mt-16 pt-8 border-t border-gray-200">
                        <Link href="/admin/login" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                            관리자 로그인
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
