import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.user.updateMany({
    where: { email: 'john@realestatecrm.com' },
    data: { isActive: true }
  });
  console.log("User reactivated");
}
main().finally(() => prisma.$disconnect());
