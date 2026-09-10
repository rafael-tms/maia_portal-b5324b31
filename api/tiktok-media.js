// api/tiktok-media.js

export default async function handler(req, res) {
  console.log('[TikTok API] Iniciando requisição...');
  
  try {
    const refreshToken = process.env.TIKTOK_REFRESH_TOKEN;
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

    console.log('[TikTok API] Verificando credenciais...', {
      hasRefreshToken: !!refreshToken,
      hasClientKey: !!clientKey,
      hasClientSecret: !!clientSecret,
      refreshTokenPrefix: refreshToken?.substring(0, 10)
    });

    if (!refreshToken || !clientKey || !clientSecret) {
      console.error('[TikTok API] Credenciais não configuradas');
      return res.status(500).json({ error: 'Credenciais do TikTok não configuradas.' });
    }

    console.log('[TikTok API] Solicitando access_token...');
    
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
    console.log('[TikTok API] Resposta do token:', { 
      status: tokenRes.status,
      hasAccessToken: !!tokenData.access_token,
      error: tokenData.error,
      errorDescription: tokenData.error_description
    });

    if (!tokenData.access_token) {
      console.error('[TikTok API] Erro ao obter access_token:', tokenData);
      return res.status(500).json({ 
        error: 'Falha ao obter token de acesso do TikTok.',
        details: tokenData.error_description || tokenData.error || 'Token inválido ou expirado'
      });
    }

    const accessToken = tokenData.access_token;
    console.log('[TikTok API] Access token obtido, buscando informações do usuário...');

    // 2a) Primeiro, busca informações do usuário para confirmar acesso
    const userInfoRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const userInfo = await userInfoRes.json();
    console.log('[TikTok API] Info do usuário:', {
      status: userInfoRes.status,
      data: userInfo
    });

    // 2b) Busca os vídeos do usuário
    console.log('[TikTok API] Buscando vídeos...');
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
    console.log('[TikTok API] Resposta dos vídeos:', {
      status: videosRes.status,
      hasVideos: !!videosData.data?.videos,
      videoCount: videosData.data?.videos?.length,
      error: videosData.error,
      fullResponse: JSON.stringify(videosData, null, 2)
    });

    // Verifica se há erro REAL na resposta (code diferente de "ok")
    if (videosData.error && videosData.error.code !== 'ok') {
      console.error('[TikTok API] Erro retornado pela API TikTok:', videosData.error);
      return res.status(500).json({ 
        error: 'Falha ao buscar vídeos do TikTok.',
        details: videosData.error.message || videosData.error.code || 'Erro desconhecido',
        tiktokError: videosData.error
      });
    }

    // Verifica se a estrutura de dados está correta
    if (!videosData.data) {
      console.error('[TikTok API] Resposta sem campo "data":', videosData);
      return res.status(500).json({ 
        error: 'Resposta inesperada da API TikTok.',
        details: 'Campo "data" não encontrado na resposta'
      });
    }

    // Verifica se há vídeos
    if (!videosData.data.videos || videosData.data.videos.length === 0) {
      console.warn('[TikTok API] Nenhum vídeo encontrado na conta.');
      console.warn('[TikTok API] Resposta completa:', JSON.stringify(videosData, null, 2));
      
      // Retorna array vazio em vez de erro para não quebrar o frontend
      return res.status(200).json({ 
        videos: [],
        message: 'Nenhum vídeo público encontrado na conta TikTok.',
        hasMore: videosData.data.has_more || false,
        cursor: videosData.data.cursor || null
      });
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

    console.log('[TikTok API] Sucesso! Retornando', videos.length, 'vídeos');

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');

    return res.status(200).json({ videos });
  } catch (err) {
    console.error('[TikTok API] Erro na integração TikTok:', err);
    return res.status(500).json({ 
      error: 'Erro interno',
      details: err.message
    });
  }
}
