'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: string;
}

interface Portfolio {
    id: string;
    title: string;
    description: string;
    slug: string;
    thumbnail?: string;
    isActive: boolean;
    order: number;
    _count?: {
        questions: number;
        submissions: number;
    };
}

interface Question {
    id: string;
    portfolioId: string;
    step: number;
    title: string;
    description?: string;
    thumbnail?: string;
    minLength: number;
    order: number;
    isRequired: boolean;
}

type TabType = 'users' | 'portfolios' | 'questions';

export default function SuperAdminPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedPortfolio, setSelectedPortfolio] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('portfolios');

    // User creation form
    const [showUserForm, setShowUserForm] = useState(false);
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        name: '',
        role: 'ADMIN',
    });

    // Portfolio form
    const [showPortfolioForm, setShowPortfolioForm] = useState(false);
    const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
    const [portfolioForm, setPortfolioForm] = useState({
        title: '',
        description: '',
        slug: '',
        thumbnail: '',
        isActive: true,
        order: 0,
    });

    // Question form
    const [showQuestionForm, setShowQuestionForm] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [questionForm, setQuestionForm] = useState({
        portfolioId: '',
        step: 1,
        title: '',
        description: '',
        thumbnail: '',
        minLength: 10,
        order: 0,
        isRequired: true,
    });

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (selectedPortfolio) {
            fetchQuestionsByPortfolio(selectedPortfolio);
        }
    }, [selectedPortfolio]);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            router.push('/admin/login');
            return;
        }

        const userData = JSON.parse(userStr);

        if (userData.role !== 'SUPER_ADMIN') {
            router.push('/admin/dashboard');
            return;
        }

        setCurrentUser(userData);
        await Promise.all([fetchUsers(token), fetchPortfolios()]);
        setLoading(false);
    };

    const fetchUsers = async (token: string) => {
        try {
            const response = await fetch('/api/users/list', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (response.ok) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const fetchPortfolios = async () => {
        try {
            const response = await fetch('/api/portfolios');
            const data = await response.json();
            if (response.ok) {
                setPortfolios(data.portfolios);
                if (data.portfolios.length > 0 && !selectedPortfolio) {
                    setSelectedPortfolio(data.portfolios[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch portfolios:', error);
        }
    };

    const fetchQuestionsByPortfolio = async (portfolioId: string) => {
        try {
            const response = await fetch(`/api/questions?portfolioId=${portfolioId}`);
            const data = await response.json();
            if (response.ok) {
                setQuestions(data.questions);
            }
        } catch (error) {
            console.error('Failed to fetch questions:', error);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('/api/users/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(newUser),
            });

            if (response.ok) {
                alert('사용자가 생성되었습니다.');
                setShowUserForm(false);
                setNewUser({ email: '', password: '', name: '', role: 'ADMIN' });
                await fetchUsers(token!);
            } else {
                const data = await response.json();
                alert(data.error || '사용자 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('Create user error:', error);
            alert('사용자 생성 중 오류가 발생했습니다.');
        }
    };

    const handleCreateOrUpdatePortfolio = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const url = '/api/portfolios';
            const method = editingPortfolio ? 'PUT' : 'POST';
            const body = editingPortfolio ? { ...portfolioForm, id: editingPortfolio.id } : portfolioForm;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                alert(editingPortfolio ? '포트폴리오가 수정되었습니다.' : '포트폴리오가 생성되었습니다.');
                setShowPortfolioForm(false);
                setEditingPortfolio(null);
                setPortfolioForm({
                    title: '',
                    description: '',
                    slug: '',
                    thumbnail: '',
                    isActive: true,
                    order: 0,
                });
                await fetchPortfolios();
            } else {
                const data = await response.json();
                alert(data.error || '포트폴리오 저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('Save portfolio error:', error);
            alert('포트폴리오 저장 중 오류가 발생했습니다.');
        }
    };

    const handleDeletePortfolio = async (portfolioId: string) => {
        if (!confirm('정말 이 포트폴리오를 삭제하시겠습니까? 관련된 모든 질문과 제출 내역도 함께 삭제됩니다.')) return;

        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`/api/portfolios?id=${portfolioId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                alert('포트폴리오가 삭제되었습니다.');
                await fetchPortfolios();
            } else {
                const data = await response.json();
                alert(data.error || '포트폴리오 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Delete portfolio error:', error);
            alert('포트폴리오 삭제 중 오류가 발생했습니다.');
        }
    };

    const handleEditPortfolio = (portfolio: Portfolio) => {
        setEditingPortfolio(portfolio);
        setPortfolioForm({
            title: portfolio.title,
            description: portfolio.description,
            slug: portfolio.slug,
            thumbnail: portfolio.thumbnail || '',
            isActive: portfolio.isActive,
            order: portfolio.order,
        });
        setShowPortfolioForm(true);
    };

    const handleCreateOrUpdateQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const url = '/api/questions';
            const method = editingQuestion ? 'PUT' : 'POST';
            const body = editingQuestion ? { ...questionForm, id: editingQuestion.id } : questionForm;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                alert(editingQuestion ? '질문이 수정되었습니다.' : '질문이 생성되었습니다.');
                setShowQuestionForm(false);
                setEditingQuestion(null);
                setQuestionForm({
                    portfolioId: selectedPortfolio,
                    step: 1,
                    title: '',
                    description: '',
                    thumbnail: '',
                    minLength: 10,
                    order: 0,
                    isRequired: true,
                });
                await fetchQuestionsByPortfolio(selectedPortfolio);
            } else {
                const data = await response.json();
                alert(data.error || '질문 저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('Save question error:', error);
            alert('질문 저장 중 오류가 발생했습니다.');
        }
    };

    const handleDeleteQuestion = async (questionId: string) => {
        if (!confirm('정말 이 질문을 삭제하시겠습니까?')) return;

        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`/api/questions?id=${questionId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                alert('질문이 삭제되었습니다.');
                await fetchQuestionsByPortfolio(selectedPortfolio);
            } else {
                const data = await response.json();
                alert(data.error || '질문 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Delete question error:', error);
            alert('질문 삭제 중 오류가 발생했습니다.');
        }
    };

    const handleEditQuestion = (question: Question) => {
        setEditingQuestion(question);
        setQuestionForm({
            portfolioId: question.portfolioId,
            step: question.step,
            title: question.title,
            description: question.description || '',
            thumbnail: question.thumbnail || '',
            minLength: question.minLength,
            order: question.order,
            isRequired: question.isRequired,
        });
        setShowQuestionForm(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/admin/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">로딩 중...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-black text-white border-b-2 border-black">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold">최고 관리자 페이지</h1>
                        <div className="flex items-center gap-4">
                            <span className="text-gray-300">{currentUser?.name}</span>
                            <button onClick={() => router.push('/')} className="px-4 py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-all">
                                메인 페이지
                            </button>
                            <button onClick={() => router.push('/admin/dashboard')} className="px-4 py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-all">
                                일반 대시보드
                            </button>
                            <button onClick={handleLogout} className="px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all">
                                로그아웃
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white border-b-2 border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-8">
                        <button onClick={() => setActiveTab('portfolios')} className={`py-4 px-2 font-semibold border-b-4 transition-all ${activeTab === 'portfolios' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'}`}>
                            포트폴리오 관리
                        </button>
                        <button onClick={() => setActiveTab('questions')} className={`py-4 px-2 font-semibold border-b-4 transition-all ${activeTab === 'questions' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'}`}>
                            질문 관리
                        </button>
                        <button onClick={() => setActiveTab('users')} className={`py-4 px-2 font-semibold border-b-4 transition-all ${activeTab === 'users' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'}`}>
                            사용자 관리
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Portfolios Tab */}
                {activeTab === 'portfolios' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-black">포트폴리오 목록</h2>
                            <button
                                onClick={() => {
                                    setEditingPortfolio(null);
                                    setPortfolioForm({
                                        title: '',
                                        description: '',
                                        slug: '',
                                        thumbnail: '',
                                        isActive: true,
                                        order: portfolios.length,
                                    });
                                    setShowPortfolioForm(true);
                                }}
                                className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all"
                            >
                                + 새 포트폴리오 추가
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {portfolios.map((portfolio) => (
                                <div key={portfolio.id} className="bg-white border-2 border-black rounded-lg overflow-hidden">
                                    {portfolio.thumbnail && (
                                        <div className="w-full h-40 bg-gray-200">
                                            <img src={portfolio.thumbnail} alt={portfolio.title} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-black">{portfolio.title}</h3>
                                                {!portfolio.isActive && <span className="text-xs bg-gray-200 px-2 py-1 rounded ml-2">비활성</span>}
                                            </div>
                                        </div>
                                        {portfolio.description && <p className="text-gray-600 mb-4">{portfolio.description}</p>}
                                        <div className="text-sm text-gray-500 mb-4">
                                            <div>슬러그: {portfolio.slug}</div>
                                            <div>순서: {portfolio.order}</div>
                                            {portfolio._count && (
                                                <>
                                                    <div>질문: {portfolio._count.questions}개</div>
                                                    <div>제출: {portfolio._count.submissions}개</div>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditPortfolio(portfolio)} className="flex-1 px-3 py-2 text-sm border-2 border-black rounded hover:bg-black hover:text-white transition-all">
                                                수정
                                            </button>
                                            <button onClick={() => handleDeletePortfolio(portfolio.id)} className="flex-1 px-3 py-2 text-sm border-2 border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition-all">
                                                삭제
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Questions Tab */}
                {activeTab === 'questions' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-bold text-black">질문 목록</h2>
                                <select value={selectedPortfolio} onChange={(e) => setSelectedPortfolio(e.target.value)} className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black">
                                    {portfolios.map((portfolio) => (
                                        <option key={portfolio.id} value={portfolio.id}>
                                            {portfolio.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={() => {
                                    setEditingQuestion(null);
                                    setQuestionForm({
                                        portfolioId: selectedPortfolio,
                                        step: Math.max(...questions.map((q) => q.step), 0) + 1,
                                        title: '',
                                        description: '',
                                        thumbnail: '',
                                        minLength: 10,
                                        order: 0,
                                        isRequired: true,
                                    });
                                    setShowQuestionForm(true);
                                }}
                                className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all"
                                disabled={!selectedPortfolio}
                            >
                                + 새 질문 추가
                            </button>
                        </div>

                        {questions.length === 0 ? (
                            <div className="text-center py-12 bg-white border-2 border-black rounded-lg">
                                <p className="text-gray-600">이 포트폴리오에는 아직 질문이 없습니다.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {Array.from(new Set(questions.map((q) => q.step)))
                                    .sort()
                                    .map((step) => (
                                        <div key={step} className="bg-white border-2 border-black rounded-lg p-6">
                                            <h3 className="text-xl font-bold text-black mb-4">단계 {step}</h3>
                                            <div className="space-y-3">
                                                {questions
                                                    .filter((q) => q.step === step)
                                                    .sort((a, b) => a.order - b.order)
                                                    .map((question) => (
                                                        <div key={question.id} className="border-2 border-gray-300 rounded-lg p-4 hover:border-black transition-all">
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex-1">
                                                                    <div className="font-semibold text-black">
                                                                        {question.title}
                                                                        {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                                                                    </div>
                                                                    {question.description && <div className="text-sm text-gray-600 mt-1">{question.description}</div>}
                                                                    <div className="text-xs text-gray-500 mt-2">
                                                                        최소 {question.minLength}자 | 순서: {question.order}
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => handleEditQuestion(question)} className="px-3 py-1 text-sm border-2 border-black rounded hover:bg-black hover:text-white transition-all">
                                                                        수정
                                                                    </button>
                                                                    <button onClick={() => handleDeleteQuestion(question.id)} className="px-3 py-1 text-sm border-2 border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition-all">
                                                                        삭제
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-black">사용자 목록</h2>
                            <button onClick={() => setShowUserForm(true)} className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all">
                                + 새 사용자 생성
                            </button>
                        </div>

                        <div className="bg-white border-2 border-black rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y-2 divide-gray-200">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">이름</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">이메일</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">역할</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wider">생성일</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-black">{user.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'SUPER_ADMIN' ? 'bg-black text-white' : 'bg-gray-200 text-gray-800'}`}>{user.role === 'SUPER_ADMIN' ? '최고 관리자' : '관리자'}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(user.createdAt).toLocaleDateString('ko-KR')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Portfolio Form Modal */}
            {showPortfolioForm && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    onClick={() => {
                        setShowPortfolioForm(false);
                        setEditingPortfolio(null);
                    }}
                >
                    <div className="bg-white rounded-lg p-8 max-w-2xl w-full border-2 border-black" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-black mb-6">{editingPortfolio ? '포트폴리오 수정' : '새 포트폴리오 추가'}</h3>
                        <form onSubmit={handleCreateOrUpdatePortfolio} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-black mb-2">제목</label>
                                <input type="text" required value={portfolioForm.title} onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-black mb-2">설명</label>
                                <textarea value={portfolioForm.description} onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })} rows={3} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-black mb-2">슬러그 (URL 경로)</label>
                                <input
                                    type="text"
                                    required
                                    value={portfolioForm.slug}
                                    onChange={(e) => setPortfolioForm({ ...portfolioForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="예: web-development"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-black mb-2">썸네일 이미지 (선택사항)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const formData = new FormData();
                                            formData.append('file', file);
                                            const token = localStorage.getItem('token');
                                            try {
                                                const response = await fetch('/api/upload', {
                                                    method: 'POST',
                                                    headers: {
                                                        Authorization: `Bearer ${token}`,
                                                    },
                                                    body: formData,
                                                });
                                                if (response.ok) {
                                                    const data = await response.json();
                                                    setPortfolioForm({ ...portfolioForm, thumbnail: data.url });
                                                } else {
                                                    alert('이미지 업로드에 실패했습니다.');
                                                }
                                            } catch (error) {
                                                console.error('Upload error:', error);
                                                alert('이미지 업로드 중 오류가 발생했습니다.');
                                            }
                                        }
                                    }}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-black file:text-white file:cursor-pointer hover:file:bg-gray-800"
                                />
                                {portfolioForm.thumbnail && (
                                    <div className="mt-2 w-full h-32 bg-gray-200 rounded-lg overflow-hidden relative">
                                        <img src={portfolioForm.thumbnail} alt="미리보기" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                        <button type="button" onClick={() => setPortfolioForm({ ...portfolioForm, thumbnail: '' })} className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">
                                            삭제
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-black mb-2">순서</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={portfolioForm.order}
                                        onChange={(e) => setPortfolioForm({ ...portfolioForm, order: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    />
                                </div>
                                <div className="flex items-center pt-6">
                                    <input type="checkbox" id="isActive" checked={portfolioForm.isActive} onChange={(e) => setPortfolioForm({ ...portfolioForm, isActive: e.target.checked })} className="w-4 h-4 border-2 border-gray-300 rounded" />
                                    <label htmlFor="isActive" className="ml-2 text-sm font-semibold text-black">
                                        활성화
                                    </label>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPortfolioForm(false);
                                        setEditingPortfolio(null);
                                    }}
                                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-100 transition-all"
                                >
                                    취소
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all">
                                    {editingPortfolio ? '수정' : '생성'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Question Form Modal */}
            {showQuestionForm && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                    onClick={() => {
                        setShowQuestionForm(false);
                        setEditingQuestion(null);
                    }}
                >
                    <div className="bg-white rounded-lg p-8 max-w-2xl w-full border-2 border-black max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-black mb-6">{editingQuestion ? '질문 수정' : '새 질문 추가'}</h3>
                        <form onSubmit={handleCreateOrUpdateQuestion} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-black mb-2">단계</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={questionForm.step}
                                        onChange={(e) => setQuestionForm({ ...questionForm, step: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-black mb-2">순서</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={questionForm.order}
                                        onChange={(e) => setQuestionForm({ ...questionForm, order: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-black mb-2">질문 제목</label>
                                <input type="text" required value={questionForm.title} onChange={(e) => setQuestionForm({ ...questionForm, title: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-black mb-2">설명 (선택사항)</label>
                                <textarea value={questionForm.description} onChange={(e) => setQuestionForm({ ...questionForm, description: e.target.value })} rows={3} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-black mb-2">썸네일 이미지 (선택사항)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const formData = new FormData();
                                            formData.append('file', file);
                                            const token = localStorage.getItem('token');
                                            try {
                                                const response = await fetch('/api/upload', {
                                                    method: 'POST',
                                                    headers: {
                                                        Authorization: `Bearer ${token}`,
                                                    },
                                                    body: formData,
                                                });
                                                if (response.ok) {
                                                    const data = await response.json();
                                                    setQuestionForm({ ...questionForm, thumbnail: data.url });
                                                } else {
                                                    alert('이미지 업로드에 실패했습니다.');
                                                }
                                            } catch (error) {
                                                console.error('Upload error:', error);
                                                alert('이미지 업로드 중 오류가 발생했습니다.');
                                            }
                                        }
                                    }}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-black file:text-white file:cursor-pointer hover:file:bg-gray-800"
                                />
                                {questionForm.thumbnail && (
                                    <div className="mt-2 w-full h-32 bg-gray-200 rounded-lg overflow-hidden relative">
                                        <img src={questionForm.thumbnail} alt="미리보기" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                        <button type="button" onClick={() => setQuestionForm({ ...questionForm, thumbnail: '' })} className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">
                                            삭제
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-black mb-2">최소 글자 수</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={questionForm.minLength}
                                    onChange={(e) => setQuestionForm({ ...questionForm, minLength: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                />
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" id="isRequired" checked={questionForm.isRequired} onChange={(e) => setQuestionForm({ ...questionForm, isRequired: e.target.checked })} className="w-4 h-4 border-2 border-gray-300 rounded" />
                                <label htmlFor="isRequired" className="ml-2 text-sm font-semibold text-black">
                                    필수 항목
                                </label>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowQuestionForm(false);
                                        setEditingQuestion(null);
                                    }}
                                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-100 transition-all"
                                >
                                    취소
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all">
                                    {editingQuestion ? '수정' : '생성'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* User Creation Modal */}
            {showUserForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowUserForm(false)}>
                    <div className="bg-white rounded-lg p-8 max-w-md w-full border-2 border-black" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-black mb-6">새 사용자 생성</h3>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-black mb-2">이름</label>
                                <input type="text" required value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-black mb-2">이메일</label>
                                <input type="email" required value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-black mb-2">비밀번호</label>
                                <input type="password" required value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-black mb-2">역할</label>
                                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black">
                                    <option value="ADMIN">관리자</option>
                                    <option value="SUPER_ADMIN">최고 관리자</option>
                                </select>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button type="button" onClick={() => setShowUserForm(false)} className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-100 transition-all">
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
        </div>
    );
}
