const axios = require('axios');

async function testar() {
  try {
    const res = await axios.get('http://localhost:4000/listar-usuario');
    console.log('USUARIOS:', res.data);
  } catch (err) {
    console.error('ERRO:', err.message);
  }
}

testar();
