import Link from 'next/link';

export default function ThankYouPage() {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="max-w-2xl mx-auto px-4 py-12 text-center">
                <div className="mb-8">
                    <div className="text-6xl mb-6">✅</div>
                    <h1 className="text-4xl font-bold text-black mb-4">제출이 완료되었습니다</h1>
                    <p className="text-xl text-gray-600 mb-8">양식이 성공적으로 제출되었습니다. 감사합니다.</p>
                </div>

                <Link href="/" className="inline-block px-8 py-4 bg-black text-white text-lg font-semibold rounded-lg hover:bg-gray-800 transition-all">
                    홈으로 돌아가기
                </Link>
            </div>
        </div>
    );
}
