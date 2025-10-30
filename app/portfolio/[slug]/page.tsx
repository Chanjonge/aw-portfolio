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
    [key: string]: any;
}

export default function PortfolioForm() {
    const router = useRouter();
    const params = useParams();
    const slug = params.slug as string;

    const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentStep, setCurrentStep] = useState(-1); // -1 = 로딩, 0+ = 질문 단계
    const [formData, setFormData] = useState<FormData>({});
    const [errors, setErrors] = useState<FormData>({});

    // ✅ 객실
    const [rooms, setRooms] = useState<Array<{ id: string; name: string; desc: string; type: string; price: string }>>([{ id: 'room-1', name: '', desc: '', type: '', price: '' }]);

    // ✅ 스페셜 (6단계)
    const [specials, setSpecials] = useState<Array<{ id: string; name: string; desc: string }>>([{ id: 'special-1', name: '', desc: '' }]);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [userRole, setUserRole] = useState<string>('');

    const [companyName, setCompanyName] = useState('');
    const [password, setPassword] = useState('');
    const [existingSubmissionId, setExistingSubmissionId] = useState<string | null>(null);

    const maxStep = questions.length > 0 ? Math.max(...questions.map((q) => q.step)) : 1;
    const minStep = questions.length > 0 ? Math.min(...questions.map((q) => q.step)) : 0;

    useEffect(() => {
        if (questions.length > 0 && currentStep === -1) {
            setCurrentStep(minStep);
        }
    }, [questions, minStep, currentStep]);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const userData = JSON.parse(userStr);
                setUserRole(userData.role || '');
            } catch (error) {
                console.error('Failed to parse user data:', error);
            }
        }

        const portfolioAuth = localStorage.getItem('portfolio_auth');
        if (portfolioAuth) {
            try {
                const authData = JSON.parse(portfolioAuth);
                setCompanyName(authData.companyName);
                setPassword(authData.password);
                setTimeout(() => {
                    checkExistingSubmission(authData.companyName, authData.password);
                }, 1000);
            } catch (error) {
                console.error('Failed to parse portfolio auth:', error);
            }
        }

        fetchPortfolioAndQuestions();
    }, [slug]);

    // Enter로 다음
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.key === 'Enter' && !event.shiftKey && !submitting) {
                const target = event.target as HTMLElement;
                if (target.tagName === 'TEXTAREA' && !event.ctrlKey) return;
                event.preventDefault();
                if (currentStep < maxStep) {
                    handleNext();
                } else {
                    handleSubmit();
                }
            }
        };
        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [currentStep, maxStep, submitting]);

    const checkExistingSubmission = async (company: string, pass: string) => {
        if (!portfolio) return;
        try {
            const response = await fetch(`/api/submissions/check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    portfolioId: portfolio.id,
                    companyName: company,
                    password: pass,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.submission) {
                    setExistingSubmissionId(data.submission.id);
                    setFormData(data.submission.responses);

                    // ✅ rooms 복원
                    const savedRooms = data.submission.responses?.rooms;
                    if (Array.isArray(savedRooms) && savedRooms.length > 0) {
                        setRooms(
                            savedRooms.map((r: any, idx: number) => ({
                                id: r.id ? String(r.id) : `room-${idx + 1}`,
                                name: r.name || '',
                                desc: r.desc || '',
                                type: r.type || '',
                                price: r.price || '',
                            }))
                        );
                    } else {
                        setRooms([{ id: 'room-1', name: '', desc: '', type: '', price: '' }]);
                    }

                    // ✅ specials 복원
                    const savedSpecials = data.submission.responses?.specials;
                    if (Array.isArray(savedSpecials) && savedSpecials.length > 0) {
                        setSpecials(
                            savedSpecials.map((s: any, idx: number) => ({
                                id: s.id ? String(s.id) : `special-${idx + 1}`,
                                name: s.name || '',
                                desc: s.desc || '',
                            }))
                        );
                    } else {
                        setSpecials([{ id: 'special-1', name: '', desc: '' }]);
                    }

                    alert('기존 작성 내역을 불러왔습니다.');
                }
            }
        } catch (error) {
            console.error('Failed to check existing submission:', error);
        }
    };

    const fetchPortfolioAndQuestions = async () => {
        try {
            const portfoliosResponse = await fetch('/api/portfolios');
            const portfoliosData = await portfoliosResponse.json();
            const foundPortfolio = portfoliosData.portfolios.find((p: Portfolio) => p.slug === slug);

            if (!foundPortfolio) {
                router.push('/');
                return;
            }

            setPortfolio(foundPortfolio);

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

        if (currentStep === 0) return true;

        currentQuestions.forEach((question) => {
            const value = formData[question.id];
            if (question.isRequired) {
                if (question.questionType === 'file') {
                    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
                        newErrors[question.id] = '파일을 업로드해주세요.';
                        isValid = false;
                        return;
                    }
                } else if (question.questionType === 'checkbox') {
                    if (!value || typeof value !== 'object') {
                        newErrors[question.id] = '최소 하나 이상 선택해주세요.';
                        isValid = false;
                        return;
                    }
                    try {
                        const options = JSON.parse(question.options || '{}');
                        const isMultiple = options.multiple !== false;
                        if (isMultiple) {
                            if (!('checked' in value) || !(value as any).checked || (value as any).checked.length === 0) {
                                newErrors[question.id] = '최소 하나 이상 선택해주세요.';
                                isValid = false;
                                return;
                            }
                        } else {
                            if (!('selected' in value) || !(value as any).selected) {
                                newErrors[question.id] = '하나를 선택해주세요.';
                                isValid = false;
                                return;
                            }
                        }
                    } catch {
                        if (!('checked' in value) || !(value as any).checked || (value as any).checked.length === 0) {
                            newErrors[question.id] = '최소 하나 이상 선택해주세요.';
                            isValid = false;
                            return;
                        }
                    }
                } else if (question.questionType === 'repeatable') {
                    if (!value || !Array.isArray(value) || value.length === 0) {
                        newErrors[question.id] = '최소 하나 이상 입력해주세요.';
                        isValid = false;
                        return;
                    }
                } else if (question.questionType === 'agreement') {
                    if (!value || !value.agreed) {
                        newErrors[question.id] = '안내사항에 동의해주세요.';
                        isValid = false;
                        return;
                    }
                } else {
                    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
                        newErrors[question.id] = '이 항목은 필수입니다.';
                        isValid = false;
                        return;
                    }
                }
            }

            if (question.requireMinLength && (question.questionType === 'text' || question.questionType === 'textarea') && typeof value === 'string' && value.trim().length > 0 && value.trim().length < question.minLength) {
                newErrors[question.id] = `최소 ${question.minLength}자 이상 입력해주세요.`;
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    const validateAllSteps = (): boolean => {
        const newErrors: FormData = {};
        let isValid = true;
        const missingSteps: number[] = [];

        if (!companyName.trim()) {
            alert('상호명(회사명)을 입력해주세요.');
            return false;
        }
        if (!password.trim()) {
            alert('비밀번호를 입력해주세요.');
            return false;
        }

        questions.forEach((question) => {
            const value = formData[question.id];
            if (question.isRequired) {
                let hasError = false;

                if (question.questionType === 'file') {
                    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
                        newErrors[question.id] = '파일을 업로드해주세요.';
                        hasError = true;
                    }
                } else if (question.questionType === 'checkbox') {
                    if (!value || typeof value !== 'object') {
                        newErrors[question.id] = '최소 하나 이상 선택해주세요.';
                        hasError = true;
                    } else {
                        try {
                            const options = JSON.parse(question.options || '{}');
                            const isMultiple = options.multiple !== false;
                            if (isMultiple) {
                                if (!('checked' in value) || !(value as any).checked || (value as any).checked.length === 0) {
                                    newErrors[question.id] = '최소 하나 이상 선택해주세요.';
                                    hasError = true;
                                }
                            } else {
                                if (!('selected' in value) || !(value as any).selected) {
                                    newErrors[question.id] = '하나를 선택해주세요.';
                                    hasError = true;
                                }
                            }
                        } catch {
                            if (!('checked' in value) || !(value as any).checked || (value as any).checked.length === 0) {
                                newErrors[question.id] = '최소 하나 이상 선택해주세요.';
                                hasError = true;
                            }
                        }
                    }
                } else if (question.questionType === 'repeatable') {
                    if (!value || !Array.isArray(value) || value.length === 0) {
                        newErrors[question.id] = '최소 하나 이상 입력해주세요.';
                        hasError = true;
                    }
                } else if (question.questionType === 'agreement') {
                    if (!value || !value.agreed) {
                        newErrors[question.id] = '안내사항에 동의해주세요.';
                        hasError = true;
                    }
                } else {
                    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
                        newErrors[question.id] = '이 항목은 필수입니다.';
                        hasError = true;
                    }
                }

                if (hasError && !missingSteps.includes(question.step)) {
                    missingSteps.push(question.step);
                    isValid = false;
                }
            }

            if (question.requireMinLength && (question.questionType === 'text' || question.questionType === 'textarea') && typeof value === 'string' && value.trim().length > 0 && value.trim().length < question.minLength) {
                newErrors[question.id] = `최소 ${question.minLength}자 이상 입력해주세요.`;
                if (!missingSteps.includes(question.step)) missingSteps.push(question.step);
                isValid = false;
            }
        });

        setErrors(newErrors);

        if (!isValid && missingSteps.length > 0) {
            const sortedSteps = missingSteps.sort((a, b) => a - b);
            alert(`${sortedSteps.join(', ')}단계에 미완성된 필수 항목이 있습니다.\n해당 단계로 이동하여 모든 필수 항목을 완성해주세요.`);
        }

        return isValid;
    };

    // ✅ 객실 추가
    const handleAddRoom = () => {
        setRooms((prev) => [
            ...prev,
            {
                id: `room-${Date.now()}`,
                name: '',
                desc: '',
                type: '',
                price: '',
            },
        ]);
    };

    // ✅ 객실 삭제
    const handleRemoveRoom = (id: string) => {
        setRooms((prev) => prev.filter((room) => room.id !== id));
    };

    // ✅ 스페셜 추가 (6단계)
    const handleAddSpecial = () => {
        setSpecials((prev) => [
            ...prev,
            {
                id: `special-${Date.now()}`,
                name: '',
                desc: '',
            },
        ]);
    };

    // ✅ 스페셜 삭제
    const handleRemoveSpecial = (id: string) => {
        setSpecials((prev) => prev.filter((sp) => sp.id !== id));
    };

    const handleNext = async () => {
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
                    responses: {
                        ...formData,
                        rooms,
                        specials, // ✅ 스페셜도 같이 저장
                    },
                    isDraft: false,
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
        if (!validateAllSteps() || !portfolio) return;
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
                    responses: {
                        ...formData,
                        rooms,
                        specials, // ✅ 제출에도 포함
                    },
                    isDraft: false,
                }),
            });

            if (response.ok) {
                alert('제출이 완료되었습니다!\n데이터가 안전하게 저장되었습니다.');
                router.push('/thank-you');
            } else {
                const errorData = await response.json();
                console.error('제출 실패:', errorData);
                alert(errorData.error || '제출 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.');
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('제출 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (questionId: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [questionId]: value,
        }));
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
                    <div>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-black mb-2">{currentStep === 0 ? '안내사항' : `단계 ${currentStep}`}</h2>
                            <p className="text-gray-600">{currentStep === 0 ? '다음 단계로 진행하기 전에 안내사항을 확인해주세요.' : '모든 필수 항목을 작성해주세요.'}</p>
                        </div>

                        <div className="pr-2 space-y-8">
                            {currentQuestions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">이 단계에는 질문이 없습니다.</div>
                            ) : (
                                currentQuestions.map((question) => (
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

                            {/* ✅ 5단계 : 객실 */}
                            {currentStep === 5 && (
                                <div className="mt-6 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-black">객실 정보 입력</h3>
                                        <button type="button" onClick={handleAddRoom} className="px-4 py-2 bg-gray-100 border-2 border-black rounded-lg text-sm font-semibold hover:bg-black hover:text-white transition-all">
                                            + 객실 추가
                                        </button>
                                    </div>

                                    {rooms.length === 0 && <p className="text-gray-500 text-sm">아직 등록된 객실이 없습니다. “객실 추가”를 눌러주세요.</p>}

                                    {rooms.map((room, index) => (
                                        <div key={room.id} className="p-4 border rounded-lg space-y-4 relative bg-gray-50">
                                            {rooms.length > 1 && (
                                                <button type="button" onClick={() => handleRemoveRoom(room.id)} className="absolute top-3 right-3 text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                                                    삭제
                                                </button>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-black text-white text-xs">{index + 1}</span>
                                                <p className="text-sm text-gray-700">객실 {index + 1}</p>
                                            </div>

                                            <div>
                                                <label className="block font-semibold mb-1">객실명</label>
                                                <input
                                                    type="text"
                                                    value={room.name}
                                                    onChange={(e) => {
                                                        const updated = rooms.map((r) => (r.id === room.id ? { ...r, name: e.target.value } : r));
                                                        setRooms(updated);
                                                    }}
                                                    className="w-full border border-gray-300 rounded-lg p-2"
                                                    placeholder="예: Signature Spa Room"
                                                />
                                            </div>

                                            <div>
                                                <label className="block font-semibold mb-1">객실 설명</label>
                                                <textarea
                                                    value={room.desc}
                                                    onChange={(e) => {
                                                        const updated = rooms.map((r) => (r.id === room.id ? { ...r, desc: e.target.value } : r));
                                                        setRooms(updated);
                                                    }}
                                                    className="w-full border border-gray-300 rounded-lg p-2"
                                                    rows={3}
                                                    placeholder="객실 특징, 뷰, 서비스 등을 적어주세요."
                                                />
                                            </div>

                                            <div>
                                                <label className="block font-semibold mb-1">형태</label>
                                                <input
                                                    type="text"
                                                    value={room.type}
                                                    onChange={(e) => {
                                                        const updated = rooms.map((r) => (r.id === room.id ? { ...r, type: e.target.value } : r));
                                                        setRooms(updated);
                                                    }}
                                                    className="w-full border border-gray-300 rounded-lg p-2"
                                                    placeholder="예: 침실1 + 거실1 + 화장실1"
                                                />
                                            </div>

                                            <div>
                                                <label className="block font-semibold mb-1">요금</label>
                                                <input
                                                    type="text"
                                                    value={room.price}
                                                    onChange={(e) => {
                                                        const updated = rooms.map((r) => (r.id === room.id ? { ...r, price: e.target.value } : r));
                                                        setRooms(updated);
                                                    }}
                                                    className="w-full border border-gray-300 rounded-lg p-2"
                                                    placeholder="예: 비수기(주중/주말) : 100,000 / 200,000"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ✅ 6단계 : 스페셜 */}
                            {currentStep === 6 && (
                                <div className="mt-6 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-black">스페셜 정보 입력</h3>
                                        <button type="button" onClick={handleAddSpecial} className="px-4 py-2 bg-gray-100 border-2 border-black rounded-lg text-sm font-semibold hover:bg-black hover:text-white transition-all">
                                            + 스페셜 추가
                                        </button>
                                    </div>

                                    {specials.length === 0 && <p className="text-gray-500 text-sm">아직 등록된 스페셜이 없습니다. “스페셜 추가”를 눌러주세요.</p>}

                                    {specials.map((sp, index) => (
                                        <div key={sp.id} className="p-4 border rounded-lg space-y-4 relative bg-gray-50">
                                            {specials.length > 1 && (
                                                <button type="button" onClick={() => handleRemoveSpecial(sp.id)} className="absolute top-3 right-3 text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                                                    삭제
                                                </button>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-black text-white text-xs">{index + 1}</span>
                                                <p className="text-sm text-gray-700">스페셜 {index + 1}</p>
                                            </div>

                                            <div>
                                                <label className="block font-semibold mb-1">스페셜명</label>
                                                <input
                                                    type="text"
                                                    value={sp.name}
                                                    onChange={(e) => {
                                                        const updated = specials.map((s) => (s.id === sp.id ? { ...s, name: e.target.value } : s));
                                                        setSpecials(updated);
                                                    }}
                                                    className="w-full border border-gray-300 rounded-lg p-2"
                                                    placeholder="예: 바비큐 세트 / 와인 서비스"
                                                />
                                            </div>

                                            <div>
                                                <label className="block font-semibold mb-1">스페셜 설명</label>
                                                <textarea
                                                    value={sp.desc}
                                                    onChange={(e) => {
                                                        const updated = specials.map((s) => (s.id === sp.id ? { ...s, desc: e.target.value } : s));
                                                        setSpecials(updated);
                                                    }}
                                                    className="w-full border border-gray-300 rounded-lg p-2"
                                                    rows={3}
                                                    placeholder="제공 조건, 인원수, 유의사항 등을 적어주세요."
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center mt-8 pt-6 border-t-2 border-gray-200">
                        {/* 왼쪽 */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handlePrevious}
                                disabled={currentStep === minStep}
                                className={`px-6 py-3 rounded-lg font-semibold transition-all ${currentStep === minStep ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-black border-2 border-black hover:bg-black hover:text-white'}`}
                            >
                                이전
                            </button>

                            {/* 5단계일 때 객실 추가 */}
                            {currentStep === 5 && (
                                <button onClick={handleAddRoom} className="px-6 py-3 bg-gray-100 border-2 border-black rounded-lg font-semibold hover:bg-black hover:text-white transition-all">
                                    객실 추가
                                </button>
                            )}

                            {/* 6단계일 때 스페셜 추가 */}
                            {currentStep === 6 && (
                                <button onClick={handleAddSpecial} className="px-6 py-3 bg-gray-100 border-2 border-black rounded-lg font-semibold hover:bg-black hover:text-white transition-all">
                                    스페셜 추가
                                </button>
                            )}
                        </div>

                        {/* 오른쪽 */}
                        <div className="flex gap-3">
                            <button onClick={handleSaveDraft} disabled={submitting} className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:border-black transition-all disabled:opacity-50">
                                💾 임시저장
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

                {/* Back to Home */}
                <div className="text-center mt-6">
                    <button
                        onClick={() => {
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
