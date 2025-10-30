'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
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
    _count?: { portfolios: number };
}

interface Portfolio {
    id: string;
    title: string;
    description: string;
    slug: string;
    thumbnail?: string;
    domain?: string; // 미리보기용 도메인 URL
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

    // 미리보기 팝업 상태
    const [showPreview, setShowPreview] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [previewTitle, setPreviewTitle] = useState<string>('');
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop'); // ⬅ 추가
    const [proxyError, setProxyError] = useState<string>(''); // 프록시 오류 상태

    // ESC 키로 팝업 닫기 + 스크롤 잠금/복원
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && showPreview) setShowPreview(false);
        };
        const prevOverflow = document.body.style.overflow;

        if (showPreview) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = prevOverflow || '';
        };
    }, [showPreview]);

    // 인증 상태
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');

    // 초기 로드
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

        // 로컬 인증 데이터 복원
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

        fetchCategories();
    }, []);

    // 카테고리/포트폴리오
    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();
            if (response.ok) setCategories(data.categories);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchPortfolios = useCallback(async () => {
        try {
            setLoading(true);
            const url = selectedCategory ? `/api/portfolios?active=true&categoryId=${selectedCategory}` : '/api/portfolios?active=true';
            const response = await fetch(url);
            const data = await response.json();
            if (response.ok) setPortfolios(data.portfolios);
        } catch (error) {
            console.error('Failed to fetch portfolios:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedCategory]);

    useEffect(() => {
        fetchPortfolios();
    }, [fetchPortfolios]);

    // 로그아웃
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    // 인증 처리
    const handleAuth = async () => {
        setAuthError('');

        if (!companyName.trim()) {
            setAuthError('상호명을 입력해주세요.');
            return;
        }
        if (password.length !== 4 || !/^\d{4}$/.test(password)) {
            setAuthError('비밀번호 4자리를 입력해주세요.');
            return;
        }

        try {
            const response = await fetch('/api/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyName: companyName.trim(), password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem(
                    'portfolio_auth',
                    JSON.stringify({
                        companyName: companyName.trim(),
                        password,
                        memberId: data.member.id,
                        isNewMember: data.isNewMember,
                    })
                );
                setIsAuthenticated(true);
                if (data.isNewMember) alert('환영합니다! 새로운 회원으로 등록되었습니다.');
            } else {
                setAuthError(data.error || '인증에 실패했습니다.');
            }
        } catch (error) {
            console.error('Auth error:', error);
            setAuthError('인증 처리 중 오류가 발생했습니다.');
        }
    };

    // 인증 초기화
    const handleClearAuth = () => {
        localStorage.removeItem('portfolio_auth');
        setCompanyName('');
        setPassword('');
        setIsAuthenticated(false);
        setAuthError('');
    };

    // 프록시 URL 생성 함수
    const getProxyUrl = (originalUrl: string) => {
        try {
            const url = new URL(originalUrl);
            // HTTPS 사이트는 직접 사용
            if (url.protocol === 'https:') {
                return originalUrl;
            }
            // HTTP 사이트는 프록시를 통해 사용
            return `/api/proxy?url=${encodeURIComponent(originalUrl)}`;
        } catch (error) {
            console.error('Invalid URL:', originalUrl);
            return originalUrl;
        }
    };

    // 미리보기 열기 함수
    const handlePreviewOpen = (domain: string, title: string) => {
        setProxyError('');
        const proxyUrl = getProxyUrl(domain);
        setPreviewUrl(proxyUrl);
        setPreviewTitle(title);
        setPreviewMode('desktop');
        setShowPreview(true);
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="bg-white border-b-2 border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-black">
                            <img src="/logo.png" alt="로고" className="h-8" />
                        </h1>
                        <div className="flex items-center gap-4">
                            {/* 상호명 표시 (비관리자 인증시) */}
                            {isAuthenticated && companyName && !user && (
                                <div className="flex items-center gap-2 mr-4">
                                    <span className="font-semibold text-black text-sm">상호명: {companyName}</span>
                                    <button onClick={handleClearAuth} className="text-xs text-gray-500 hover:text-gray-700 underline">
                                        로그아웃
                                    </button>
                                </div>
                            )}

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
                                    작성 내역 불러오기
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="text-center mb-18">
                    <h2 className="text-4xl text-black mb-4">당신의 감각에 맞는 디자인을 찾아보세요</h2>
                    <p className="text-xl text-gray-600">쉽고 간편하게 만들어보세요</p>
                </div>

                {/* 사용자 인증 섹션 */}
                {!isAuthenticated && !user && (
                    <div className="max-w-md mx-auto mb-12 bg-white border-2 border-black rounded-lg p-8 shadow-lg">
                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold text-black mb-2">제출자 정보 입력</h3>
                            <p className="text-gray-600">상호명과 4자리 비밀번호를 입력하세요</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    상호명 <span className="text-red-500">*</span>
                                </label>
                                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="상호명을 입력해주세요" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    비밀번호 4자리 <span className="text-red-500">*</span>
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
                )}

                {/* Category Filter */}
                {(isAuthenticated || user) && categories.length > 0 && (
                    <div className="mb-8">
                        <div className="flex justify-start gap-3 flex-wrap">
                            <button onClick={() => setSelectedCategory(null)} className={`px-6 py-1 text-base font-semibold transition-all ${selectedCategory === null ? 'bg-black text-white' : 'bg-white text-black border-b border-black hover:bg-black hover:text-white'}`}>
                                전체
                            </button>

                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`px-6 py-1 text-base font-semibold transition-all ${selectedCategory === category.id ? 'bg-black text-white' : 'bg-white text-black border-b border-black hover:bg-black hover:text-white'}`}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 포트폴리오 목록 */}
                {(isAuthenticated || user) &&
                    (loading ? (
                        <div className="text-center py-12">
                            <div className="text-xl text-gray-600">불러오는 중입니다</div>
                        </div>
                    ) : portfolios.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-xl text-gray-600">등록된 타입이 존재하지 않습니다.</div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {portfolios.map((portfolio) => (
                                <Link key={portfolio.id} href={`/portfolio/${portfolio.slug}`} className="border-black transition-all overflow-hidden group">
                                    {portfolio.thumbnail && (
                                        <div className="portfolio-list w-full h-48 bg-gray-200 overflow-hidden">
                                            <img src={portfolio.thumbnail} alt={portfolio.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                                        </div>
                                    )}

                                    <div className="p-2 pt-6">
                                        <h3 className="text-2xl font-bold mb-3 group-hover:text-gray-700">{portfolio.title}</h3>
                                        {portfolio.description && <p className="text-gray-600 mb-4">{portfolio.description}</p>}
                                    </div>

                                    {/* 버튼 영역 */}
                                    <div className="flex gap-3 px-2 pb-6">
                                        {/* 미리보기 버튼 - 팝업 모달 */}
                                        {portfolio.domain ? (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handlePreviewOpen(portfolio.domain!, portfolio.title);
                                                }}
                                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-all"
                                            >
                                                미리보기
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    alert('이 포트폴리오에는 도메인이 등록되어 있지 않습니다.');
                                                }}
                                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-all opacity-50 cursor-not-allowed"
                                                disabled
                                            >
                                                미리보기
                                            </button>
                                        )}

                                        {/* 정보입력 버튼 */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                router.push(`/portfolio/${portfolio.slug}`);
                                            }}
                                            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-all"
                                        >
                                            정보입력
                                        </button>
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

            {/* 미리보기 팝업 모달 */}
            {/* 미리보기 팝업 모달 */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowPreview(false)}>
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-8xl h-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`${previewTitle} 미리보기`}>
                        {/* 상단 바 */}
                        <div className="bg-gray-100 px-4 py-3 rounded-t-lg border-b flex items-center gap-4">
                            {/* 주소창 */}
                            <div className="flex-1 px-3 py-2 text-sm text-gray-700 overflow-hidden text-ellipsis whitespace-nowrap">{previewTitle}</div>

                            {/* 모드 토글 */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPreviewMode('desktop')}
                                    className={`px-3 py-2 rounded-md border text-sm transition-all ${previewMode === 'desktop' ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                                    title="데스크톱 미리보기"
                                >
                                    PC
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreviewMode('mobile')}
                                    className={`px-3 py-2 rounded-md border text-sm transition-all ${previewMode === 'mobile' ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                                    title="모바일 미리보기(500px)"
                                >
                                    모바일
                                </button>
                            </div>

                            {/* 닫기 */}
                            <button onClick={() => setShowPreview(false)} className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-lg transition-colors" title="닫기 (ESC)">
                                ×
                            </button>
                        </div>

                        {/* iframe 컨텐츠 */}
                        <div className="flex-1 bg-white rounded-b-lg overflow-auto flex items-start justify-center">
                            {proxyError ? (
                                <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-lg max-w-md">
                                    <h3 className="text-lg font-semibold text-red-800 mb-2">미리보기 로드 실패</h3>
                                    <p className="text-red-600 mb-4">{proxyError}</p>
                                    <button
                                        onClick={() => {
                                            setProxyError('');
                                            // 원본 URL로 새 창에서 열기
                                            const originalUrl = new URLSearchParams(previewUrl.split('?')[1] || '').get('url') || previewUrl;
                                            window.open(originalUrl, '_blank');
                                        }}
                                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all"
                                    >
                                        새 창에서 열기
                                    </button>
                                </div>
                            ) : (
                                <div
                                    className={`mt-4 mb-6 rounded-[12px] border border-gray-200 shadow-md overflow-hidden bg-white`}
                                    style={{
                                        width: previewMode === 'mobile' ? '500px' : '100%',
                                        maxWidth: previewMode === 'mobile' ? '500px' : '100%',
                                        height: 'calc(100% - 2rem)',
                                        transition: 'all 0.6s ease-in-out',
                                        transform: previewMode === 'mobile' ? 'scale(1)' : 'scale(1)',
                                    }}
                                >
                                    <iframe
                                        key={`${previewMode}-${previewUrl}`} // 모드 전환 시 레이아웃 재계산
                                        src={previewUrl}
                                        className={previewMode === 'mobile' ? 'w-[500px] h-full border-0' : 'w-full h-full border-0'}
                                        title={`${previewTitle} 미리보기`}
                                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                                        onError={() => setProxyError('사이트를 로드할 수 없습니다. 네트워크 연결을 확인해주세요.')}
                                        onLoad={(e) => {
                                            const iframe = e.target as HTMLIFrameElement;
                                            try {
                                                // iframe 로드 성공 확인
                                                if (iframe.contentWindow) {
                                                    setProxyError('');
                                                }
                                            } catch (error) {
                                                // Cross-origin 오류는 정상적인 경우
                                                setProxyError('');
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
