'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Member {
    id: string;
    companyName: string;
    password: string; // 평문 비밀번호 (식별번호)
    lastLoginAt: string | null; // null일 수 있음
    createdAt: string;
    updatedAt: string;
    ipAddress?: string;
    loginCount: number;
}

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}

export default function MembersPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);

    useEffect(() => {
        // Check authentication
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!userStr || !token) {
            router.push('/admin/login');
            return;
        }

        try {
            const userData = JSON.parse(userStr);
            if (userData.role !== 'SUPER_ADMIN') {
                alert('최고 관리자만 접근할 수 있습니다.');
                router.push('/admin/dashboard');
                return;
            }
            setUser(userData);
            fetchMembers();
        } catch (error) {
            console.error('Failed to parse user data:', error);
            router.push('/admin/login');
        }
    }, [router]);

    const fetchMembers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/members', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                setMembers(data.members);
            } else {
                alert(data.error || '회원 목록을 가져오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('Failed to fetch members:', error);
            alert('회원 목록을 가져오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMember = async (memberId: string) => {
        if (!confirm('정말로 이 회원을 삭제하시겠습니까?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/members/${memberId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                alert('회원이 삭제되었습니다.');
                fetchMembers(); // 목록 새로고침
            } else {
                alert(data.error || '회원 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Failed to delete member:', error);
            alert('회원 삭제 중 오류가 발생했습니다.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/admin/login');
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('ko-KR');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-xl text-gray-600">로딩 중...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Link href="/admin/super" className="text-2xl font-bold text-black hover:text-gray-700">
                                관리자 페이지
                            </Link>
                            <span className="text-gray-400">|</span>
                            <h1 className="text-xl font-semibold text-gray-800">회원 관리</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-600">{user?.name}님 (최고 관리자)</span>
                            <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                로그아웃
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">회원 목록</h2>
                    <p className="text-gray-600">상호명으로 가입한 모든 회원들을 관리할 수 있습니다.</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">총 회원 수</p>
                                <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 rounded-lg">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">오늘 가입</p>
                                <p className="text-2xl font-bold text-gray-900">{members.filter((m) => new Date(m.createdAt).toDateString() === new Date().toDateString()).length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 rounded-lg">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">총 로그인 횟수</p>
                                <p className="text-2xl font-bold text-gray-900">{members.reduce((sum, m) => sum + m.loginCount, 0)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Members Table */}
                <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">회원 목록</h3>
                    </div>

                    {members.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <p className="text-gray-500">등록된 회원이 없습니다.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상호명</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">비밀번호</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가입일</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">마지막 로그인</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">로그인 횟수</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP 주소</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {members.map((member) => (
                                        <tr key={member.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{member.companyName}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{member.password}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(member.createdAt)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(member.lastLoginAt)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{member.loginCount}회</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.ipAddress || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button onClick={() => setSelectedMember(member)} className="text-blue-600 hover:text-blue-900 mr-4">
                                                    상세보기
                                                </button>
                                                <button onClick={() => handleDeleteMember(member.id)} className="text-red-600 hover:text-red-900">
                                                    삭제
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Member Detail Modal */}
            {selectedMember && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">회원 상세 정보</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">상호명</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedMember.companyName}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">가입일</label>
                                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedMember.createdAt)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">마지막 로그인</label>
                                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedMember.lastLoginAt)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">로그인 횟수</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedMember.loginCount}회</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">IP 주소</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedMember.ipAddress || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">비밀번호</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedMember.password}</p>
                                </div>
                            </div>
                            <div className="flex justify-end mt-6">
                                <button onClick={() => setSelectedMember(null)} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors">
                                    닫기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
