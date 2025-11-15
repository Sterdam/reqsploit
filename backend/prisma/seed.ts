import { PrismaClient, Plan } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // Create test users
  const testUserPassword = await bcrypt.hash('password123', 12);

  const freeUser = await prisma.user.upsert({
    where: { email: 'free@test.com' },
    update: {},
    create: {
      email: 'free@test.com',
      passwordHash: testUserPassword,
      name: 'Free User',
      plan: Plan.FREE,
      emailVerified: true,
    },
  });

  const proUser = await prisma.user.upsert({
    where: { email: 'pro@test.com' },
    update: {},
    create: {
      email: 'pro@test.com',
      passwordHash: testUserPassword,
      name: 'Pro User',
      plan: Plan.PRO,
      emailVerified: true,
    },
  });

  const enterpriseUser = await prisma.user.upsert({
    where: { email: 'enterprise@test.com' },
    update: {},
    create: {
      email: 'enterprise@test.com',
      passwordHash: testUserPassword,
      name: 'Enterprise User',
      plan: Plan.ENTERPRISE,
      emailVerified: true,
    },
  });

  // Create token usage for test users
  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  await prisma.tokenUsage.upsert({
    where: {
      userId_monthYear: {
        userId: freeUser.id,
        monthYear,
      },
    },
    update: {},
    create: {
      userId: freeUser.id,
      monthYear,
      tokensUsed: 0,
      tokensLimit: 10000,
      resetDate: nextMonth,
    },
  });

  await prisma.tokenUsage.upsert({
    where: {
      userId_monthYear: {
        userId: proUser.id,
        monthYear,
      },
    },
    update: {},
    create: {
      userId: proUser.id,
      monthYear,
      tokensUsed: 0,
      tokensLimit: 100000,
      resetDate: nextMonth,
    },
  });

  await prisma.tokenUsage.upsert({
    where: {
      userId_monthYear: {
        userId: enterpriseUser.id,
        monthYear,
      },
    },
    update: {},
    create: {
      userId: enterpriseUser.id,
      monthYear,
      tokensUsed: 0,
      tokensLimit: 500000,
      resetDate: nextMonth,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('\n📧 Test Accounts:');
  console.log('   Free User: free@test.com / password123');
  console.log('   Pro User: pro@test.com / password123');
  console.log('   Enterprise User: enterprise@test.com / password123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
