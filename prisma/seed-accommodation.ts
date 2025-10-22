import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🏨 Creating accommodation portfolio and questions...');

    // 기존 포트폴리오 확인 및 생성/업데이트
    let portfolio = await prisma.portfolio.findUnique({
        where: { slug: 'accommodation-info' },
    });

    if (portfolio) {
        console.log('⚠️ Portfolio already exists, updating...');
        // 기존 질문 삭제
        await prisma.question.deleteMany({
            where: { portfolioId: portfolio.id },
        });
    } else {
        portfolio = await prisma.portfolio.create({
            data: {
                title: '숙소 정보 등록',
                description: '숙소 운영을 위한 필수 정보를 등록해주세요',
                slug: 'accommodation-info',
                isActive: true,
                order: 0,
            },
        });
    }

    console.log(`✅ Created portfolio: ${portfolio.title}`);

    // 질문들 생성 - 모두 step 1에 배치 (한 페이지에 모든 질문 표시)
    const questions = [
        // 1. 숙소명(국문)
        {
            portfolioId: portfolio.id,
            step: 1,
            order: 1,
            title: '1. 숙소명(국문)',
            description: '',
            questionType: 'text',
            isRequired: true,
            minLength: 2,
            maxLength: 100,
        },

        // 2. 숙소명(영문)
        {
            portfolioId: portfolio.id,
            step: 1,
            order: 2,
            title: '2. 숙소명(영문)',
            description: '',
            questionType: 'text',
            isRequired: true,
            minLength: 2,
            maxLength: 100,
        },

        // 3. 사업자 관련
        {
            portfolioId: portfolio.id,
            step: 1,
            order: 3,
            title: '3. 사업자 관련',
            description: '입력 필드 추가 및 삭제 가능',
            questionType: 'repeatable',
            options: JSON.stringify({
                fields: [
                    { label: '대표자명', type: 'text', placeholder: '대표자 이름을 입력하세요' },
                    { label: '번호', type: 'text', placeholder: '연락처를 입력하세요' },
                    { label: '사업자등록증', type: 'file' },
                ],
            }),
            isRequired: false,
            minLength: 0,
        },

        // 4. 홈페이지 담당자 연락처
        {
            portfolioId: portfolio.id,
            step: 1,
            order: 4,
            title: '4. 홈페이지 담당자 연락처',
            description: '입력 필드 추가 및 삭제 가능',
            questionType: 'repeatable',
            options: JSON.stringify({
                fields: [
                    { label: '담당자명', type: 'text', placeholder: '이름' },
                    { label: '연락처', type: 'text', placeholder: '010-0000-0000' },
                ],
            }),
            isRequired: true,
            minLength: 0,
        },

        // 5. 통장사본
        {
            portfolioId: portfolio.id,
            step: 1,
            order: 5,
            title: '5. 통장사본',
            description: '통장사본 파일을 첨부해주세요',
            questionType: 'file',
            isRequired: false,
            minLength: 0,
        },

        // 6. 농어촌민박신고번호
        {
            portfolioId: portfolio.id,
            step: 1,
            order: 6,
            title: '6. 농어촌민박신고번호',
            description: '',
            questionType: 'repeatable',
            options: JSON.stringify({
                fields: [
                    { label: '신고번호', type: 'text', placeholder: '농어촌민박신고번호 입력' },
                    { label: '농어촌민박신고증', type: 'file' },
                ],
            }),
            isRequired: false,
            minLength: 0,
        },

        // 7. 통신판매번호
        {
            portfolioId: portfolio.id,
            step: 1,
            order: 7,
            title: '7. 통신판매번호',
            description: '',
            questionType: 'repeatable',
            options: JSON.stringify({
                fields: [
                    { label: '신고번호', type: 'text', placeholder: '통신판매번호 입력' },
                    { label: '통신판매신고증', type: 'file' },
                ],
            }),
            isRequired: false,
            minLength: 0,
        },

        // 8. 숙소 주소
        {
            portfolioId: portfolio.id,
            step: 1,
            order: 8,
            title: '8. 숙소 주소',
            description: '도로명 주소로 작성 부탁드립니다.',
            questionType: 'text',
            isRequired: true,
            minLength: 5,
            maxLength: 200,
        },

        // 9. 이메일 주소
        {
            portfolioId: portfolio.id,
            step: 1,
            order: 9,
            title: '9. 이메일 주소',
            description: '',
            questionType: 'text',
            isRequired: true,
            minLength: 5,
            maxLength: 100,
        },

        // 10. SNS 계정
        {
            portfolioId: portfolio.id,
            step: 1,
            order: 10,
            title: '10. SNS 계정',
            description: '',
            questionType: 'checkbox',
            options: JSON.stringify({
                checkboxes: [
                    { label: '인스타그램', hasInput: true },
                    { label: '네이버 블로그', hasInput: true },
                    { label: '기타', hasInput: true },
                ],
            }),
            isRequired: false,
            minLength: 0,
        },
    ];

    for (const questionData of questions) {
        await prisma.question.create({
            data: questionData,
        });
    }

    console.log(`✅ Created ${questions.length} questions`);
    console.log('\n=================================');
    console.log('숙소 정보 등록 포트폴리오 생성 완료!');
    console.log('URL: /portfolio/accommodation');
    console.log('=================================\n');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
