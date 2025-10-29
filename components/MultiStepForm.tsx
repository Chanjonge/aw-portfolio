'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DynamicFormField from './DynamicFormField';

interface Question {
    id: string;
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

interface FormData {
    [key: string]: any;
}

export default function MultiStepForm() {
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentStep, setCurrentStep] = useState(-1); // -1로 초기화하여 로딩 상태 구분
    const [formData, setFormData] = useState<FormData>({});
    const [errors, setErrors] = useState<FormData>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const maxStep = questions.length > 0 ? Math.max(...questions.map((q) => q.step)) : 1;
    const minStep = questions.length > 0 ? Math.min(...questions.map((q) => q.step)) : 0;

    // 질문이 로드되면 적절한 시작 단계로 설정
    useEffect(() => {
        if (questions.length > 0 && currentStep === -1) {
            setCurrentStep(minStep);
        }
    }, [questions, minStep, currentStep]);

    useEffect(() => {
        fetchQuestions();
    }, []);

    // Enter 키 이벤트 리스너
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key === 'Enter' && !event.shiftKey && !submitting) {
                // textarea나 input에서 Shift+Enter는 줄바꿈이므로 제외
                const target = event.target as HTMLElement;
                if (target.tagName === 'TEXTAREA' && !event.ctrlKey) {
                    return; // textarea에서는 Ctrl+Enter만 다음 단계로
                }

                event.preventDefault();
                if (currentStep < maxStep) {
                    handleNext();
                } else {
                    handleSubmit();
                }
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, [currentStep, maxStep, submitting]);

    const fetchQuestions = async () => {
        try {
            const response = await fetch('/api/questions');
            const data = await response.json();
            setQuestions(data.questions);
        } catch (error) {
            console.error('Failed to fetch questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const currentQuestions = questions.filter((q) => q.step === currentStep);

    const validateStep = (): boolean => {
        const newErrors: FormData = {};
        let isValid = true;

        currentQuestions.forEach((question) => {
            const value = formData[question.id];
            const questionType = (question.questionType ?? 'text').toString().trim().toLowerCase();

            if (question.isRequired) {
                // agreement 타입의 경우 동의 체크박스 검증
                if (questionType === 'agreement') {
                    if (!value || !value.agreed) {
                        newErrors[question.id] = '안내사항에 동의해주세요.';
                        isValid = false;
                    }
                }
                // checkbox 타입의 경우
                else if (questionType === 'checkbox') {
                    if (!value || (value.checked && value.checked.length === 0) || (!value.checked && !value.selected)) {
                        newErrors[question.id] = '하나 이상의 항목을 선택해주세요.';
                        isValid = false;
                    }
                }
                // repeatable 타입의 경우
                else if (questionType === 'repeatable') {
                    if (!value || !Array.isArray(value) || value.length === 0) {
                        newErrors[question.id] = '최소 하나의 항목을 추가해주세요.';
                        isValid = false;
                    }
                }
                // notice 타입은 입력이 필요없음
                else if (questionType !== 'notice') {
                    // 일반 텍스트 타입들
                    const stringValue = typeof value === 'string' ? value : '';
                    if (stringValue.trim().length === 0) {
                        newErrors[question.id] = '이 항목은 필수입니다.';
                        isValid = false;
                    }
                    // 최소 길이 검증
                    else if (question.requireMinLength && stringValue.trim().length < question.minLength) {
                        newErrors[question.id] = `최소 ${question.minLength}자 이상 입력해주세요.`;
                        isValid = false;
                    }
                }
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
        if (currentStep > minStep) {
            setCurrentStep(currentStep - 1);
            window.scrollTo(0, 0);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;

        setSubmitting(true);
        try {
            const response = await fetch('/api/submissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
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

    const handleChange = (questionId: string, value: any) => {
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

    if (loading || currentStep === -1) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">로딩 중...</div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">아직 설정된 질문이 없습니다</h2>
                    <p className="text-gray-600">관리자에게 문의해주세요.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                            {currentStep === 0 ? '안내사항' : `단계 ${currentStep}`} / {maxStep}
                        </span>
                        <span className="text-sm text-gray-500">{Math.round(((currentStep - minStep + 1) / (maxStep - minStep + 1)) * 100)}% 완료</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-black h-2 rounded-full transition-all duration-300" style={{ width: `${((currentStep - minStep + 1) / (maxStep - minStep + 1)) * 100}%` }} />
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white border-2 border-black rounded-lg p-8 shadow-lg">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-black mb-2">{currentStep === 0 ? '안내사항' : `단계 ${currentStep}`}</h1>
                        <p className="text-gray-600">{currentStep === 0 ? '다음 단계로 진행하기 전에 안내사항을 확인해주세요.' : '모든 필수 항목을 작성해주세요.'}</p>
                    </div>

                    {/* Questions */}
                    <div className="space-y-6">
                        {currentQuestions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">이 단계에는 질문이 없습니다.</div>
                        ) : (
                            currentQuestions
                                .sort((a, b) => a.order - b.order)
                                .map((question) => (
                                    <DynamicFormField
                                        key={question.id}
                                        question={{
                                            ...question,
                                            questionType: question.questionType || 'text',
                                        }}
                                        value={formData[question.id]}
                                        onChange={(value) => handleChange(question.id, value)}
                                        error={errors[question.id]}
                                    />
                                ))
                        )}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center mt-8 pt-6 border-t-2 border-gray-200">
                        <button
                            onClick={handlePrevious}
                            disabled={currentStep === minStep}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all ${currentStep === minStep ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-black border-2 border-black hover:bg-black hover:text-white'}`}
                        >
                            이전
                        </button>

                        {currentStep < maxStep ? (
                            <button onClick={handleNext} className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all">
                                {currentStep === 0 ? '시작하기' : '다음'}
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={submitting} className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed">
                                {submitting ? '제출 중...' : '제출하기'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
