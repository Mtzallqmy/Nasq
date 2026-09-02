import { PrismaClient } from '@prisma/client';
import { PERMISSION_CATALOG } from '../src/modules/workspaces/permission-catalog';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  for (const key of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key },
    });
  }
  console.info(`Seeded ${PERMISSION_CATALOG.length} permission definitions.`);
}

main()
  .finally(async () => prisma.$disconnect())
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
