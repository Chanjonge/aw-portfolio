'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                if (data.user.role === 'SUPER_ADMIN') {
                    router.push('/admin/super');
                } else {
                    router.push('/admin/dashboard');
                }
            } else {
                setError(data.error || '로그인에 실패했습니다.');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('로그인 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="bg-white border-2 border-black rounded-lg p-8 shadow-lg">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-black">관리자 로그인</h2>
                        <p className="mt-2 text-gray-600">관리자 계정으로 로그인하세요</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && <div className="bg-red-50 border-2 border-red-500 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-black mb-2">
                                이메일
                            </label>
                            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all" placeholder="admin@example.com" />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-black mb-2">
                                비밀번호
                            </label>
                            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all" placeholder="••••••••" />
                        </div>

                        <button type="submit" disabled={loading} className="w-full px-4 py-3 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {loading ? '로그인 중...' : '로그인'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <a href="/" className="text-sm text-gray-600 hover:text-black">
                            홈으로 돌아가기
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
