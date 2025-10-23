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
    categoryId?: string;
    category?: {
        id: string;
        name: string;
        slug: string;
    };
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
    maxLength?: number;
    requireMinLength?: boolean;
    order: number;
    isRequired: boolean;
    questionType?: string;
    options?: string;
}

type TabType = 'users' | 'portfolios' | 'questions' | 'submissions' | 'categories';

interface Category {
    id: string;
    name: string;
    slug: string;
    order: number;
    createdAt: string;
    updatedAt: string;
    _count?: {
        portfolios: number;
    };
}

interface Submission {
    id: string;
    portfolioId: string;
    companyName: string;
    password: string;
    isDraft: boolean;
    completedAt: string;
    updatedAt: string;
    responses: any;
    portfolio: {
        title: string;
        slug: string;
    };
}

export default function SuperAdminPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
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
        categoryId: '',
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
        maxLength: 500,
        requireMinLength: false,
        order: 0,
        isRequired: true,
        questionType: 'text',
        options: '',
    });

    // Category form
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryForm, setCategoryForm] = useState({
        name: '',
        slug: '',
        order: 0,
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

    const fetchSubmissions = async () => {
        try {
            // 1. 구글 시트에서 데이터 가져오기 시도
            try {
                const sheetsResponse = await fetch('/api/sheets');
                if (sheetsResponse.ok) {
                    const sheetsData = await sheetsResponse.json();
                    if (sheetsData.submissions && sheetsData.submissions.length > 0) {
                        // 구글 시트 데이터를 기존 형식에 맞게 변환
                        const formattedSubmissions = sheetsData.submissions.map((sub: any) => ({
                            id: sub.id,
                            companyName: sub.companyName,
                            completedAt: sub.submittedAt,
                            ipAddress: sub.ipAddress,
                            responses: sub.responses,
                            portfolio: {
                                title: sub.portfolioTitle,
                                slug: '',
                            },
                        }));
                        setSubmissions(formattedSubmissions);
                        return;
                    }
                }
            } catch (sheetsError) {
                console.error('구글 시트 조회 실패:', sheetsError);
            }

            // 2. 구글 시트 실패 시 기존 데이터베이스에서 가져오기
            const token = localStorage.getItem('token');
            const response = await fetch('/api/submissions', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (response.ok) {
                setSubmissions(data.submissions || []);
            }
        } catch (error) {
            console.error('Failed to fetch submissions:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/categories', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (response.ok) {
                setCategories(data.categories || []);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const handleCreateOrUpdateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const url = '/api/categories';
            const method = editingCategory ? 'PUT' : 'POST';
            const body = editingCategory ? { ...categoryForm, id: editingCategory.id } : categoryForm;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                alert(editingCategory ? '카테고리가 수정되었습니다.' : '카테고리가 생성되었습니다.');
                setShowCategoryForm(false);
                setEditingCategory(null);
                setCategoryForm({
                    name: '',
                    slug: '',
                    order: 0,
                });
                await fetchCategories();
            } else {
                const data = await response.json();
                alert(data.error || '카테고리 저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('Save category error:', error);
            alert('카테고리 저장 중 오류가 발생했습니다.');
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (!confirm('정말로 이 카테고리를 삭제하시겠습니까?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/categories?id=${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                alert('카테고리가 삭제되었습니다.');
                await fetchCategories();
            } else {
                const data = await response.json();
                alert(data.error || '카테고리 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Delete category error:', error);
            alert('카테고리 삭제 중 오류가 발생했습니다.');
        }
    };

    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setCategoryForm({
            name: category.name,
            slug: category.slug,
            order: category.order,
        });
        setShowCategoryForm(true);
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
                    categoryId: '',
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
            categoryId: portfolio.categoryId || '',
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
                    maxLength: 500,
                    requireMinLength: false,
                    order: 0,
                    isRequired: true,
                    questionType: 'text',
                    options: '',
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
            maxLength: question.maxLength || 500,
            requireMinLength: question.requireMinLength || false,
            order: question.order,
            isRequired: question.isRequired,
            questionType: question.questionType || 'text',
            options: question.options || '',
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
                        <button
                            onClick={() => {
                                setActiveTab('portfolios');
                                fetchCategories();
                            }}
                            className={`py-4 px-2 font-semibold border-b-4 transition-all ${activeTab === 'portfolios' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'}`}
                        >
                            포트폴리오 관리
                        </button>
                        <button onClick={() => setActiveTab('questions')} className={`py-4 px-2 font-semibold border-b-4 transition-all ${activeTab === 'questions' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'}`}>
                            질문 관리
                        </button>
                        <button onClick={() => setActiveTab('users')} className={`py-4 px-2 font-semibold border-b-4 transition-all ${activeTab === 'users' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'}`}>
                            사용자 관리
                        </button>
                        {/* <button
                            onClick={() => {
                                setActiveTab('submissions');
                                fetchSubmissions();
                            }}
                            className={`py-4 px-2 font-semibold border-b-4 transition-all ${activeTab === 'submissions' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'}`}
                        >
                            제출 목록
                        </button> */}
                        <button
                            onClick={() => {
                                setActiveTab('categories');
                                fetchCategories();
                            }}
                            className={`py-4 px-2 font-semibold border-b-4 transition-all ${activeTab === 'categories' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-black'}`}
                        >
                            카테고리 관리
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
                                        categoryId: '',
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
                                                <div className="flex items-center gap-2 mt-1">
                                                    {portfolio.category && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{portfolio.category.name}</span>}
                                                    {!portfolio.isActive && <span className="text-xs bg-gray-200 px-2 py-1 rounded">비활성</span>}
                                                </div>
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
                                        maxLength: 500,
                                        requireMinLength: false,
                                        order: 0,
                                        isRequired: true,
                                        questionType: 'text',
                                        options: '',
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
                                <label className="block text-sm font-semibold text-black mb-2">카테고리</label>
                                <select value={portfolioForm.categoryId} onChange={(e) => setPortfolioForm({ ...portfolioForm, categoryId: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black">
                                    <option value="">카테고리 선택 (선택사항)</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
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
                                            // 로딩 표시
                                            const originalText = e.target.nextElementSibling?.textContent;
                                            if (e.target.nextElementSibling) {
                                                e.target.nextElementSibling.textContent = '업로드 중...';
                                            }

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

                                                const data = await response.json();
                                                console.log('Upload response:', data);

                                                if (response.ok && data.url) {
                                                    setPortfolioForm({ ...portfolioForm, thumbnail: data.url });
                                                    alert('✅ 이미지 업로드 성공!\n저장 버튼을 눌러주세요.');
                                                } else {
                                                    console.error('Upload failed:', data);
                                                    alert(`❌ 이미지 업로드 실패: ${data.error || data.details || '알 수 없는 오류'}\n\n${data.details ? `상세: ${data.details}` : ''}`);
                                                }
                                            } catch (error) {
                                                console.error('Upload error:', error);
                                                alert('❌ 이미지 업로드 중 오류가 발생했습니다.\n콘솔을 확인하세요.');
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
                                <label className="block text-sm font-semibold text-black mb-2">질문 유형</label>
                                <select value={questionForm.questionType} onChange={(e) => setQuestionForm({ ...questionForm, questionType: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black">
                                    <option value="text">단답형 (텍스트)</option>
                                    <option value="textarea">장문형 (여러 줄)</option>
                                    <option value="file">파일 업로드</option>
                                    <option value="checkbox">체크박스 (조건부 입력)</option>
                                    <option value="repeatable">반복 가능한 필드</option>
                                </select>
                            </div>
                            {questionForm.questionType === 'checkbox' && (
                                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                                    <h4 className="font-semibold text-black">체크박스 설정</h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-black mb-2">선택 방식</label>
                                            <select
                                                value={(() => {
                                                    try {
                                                        const parsed = JSON.parse(questionForm.options || '{}');
                                                        return parsed.multiple ? 'multiple' : 'single';
                                                    } catch {
                                                        return 'single';
                                                    }
                                                })()}
                                                onChange={(e) => {
                                                    try {
                                                        const parsed = JSON.parse(questionForm.options || '{}');
                                                        parsed.multiple = e.target.value === 'multiple';
                                                        setQuestionForm({ ...questionForm, options: JSON.stringify(parsed) });
                                                    } catch {
                                                        setQuestionForm({
                                                            ...questionForm,
                                                            options: JSON.stringify({
                                                                multiple: e.target.value === 'multiple',
                                                                checkboxes: [],
                                                            }),
                                                        });
                                                    }
                                                }}
                                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                            >
                                                <option value="single">단일 선택 (라디오 버튼)</option>
                                                <option value="multiple">다중 선택 (체크박스)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-black mb-2">체크박스 개수</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={(() => {
                                                    try {
                                                        const parsed = JSON.parse(questionForm.options || '{}');
                                                        return parsed.checkboxes?.length || 1;
                                                    } catch {
                                                        return 1;
                                                    }
                                                })()}
                                                onChange={(e) => {
                                                    const count = parseInt(e.target.value) || 1;
                                                    try {
                                                        const parsed = JSON.parse(questionForm.options || '{}');
                                                        const currentBoxes = parsed.checkboxes || [];
                                                        const newBoxes = [];

                                                        for (let i = 0; i < count; i++) {
                                                            newBoxes.push(
                                                                currentBoxes[i] || {
                                                                    label: `선택지 ${i + 1}`,
                                                                    hasInput: false,
                                                                }
                                                            );
                                                        }

                                                        parsed.checkboxes = newBoxes;
                                                        setQuestionForm({ ...questionForm, options: JSON.stringify(parsed) });
                                                    } catch {
                                                        const newBoxes = [];
                                                        for (let i = 0; i < count; i++) {
                                                            newBoxes.push({ label: `선택지 ${i + 1}`, hasInput: false });
                                                        }
                                                        setQuestionForm({
                                                            ...questionForm,
                                                            options: JSON.stringify({
                                                                multiple: false,
                                                                checkboxes: newBoxes,
                                                            }),
                                                        });
                                                    }
                                                }}
                                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-sm font-semibold text-black">체크박스 옵션</label>
                                        {(() => {
                                            try {
                                                const parsed = JSON.parse(questionForm.options || '{}');
                                                return (parsed.checkboxes || []).map((checkbox: any, index: number) => (
                                                    <div key={index} className="flex gap-3 items-center p-3 bg-white rounded border">
                                                        <span className="text-sm font-medium w-12">{index + 1}.</span>
                                                        <input
                                                            type="text"
                                                            value={checkbox.label || ''}
                                                            onChange={(e) => {
                                                                const parsed = JSON.parse(questionForm.options || '{}');
                                                                parsed.checkboxes[index].label = e.target.value;
                                                                setQuestionForm({ ...questionForm, options: JSON.stringify(parsed) });
                                                            }}
                                                            placeholder="선택지 제목"
                                                            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                                                        />
                                                        <label className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={checkbox.hasInput || false}
                                                                onChange={(e) => {
                                                                    const parsed = JSON.parse(questionForm.options || '{}');
                                                                    parsed.checkboxes[index].hasInput = e.target.checked;
                                                                    setQuestionForm({ ...questionForm, options: JSON.stringify(parsed) });
                                                                }}
                                                                className="w-4 h-4"
                                                            />
                                                            <span className="text-sm">추가 입력 필드</span>
                                                        </label>
                                                    </div>
                                                ));
                                            } catch {
                                                return <p className="text-red-500 text-sm">옵션 설정을 불러올 수 없습니다.</p>;
                                            }
                                        })()}
                                    </div>
                                </div>
                            )}

                            {questionForm.questionType === 'repeatable' && (
                                <div>
                                    <label className="block text-sm font-semibold text-black mb-2">반복 필드 설정 (JSON 형식)</label>
                                    <textarea
                                        value={questionForm.options}
                                        onChange={(e) => setQuestionForm({ ...questionForm, options: e.target.value })}
                                        rows={8}
                                        placeholder='{"fields": [{"label": "대표자명", "type": "text", "placeholder": "이름"}]}'
                                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black font-mono text-sm"
                                    />
                                    <p className="text-xs text-gray-600 mt-1">반복 필드: {`{"fields": [{"label": "라벨", "type": "text/file", "placeholder": "힌트"}]}`}</p>
                                </div>
                            )}
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

                                                const data = await response.json();
                                                console.log('Upload response:', data);

                                                if (response.ok && data.url) {
                                                    setQuestionForm({ ...questionForm, thumbnail: data.url });
                                                    alert('✅ 이미지 업로드 성공!\n저장 버튼을 눌러주세요.');
                                                } else {
                                                    console.error('Upload failed:', data);
                                                    alert(`❌ 이미지 업로드 실패: ${data.error || data.details || '알 수 없는 오류'}\n\n${data.details ? `상세: ${data.details}` : ''}`);
                                                }
                                            } catch (error) {
                                                console.error('Upload error:', error);
                                                alert('❌ 이미지 업로드 중 오류가 발생했습니다.\n콘솔을 확인하세요.');
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
                            {(questionForm.questionType === 'text' || questionForm.questionType === 'textarea') && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-black mb-2">최소 글자 수</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={questionForm.minLength}
                                                onChange={(e) => setQuestionForm({ ...questionForm, minLength: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                                disabled={!questionForm.requireMinLength}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-black mb-2">최대 글자 수</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={questionForm.maxLength}
                                                onChange={(e) => setQuestionForm({ ...questionForm, maxLength: parseInt(e.target.value) })}
                                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <input type="checkbox" id="requireMinLength" checked={questionForm.requireMinLength} onChange={(e) => setQuestionForm({ ...questionForm, requireMinLength: e.target.checked })} className="w-4 h-4 border-2 border-gray-300 rounded" />
                                        <label htmlFor="requireMinLength" className="ml-2 text-sm font-semibold text-black">
                                            최소 글자 수 검증 활성화
                                        </label>
                                    </div>
                                </>
                            )}
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

            {/* Submissions Tab */}
            {activeTab === 'submissions' && (
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">제출 목록</h2>
                        <button onClick={fetchSubmissions} className="px-4 py-2 border-2 border-black rounded-lg font-semibold hover:bg-black hover:text-white transition-all">
                            🔄 새로고침
                        </button>
                    </div>

                    {submissions.length === 0 ? (
                        <div className="bg-white border-2 border-gray-200 rounded-lg p-12 text-center">
                            <span className="text-6xl mb-4 block">📝</span>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">제출 내역이 없습니다</h3>
                            <p className="text-gray-600">사용자가 포트폴리오를 제출하면 여기에 표시됩니다</p>
                        </div>
                    ) : (
                        <div className="bg-white border-2 border-black rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b-2 border-black">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-black">상호명</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-black">비밀번호</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-black">포트폴리오</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-black">상태</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-black">제출일</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-black">작업</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {submissions.map((submission) => (
                                            <tr key={submission.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm font-semibold text-black">{submission.companyName}</td>
                                                <td className="px-6 py-4 text-sm font-mono text-gray-700">
                                                    <span className="px-2 py-1 bg-gray-100 rounded">{submission.password.slice(0, 10)}...</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{submission.portfolio.title}</td>
                                                <td className="px-6 py-4 text-sm">
                                                    {submission.isDraft ? <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">임시저장</span> : <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">제출완료</span>}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {new Date(submission.isDraft ? submission.updatedAt : submission.completedAt).toLocaleDateString('ko-KR', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                const responseText = Object.entries(submission.responses)
                                                                    .map(([key, value]) => `${key}: ${value}`)
                                                                    .join('\n\n');
                                                                alert(`제출 내용:\n\n${responseText}`);
                                                            }}
                                                            className="text-black font-semibold hover:underline"
                                                        >
                                                            상세보기
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm('이 제출을 삭제하시겠습니까?')) {
                                                                    try {
                                                                        const token = localStorage.getItem('token');
                                                                        const response = await fetch(`/api/submissions/${submission.id}`, {
                                                                            method: 'DELETE',
                                                                            headers: {
                                                                                Authorization: `Bearer ${token}`,
                                                                            },
                                                                        });

                                                                        if (response.ok) {
                                                                            alert('삭제되었습니다.');
                                                                            fetchSubmissions();
                                                                        } else {
                                                                            const data = await response.json();
                                                                            alert(data.error || '삭제 실패');
                                                                        }
                                                                    } catch (error) {
                                                                        console.error('Delete error:', error);
                                                                        alert('삭제 중 오류가 발생했습니다.');
                                                                    }
                                                                }
                                                            }}
                                                            className="text-red-600 font-semibold hover:underline"
                                                        >
                                                            삭제
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary */}
                            <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-200">
                                <div className="flex gap-6 text-sm text-gray-600">
                                    <span>
                                        전체: <strong className="text-black">{submissions.length}</strong>건
                                    </span>
                                    <span>
                                        제출완료: <strong className="text-green-600">{submissions.filter((s) => !s.isDraft).length}</strong>건
                                    </span>
                                    <span>
                                        임시저장: <strong className="text-yellow-600">{submissions.filter((s) => s.isDraft).length}</strong>건
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">카테고리 관리</h2>
                        <button
                            onClick={() => {
                                setEditingCategory(null);
                                setCategoryForm({
                                    name: '',
                                    slug: '',
                                    order: categories.length,
                                });
                                setShowCategoryForm(true);
                            }}
                            className="px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all"
                        >
                            + 새 카테고리 추가
                        </button>
                    </div>

                    {categories.length === 0 ? (
                        <div className="bg-white border-2 border-gray-200 rounded-lg p-12 text-center">
                            <span className="text-6xl mb-4 block">📁</span>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">카테고리가 없습니다</h3>
                            <p className="text-gray-600">새 카테고리를 추가하여 포트폴리오를 분류해보세요</p>
                        </div>
                    ) : (
                        <div className="bg-white border-2 border-black rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b-2 border-black">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-black">카테고리명</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-black">슬러그</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-black">순서</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-black">포트폴리오 수</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-black">작업</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {categories.map((category) => (
                                            <tr key={category.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm font-semibold text-black">{category.name}</td>
                                                <td className="px-6 py-4 text-sm font-mono text-gray-700">{category.slug}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{category.order}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{category._count?.portfolios || 0}개</td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleEditCategory(category)} className="text-blue-600 font-semibold hover:underline">
                                                            수정
                                                        </button>
                                                        <button onClick={() => handleDeleteCategory(category.id)} className="text-red-600 font-semibold hover:underline">
                                                            삭제
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Category Form Modal */}
            {showCategoryForm && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => {
                        setShowCategoryForm(false);
                        setEditingCategory(null);
                    }}
                >
                    <div className="bg-white rounded-lg p-8 max-w-md w-full border-2 border-black" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-black mb-6">{editingCategory ? '카테고리 수정' : '새 카테고리 추가'}</h3>
                        <form onSubmit={handleCreateOrUpdateCategory} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-black mb-2">카테고리명</label>
                                <input type="text" required value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-black mb-2">슬러그 (URL용)</label>
                                <input type="text" required value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-black mb-2">순서</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={categoryForm.order}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, order: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button type="submit" className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all">
                                    {editingCategory ? '수정' : '생성'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCategoryForm(false);
                                        setEditingCategory(null);
                                    }}
                                    className="flex-1 px-4 py-2 bg-white text-black border-2 border-black rounded-lg font-semibold hover:bg-black hover:text-white transition-all"
                                >
                                    취소
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
