'use client';

import { useMemo, useState } from 'react';

interface FieldOption {
    label: string;
    hasInput?: boolean;
}

interface RepeatableField {
    label: string;
    type: 'text' | 'file';
    placeholder?: string;
}

/** 옵션 스키마 (타입가드용) */
interface CheckboxOptions {
    checkboxes: FieldOption[];
    multiple?: boolean; // 기본 true
}

interface RepeatableOptions {
    fields: RepeatableField[];
}

type AnyOptions = CheckboxOptions | RepeatableOptions | null;

interface DynamicFormFieldProps {
    question: {
        id: string;
        title: string;
        description?: string;
        thumbnail?: string;
        questionType: string; // 'notice' | 'text' | 'textarea' | 'file' | 'checkbox' | 'repeatable' ...
        options?: string;
        isRequired: boolean;
        minLength?: number;
        maxLength?: number;
    };
    value: any;
    onChange: (value: any) => void;
    error?: string;
}

/** 안전 파싱 + 타입가드 */
function parseOptions(options?: string): AnyOptions {
    if (!options) return null;
    try {
        const parsed = JSON.parse(options);
        if (parsed && typeof parsed === 'object') {
            return parsed as AnyOptions;
        }
        return null;
    } catch (e) {
        console.error('Failed to parse options:', e);
        return null;
    }
}
function isCheckboxOptions(o: AnyOptions): o is CheckboxOptions {
    return !!o && Array.isArray((o as any).checkboxes);
}
function isRepeatableOptions(o: AnyOptions): o is RepeatableOptions {
    return !!o && Array.isArray((o as any).fields);
}

