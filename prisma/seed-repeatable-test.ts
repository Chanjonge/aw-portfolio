import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 반복 가능한 필드 테스트 질문 시드 시작...');

    // 기존 포트폴리오 찾기 또는 생성
    let portfolio = await prisma.portfolio.findFirst({
        where: { slug: 'repeatable-test' },
    });

    if (!portfolio) {
        portfolio = await prisma.portfolio.create({
            data: {
                title: '반복 필드 테스트 포트폴리오',
                description: '반복 가능한 필드를 테스트하는 포트폴리오입니다.',
                slug: 'repeatable-test',
                isActive: true,
                order: 998,
            },
        });
        console.log('✅ 테스트 포트폴리오 생성됨:', portfolio.title);
    }

    // 기존 질문들 삭제
    await prisma.question.deleteMany({
        where: { portfolioId: portfolio.id },
    });

    // 1. 연락처 정보 (올바른 예시)
    await prisma.question.create({
        data: {
            portfolioId: portfolio.id,
            step: 1,
            title: '대표자 연락처 정보를 입력해주세요',
            description: '여러 개의 연락처를 추가할 수 있습니다.',
            questionType: 'repeatable',
            options: JSON.stringify({
                fields: [
                    { label: '연락처 유형', type: 'text', placeholder: '예: 휴대폰, 사무실, 팩스' },
                    { label: '연락처 번호', type: 'text', placeholder: '010-0000-0000' },
                ],
            }),
            order: 1,
            isRequired: true,
        },
    });

    // 2. 팀원 정보
    await prisma.question.create({
        data: {
            portfolioId: portfolio.id,
            step: 1,
            title: '프로젝트 참여 팀원 정보를 입력해주세요',
            description: '팀원을 추가하거나 삭제할 수 있습니다.',
            questionType: 'repeatable',
            options: JSON.stringify({
                fields: [
                    { label: '이름', type: 'text', placeholder: '팀원 이름' },
                    { label: '역할', type: 'text', placeholder: '예: 개발자, 디자이너, PM' },
                    { label: '경력', type: 'text', placeholder: '예: 3년' },
                    { label: '포트폴리오', type: 'file', placeholder: '포트폴리오 파일 업로드' },
                ],
            }),
            order: 2,
            isRequired: true,
        },
    });

    // 3. 잘못된 예시 (같은 label 사용)
    await prisma.question.create({
        data: {
            portfolioId: portfolio.id,
            step: 1,
            title: '❌ 잘못된 예시: 같은 라벨 사용',
            description: '이 질문은 데이터 저장에 문제가 있을 수 있습니다.',
            questionType: 'repeatable',
            options: JSON.stringify({
                fields: [
                    { label: '대표자명', type: 'text', placeholder: '연락처1' },
                    { label: '대표자명', type: 'text', placeholder: '연락처2' },
                ],
            }),
            order: 3,
            isRequired: false,
        },
    });

    console.log('✅ 반복 가능한 필드 테스트 질문들이 생성되었습니다!');
    console.log('📝 테스트 URL: http://localhost:3001/portfolio/repeatable-test');
    console.log('');
    console.log('🔍 테스트 포인트:');
    console.log('1. 첫 번째 질문: 올바른 형식 - 각 필드가 고유한 label을 가짐');
    console.log('2. 두 번째 질문: 복합 필드 - 텍스트와 파일 업로드 혼합');
    console.log('3. 세 번째 질문: 잘못된 형식 - 같은 label 사용으로 인한 문제 확인');
}

main()
    .catch((e) => {
        console.error('❌ 시드 실행 중 오류:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
