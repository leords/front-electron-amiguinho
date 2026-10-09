const path = require('path');
const prismaPath = path.resolve('../node-amiguinho-central/node_modules/@prisma/client');
const { PrismaClient } = require(prismaPath);
const prisma = new PrismaClient();

async function main() {
  const clientes = await prisma.clienteExterno.findMany({ take: 5 });
  console.log('CLIENTES EXTERNOS:', JSON.stringify(clientes, null, 2));

  const ultimasLocalizacoes = await prisma.localizacao.findMany({ take: 3 });
  console.log('LOCALIZACOES:', JSON.stringify(ultimasLocalizacoes, null, 2));

  const produtos = await prisma.produto.findMany({ take: 3 });
  console.log('PRODUTOS:', JSON.stringify(produtos, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
