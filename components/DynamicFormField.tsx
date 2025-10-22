'use client';

import { useState } from 'react';

interface FieldOption {
    label: string;
    hasInput?: boolean;
}

interface RepeatableField {
    label: string;
    type: 'text' | 'file';
    placeholder?: string;
}

interface DynamicFormFieldProps {
    question: {
        id: string;
        title: string;
        description?: string;
        thumbnail?: string;
        questionType: string;
        options?: string;
        isRequired: boolean;
        minLength?: number;
        maxLength?: number;
    };
    value: any;
    onChange: (value: any) => void;
    error?: string;
}

export default function DynamicFormField({ question, value, onChange, error }: DynamicFormFieldProps) {
    const [checkedOptions, setCheckedOptions] = useState<string[]>([]);
    const [repeatableItems, setRepeatableItems] = useState<any[]>([{}]);
    const [uploading, setUploading] = useState(false);

    const parsedOptions = question.options ? JSON.parse(question.options) : null;

    // 파일 업로드 핸들러
    const handleFileUpload = async (file: File): Promise<string | null> => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            
            if (response.ok && data.url) {
                return data.url;
            } else {
                console.error('Upload failed:', data);
                alert(`파일 업로드 실패: ${data.error || '알 수 없는 오류'}`);
                return null;
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('파일 업로드 중 오류가 발생했습니다.');
            return null;
        } finally {
            setUploading(false);
        }
    };

    // 텍스트 입력
    if (question.questionType === 'text') {
        return (
            <div className="space-y-3">
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
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all ${
                        error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder={`${question.title}을(를) 입력하세요`}
                    maxLength={question.maxLength}
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
        );
    }

    // 텍스트 영역
    if (question.questionType === 'textarea') {
        return (
            <div className="space-y-3">
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
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    rows={6}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all ${
                        error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="여기에 답변을 입력하세요..."
                    maxLength={question.maxLength}
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
        );
    }

    // 파일 업로드
    if (question.questionType === 'file') {
        return (
            <div className="space-y-3">
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
                <input
                    type="file"
                    accept="image/*,.pdf"
                    disabled={uploading}
                    onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const url = await handleFileUpload(file);
                            if (url) {
                                onChange(url);
                            }
                        }
                    }}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-black file:text-white file:cursor-pointer hover:file:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {uploading && <p className="text-sm text-blue-600">⏳ 업로드 중...</p>}
                {value && !uploading && <p className="text-sm text-green-600">✅ 파일 업로드 완료: {value.split('/').pop()}</p>}
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
        );
    }

    // 체크박스 (조건부 입력 필드)
    if (question.questionType === 'checkbox' && parsedOptions?.checkboxes) {
        const currentValue = value || { checked: [], inputs: {} };
        
        return (
            <div className="space-y-3">
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

                <div className="space-y-3">
                    {parsedOptions.checkboxes.map((option: FieldOption, idx: number) => {
                        const isChecked = currentValue.checked?.includes(option.label);
                        
                        return (
                            <div key={idx} className="border-2 border-gray-200 rounded-lg p-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                            const newChecked = e.target.checked
                                                ? [...(currentValue.checked || []), option.label]
                                                : (currentValue.checked || []).filter((c: string) => c !== option.label);
                                            
                                            onChange({
                                                ...currentValue,
                                                checked: newChecked,
                                            });
                                        }}
                                        className="w-5 h-5 text-black border-2 border-gray-300 rounded focus:ring-2 focus:ring-black"
                                    />
                                    <span className="font-semibold text-black">{option.label}</span>
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
                                        placeholder={`${option.label} 입력`}
                                        className="mt-3 w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
        );
    }

    // 반복 가능한 필드 (추가/삭제 가능)
    if (question.questionType === 'repeatable' && parsedOptions?.fields) {
        const currentValue = value || [];
        
        return (
            <div className="space-y-3">
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

                <div className="space-y-4">
                    {currentValue.map((item: any, itemIdx: number) => (
                        <div key={itemIdx} className="border-2 border-gray-300 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-semibold text-gray-700">항목 {itemIdx + 1}</span>
                                {currentValue.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newValue = currentValue.filter((_: any, idx: number) => idx !== itemIdx);
                                            onChange(newValue);
                                        }}
                                        className="text-sm text-red-600 hover:text-red-800 font-semibold"
                                    >
                                        삭제
                                    </button>
                                )}
                            </div>

                            {parsedOptions.fields.map((field: RepeatableField, fieldIdx: number) => (
                                <div key={fieldIdx}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        {field.label}
                                    </label>
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
                                            {item[field.label] && field.type === 'file' && (
                                                <p className="text-sm text-green-600 mt-1">✅ 파일: {item[field.label].split('/').pop()}</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={() => {
                            onChange([...currentValue, {}]);
                        }}
                        className="w-full px-4 py-3 border-2 border-dashed border-gray-400 rounded-lg font-semibold text-gray-700 hover:border-black hover:text-black transition-all"
                    >
                        + 항목 추가
                    </button>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
        );
    }

    // 기본: textarea (호환성)
    return (
        <div className="space-y-3">
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
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                rows={6}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black transition-all ${
                    error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="여기에 답변을 입력하세요..."
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}

