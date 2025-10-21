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
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<FormData>({});
    const [errors, setErrors] = useState<FormData>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const maxStep = Math.max(...questions.map((q) => q.step), 5);

    useEffect(() => {
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

    const handleNext = () => {
        if (validateStep()) {
            if (currentStep < maxStep) {
                setCurrentStep(currentStep + 1);
                window.scrollTo(0, 0);
            }
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo(0, 0);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep() || !portfolio) return;

        setSubmitting(true);
        try {
            const response = await fetch('/api/submissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    portfolioId: portfolio.id,
                    responses: formData,
                }),
            });

            if (response.ok) {
                alert('제출이 완료되었습니다.');
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
                    <button onClick={() => router.push('/')} className="px-4 py-2 bg-black text-white rounded-lg">
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
                    <button onClick={() => router.push('/')} className="px-4 py-2 bg-black text-white rounded-lg">
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

                {/* Form Card */}
                <div className="bg-white border-2 border-black rounded-lg p-8 shadow-lg">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-black mb-2">단계 {currentStep}</h2>
                        <p className="text-gray-600">모든 필수 항목을 작성해주세요.</p>
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

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center mt-8 pt-6 border-t-2 border-gray-200">
                        <button onClick={handlePrevious} disabled={currentStep === 1} className={`px-6 py-3 rounded-lg font-semibold transition-all ${currentStep === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-black border-2 border-black hover:bg-black hover:text-white'}`}>
                            이전
                        </button>

                        {currentStep < maxStep ? (
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
                    <button onClick={() => router.push('/')} className="text-gray-600 hover:text-black transition-all">
                        ← 포트폴리오 리스트로 돌아가기
                    </button>
                </div>
            </div>
        </div>
    );
}
