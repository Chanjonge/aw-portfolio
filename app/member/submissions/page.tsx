'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Submission {
    id: string;
    portfolioId: string;
    createdAt: string;
    portfolio: {
        title: string;
        slug: string;
    };
}

export default function MemberSubmissionsPage() {
    const router = useRouter();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState('');

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
            setUsername(userData.username);
            fetchSubmissions();
        } catch (error) {
            router.push('/member/login');
        }
    };

    const fetchSubmissions = async () => {
        try {
            // 현재는 제출 내역 API가 없으므로 빈 배열로 시작
            // 추후 API 구현 시 연결
            setSubmissions([]);
        } catch (error) {
            console.error('Failed to fetch submissions:', error);
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
                                <Link href="/member/portfolios" className="text-gray-600 hover:text-black font-medium transition-colors">
                                    포트폴리오
                                </Link>
                                <Link href="/member/submissions" className="text-black font-bold border-b-2 border-black">
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
                    <h1 className="text-4xl font-bold text-black mb-2">내 제출 내역</h1>
                    <p className="text-gray-600">제출한 포트폴리오 신청서를 확인하세요</p>
                </div>

                {submissions.length === 0 ? (
                    <div className="bg-white border-2 border-gray-200 rounded-lg p-12 text-center">
                        <span className="text-6xl mb-4 block">📝</span>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">제출한 내역이 없습니다</h3>
                        <p className="text-gray-600 mb-6">포트폴리오 페이지에서 신청서를 작성해보세요</p>
                        <Link href="/member/portfolios" className="inline-block px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all">
                            포트폴리오 보기
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white border-2 border-black rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b-2 border-black">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-black">포트폴리오</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-black">제출일</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-black">상태</th>
                                        <th className="px-6 py-4 text-left text-sm font-bold text-black">작업</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {submissions.map((submission) => (
                                        <tr key={submission.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-black font-medium">
                                                {submission.portfolio.title}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(submission.createdAt).toLocaleDateString('ko-KR')}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                                    제출완료
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <button className="text-black font-semibold hover:underline">
                                                    상세보기
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

