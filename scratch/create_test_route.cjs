const path = require('path');
const crypto = require('crypto');
const prismaPath = path.resolve('../node-amiguinho-central/node_modules/@prisma/client');
const { PrismaClient } = require(prismaPath);
const prisma = new PrismaClient();

async function main() {
  const dataHojeStr = '2026-10-01'; // Data de teste
  const usuarioId = 6; // Emerson

  console.log('Criando pedidos e localizações de teste para Emerson (id: 6) na data', dataHojeStr);

  const clientes = [
    { id: 1, nome: 'BRITO', lat: -26.1752, lon: -50.3925, hora: '08:30:00', origem: 'pedido', total: 420.0 },
    { id: 8, nome: 'ZE PADILHA', lat: -26.1824, lon: -50.3851, hora: '09:15:00', origem: 'visita', total: 0 },
    { id: 9, nome: 'SANDRA BUENO', lat: -26.3712, lon: -50.1432, hora: '10:40:00', origem: 'pedido', total: 685.5 },
    { id: 10, nome: 'KARPEM', lat: -26.3748, lon: -50.1408, hora: '11:30:00', origem: 'pedido', total: 310.0 },
    { id: 11, nome: 'MIKAS', lat: -26.3775, lon: -50.1385, hora: '13:15:00', origem: 'visita', total: 0 },
    { id: 14, nome: 'PRIMO', lat: -26.3842, lon: -50.1315, hora: '14:20:00', origem: 'pedido', total: 950.0 },
  ];

  // Limpa registros anteriores de teste para hoje se necessário
  await prisma.localizacao.deleteMany({
    where: {
      usuarioId: usuarioId,
      data: {
        gte: new Date(`${dataHojeStr}T00:00:00.000Z`),
        lte: new Date(`${dataHojeStr}T23:59:59.999Z`),
      }
    }
  });

  for (let i = 0; i < clientes.length; i++) {
    const item = clientes[i];
    const dataHoraISO = new Date(`${dataHojeStr}T${item.hora}.000Z`);

    // 1. Cria localização na tabela localizacao
    const loc = await prisma.localizacao.create({
      data: {
        uuid: crypto.randomUUID(),
        data: dataHoraISO,
        latitude: item.lat,
        longitude: item.lon,
        precisao: 8,
        origem: item.origem,
        usuarioId: usuarioId,
        clienteId: item.id
      }
    });

    console.log(`Localização #${i + 1} criada para cliente ${item.nome} (${item.origem}) às ${item.hora}`);

    // 2. Se for pedido, cria também pedidoExterno
    if (item.origem === 'pedido') {
      const ped = await prisma.pedidoExterno.create({
        data: {
          uuid: crypto.randomUUID(),
          tipo: 'externo',
          clienteId: item.id,
          formaPagamentoId: 1,
          vendedor: 'Emerson',
          total: item.total,
          status: 'carregado',
          data: dataHoraISO,
          usuarioId: usuarioId
        }
      });
      console.log(`  -> PedidoExterno #${ped.id} criado com total R$ ${item.total}`);
    }
  }

  console.log('--- TESTE CONCLUÍDO COM SUCESSO! ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
