'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
    id: string;
    username: string;
    companyName: string;
    role: string;
}

export default function MemberDashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = () => {
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
            setUser(userData);
        } catch (error) {
            router.push('/member/login');
        } finally {
            setLoading(false);
        }
    };

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

    if (!user) {
        return null;
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
                                <Link href="/member/dashboard" className="text-black font-bold border-b-2 border-black">
                                    대시보드
                                </Link>
                                <Link href="/member/portfolios" className="text-gray-600 hover:text-black font-medium transition-colors">
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
                {/* Welcome Section */}
                <div className="bg-white border-2 border-black rounded-lg p-8 mb-8 shadow-lg">
                    <h2 className="text-3xl font-bold text-black mb-4">환영합니다, {user.companyName}님!</h2>
                    <p className="text-gray-600 mb-2">아이디: {user.username}</p>
                    <p className="text-gray-600">회원 전용 페이지입니다.</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white border-2 border-black rounded-lg p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-black">내 정보</h3>
                            <span className="text-3xl">👤</span>
                        </div>
                        <p className="text-gray-600 text-sm">회원 계정으로 로그인됨</p>
                    </div>

                    <div className="bg-white border-2 border-black rounded-lg p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-black">상호명</h3>
                            <span className="text-3xl">🏢</span>
                        </div>
                        <p className="text-gray-600 text-sm">{user.companyName}</p>
                    </div>

                    <div className="bg-white border-2 border-black rounded-lg p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-black">상태</h3>
                            <span className="text-3xl">✅</span>
                        </div>
                        <p className="text-gray-600 text-sm">활성화됨</p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white border-2 border-black rounded-lg p-8 shadow-lg">
                    <h3 className="text-2xl font-bold text-black mb-6">회원 전용 기능</h3>
                    
                    <div className="space-y-4">
                        <Link href="/member/portfolios" className="block p-6 border-2 border-gray-200 rounded-lg hover:border-black hover:shadow-lg transition-all cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-lg font-semibold text-black mb-2">포트폴리오 보기</h4>
                                    <p className="text-gray-600 text-sm">등록된 포트폴리오를 확인하고 신청하세요</p>
                                </div>
                                <span className="text-2xl">📁</span>
                            </div>
                        </Link>

                        <Link href="/member/submissions" className="block p-6 border-2 border-gray-200 rounded-lg hover:border-black hover:shadow-lg transition-all cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-lg font-semibold text-black mb-2">내 제출 내역</h4>
                                    <p className="text-gray-600 text-sm">제출한 양식을 확인하세요</p>
                                </div>
                                <span className="text-2xl">📝</span>
                            </div>
                        </Link>

                        <Link href="/member/mypage" className="block p-6 border-2 border-gray-200 rounded-lg hover:border-black hover:shadow-lg transition-all cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-lg font-semibold text-black mb-2">마이페이지</h4>
                                    <p className="text-gray-600 text-sm">내 정보를 확인하고 수정하세요</p>
                                </div>
                                <span className="text-2xl">👤</span>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-500 rounded-lg">
                    <h4 className="font-bold text-blue-900 mb-2">💡 안내</h4>
                    <p className="text-blue-800 text-sm">
                        회원 전용 페이지입니다. 추가 기능이 필요하시면 관리자에게 문의해주세요.
                    </p>
                </div>
            </div>
        </div>
    );
}

