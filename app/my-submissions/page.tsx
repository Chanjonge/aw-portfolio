'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Submission {
    id: string;
    portfolioId: string;
    companyName: string;
    isDraft: boolean;
    completedAt: string;
    updatedAt: string;
    responses: any;
    portfolio: {
        title: string;
        slug: string;
    };
}

export default function MySubmissionsPage() {
    const router = useRouter();
    const [companyName, setCompanyName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        setError('');

        if (!companyName.trim()) {
            setError('상호명을 입력해주세요.');
            return;
        }

        if (password.length !== 4 || !/^\d{4}$/.test(password)) {
            setError('4자리 숫자 비밀번호를 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/submissions/my-list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyName, password }),
            });

            if (response.ok) {
                const data = await response.json();
                setSubmissions(data.submissions || []);
                setSearched(true);

                if (data.submissions.length === 0) {
                    setError('제출 내역이 없습니다.');
                }
            } else {
                const data = await response.json();
                setError(data.error || '조회 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('Search error:', error);
            setError('조회 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = (submission: Submission) => {
        router.push(`/portfolio/${submission.portfolio.slug}`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b-2 border-black">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="text-2xl font-bold text-black hover:text-gray-700">
                            포트폴리오 시스템
                        </Link>
                        <Link href="/" className="px-4 py-2 border-2 border-black rounded-lg font-semibold hover:bg-black hover:text-white transition-all">
                            홈으로
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold text-black mb-2">내 제출 내역 조회</h1>
                    <p className="text-gray-600">제출 시 입력한 상호명과 비밀번호로 조회하세요</p>
                </div>

                {/* Search Form */}
                <div className="bg-white border-2 border-black rounded-lg p-8 shadow-lg mb-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                상호명 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="제출 시 입력한 상호명"
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all"
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
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
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <p className="text-sm text-gray-500 mt-1">제출 시 입력한 4자리 숫자</p>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border-2 border-red-500 rounded-lg">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <button onClick={handleSearch} disabled={loading} className="w-full px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {loading ? '조회 중...' : '제출 내역 조회'}
                        </button>
                    </div>
                </div>

                {/* Submissions List */}
                {searched && submissions.length > 0 && (
                    <div className="bg-white border-2 border-black rounded-lg overflow-hidden shadow-lg">
                        <div className="p-6 bg-gray-50 border-b-2 border-black">
                            <h2 className="text-xl font-bold text-black">
                                {companyName}님의 제출 내역 ({submissions.length}건)
                            </h2>
                        </div>

                        <div className="divide-y-2 divide-gray-200">
                            {submissions.map((submission) => (
                                <div key={submission.id} className="p-6 hover:bg-gray-50 transition-all">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-black">{submission.portfolio.title}</h3>
                                                {submission.isDraft ? <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">임시저장</span> : <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">제출완료</span>}
                                            </div>

                                            <div className="space-y-1 text-sm text-gray-600">
                                                <p>
                                                    {submission.isDraft ? '저장일' : '제출일'}:{' '}
                                                    {new Date(submission.isDraft ? submission.updatedAt : submission.completedAt).toLocaleDateString('ko-KR', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                                {submission.isDraft && submission.updatedAt !== submission.completedAt && (
                                                    <p className="text-yellow-600">
                                                        💡 마지막 수정:{' '}
                                                        {new Date(submission.updatedAt).toLocaleDateString('ko-KR', {
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button onClick={() => handleContinue(submission)} className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all">
                                                {submission.isDraft ? '이어서 작성' : '수정하기'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Info Box */}
                <div className="mt-8 p-6 border-2 rounded-lg">
                    <h4 className="font-bold mb-2">💡 안내</h4>
                    <ul className="text-sm space-y-1">
                        <li>• 포트폴리오 제출 시 입력한 상호명과 비밀번호를 입력하세요</li>
                        <li>• 임시저장된 제출물은 "이어서 작성"으로 계속 작성할 수 있습니다</li>
                        <li>• 제출 완료된 내용도 언제든지 수정할 수 있습니다</li>
                        <li>• 비밀번호를 분실한 경우 관리자에게 문의해주세요</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
