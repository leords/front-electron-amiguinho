const path = require('path');
const prismaPath = path.resolve('../node-amiguinho-central/node_modules/@prisma/client');
const { PrismaClient } = require(prismaPath);
const prisma = new PrismaClient();

async function main() {
  const peds = await prisma.pedidoExterno.findMany({ take: 3 });
  console.log('PEDIDOS EXTERNOS:', JSON.stringify(peds, null, 2));

  const emersonClientes = await prisma.clienteExterno.findMany({
    where: { vendedor: { contains: 'EMERSON', mode: 'insensitive' } },
    take: 10
  });
  console.log('CLIENTES DO EMERSON:', emersonClientes.map(c => ({ id: c.id, nome: c.nome, endereco: c.endereco, cidade: c.cidade })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
