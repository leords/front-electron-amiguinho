const path = require('path');
const prismaPath = path.resolve('../node-amiguinho-central/node_modules/@prisma/client');
console.log('Prisma path:', prismaPath);

try {
  const { PrismaClient } = require(prismaPath);
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  async function main() {
    const usuarios = await prisma.usuario.findMany();
    console.log('USUARIOS:', usuarios.map(u => ({ id: u.id, nome: u.nome, usuario: u.usuario, nivelAcesso: u.nivelAcesso })));
  }

  main().catch(console.error).finally(() => prisma.$disconnect());
} catch (e) {
  console.error('Error requiring prisma:', e.message);
}
