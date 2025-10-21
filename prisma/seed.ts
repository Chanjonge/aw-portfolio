import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting database seed...');

    // Create super admin user
    const hashedPassword = await hash('admin123', 12);

    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            password: hashedPassword,
            name: '최고 관리자',
            role: 'SUPER_ADMIN',
        },
    });

    console.log('Super admin created:', superAdmin.email);

    // Create sample portfolios
    const portfolios = [
        {
            title: '웹 개발 포트폴리오',
            description: '웹 개발 프로젝트 지원을 위한 포트폴리오',
            slug: 'web-development',
            isActive: true,
            order: 1,
        },
        {
            title: '디자인 포트폴리오',
            description: '디자인 프로젝트 지원을 위한 포트폴리오',
            slug: 'design',
            isActive: true,
            order: 2,
        },
        {
            title: '마케팅 포트폴리오',
            description: '마케팅 프로젝트 지원을 위한 포트폴리오',
            slug: 'marketing',
            isActive: true,
            order: 3,
        },
    ];

    const createdPortfolios = [];
    for (const portfolio of portfolios) {
        const created = await prisma.portfolio.create({
            data: portfolio,
        });
        createdPortfolios.push(created);
        console.log(`Created portfolio: ${created.title}`);
    }

    // Create sample questions for first portfolio (웹 개발)
    const webDevQuestions = [
        {
            portfolioId: createdPortfolios[0].id,
            step: 1,
            order: 0,
            title: '자기소개를 해주세요',
            description: '본인에 대해 자유롭게 소개해주세요.',
            minLength: 10,
            isRequired: true,
        },
        {
            portfolioId: createdPortfolios[0].id,
            step: 1,
            order: 1,
            title: '웹 개발 경험을 설명해주세요',
            description: '어떤 웹 개발 프로젝트를 진행해보셨나요?',
            minLength: 10,
            isRequired: true,
        },
        {
            portfolioId: createdPortfolios[0].id,
            step: 2,
            order: 0,
            title: '가장 자신있는 기술 스택은 무엇인가요?',
            description: '프론트엔드, 백엔드, 데이터베이스 등',
            minLength: 10,
            isRequired: true,
        },
    ];

    // Create sample questions for second portfolio (디자인)
    const designQuestions = [
        {
            portfolioId: createdPortfolios[1].id,
            step: 1,
            order: 0,
            title: '자기소개를 해주세요',
            description: '본인에 대해 자유롭게 소개해주세요.',
            minLength: 10,
            isRequired: true,
        },
        {
            portfolioId: createdPortfolios[1].id,
            step: 1,
            order: 1,
            title: '디자인 철학을 공유해주세요',
            description: '어떤 디자인 철학을 가지고 계신가요?',
            minLength: 10,
            isRequired: true,
        },
        {
            portfolioId: createdPortfolios[1].id,
            step: 2,
            order: 0,
            title: '가장 만족스러웠던 프로젝트는?',
            description: '디자인 프로젝트 중 가장 기억에 남는 작업',
            minLength: 10,
            isRequired: true,
        },
    ];

    const allQuestions = [...webDevQuestions, ...designQuestions];
    for (const question of allQuestions) {
        await prisma.question.create({
            data: question,
        });
    }

    console.log(`Created ${allQuestions.length} sample questions across portfolios`);
    console.log('Database seed completed!');
    console.log('\n=================================');
    console.log('Super Admin Credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
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
