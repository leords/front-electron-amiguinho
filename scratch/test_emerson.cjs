async function testar() {
  try {
    const res = await fetch('http://localhost:4000/listar-usuario');
    const data = await res.json();
    console.log('USUARIOS:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('ERRO:', err.message);
  }
}

testar();
