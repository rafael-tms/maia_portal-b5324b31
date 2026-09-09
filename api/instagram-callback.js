// api/instagram-callback.js

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Nenhum código recebido.');
  }

  try {
    const shortTokenRes = await fetch(
      `https://api.instagram.com/oauth/access_token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.INSTAGRAM_APP_ID,
          client_secret: process.env.INSTAGRAM_APP_SECRET,
          grant_type: 'authorization_code',
          redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
          code,
        }),
      }
    );

    const shortTokenData = await shortTokenRes.json();

    if (!shortTokenData.access_token) {
      console.error('Erro ao trocar code por token:', shortTokenData);
      return res.status(500).send('Falha ao obter token. Veja os logs no Vercel.');
    }

    const longTokenRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${shortTokenData.access_token}`
    );

    const longTokenData = await longTokenRes.json();

    if (!longTokenData.access_token) {
      console.error('Erro ao gerar token de longa duração:', longTokenData);
      return res.status(500).send('Falha ao gerar token de longa duração.');
    }

    return res.status(200).send(`
      <h2>Login concluído ✅</h2>
      <p>Copie o valor abaixo e cole em <b>INSTAGRAM_LONG_LIVED_TOKEN</b> nas Environment Variables do Vercel:</p>
      <textarea style="width:100%;height:80px">${longTokenData.access_token}</textarea>
      <p>Expira em aproximadamente ${Math.round(longTokenData.expires_in / 86400)} dias.</p>
    `);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Erro interno.');
  }
}