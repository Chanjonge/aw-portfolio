import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 체크박스 테스트 질문 시드 시작...');

    // 기존 포트폴리오 찾기 또는 생성
    let portfolio = await prisma.portfolio.findFirst({
        where: { slug: 'checkbox-test' },
    });

    if (!portfolio) {
        portfolio = await prisma.portfolio.create({
            data: {
                title: '체크박스 테스트 포트폴리오',
                description: '다양한 체크박스 유형을 테스트하는 포트폴리오입니다.',
                slug: 'checkbox-test',
                isActive: true,
                order: 999,
            },
        });
        console.log('✅ 테스트 포트폴리오 생성됨:', portfolio.title);
    }

    // 기존 질문들 삭제
    await prisma.question.deleteMany({
        where: { portfolioId: portfolio.id },
    });

    // 1. 다중 선택 체크박스 (추가 입력 필드 없음)
    await prisma.question.create({
        data: {
            portfolioId: portfolio.id,
            step: 1,
            title: '관심 있는 서비스를 모두 선택해주세요',
            description: '여러 개를 선택할 수 있습니다.',
            questionType: 'checkbox',
            options: JSON.stringify({
                multiple: true,
                checkboxes: [
                    { label: '웹 개발', hasInput: false },
                    { label: '모바일 앱 개발', hasInput: false },
                    { label: 'UI/UX 디자인', hasInput: false },
                    { label: '브랜딩', hasInput: false },
                    { label: '마케팅', hasInput: false },
                ],
            }),
            order: 1,
            isRequired: true,
        },
    });

    // 2. 단일 선택 라디오 버튼 (추가 입력 필드 없음)
    await prisma.question.create({
        data: {
            portfolioId: portfolio.id,
            step: 1,
            title: '프로젝트 예산 범위를 선택해주세요',
            description: '하나만 선택할 수 있습니다.',
            questionType: 'checkbox',
            options: JSON.stringify({
                multiple: false,
                checkboxes: [
                    { label: '100만원 미만', hasInput: false },
                    { label: '100-300만원', hasInput: false },
                    { label: '300-500만원', hasInput: false },
                    { label: '500만원 이상', hasInput: false },
                ],
            }),
            order: 2,
            isRequired: true,
        },
    });

    // 3. 다중 선택 체크박스 (추가 입력 필드 있음)
    await prisma.question.create({
        data: {
            portfolioId: portfolio.id,
            step: 1,
            title: '보유하신 SNS 계정을 모두 선택하고 계정 정보를 입력해주세요',
            description: '여러 개를 선택할 수 있으며, 선택한 항목에 대해 추가 정보를 입력해주세요.',
            questionType: 'checkbox',
            options: JSON.stringify({
                multiple: true,
                checkboxes: [
                    { label: '인스타그램', hasInput: true },
                    { label: '페이스북', hasInput: true },
                    { label: '유튜브', hasInput: true },
                    { label: '틱톡', hasInput: true },
                    { label: '네이버 블로그', hasInput: true },
                ],
            }),
            order: 3,
            isRequired: true,
        },
    });

    // 4. 단일 선택 라디오 버튼 (추가 입력 필드 있음)
    await prisma.question.create({
        data: {
            portfolioId: portfolio.id,
            step: 1,
            title: '선호하는 연락 방법을 선택하고 연락처를 입력해주세요',
            description: '하나만 선택할 수 있습니다.',
            questionType: 'checkbox',
            options: JSON.stringify({
                multiple: false,
                checkboxes: [
                    { label: '이메일', hasInput: true },
                    { label: '전화', hasInput: true },
                    { label: '카카오톡', hasInput: true },
                    { label: '문자메시지', hasInput: true },
                ],
            }),
            order: 4,
            isRequired: true,
        },
    });

    console.log('✅ 체크박스 테스트 질문들이 생성되었습니다!');
    console.log('📝 테스트 URL: http://localhost:3001/portfolio/checkbox-test');
}

main()
    .catch((e) => {
        console.error('❌ 시드 실행 중 오류:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
