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
    const [rooms, setRooms] = useState<{ id: number; name: string; desc: string; type: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [userRole, setUserRole] = useState<string>('');

    // 상호명과 비밀번호
    const [companyName, setCompanyName] = useState('');
    const [password, setPassword] = useState('');
    const [existingSubmissionId, setExistingSubmissionId] = useState<string | null>(null);

    const maxStep = questions.length > 0 ? Math.max(...questions.map((q) => q.step)) : 1;
    const minStep = questions.length > 0 ? Math.min(...questions.map((q) => q.step)) : 0;

    // 질문이 로드되면 적절한 시작 단계로 설정
    useEffect(() => {
        if (questions.length > 0 && currentStep === -1) {
            setCurrentStep(minStep);
        }
    }, [questions, minStep, currentStep]);

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

        // localStorage에서 인증 정보 가져오기
        const localCompany = localStorage.getItem('companyName');
        const localPassword = localStorage.getItem('password');
        if (localCompany && localPassword) {
            setCompanyName(localCompany);
            setPassword(localPassword);
            // 자동으로 기존 제출 내역 확인
            setTimeout(() => {
                checkExistingSubmission(localCompany, localPassword);
            }, 1000);
        }

        fetchPortfolioAndQuestions();
    }, [slug]);

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
                    // 기존 제출 내역이 있으면 불러오기
                    setExistingSubmissionId(data.submission.id);
                    setFormData(data.submission.responses);
                      setRooms(data.submission.responses?.rooms || []); // ✅ 추가
                    alert('기존 작성 내역을 불러왔습니다.');

                    
                }
            }
        } catch (error) {
            console.error('Failed to check existing submission:', error);
        }
    };

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
                // 체크박스는 다중/단일 선택에 따라 확인
                else if (question.questionType === 'checkbox') {
                    if (!value || typeof value !== 'object') {
                        newErrors[question.id] = '최소 하나 이상 선택해주세요.';
                        isValid = false;
                        return;
                    }

                    try {
                        const options = JSON.parse(question.options || '{}');
                        const isMultiple = options.multiple !== false; // 기본값은 다중 선택

                        if (isMultiple) {
                            // 다중 선택: checked 배열 확인
                            if (!('checked' in value) || !(value as any).checked || (value as any).checked.length === 0) {
                                newErrors[question.id] = '최소 하나 이상 선택해주세요.';
                                isValid = false;
                                return;
                            }
                        } else {
                            // 단일 선택: selected 값 확인
                            if (!('selected' in value) || !(value as any).selected) {
                                newErrors[question.id] = '하나를 선택해주세요.';
                                isValid = false;
                                return;
                            }
                        }
                    } catch {
                        // JSON 파싱 실패 시 기본 다중 선택으로 처리
                        if (!('checked' in value) || !(value as any).checked || (value as any).checked.length === 0) {
                            newErrors[question.id] = '최소 하나 이상 선택해주세요.';
                            isValid = false;
                            return;
                        }
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
                // 동의 체크박스는 agreed 값 확인
                else if (question.questionType === 'agreement') {
                    if (!value || !value.agreed) {
                        newErrors[question.id] = '안내사항에 동의해주세요.';
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
            if (question.requireMinLength && (question.questionType === 'text' || question.questionType === 'textarea') && typeof value === 'string' && value.trim().length > 0 && value.trim().length < question.minLength) {
                newErrors[question.id] = `최소 ${question.minLength}자 이상 입력해주세요.`;
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

   const handleAddRoom = () => {
  const newId = rooms.length + 2; // ✅ 2부터 시작
  const newRoom = { id: newId, name: '', desc: '', type: '' };
  setRooms((prev) => [...prev, newRoom]);
};
    const handleNext = async () => {
        // 질문 단계 검증 후 다음 단계로
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
    rooms, // ✅ 객실 데이터 포함
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
        if (!validateStep() || !portfolio) return;

        setSubmitting(true);
        try {
            // 데이터베이스에 저장
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
                    {/* 질문 단계 */}
                    <div>
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-black mb-2">{currentStep === 0 ? '안내사항' : `단계 ${currentStep}`}</h2>
                            <p className="text-gray-600">{currentStep === 0 ? '다음 단계로 진행하기 전에 안내사항을 확인해주세요.' : '모든 필수 항목을 작성해주세요.'}</p>
                        </div>

                       {/* Questions - 스크롤 가능 영역 */}
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

  {/* ✅ 객실 입력 영역 (5단계 전용) */}
  {currentStep === 5 && (
    <div className="mt-6 space-y-8">
      {rooms.map((room, index) => (
        <div key={room.id} className="p-4 border rounded-lg space-y-4">
          <div>
            <label className="block font-semibold mb-1">객실명 {index + 1}</label>
            <input
              type="text"
              value={room.name}
              onChange={(e) => {
                const updated = [...rooms];
                updated[index].name = e.target.value;
                setRooms(updated);
              }}
              className="w-full border border-gray-300 rounded-lg p-2"
              placeholder={`객실${index + 1} 이름을 입력해주세요.`}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">객실 설명 {index + 1}</label>
            <textarea
              value={room.desc}
              onChange={(e) => {
                const updated = [...rooms];
                updated[index].desc = e.target.value;
                setRooms(updated);
              }}
              className="w-full border border-gray-300 rounded-lg p-2"
              rows={3}
              placeholder={`객실${index + 1} 설명을 입력해주세요.`}
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">형태 {index + 1}</label>
            <input
              type="text"
              value={room.type}
              onChange={(e) => {
                const updated = [...rooms];
                updated[index].type = e.target.value;
                setRooms(updated);
              }}
              className="w-full border border-gray-300 rounded-lg p-2"
              placeholder={`예: 침실1 + 거실1 + 화장실1`}
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

  {/* 왼쪽 버튼 그룹 */}
  <div className="flex items-center gap-4">
    {/* 이전 버튼 */}
    <button
      onClick={handlePrevious}
      disabled={currentStep === minStep}
      className={`px-6 py-3 rounded-lg font-semibold transition-all ${
        currentStep === minStep
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
          : 'bg-white text-black border-2 border-black hover:bg-black hover:text-white'
      }`}
    >
      이전
    </button>

    {/* ✅ 5단계일 때만 객실 추가 버튼 */}
    {currentStep === 5 && (
      <button
        onClick={handleAddRoom}
        className="px-6 py-3 bg-gray-100 border-2 border-black rounded-lg font-semibold hover:bg-black hover:text-white transition-all"
      >
        객실 추가
      </button>
    )}
  </div>

  {/* 오른쪽 버튼 그룹 */}
  <div className="flex gap-3">
    <button
      onClick={handleSaveDraft}
      disabled={submitting}
      className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:border-black transition-all disabled:opacity-50"
    >
      💾 임시저장
    </button>

    {currentStep < maxStep ? (
      <button
        onClick={handleNext}
        className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all"
      >
        {currentStep === 0 ? '시작하기' : '다음'}
      </button>
    ) : (
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
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

