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

    // 일반 상태
    const [user, setUser] = useState<User | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // 인증 상태
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');

    /* -------------------------------------------
     * 초기 로드 시 localStorage 데이터 복원
     * ------------------------------------------- */
    useEffect(() => {
        // 사용자 로그인 상태 복원
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                setUser(userData);
            } catch (error) {
                console.error('Failed to parse user data:', error);
            }
        }

        // ✅ 로컬 인증 데이터 복원
        const savedAuth = localStorage.getItem('portfolio_auth');
        if (savedAuth) {
            try {
                const parsed = JSON.parse(savedAuth);
                if (parsed.companyName && parsed.password) {
                    setCompanyName(parsed.companyName);
                    setPassword(parsed.password);
                    setIsAuthenticated(true);
                }
            } catch (err) {
                console.error('Failed to parse saved auth:', err);
            }
        }

        // Fetch 초기 데이터
        fetchCategories();
        fetchPortfolios();
    }, []);

    /* -------------------------------------------
     * 카테고리 변경 시 포트폴리오 새로 불러오기
     * ------------------------------------------- */
    useEffect(() => {
        fetchPortfolios();
    }, [selectedCategory]);

    /* -------------------------------------------
     * API 요청
     * ------------------------------------------- */
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

    /* -------------------------------------------
     * 로그아웃 (사용자 계정)
     * ------------------------------------------- */
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    /* -------------------------------------------
     * 인증 처리 (상호명 + 비밀번호)
     * ------------------------------------------- */
    const handleAuth = () => {
        setAuthError('');

        if (!companyName.trim()) {
            setAuthError('상호명을 입력해주세요.');
            return;
        }

        if (password.length !== 4 || !/^\d{4}$/.test(password)) {
            setAuthError('4자리 숫자 비밀번호를 입력해주세요.');
            return;
        }

        // ✅ localStorage에 저장 (세션이 아니라 영구 저장)
        localStorage.setItem('portfolio_auth', JSON.stringify({ companyName: companyName.trim(), password }));

        setIsAuthenticated(true);
    };

    /* -------------------------------------------
     * 인증 초기화 (다른 정보로 변경)
     * ------------------------------------------- */
    const handleClearAuth = () => {
        localStorage.removeItem('portfolio_auth');
        setCompanyName('');
        setPassword('');
        setIsAuthenticated(false);
        setAuthError('');
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

                {/* 사용자 인증 섹션 */}
                {!isAuthenticated ? (
                    <div className="max-w-md mx-auto mb-12 bg-white border-2 border-black rounded-lg p-8 shadow-lg">
                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold text-black mb-2">제출자 정보 입력</h3>
                            <p className="text-gray-600">상호명과 4자리 비밀번호를 입력하세요</p>
                            <p className="text-sm text-gray-500 mt-2">한 번 입력하면 모든 타입에서 자동으로 사용됩니다</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    상호명 <span className="text-red-500">*</span>
                                </label>
                                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="상호명 또는 이름을 입력하세요" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    4자리 비밀번호 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                                    placeholder="숫자 4자리"
                                    maxLength={4}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all"
                                />
                                <p className="text-sm text-gray-500 mt-1">숫자 4자리만 입력 가능합니다</p>
                            </div>

                            {authError && (
                                <div className="p-4 bg-red-50 border-2 border-red-500 rounded-lg">
                                    <p className="text-sm text-red-700">{authError}</p>
                                </div>
                            )}

                            <button onClick={handleAuth} className="w-full px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all">
                                확인
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-md mx-auto mb-12 bg-green-50 border-2 border-green-500 rounded-lg p-6">
                        <div className="text-center">
                            <div className="text-green-600 mb-2">✅ 인증 완료</div>
                            <div className="font-semibold text-black mb-2">상호명: {companyName}</div>
                            <div className="text-sm text-gray-600 mb-4">이제 원하는 타입을 선택하세요</div>
                            <button onClick={handleClearAuth} className="text-sm text-gray-500 hover:text-gray-700 underline">
                                다른 정보로 변경
                            </button>
                        </div>
                    </div>
                )}

                {/* Category Filter - 인증된 사용자에게만 표시 */}
                {isAuthenticated && categories.length > 0 && (
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

                {/* 포트폴리오 목록 - 인증된 사용자에게만 표시 */}
                {isAuthenticated &&
                    (loading ? (
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
                    ))}

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
