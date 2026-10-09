import fs from 'fs';

const controladorPath = 'c:/Users/Léo/Desktop/projetos/amigao/node-amiguinho-central/src/controlador/pedido/buscarPedidoControlador.js';
const controladorContent = `import {
  ERRO_MSG_PEDIDOS,
  HTTP_STATUS_CODES,
} from '../../config/httpStatusCodes.js'
import { AppError } from '../../error/appError.js'
import { BuscarPedidoServico } from '../../servico/pedido/buscarPedidoServico.js'
import { coletarErro } from '../../utilidades/coletarErro.js'

class BuscarPedidoControlador {
  async tratar(req, res, next) {
    const setor = req.query.setor ? req.query.setor : undefined
    const vendedor = req.query.vendedor ? req.query.vendedor : undefined
    const cliente = req.query.cliente ? req.query.cliente : undefined
    const formaPagamentoId = req.query.formaPagamentoId
      ? Number(req.query.formaPagamentoId)
      : undefined
    // Mantenho as datas vindos como strings, vem no formato 2025-12-14
    const dataInicio = req.query.dataInicio
    const dataFim = req.query.dataFim
    const usuarioId = req.query.usuarioId
      ? Number(req.query.usuarioId)
      : undefined
    const status = req.query.status ? req.query.status : undefined
    const semCarga = req.query.semCarga === 'true' || req.query.semCarga === true

    try {
      const opcoesSetor = ['delivery', 'externo', 'balcao']
      const opcoesVendedor = ['b1', 'b2', 'b3']

      if (setor && typeof setor !== 'string' && !opcoesSetor.includes(setor)) {
        throw new AppError(
          ERRO_MSG_PEDIDOS.SETOR,
          HTTP_STATUS_CODES.BAD_REQUEST,
          'VENDEDOR_NOT_FOUND'
        )
      }
      if (vendedor && typeof vendedor !== 'string') {
        throw new AppError(
          'Vendedor inválido',
          HTTP_STATUS_CODES.BAD_REQUEST,
          'VENDEDOR_NOT_FOUND'
        )
      }
      if (setor === 'balcao' && vendedor) {
        if (!opcoesVendedor.includes(vendedor)) {
          throw new AppError(
            ERRO_MSG_PEDIDOS.VENDEDOR_BALCAO,
            HTTP_STATUS_CODES.BAD_REQUEST,
            'SETOR_NOT_FOUND'
          )
        }
      }
      if (cliente && typeof cliente !== 'string') {
        throw new AppError(
          'Cliente inválido',
          HTTP_STATUS_CODES.BAD_REQUEST,
          'CLIENTE_NOT_FOUND'
        )
      }
      if (formaPagamentoId && isNaN(formaPagamentoId)) {
        throw new AppError(
          'Forma de pagamento inválida',
          HTTP_STATUS_CODES.BAD_REQUEST,
          'FORMA_PAGAMENTO_NOT_FOUND'
        )
      }
      if (usuarioId && isNaN(usuarioId)) {
        throw new AppError(
          'ID de usuário inválido',
          HTTP_STATUS_CODES.BAD_REQUEST,
          'USUARIO_NOT_FOUND'
        )
      }

      if (status && typeof status !== 'string') {
        throw new AppError(
          'Status inválido',
          HTTP_STATUS_CODES.BAD_REQUEST,
          'STATUS_NOT_FOUND'
        )
      }

      // valido a tipagem das datas.
      if (
        dataInicio &&
        typeof dataInicio !== 'string' &&
        dataFim &&
        typeof dataFim !== 'string'
      ) {
        throw new AppError(
          'Data inválida',
          HTTP_STATUS_CODES.BAD_REQUEST,
          'DATA_NOT_FOUND'
        )
      }

      // transformo elas em ISO manualmente. desta forma consigo pegar o intervalo do dia inteiro.
      const inicio = dataInicio
        ? new Date(\`\${dataInicio}T00:00:00-03:00\`)
        : undefined
      const fim = dataFim
        ? new Date(\`\${dataFim}T23:59:59.999-03:00\`)
        : undefined

      const servico = new BuscarPedidoServico()
      const resultado = await servico.executar(
        setor,
        vendedor,
        cliente,
        formaPagamentoId,
        inicio,
        fim,
        usuarioId,
        status,
        semCarga
      )

      return res.status(HTTP_STATUS_CODES.OK).json(resultado)
    } catch (error) {
      console.log(error)
      next(error)
    }
  }
}

export { BuscarPedidoControlador }
`;

