const path = require('path');
const prismaPath = path.resolve('../node-amiguinho-central/node_modules/@prisma/client');
const { PrismaClient } = require(prismaPath);
const prisma = new PrismaClient();

async function main() {
  const clientes = await prisma.cliente.findMany({
    take: 10,
    select: { id: true, nome: true, endereco: true, cidade: true, cnpj: true }
  });
  console.log('CLIENTES:', clientes);

  const formas = await prisma.formaPagamento.findMany({ take: 5 });
  console.log('FORMAS:', formas);

  const produtos = await prisma.produto.findMany({
    take: 5,
    select: { id: true, nome: true, precoVenda: true, estoque: true }
  });
  console.log('PRODUTOS:', produtos);

  // Check if there is a localizacao or rota model
  console.log('PRISMA KEYS:', Object.keys(prisma).filter(k => !k.startsWith('$') && !k.startsWith('_')));
}

main().catch(console.error).finally(() => prisma.$disconnect());
