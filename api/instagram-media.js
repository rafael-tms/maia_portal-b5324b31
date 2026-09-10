// api/instagram-media.js

export default async function handler(req, res) {
  try {
    const token = process.env.INSTAGRAM_LONG_LIVED_TOKEN;

    if (!token) {
      return res.status(500).json({ error: 'Token do Instagram não configurado.' });
    }

    // 1) Descobre as Páginas do Facebook vinculadas ao token
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${token}`
    );
    const pagesData = await pagesRes.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      console.error('Nenhuma página encontrada:', pagesData);
      return res.status(500).json({ error: 'Nenhuma página do Facebook encontrada para essa conta.' });
    }

    const pageId = pagesData.data[0].id;
    const pageAccessToken = pagesData.data[0].access_token;

    // 2) Descobre o Instagram Business Account ID vinculado a essa página
    const igAccountRes = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );
    const igAccountData = await igAccountRes.json();

    const igUserId = igAccountData.instagram_business_account?.id;

    if (!igUserId) {
      console.error('Conta Instagram não encontrada:', igAccountData);
      return res.status(500).json({ error: 'Conta Instagram Business não encontrada.' });
    }

    // 3) Busca os últimos posts
    const mediaRes = await fetch(
      `https://graph.facebook.com/v21.0/${igUserId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=3&access_token=${pageAccessToken}`
    );
    const mediaData = await mediaRes.json();

    if (!mediaData.data) {
      console.error('Erro ao buscar mídia:', mediaData);
      return res.status(500).json({ error: 'Falha ao buscar posts do Instagram.' });
    }

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');

    return res.status(200).json({ posts: mediaData.data });
  } catch (err) {
    console.error('Erro na integração Instagram:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}