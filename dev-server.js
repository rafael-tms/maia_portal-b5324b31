// dev-server.js — SÓ PARA TESTES LOCAIS, não sobe pro Vercel
require('dotenv').config();
const express = require('express');
const app = express();

app.get('/api/tiktok-callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Nenhum código recebido.');

  const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: 'http://localhost:8080/api/tiktok-callback',
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.refresh_token) {
    console.error(tokenData);
    return res.status(500).send('Erro: ' + JSON.stringify(tokenData));
  }

  res.send(`
    <h2>Login concluído ✅</h2>
    <p>Copie e guarde este valor:</p>
    <textarea style="width:100%;height:80px">${tokenData.refresh_token}</textarea>
  `);
});

app.listen(3001, () => console.log('Servidor de teste rodando em http://localhost:3001'));