'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // 컴포넌트 마운트 시 입력 필드 확인
    useEffect(() => {
        // 입력 필드가 제대로 렌더링되었는지 확인
        const emailInput = document.getElementById('email') as HTMLInputElement;
        const passwordInput = document.getElementById('password') as HTMLInputElement;

        if (!emailInput || !passwordInput) {
            console.error('Input fields not found');
        }
    }, []);

    // 안전한 이벤트 핸들러
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    // 폴백 이벤트 핸들러 (키보드 입력)
    const handleEmailKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const target = e.target as HTMLInputElement;
        if (target.value !== email) {
            setEmail(target.value);
        }
    };

    const handlePasswordKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const target = e.target as HTMLInputElement;
        if (target.value !== password) {
            setPassword(target.value);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        console.log('로그인 시도:', { email, password: '***' });

        try {
            console.log('API 호출 시작...');
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            console.log('응답 상태:', response.status);
            console.log('응답 헤더:', response.headers);

            if (!response.ok) {
                console.log('HTTP 오류:', response.status, response.statusText);
            }

            const data = await response.json();
            console.log('응답 데이터:', data);

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                console.log('로그인 성공, 리다이렉트:', data.user.role);

                // 강제로 페이지 새로고침을 통한 리다이렉트
                if (data.user.role === 'SUPER_ADMIN') {
                    console.log('SUPER_ADMIN으로 리다이렉트');
                    window.location.href = '/admin/super';
                } else {
                    console.log('일반 관리자로 리다이렉트');
                    window.location.href = '/admin/dashboard';
                }
            } else {
                console.log('로그인 실패:', data.error);
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
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={email}
                                onChange={handleEmailChange}
                                onKeyUp={handleEmailKeyUp}
                                onInput={handleEmailChange}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all bg-white text-black"
                                placeholder="admin@example.com"
                                autoComplete="email"
                                disabled={loading}
                                style={{ backgroundColor: 'white', color: 'black' }}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-black mb-2">
                                비밀번호
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={handlePasswordChange}
                                onKeyUp={handlePasswordKeyUp}
                                onInput={handlePasswordChange}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all bg-white text-black"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                disabled={loading}
                                style={{ backgroundColor: 'white', color: 'black' }}
                            />
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
