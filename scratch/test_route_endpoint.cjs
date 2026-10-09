const path = require('path');
const jwt = require('jsonwebtoken');

// Token JWT para teste
const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_jwt' || 'amigao';

async function testar() {
  try {
    // Busca rota no endpoint
    // Se o backend tiver autenticadorMiddleware, vamos testar com token
    const token = jwt.sign({ id: 1, usuario: 'admin', nivelAcesso: 'ADMIN' }, 'amigaodistribuidora', { expiresIn: '1d' });

    const url = 'http://localhost:4000/localizacoes/vendedor?data=2026-10-01&usuarioId=6';
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    console.log('STATUS:', res.status);
    console.log('RESPOSTA ROTA:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('ERRO:', err.message);
  }
}

testar();
