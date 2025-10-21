'use client';

import { useState, useEffect } from 'react';

interface Member {
    id: string;
    username: string;
    companyName: string;
    isActive: boolean;
    createdAt: string;
    lastLogin: string | null;
}

interface MemberManagementProps {
    token: string;
}

export default function MemberManagement({ token }: MemberManagementProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [memberForm, setMemberForm] = useState({
        username: '',
        password: '',
        companyName: '',
    });

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/members', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setMembers(data);
            } else {
                alert('회원 목록을 가져오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('Fetch members error:', error);
            alert('회원 목록을 가져오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMember = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!memberForm.username || !memberForm.password || !memberForm.companyName) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        try {
            const response = await fetch('/api/members', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(memberForm),
            });

            const data = await response.json();

            if (response.ok) {
                alert('✅ 회원이 생성되었습니다!');
                setMemberForm({ username: '', password: '', companyName: '' });
                setShowForm(false);
                await fetchMembers();
            } else {
                alert(`❌ ${data.error || '회원 생성에 실패했습니다.'}`);
            }
        } catch (error) {
            console.error('Create member error:', error);
            alert('회원 생성 중 오류가 발생했습니다.');
        }
    };

    const handleToggleActive = async (memberId: string, currentStatus: boolean) => {
        if (!confirm(`회원을 ${currentStatus ? '비활성화' : '활성화'} 하시겠습니까?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/members/${memberId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ isActive: !currentStatus }),
            });

            if (response.ok) {
                alert('✅ 회원 상태가 변경되었습니다!');
                await fetchMembers();
            } else {
                alert('❌ 상태 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('Toggle active error:', error);
            alert('상태 변경 중 오류가 발생했습니다.');
        }
    };

    const handleDeleteMember = async (memberId: string, username: string) => {
        if (!confirm(`"${username}" 회원을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/members/${memberId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                alert('✅ 회원이 삭제되었습니다!');
                await fetchMembers();
            } else {
                alert('❌ 회원 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Delete member error:', error);
            alert('회원 삭제 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-black">회원 관리</h2>
                    <p className="text-gray-600 mt-2">일반 회원 계정을 생성하고 관리합니다</p>
                </div>
                <button
                    onClick={() => {
                        setShowForm(true);
                        setMemberForm({ username: '', password: '', companyName: '' });
                    }}
                    className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all"
                >
                    + 회원 추가
                </button>
            </div>

            {/* Member Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
                    <div className="bg-white rounded-lg p-8 max-w-md w-full border-2 border-black" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-black mb-6">새 회원 추가</h3>
                        <form onSubmit={handleCreateMember} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-black mb-2">아이디 (3자 이상)</label>
                                <input
                                    type="text"
                                    required
                                    value={memberForm.username}
                                    onChange={(e) => setMemberForm({ ...memberForm, username: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="회원 아이디"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-black mb-2">비밀번호 (4자 이상)</label>
                                <input
                                    type="password"
                                    required
                                    value={memberForm.password}
                                    onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="회원 비밀번호"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-black mb-2">상호명</label>
                                <input
                                    type="text"
                                    required
                                    value={memberForm.companyName}
                                    onChange={(e) => setMemberForm({ ...memberForm, companyName: e.target.value })}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="회사 또는 상호명"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-100 transition-all"
                                >
                                    취소
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all">
                                    생성
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Members List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-gray-600">로딩 중...</p>
                </div>
            ) : members.length === 0 ? (
                <div className="text-center py-12 bg-white border-2 border-gray-300 rounded-lg">
                    <p className="text-gray-600 text-lg">등록된 회원이 없습니다.</p>
                    <p className="text-gray-500 mt-2">새 회원을 추가해보세요!</p>
                </div>
            ) : (
                <div className="bg-white border-2 border-black rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-black text-white">
                            <tr>
                                <th className="px-6 py-4 text-left">아이디</th>
                                <th className="px-6 py-4 text-left">상호명</th>
                                <th className="px-6 py-4 text-center">상태</th>
                                <th className="px-6 py-4 text-center">마지막 로그인</th>
                                <th className="px-6 py-4 text-center">생성일</th>
                                <th className="px-6 py-4 text-center">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-gray-200">
                            {members.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-semibold">{member.username}</td>
                                    <td className="px-6 py-4">{member.companyName}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {member.isActive ? '활성' : '비활성'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                                        {member.lastLogin ? new Date(member.lastLogin).toLocaleString('ko-KR') : '로그인 기록 없음'}
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm text-gray-600">{new Date(member.createdAt).toLocaleDateString('ko-KR')}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => handleToggleActive(member.id, member.isActive)}
                                                className={`px-3 py-1 text-sm rounded font-semibold transition-colors ${
                                                    member.isActive ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                }`}
                                            >
                                                {member.isActive ? '비활성화' : '활성화'}
                                            </button>
                                            <button onClick={() => handleDeleteMember(member.id, member.username)} className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded font-semibold hover:bg-red-200 transition-colors">
                                                삭제
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Info Box */}
            <div className="p-6 bg-blue-50 border-2 border-blue-500 rounded-lg">
                <h4 className="font-bold text-blue-900 mb-2">💡 회원 관리 안내</h4>
                <ul className="text-blue-800 text-sm space-y-1 list-disc list-inside">
                    <li>회원은 /member/login 페이지에서 로그인할 수 있습니다</li>
                    <li>비활성화된 회원은 로그인할 수 없습니다</li>
                    <li>회원 계정: 아이디 + 비밀번호 + 상호명으로 구성됩니다</li>
                </ul>
            </div>
        </div>
    );
}

