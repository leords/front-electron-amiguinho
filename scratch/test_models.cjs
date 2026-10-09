const path = require('path');
const prismaPath = path.resolve('../node-amiguinho-central/node_modules/@prisma/client');
const { PrismaClient } = require(prismaPath);
const prisma = new PrismaClient();

async function main() {
  const models = Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_'));
  console.log('MODELOS PRISMA:', models);
}

main().catch(console.error).finally(() => prisma.$disconnect());