export default function DynamicFormField({ question, value, onChange, error }: DynamicFormFieldProps) {
    const [uploading, setUploading] = useState(false);

    // 기본값
    const questionType = question.questionType || 'text';

    // 옵션 파싱 (메모)
    const parsedOptions = useMemo(() => parseOptions(question.options), [question.options]);

    // 파일 업로드 핸들러
    const handleFileUpload = async (file: File): Promise<string | null> => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await response.json();

            if (response.ok && data.url) {
                return data.url as string;
            } else {
                console.error('Upload failed:', data);
                alert(`파일 업로드 실패: ${data.error || '알 수 없는 오류'}`);
                return null;
            }
        } catch (err) {
            console.error('Upload error:', err);
            alert('파일 업로드 중 오류가 발생했습니다.');
            return null;
        } finally {
            setUploading(false);
        }
    };

    // =========================
    // 안내 전용 notice (입력 없음)
    // =========================
    if (questionType === 'notice') {
        const hasThumbnail = !!question.thumbnail?.trim();
        const hasDescription = !!question.description?.trim();

        return (
            <section aria-label={question.title} className="space-y-4 py-6">
                {hasThumbnail && (
                    <div className="w-full h-48 bg-gray-100 rounded-xl overflow-hidden">
                        <img src={question.thumbnail!} alt={question.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                )}

                <div>
                    <h2 className="text-xl font-semibold text-black">{question.title}</h2>
                    {hasDescription && <p className="mt-2 text-gray-600 leading-relaxed whitespace-pre-line">{question.description}</p>}
                </div>

                <hr className="border-gray-200 mt-6" />
            </section>
        );
    }

    // 텍스트 입력
    if (questionType === 'text') {
        return (
            <div className="space-y-3">
                {question.thumbnail && (
                    <div className="w-full h-40 bg-gray-200 rounded-lg overflow-hidden">
                        <img src={question.thumbnail} alt={question.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                )}
                <label className="block">
                    <span className="text-lg font-semibold text-black">
                        {question.title}
                        {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                    </span>
                    {question.description && <span className="block text-sm text-gray-600 mt-1">{question.description}</span>}
                </label>
                <input
                    type="text"
                    value={value ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                    placeholder={`${question.title}을(를) 입력하세요`}
                    maxLength={question.maxLength}
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
        );
    }

    // 텍스트 영역
    if (questionType === 'textarea') {
        return (
            <div className="space-y-3">
                {question.thumbnail && (
                    <div className="w-full h-40 bg-gray-200 rounded-lg overflow-hidden">
                        <img src={question.thumbnail} alt={question.title} className="w-full h-full object-cover" loading="lazy" />
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
                    value={value ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    rows={6}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                    placeholder="여기에 답변을 입력하세요..."
                    maxLength={question.maxLength}
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
        );
    }

    // 파일 업로드
    if (questionType === 'file') {
        return (
            <div className="space-y-3">
                {question.thumbnail && (
                    <div className="w-full h-40 bg-gray-200 rounded-lg overflow-hidden">
                        <img src={question.thumbnail} alt={question.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                )}
                <label className="block">
                    <span className="text-lg font-semibold text-black">
                        {question.title}
                        {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                    </span>
                    {question.description && <span className="block text-sm text-gray-600 mt-1">{question.description}</span>}
                </label>
                <input
                    type="file"
                    accept="image/*,.pdf"
                    disabled={uploading}
                    onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const url = await handleFileUpload(file);
                            if (url) onChange(url);
                        }
                    }}
                    className="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-black file:text-white file:cursor-pointer hover:file:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {uploading && <p className="text-sm text-blue-600">⏳ 업로드 중...</p>}
                {value && !uploading && <p className="text-sm text-green-600">✅ 파일 업로드 완료: {typeof value === 'string' ? value.split('/').pop() : String(value)}</p>}
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
        );
    }

    // 체크박스 (조건부 입력)
    if (questionType === 'checkbox') {
        if (!isCheckboxOptions(parsedOptions)) {
            console.error('Invalid checkbox options:', parsedOptions);
            return (
                <div className="space-y-3">
                    <label className="block">
                        <span className="text-lg font-semibold text-black">
                            {question.title}
                            {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                        </span>
                        {question.description && <span className="block text-sm text-gray-600 mt-1">{question.description}</span>}
                    </label>
                    <p className="text-sm text-red-500">체크박스 설정 오류: 관리자에게 문의하세요.</p>
                    <textarea value={typeof value === 'string' ? value : ''} onChange={(e) => onChange(e.target.value)} rows={3} placeholder="여기에 답변을 입력하세요..." className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
            );
        }

        const isMultiple = parsedOptions.multiple !== false; // 기본 다중 선택
        const currentValue = value || (isMultiple ? { checked: [] as string[], inputs: {} as Record<string, string> } : { selected: '', inputs: {} as Record<string, string> });

        return (
            <div className="space-y-4 bg-white p-6 rounded-lg border-2 border-gray-200">
                {question.thumbnail && (
                    <div className="w-full h-40 bg-gray-200 rounded-lg overflow-hidden">
                        <img src={question.thumbnail} alt={question.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                )}
                <div>
                    <span className="text-lg font-semibold text-black">
                        {question.title}
                        {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                    </span>
                    {question.description && <p className="text-sm text-gray-600 mt-1">{question.description}</p>}
                    <p className="text-xs text-gray-500 mt-2">원하는 항목을 선택하고 정보를 입력해주세요</p>
                </div>

                <div className="space-y-3">
                    {parsedOptions.checkboxes.map((option, idx) => {
                        const isChecked = isMultiple ? currentValue.checked?.includes(option.label) : currentValue.selected === option.label;

                        return (
                            <div key={idx} className={`rounded-lg p-4 border-2 transition-all ${isChecked ? 'border-black' : 'border-gray-200'}`}>
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type={isMultiple ? 'checkbox' : 'radio'}
                                        name={isMultiple ? undefined : `question-${question.id}-radio`}
                                        checked={!!isChecked}
                                        onChange={(e) => {
                                            if (isMultiple) {
                                                const newChecked = e.target.checked ? [...(currentValue.checked || []), option.label] : (currentValue.checked || []).filter((c: string) => c !== option.label);

                                                onChange({ ...currentValue, checked: newChecked });
                                            } else {
                                                const newInputs: Record<string, string> = {};
                                                if (option.hasInput && currentValue.inputs?.[option.label]) {
                                                    newInputs[option.label] = currentValue.inputs[option.label];
                                                }
                                                onChange({ selected: option.label, inputs: newInputs });
                                            }
                                        }}
                                        className="w-5 h-5 mt-0.5 text-black border-2 border-gray-400 rounded focus:ring-2 focus:ring-black cursor-pointer"
                                    />
                                    <span className="font-semibold text-black flex-1">{option.label}</span>
                                </label>

                                {option.hasInput && isChecked && (
                                    <input
                                        type="text"
                                        value={currentValue.inputs?.[option.label] || ''}
                                        onChange={(e) => {
                                            onChange({
                                                ...currentValue,
                                                inputs: {
                                                    ...currentValue.inputs,
                                                    [option.label]: e.target.value,
                                                },
                                            });
                                        }}
                                        placeholder={`${option.label} 주소나 계정을 입력하세요`}
                                        className="mt-3 w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
                {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            </div>
        );
    }

    // 반복 가능한 필드
    if (questionType === 'repeatable') {
        if (!isRepeatableOptions(parsedOptions)) {
            console.error('Invalid repeatable options:', parsedOptions);
            return (
                <div className="space-y-3">
                    <label className="block">
                        <span className="text-lg font-semibold text-black">
                            {question.title}
                            {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                        </span>
                        {question.description && <span className="block text-sm text-gray-600 mt-1">{question.description}</span>}
                    </label>
                    <p className="text-sm text-red-500">반복 필드 설정 오류: 관리자에게 문의하세요.</p>
                </div>
            );
        }

        const currentValue: any[] = Array.isArray(value) ? value : [{}];

        return (
            <div className="space-y-3">
                {question.thumbnail && (
                    <div className="w-full h-40 bg-gray-200 rounded-lg overflow-hidden">
                        <img src={question.thumbnail} alt={question.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                )}
                <label className="block">
                    <span className="text-lg font-semibold text-black">
                        {question.title}
                        {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                    </span>
                    {question.description && <span className="block text-sm text-gray-600 mt-1">{question.description}</span>}
                </label>

                <div className="space-y-4">
                    {currentValue.map((item, itemIdx) => (
                        <div key={itemIdx} className="border-2 border-gray-300 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-semibold text-gray-700">항목 {itemIdx + 1}</span>
                                {currentValue.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newValue = currentValue.filter((_, idx) => idx !== itemIdx);
                                            onChange(newValue);
                                        }}
                                        className="text-sm text-red-600 hover:text-red-800 font-semibold"
                                    >
                                        삭제
                                    </button>
                                )}
                            </div>

                            {parsedOptions.fields.map((field, fieldIdx) => (
                                <div key={fieldIdx}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">{field.label}</label>
                                    {field.type === 'text' ? (
                                        <input
                                            type="text"
                                            value={item[field.label] || ''}
                                            onChange={(e) => {
                                                const newValue = [...currentValue];
                                                newValue[itemIdx] = {
                                                    ...newValue[itemIdx],
                                                    [field.label]: e.target.value,
                                                };
                                                onChange(newValue);
                                            }}
                                            placeholder={field.placeholder}
                                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                        />
                                    ) : (
                                        <>
                                            <input
                                                type="file"
                                                accept="image/*,.pdf"
                                                disabled={uploading}
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const url = await handleFileUpload(file);
                                                        if (url) {
                                                            const newValue = [...currentValue];
                                                            newValue[itemIdx] = {
                                                                ...newValue[itemIdx],
                                                                [field.label]: url,
                                                            };
                                                            onChange(newValue);
                                                        }
                                                    }
                                                }}
                                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-black file:text-white file:cursor-pointer hover:file:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                            {item[field.label] && field.type === 'file' && <p className="text-sm text-green-600 mt-1">✅ 파일: {typeof item[field.label] === 'string' ? item[field.label].split('/').pop() : String(item[field.label])}</p>}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}

                    <button type="button" onClick={() => onChange([...currentValue, {}])} className="w-full px-4 py-3 border-2 border-dashed border-gray-400 rounded-lg font-semibold text-gray-700 hover:border-black hover:text-black transition-all">
                        + 항목 추가
                    </button>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
        );
    }

    // 기본: textarea (호환용)
    return (
        <div className="space-y-3">
            {question.thumbnail && (
                <div className="w-full h-40 bg-gray-200 rounded-lg overflow-hidden">
                    <img src={question.thumbnail} alt={question.title} className="w-full h-full object-cover" loading="lazy" />
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
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
                rows={6}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                placeholder="여기에 답변을 입력하세요..."
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}