fs.writeFileSync(controladorPath, controladorContent, 'utf8');

const servicoPath = 'c:/Users/Léo/Desktop/projetos/amigao/node-amiguinho-central/src/servico/pedido/buscarPedidoServico.js';
const servicoContent = `import prismaCliente from '../../prisma/index.js'

class BuscarPedidoServico {
  async executar(
    setor,
    vendedor,
    cliente,
    formaPagamentoId,
    dataInicio,
    dataFim,
    usuarioId,
    status,
    semCarga = false
  ) {
    // Campos comuns aos três models.
    const queryBase = {}

    if (vendedor) queryBase.vendedor = vendedor.trim()
    if (usuarioId) queryBase.usuarioId = usuarioId
    if (dataInicio && dataFim) {
      queryBase.data = {
        gte: dataInicio,
        lte: dataFim,
      }
    }

    if (status) queryBase.status = status

    // Delivery: cliente é relação (via clienteId), formaPagamentoId é escalar direto
    const queryDelivery = { ...queryBase }
    if (formaPagamentoId) queryDelivery.formaPagamentoId = formaPagamentoId
    if (cliente) {
      queryDelivery.cliente = {
        nome: {
          contains: cliente,
          mode: 'insensitive',
        },
      }
    }

    // Externo: mesma estrutura do Delivery
    const queryExterno = { ...queryBase }
    if (formaPagamentoId) queryExterno.formaPagamentoId = formaPagamentoId
    if (semCarga) {
      queryExterno.cargaId = null
    }
    if (cliente) {
      queryExterno.cliente = {
        nome: {
          contains: cliente,
          mode: 'insensitive',
        },
      }
    }

    // Balcao: cliente é String simples, formaPagamentoId vem via relação "pagamentos"
    const queryBalcao = { ...queryBase }
    if (cliente) {
      queryBalcao.cliente = {
        contains: cliente,
        mode: 'insensitive',
      }
    }
    if (formaPagamentoId) {
      queryBalcao.pagamentos = {
        some: {
          formaPagamentoId,
        },
      }
    }

    try {
      if (setor === 'delivery') {
        return await prismaCliente.pedidoDelivery.findMany({
          where: queryDelivery,
          include: {
            itens: true,
            cliente: true,
            formaPagamento: true,
          },
          orderBy: {
            data: 'desc',
          },
        })
      }

      if (setor === 'externo') {
        return await prismaCliente.pedidoExterno.findMany({
          where: queryExterno,
          include: {
            itens: true,
            cliente: true,
            formaPagamento: true,
            carga: true,
            usuario: {
              select: {
                nome: true,
              },
            },
          },
          orderBy: {
            data: 'desc',
          },
        })
      }

      if (setor === 'balcao') {
        return await prismaCliente.pedidoBalcao.findMany({
          where: queryBalcao,
          include: {
            itens: true,
            pagamentos: {
              include: {
                formaPagamento: true,
              },
            },
          },
          orderBy: {
            data: 'desc',
          },
        })
      }

      const [pedidosDelivery, pedidosExterno, pedidosBalcao] =
        await Promise.all([
          prismaCliente.pedidoDelivery.findMany({
            where: queryDelivery,
            include: {
              itens: true,
              cliente: true,
              formaPagamento: true,
            },
            orderBy: {
              data: 'desc',
            },
          }),

          prismaCliente.pedidoExterno.findMany({
            where: queryExterno,
            include: {
              itens: true,
              cliente: true,
              formaPagamento: true,
              carga: true,
              usuario: {
                select: {
                  nome: true,
                },
              },
            },
            orderBy: {
              data: 'desc',
            },
          }),

          prismaCliente.pedidoBalcao.findMany({
            where: queryBalcao,
            include: {
              itens: true,
              pagamentos: {
                include: {
                  formaPagamento: true,
                },
              },
            },
            orderBy: {
              data: 'desc',
            },
          }),
        ])

      return [...pedidosDelivery, ...pedidosExterno, ...pedidosBalcao]
    } catch (error) {
      console.log(error)
      throw error
    }
  }
}

export { BuscarPedidoServico }
`;

fs.writeFileSync(servicoPath, servicoContent, 'utf8');
console.log('Arquivos do backend atualizados com sucesso!');
