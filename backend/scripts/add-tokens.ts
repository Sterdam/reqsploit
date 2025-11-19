import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addTokensToTestUser() {
  const user = await prisma.user.findUnique({
    where: { email: 'test@test.com' }
  });

  if (!user) {
    console.error('User test@test.com not found!');
    process.exit(1);
  }

  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Create or update token usage for current month
  const tokenUsage = await prisma.tokenUsage.upsert({
    where: {
      userId_monthYear: {
        userId: user.id,
        monthYear: monthYear,
      },
    },
    create: {
      userId: user.id,
      monthYear: monthYear,
      tokensUsed: 0,
      tokensLimit: 1000000, // 1M tokens
      resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1), // First day of next month
    },
    update: {
      tokensLimit: 1000000, // Update to 1M tokens
      tokensUsed: 0, // Reset usage
    },
  });

  console.log('✅ Tokens added successfully!');
  console.log(`User: ${user.email} (${user.id})`);
  console.log(`Month: ${monthYear}`);
  console.log(`Limit: ${tokenUsage.tokensLimit.toLocaleString()} tokens`);
  console.log(`Used: ${tokenUsage.tokensUsed.toLocaleString()} tokens`);
  console.log(`Remaining: ${(tokenUsage.tokensLimit - tokenUsage.tokensUsed).toLocaleString()} tokens`);
  console.log(`Reset Date: ${tokenUsage.resetDate.toISOString()}`);
}

addTokensToTestUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
