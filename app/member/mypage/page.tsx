'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
    id: string;
    username: string;
    companyName: string;
    role: string;
    createdAt?: string;
    lastLogin?: string;
}

export default function MemberMyPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

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
            setFormData({ ...formData, companyName: userData.companyName });
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

    const handleUpdate = async () => {
        if (!user) return;

        // 비밀번호 변경 시 검증
        if (formData.newPassword) {
            if (formData.newPassword.length < 4) {
                alert('새 비밀번호는 4자 이상이어야 합니다.');
                return;
            }
            if (formData.newPassword !== formData.confirmPassword) {
                alert('비밀번호가 일치하지 않습니다.');
                return;
            }
        }

        try {
            const token = localStorage.getItem('token');
            const updateData: any = { companyName: formData.companyName };
            
            if (formData.newPassword) {
                updateData.password = formData.newPassword;
            }

            const response = await fetch(`/api/members/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updateData),
            });

            if (response.ok) {
                const updatedUser = await response.json();
                
                // localStorage 업데이트
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const userData = JSON.parse(userStr);
                    userData.companyName = updatedUser.companyName;
                    localStorage.setItem('user', JSON.stringify(userData));
                    setUser(userData);
                }

                alert('정보가 업데이트되었습니다.');
                setIsEditing(false);
                setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                const error = await response.json();
                alert(error.error || '업데이트에 실패했습니다.');
            }
        } catch (error) {
            console.error('Update error:', error);
            alert('업데이트에 실패했습니다.');
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
                                <Link href="/member/dashboard" className="text-gray-600 hover:text-black font-medium transition-colors">
                                    대시보드
                                </Link>
                                <Link href="/member/portfolios" className="text-gray-600 hover:text-black font-medium transition-colors">
                                    포트폴리오
                                </Link>
                                <Link href="/member/submissions" className="text-gray-600 hover:text-black font-medium transition-colors">
                                    내 제출내역
                                </Link>
                                <Link href="/member/mypage" className="text-black font-bold border-b-2 border-black">
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
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-black mb-2">마이페이지</h1>
                    <p className="text-gray-600">내 정보를 확인하고 수정하세요</p>
                </div>

                <div className="bg-white border-2 border-black rounded-lg overflow-hidden shadow-lg">
                    {/* Profile Header */}
                    <div className="bg-gradient-to-r from-gray-800 to-black text-white p-8">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl">
                                👤
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold mb-2">{user.companyName}</h2>
                                <p className="text-gray-300">@{user.username}</p>
                            </div>
                        </div>
                    </div>

                    {/* Profile Info */}
                    <div className="p-8">
                        <div className="mb-6 flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-black">회원 정보</h3>
                            {!isEditing && (
                                <button onClick={() => setIsEditing(true)} className="px-4 py-2 border-2 border-black rounded-lg font-semibold hover:bg-black hover:text-white transition-all">
                                    정보 수정
                                </button>
                            )}
                        </div>

                        <div className="space-y-6">
                            {/* 아이디 (읽기전용) */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">아이디</label>
                                <input type="text" value={user.username} disabled className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed" />
                                <p className="text-sm text-gray-500 mt-1">아이디는 변경할 수 없습니다</p>
                            </div>

                            {/* 상호명 */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">상호명</label>
                                <input type="text" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} disabled={!isEditing} className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-black transition-all ${isEditing ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50 cursor-not-allowed'}`} />
                            </div>

                            {isEditing && (
                                <>
                                    <div className="border-t-2 border-gray-200 pt-6">
                                        <h4 className="text-lg font-bold text-black mb-4">비밀번호 변경 (선택사항)</h4>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">새 비밀번호</label>
                                                <input type="password" value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} placeholder="새 비밀번호 (4자 이상)" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black transition-all" />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">새 비밀번호 확인</label>
                                                <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder="새 비밀번호 확인" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black transition-all" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button onClick={handleUpdate} className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all">
                                            저장
                                        </button>
                                        <button onClick={() => {
                                            setIsEditing(false);
                                            setFormData({ companyName: user.companyName, currentPassword: '', newPassword: '', confirmPassword: '' });
                                        }} className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:border-black transition-all">
                                            취소
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 p-6 bg-blue-50 border-2 border-blue-500 rounded-lg">
                    <h4 className="font-bold text-blue-900 mb-2">💡 안내</h4>
                    <ul className="text-blue-800 text-sm space-y-1">
                        <li>• 상호명은 언제든지 수정할 수 있습니다.</li>
                        <li>• 비밀번호 변경 시에는 4자 이상 입력해주세요.</li>
                        <li>• 아이디 변경이 필요하시면 관리자에게 문의해주세요.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

