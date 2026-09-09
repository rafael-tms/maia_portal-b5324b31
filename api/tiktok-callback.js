// api/tiktok-callback.js

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Nenhum código recebido.');
  }

  try {
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.TIKTOK_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.refresh_token) {
      console.error('Erro ao trocar code por token:', tokenData);
      return res.status(500).send('Falha ao obter token. Veja os logs no Vercel.');
    }

    return res.status(200).send(`
      <h2>Login concluído ✅</h2>
      <p>Copie o valor abaixo e cole em <b>TIKTOK_REFRESH_TOKEN</b> nas Environment Variables do Vercel:</p>
      <textarea style="width:100%;height:80px">${tokenData.refresh_token}</textarea>
    `);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Erro interno.');
  }
}