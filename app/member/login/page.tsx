'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MemberLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/member-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                router.push('/member/dashboard');
            } else {
                setError(data.error || '로그인에 실패했습니다.');
            }
        } catch (error) {
            setError('로그인 처리 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block mb-6 px-4 py-2 text-sm text-gray-600 hover:text-black transition-colors">
                        ← 메인으로
                    </Link>
                    <h1 className="text-4xl font-bold text-black mb-2">회원 로그인</h1>
                    <p className="text-gray-600">회원 계정으로 로그인하세요</p>
                </div>

                <div className="bg-white border-2 border-black rounded-lg p-8 shadow-lg">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg">
                            <p className="text-red-700 font-semibold">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-semibold text-black mb-2">
                                아이디
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder="아이디를 입력하세요"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-black mb-2">
                                비밀번호
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder="비밀번호를 입력하세요"
                                required
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading ? '로그인 중...' : '로그인'}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t-2 border-gray-200 text-center">
                        <p className="text-sm text-gray-600">
                            계정이 없으신가요?{' '}
                            <span className="text-black font-semibold">관리자에게 문의하세요</span>
                        </p>
                        <Link href="/admin/login" className="inline-block mt-4 text-sm text-gray-500 hover:text-black transition-colors">
                            관리자 로그인 →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

