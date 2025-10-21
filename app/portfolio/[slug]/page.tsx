'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Question {
    id: string;
    step: number;
    title: string;
    description?: string;
    thumbnail?: string;
    minLength: number;
    order: number;
    isRequired: boolean;
}

interface Portfolio {
    id: string;
    title: string;
    description: string;
    slug: string;
}

interface FormData {
    [key: string]: string;
}

export default function PortfolioForm() {
    const router = useRouter();
    const params = useParams();
    const slug = params.slug as string;

    const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentStep, setCurrentStep] = useState(0); // 0 = 인증 단계, 1+ = 질문 단계
    const [formData, setFormData] = useState<FormData>({});
    const [errors, setErrors] = useState<FormData>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [userRole, setUserRole] = useState<string>('');
    
    // 상호명과 비밀번호
    const [companyName, setCompanyName] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const [existingSubmissionId, setExistingSubmissionId] = useState<string | null>(null);

    const maxStep = Math.max(...questions.map((q) => q.step), 5);

    useEffect(() => {
        // Check user role
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                setUserRole(userData.role || '');
            } catch (error) {
                console.error('Failed to parse user data:', error);
            }
        }
        fetchPortfolioAndQuestions();
    }, [slug]);

    const fetchPortfolioAndQuestions = async () => {
        try {
            // Fetch portfolio by slug
            const portfoliosResponse = await fetch('/api/portfolios');
            const portfoliosData = await portfoliosResponse.json();
            const foundPortfolio = portfoliosData.portfolios.find((p: Portfolio) => p.slug === slug);

            if (!foundPortfolio) {
                router.push('/');
                return;
            }

            setPortfolio(foundPortfolio);

            // Fetch questions for this portfolio
            const questionsResponse = await fetch(`/api/questions?portfolioId=${foundPortfolio.id}`);
            const questionsData = await questionsResponse.json();
            setQuestions(questionsData.questions);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const currentQuestions = questions.filter((q) => q.step === currentStep);

    // 인증 단계 검증
    const validateAuth = async (): Promise<boolean> => {
        setAuthError('');
        
        if (!companyName.trim()) {
            setAuthError('상호명을 입력해주세요.');
            return false;
        }
        
        if (password.length !== 4 || !/^\d{4}$/.test(password)) {
            setAuthError('4자리 숫자 비밀번호를 입력해주세요.');
            return false;
        }

        // 기존 제출 내역 확인
        try {
            const response = await fetch(`/api/submissions/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    portfolioId: portfolio?.id,
                    companyName,
                    password
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.submission) {
                    // 기존 제출 내역이 있으면 불러오기
                    setExistingSubmissionId(data.submission.id);
                    setFormData(data.submission.responses);
                    alert('기존 작성 내역을 불러왔습니다.');
                }
            }
        } catch (error) {
            console.error('Failed to check existing submission:', error);
        }

        return true;
    };

    const validateStep = (): boolean => {
        const newErrors: FormData = {};
        let isValid = true;

        currentQuestions.forEach((question) => {
            const value = formData[question.id] || '';

            if (question.isRequired && value.trim().length === 0) {
                newErrors[question.id] = '이 항목은 필수입니다.';
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    const handleNext = async () => {
        // Step 0: 인증 단계
        if (currentStep === 0) {
            const isValid = await validateAuth();
            if (isValid) {
                setCurrentStep(1);
                window.scrollTo(0, 0);
            }
            return;
        }

        // Step 1+: 질문 단계
        if (validateStep()) {
            if (currentStep < maxStep) {
                setCurrentStep(currentStep + 1);
                window.scrollTo(0, 0);
            }
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            window.scrollTo(0, 0);
        }
    };

    const handleSaveDraft = async () => {
        if (!portfolio) return;

        setSubmitting(true);
        try {
            const method = existingSubmissionId ? 'PUT' : 'POST';
            const url = existingSubmissionId 
                ? `/api/submissions/${existingSubmissionId}` 
                : '/api/submissions';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    portfolioId: portfolio.id,
                    companyName,
                    password,
                    responses: formData,
                    isDraft: true,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (!existingSubmissionId) {
                    setExistingSubmissionId(data.submission.id);
                }
                alert('임시저장되었습니다.');
            } else {
                const data = await response.json();
                alert(data.error || '임시저장 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('Save draft error:', error);
            alert('임시저장 중 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep() || !portfolio) return;

        setSubmitting(true);
        try {
            const method = existingSubmissionId ? 'PUT' : 'POST';
            const url = existingSubmissionId 
                ? `/api/submissions/${existingSubmissionId}` 
                : '/api/submissions';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    portfolioId: portfolio.id,
                    companyName,
                    password,
                    responses: formData,
                    isDraft: false,
                }),
            });

            if (response.ok) {
                alert('제출이 완료되었습니다.\n상호명과 비밀번호로 언제든지 조회/수정할 수 있습니다.');
                router.push('/thank-you');
            } else {
                const data = await response.json();
                alert(data.error || '제출 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('제출 중 오류가 발생했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (questionId: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [questionId]: value,
        }));
        // Clear error when user starts typing
        if (errors[questionId]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[questionId];
                return newErrors;
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">로딩 중...</div>
            </div>
        );
    }

    if (!portfolio) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">포트폴리오를 찾을 수 없습니다</h2>
                    <button
                        onClick={() => {
                            if (userRole === 'MEMBER') {
                                router.push('/member/portfolios');
                            } else {
                                router.push('/');
                            }
                        }}
                        className="px-4 py-2 bg-black text-white rounded-lg"
                    >
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">아직 설정된 질문이 없습니다</h2>
                    <p className="text-gray-600 mb-4">관리자에게 문의해주세요.</p>
                    <button
                        onClick={() => {
                            if (userRole === 'MEMBER') {
                                router.push('/member/portfolios');
                            } else {
                                router.push('/');
                            }
                        }}
                        className="px-4 py-2 bg-black text-white rounded-lg"
                    >
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Portfolio Info */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-black mb-2">{portfolio.title}</h1>
                    {portfolio.description && <p className="text-gray-600">{portfolio.description}</p>}
                </div>

                {/* Progress Bar */}
                {currentStep > 0 && (
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">
                                단계 {currentStep} / {maxStep}
                            </span>
                            <span className="text-sm text-gray-500">{Math.round((currentStep / maxStep) * 100)}% 완료</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-black h-2 rounded-full transition-all duration-300" style={{ width: `${(currentStep / maxStep) * 100}%` }} />
                        </div>
                    </div>
                )}

                {/* Form Card */}
                <div className="bg-white border-2 border-black rounded-lg p-8 shadow-lg">
                    {/* Step 0: 인증 단계 */}
                    {currentStep === 0 ? (
                        <div>
                            <div className="mb-8 text-center">
                                <h2 className="text-2xl font-bold text-black mb-2">제출자 정보 입력</h2>
                                <p className="text-gray-600">상호명과 4자리 비밀번호를 입력하세요</p>
                                <p className="text-sm text-gray-500 mt-2">이미 제출한 적이 있다면 같은 정보로 조회/수정이 가능합니다</p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        상호명 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="회사명 또는 이름을 입력하세요"
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all"
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
                                    />
                                    <p className="text-sm text-gray-500 mt-1">숫자 4자리만 입력 가능합니다</p>
                                </div>

                                {authError && (
                                    <div className="p-4 bg-red-50 border-2 border-red-500 rounded-lg">
                                        <p className="text-sm text-red-700">{authError}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Step 1+: 질문 단계 */
                        <div>
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-black mb-2">단계 {currentStep}</h2>
                                <p className="text-gray-600">모든 필수 항목을 작성해주세요.</p>
                                <div className="mt-4 flex gap-3">
                                    <button
                                        onClick={handleSaveDraft}
                                        disabled={submitting}
                                        className="px-4 py-2 border-2 border-gray-300 rounded-lg font-semibold hover:border-black transition-all disabled:opacity-50"
                                    >
                                        💾 임시저장
                                    </button>
                                    <p className="text-sm text-gray-500 flex items-center">작성 중인 내용을 저장하고 나중에 이어서 작성할 수 있습니다</p>
                                </div>
                            </div>

                            {/* Questions */}
                            <div className="space-y-6">
                                {currentQuestions.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">이 단계에는 질문이 없습니다.</div>
                                ) : (
                                    currentQuestions.map((question) => (
                                        <div key={question.id} className="space-y-3">
                                            {question.thumbnail && (
                                                <div className="w-full h-40 bg-gray-200 rounded-lg overflow-hidden">
                                                    <img src={question.thumbnail} alt={question.title} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <label className="block">
                                                <span className="text-lg font-semibold text-black">
                                                    {question.title}
                                                    {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                                                </span>
                                                {question.description && <span className="block text-sm text-gray-600 mt-1">{question.description}</span>}
                                            </label>
                                            <textarea
                                                value={formData[question.id] || ''}
                                                onChange={(e) => handleChange(question.id, e.target.value)}
                                                rows={6}
                                                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all ${errors[question.id] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                                                placeholder="여기에 답변을 입력하세요..."
                                            />
                                            {errors[question.id] && <p className="text-sm text-red-500 mt-1">{errors[question.id]}</p>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center mt-8 pt-6 border-t-2 border-gray-200">
                        <button 
                            onClick={handlePrevious} 
                            disabled={currentStep === 0} 
                            className={`px-6 py-3 rounded-lg font-semibold transition-all ${currentStep === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-black border-2 border-black hover:bg-black hover:text-white'}`}
                        >
                            이전
                        </button>

                        {currentStep === 0 ? (
                            <button onClick={handleNext} className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all">
                                시작하기
                            </button>
                        ) : currentStep < maxStep ? (
                            <button onClick={handleNext} className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all">
                                다음
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={submitting} className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed">
                                {submitting ? '제출 중...' : '제출하기'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-6">
                    <button
                        onClick={() => {
                            // Redirect based on user role
                            if (userRole === 'MEMBER') {
                                router.push('/member/portfolios');
                            } else {
                                router.push('/');
                            }
                        }}
                        className="text-gray-600 hover:text-black transition-all"
                    >
                        ← 포트폴리오 리스트로 돌아가기
                    </button>
                </div>
            </div>
        </div>
    );
}
