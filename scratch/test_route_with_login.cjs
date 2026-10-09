async function testar() {
  try {
    // 1. Faz login com admin
    const loginRes = await fetch('http://localhost:4000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: 'admin', senha: '123' })
    });
    const loginData = await loginRes.json();
    console.log('LOGIN DATA:', loginData);

    const token = loginData.resultado?.token || loginData.token;
    if (!token) {
      console.log('Tentando login com gui...');
      const loginRes2 = await fetch('http://localhost:4000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: 'gui', senha: '123' })
      });
      const loginData2 = await loginRes2.json();
      console.log('LOGIN 2:', loginData2);
    }

    if (token) {
      const url = 'http://localhost:4000/localizacoes/vendedor?data=2026-10-01&usuarioId=6';
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      console.log('STATUS:', res.status);
      console.log('RESPOSTA ROTA:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('ERRO:', err.message);
  }
}

testar();
