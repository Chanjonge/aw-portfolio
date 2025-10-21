import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        console.log('🔄 Seed API called');
        
        // 보안을 위해 비밀 키 확인
        let body;
        try {
            body = await request.json();
        } catch (e) {
            console.error('Failed to parse JSON:', e);
            return NextResponse.json({ 
                error: 'Invalid JSON' 
            }, { status: 400 });
        }
        
        const { secretKey } = body;
        console.log('🔑 Secret key received:', secretKey ? 'yes' : 'no');
        
        // SEED_SECRET_KEY 환경 변수가 없으면 기본값 사용 (개발용)
        const expectedKey = process.env.SEED_SECRET_KEY || 'default-seed-key-2025';
        console.log('🔑 Expected key:', expectedKey);
        
        if (secretKey !== expectedKey) {
            console.log('❌ Secret key mismatch');
            return NextResponse.json({ 
                error: 'Unauthorized',
                message: 'Invalid secret key' 
            }, { status: 401 });
        }

        console.log('✅ Secret key valid, checking existing admin...');

        // 이미 관리자가 있는지 확인
        const existingAdmin = await prisma.user.findFirst({
            where: { role: 'SUPER_ADMIN' }
        });

        if (existingAdmin) {
            console.log('⚠️ Super admin already exists');
            return NextResponse.json({ 
                success: false,
                message: 'Super admin already exists',
                admin: { email: existingAdmin.email }
            }, { status: 200 }); // 200으로 변경
        }

        console.log('🔨 Creating super admin...');

        // Super Admin 생성
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const admin = await prisma.user.create({
            data: {
                email: 'admin@example.com',
                password: hashedPassword,
                name: 'Super Admin',
                role: 'SUPER_ADMIN',
            },
        });

        console.log('✅ Super admin created:', admin.email);

        // 샘플 포트폴리오 생성
        console.log('🔨 Creating portfolios...');
        const portfolios = await Promise.all([
            prisma.portfolio.create({
                data: {
                    title: '웹 개발 포트폴리오',
                    description: '웹 개발 프로젝트 신청서',
                    slug: 'web-dev',
                    isActive: true,
                    order: 1,
                },
            }),
            prisma.portfolio.create({
                data: {
                    title: '디자인 포트폴리오',
                    description: '디자인 프로젝트 신청서',
                    slug: 'design',
                    isActive: true,
                    order: 2,
                },
            }),
            prisma.portfolio.create({
                data: {
                    title: '마케팅 포트폴리오',
                    description: '마케팅 프로젝트 신청서',
                    slug: 'marketing',
                    isActive: true,
                    order: 3,
                },
            }),
        ]);

        console.log(`✅ Created ${portfolios.length} portfolios`);

        // 각 포트폴리오에 샘플 질문 생성
        console.log('🔨 Creating questions...');
        const questions = [];
        for (const portfolio of portfolios) {
            const q1 = await prisma.question.create({
                data: {
                    portfolioId: portfolio.id,
                    step: 1,
                    title: '프로젝트 이름을 입력해주세요',
                    description: '진행하실 프로젝트의 이름을 알려주세요',
                    minLength: 5,
                    order: 1,
                    isRequired: true,
                },
            });
            
            const q2 = await prisma.question.create({
                data: {
                    portfolioId: portfolio.id,
                    step: 2,
                    title: '프로젝트 설명을 입력해주세요',
                    description: '프로젝트에 대한 간단한 설명을 작성해주세요',
                    minLength: 20,
                    order: 1,
                    isRequired: true,
                },
            });
            
            questions.push(q1, q2);
        }

        console.log(`✅ Created ${questions.length} questions`);

        return NextResponse.json({ 
            success: true,
            message: 'Database seeded successfully! 🎉',
            data: {
                admin: { 
                    email: admin.email,
                    name: admin.name,
                    role: admin.role
                },
                portfolios: portfolios.length,
                questions: questions.length
            },
            credentials: {
                email: 'admin@example.com',
                password: 'admin123'
            }
        });
    } catch (error: any) {
        console.error('❌ Seed error:', error);
        console.error('Stack:', error.stack);
        return NextResponse.json({ 
            success: false,
            error: 'Seed failed', 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

// GET 요청 시 안내 메시지
export async function GET() {
    return NextResponse.json({
        message: 'Seed endpoint',
        usage: 'Send POST request with { "secretKey": "your-key" }',
        note: 'This endpoint creates initial admin user and sample data'
    });
}

