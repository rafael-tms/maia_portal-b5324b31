// api/instagram-callback.js
// Fluxo: Login do Instagram para Empresas (Instagram API with Instagram Login)

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Nenhum código recebido.');
  }

  try {
    // 1) Troca o code por um access_token de curta duração
    //    Endpoint específico do fluxo de Login do Instagram (não é o do Facebook)
    const shortTokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_APP_ID,
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
        code,
      }),
    });

    const shortTokenData = await shortTokenRes.json();

    if (!shortTokenData.access_token) {
      console.error('Erro ao trocar code por token:', shortTokenData);
      return res.status(500).send('Falha ao obter token. Veja os logs no Vercel.');
    }

    const shortLivedToken = shortTokenData.access_token;
    const igUserId = shortTokenData.user_id;

    // 2) Troca o token de curta duração por um de longa duração (~60 dias)
    //    Endpoint graph.instagram.com (não é graph.facebook.com)
    const longTokenRes = await fetch(
      `https://graph.instagram.com/access_token?` +
        new URLSearchParams({
          grant_type: 'ig_exchange_token',
          client_secret: process.env.INSTAGRAM_APP_SECRET,
          access_token: shortLivedToken,
        })
    );

    const longTokenData = await longTokenRes.json();

    if (!longTokenData.access_token) {
      console.error('Erro ao gerar token de longa duração:', longTokenData);
      return res.status(500).send('Falha ao gerar token de longa duração.');
    }

    const longLivedToken = longTokenData.access_token;

    // 3) Confirma os dados da conta do Instagram (opcional, só para conferência visual)
    const profileRes = await fetch(
      `https://graph.instagram.com/v21.0/${igUserId}?` +
        new URLSearchParams({
          fields: 'id,username,account_type',
          access_token: longLivedToken,
        })
    );

    const profileData = await profileRes.json();

    return res.status(200).send(`
      <h2>Login concluído ✅</h2>
      <p>Copie o valor abaixo e cole em <b>INSTAGRAM_LONG_LIVED_TOKEN</b> nas Environment Variables do Vercel:</p>
      <textarea style="width:100%;height:80px">${longLivedToken}</textarea>
      <p>Expira em aproximadamente ${Math.round((longTokenData.expires_in || 0) / 86400)} dias.</p>

      <h3>Conta autorizada:</h3>
      <p>
        Username: <b>${profileData.username || '(não retornado)'}</b><br>
        Instagram User ID: <b>${igUserId}</b><br>
        Tipo de conta: <b>${profileData.account_type || '(não retornado)'}</b>
      </p>
      <p>Copie também o <b>Instagram User ID</b> acima e salve em uma variável (ex: <b>INSTAGRAM_USER_ID</b>) — você vai precisar dele para buscar os posts depois.</p>
    `);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Erro interno.');
  }
}