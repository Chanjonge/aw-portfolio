'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DynamicFormField from '@/components/DynamicFormField';

interface Question {
    id: string;
    step: number;
    title: string;
    description?: string;
    thumbnail?: string;
    questionType: string;
    options?: string;
    minLength: number;
    maxLength?: number;
    requireMinLength?: boolean;
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
                    password,
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
            const value = formData[question.id];

            // 필수 항목 체크
            if (question.isRequired) {
                // 파일 업로드는 URL이 있는지 확인
                if (question.questionType === 'file') {
                    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
                        newErrors[question.id] = '파일을 업로드해주세요.';
                        isValid = false;
                        return;
                    }
                }
                // 체크박스는 checked 배열이 있는지 확인
                else if (question.questionType === 'checkbox') {
                    if (!value || !value.checked || value.checked.length === 0) {
                        newErrors[question.id] = '최소 하나 이상 선택해주세요.';
                        isValid = false;
                        return;
                    }
                }
                // 반복 필드는 배열에 데이터가 있는지 확인
                else if (question.questionType === 'repeatable') {
                    if (!value || !Array.isArray(value) || value.length === 0) {
                        newErrors[question.id] = '최소 하나 이상 입력해주세요.';
                        isValid = false;
                        return;
                    }
                }
                // 텍스트 필드는 문자열 길이 확인
                else {
                    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
                        newErrors[question.id] = '이 항목은 필수입니다.';
                        isValid = false;
                        return;
                    }
                }
            }

            // 최소 글자 수 체크 (requireMinLength가 true이고 text/textarea일 때만)
            if (
                question.requireMinLength && 
                (question.questionType === 'text' || question.questionType === 'textarea') &&
                typeof value === 'string' && 
                value.trim().length > 0 && 
                value.trim().length < question.minLength
            ) {
                newErrors[question.id] = `최소 ${question.minLength}자 이상 입력해주세요.`;
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
            const url = existingSubmissionId ? `/api/submissions/${existingSubmissionId}` : '/api/submissions';

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
            const url = existingSubmissionId ? `/api/submissions/${existingSubmissionId}` : '/api/submissions';

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
                                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="회사명 또는 이름을 입력하세요" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all" />
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
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-black mb-2">단계 {currentStep}</h2>
                                <p className="text-gray-600">모든 필수 항목을 작성해주세요.</p>
                            </div>

                            {/* Questions - 스크롤 가능 영역 */}
                            <div className="max-h-[500px] overflow-y-auto pr-2 space-y-8">
                                {currentQuestions.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">이 단계에는 질문이 없습니다.</div>
                                ) : (
                                    currentQuestions.map((question) => <DynamicFormField key={question.id} question={question} value={formData[question.id]} onChange={(value) => handleChange(question.id, value)} error={errors[question.id]} />)
                                )}
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center mt-8 pt-6 border-t-2 border-gray-200">
                        <button onClick={handlePrevious} disabled={currentStep === 0} className={`px-6 py-3 rounded-lg font-semibold transition-all ${currentStep === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-black border-2 border-black hover:bg-black hover:text-white'}`}>
                            이전
                        </button>

                        <div className="flex gap-3">
                            {currentStep > 0 && (
                                <button onClick={handleSaveDraft} disabled={submitting} className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:border-black transition-all disabled:opacity-50">
                                    💾 임시저장
                                </button>
                            )}

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
                        포트폴리오 리스트로 돌아가기
                    </button>
                </div>
            </div>
        </div>
    );
}
