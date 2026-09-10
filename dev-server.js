// dev-server.js — SÓ PARA TESTES LOCAIS, não sobe pro Vercel
require('dotenv').config();
const express = require('express');
const app = express();

// Instagram media endpoint
app.get('/api/instagram-media', async (req, res) => {
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

    return res.status(200).json({ posts: mediaData.data });
  } catch (err) {
    console.error('Erro na integração Instagram:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// TikTok media endpoint
app.get('/api/tiktok-media', async (req, res) => {
  try {
    const refreshToken = process.env.TIKTOK_REFRESH_TOKEN;
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

    if (!refreshToken || !clientKey || !clientSecret) {
      return res.status(500).json({ error: 'Credenciais do TikTok não configuradas.' });
    }

    // 1) Troca o refresh_token por um access_token
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('Erro ao obter access_token:', tokenData);
      return res.status(500).json({ error: 'Falha ao obter token de acesso do TikTok.' });
    }

    const accessToken = tokenData.access_token;

    // 2) Busca os vídeos do usuário
    const videosRes = await fetch('https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,duration,cover_image_url,embed_link,create_time', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        max_count: 3,
      }),
    });

    const videosData = await videosRes.json();

    if (videosData.error || !videosData.data?.videos) {
      console.error('Erro ao buscar vídeos:', videosData);
      return res.status(500).json({ error: 'Falha ao buscar vídeos do TikTok.' });
    }

    // Formata os vídeos
    const videos = videosData.data.videos.map(video => ({
      id: video.id,
      title: video.title || '',
      description: video.video_description || '',
      cover_url: video.cover_image_url || '',
      embed_link: video.embed_link || '',
      duration: video.duration || 0,
      created_at: video.create_time ? new Date(video.create_time * 1000).toISOString() : null,
    }));

    return res.status(200).json({ videos });
  } catch (err) {
    console.error('Erro na integração TikTok:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

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
