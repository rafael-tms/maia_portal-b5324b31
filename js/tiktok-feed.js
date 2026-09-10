// tiktok-feed.js
// Busca e exibe os vídeos do TikTok na seção de Redes Sociais

import { initTikTokPlayers } from './tiktok-player.js';

/**
 * Dados mockados para desenvolvimento local
 */
const MOCK_VIDEOS = [
  {
    id: '1',
    title: 'Treino de Finalizações',
    description: 'Trabalhando os chutes a gol! 🎯⚽ #Futebol #Treino',
    cover_url: 'https://picsum.photos/400/700?random=10',
    embed_link: 'https://www.tiktok.com/@maialeonaa',
    duration: 15,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Gol do Jogo!',
    description: 'Que golaço! 🔥⚽ #Gol #Futebol',
    cover_url: 'https://picsum.photos/400/700?random=11',
    embed_link: 'https://www.tiktok.com/@maialeonaa',
    duration: 20,
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: '3',
    title: 'Bastidores do Treino',
    description: 'Dia de muito trabalho! 💪 #Atleta #Dedication',
    cover_url: 'https://picsum.photos/400/700?random=12',
    embed_link: 'https://www.tiktok.com/@maialeonaa',
    duration: 18,
    created_at: new Date(Date.now() - 172800000).toISOString()
  }
];

/**
 * Verifica se está em ambiente de desenvolvimento local
 */
function isLocalDevelopment() {
  return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
}

/**
 * Busca os últimos vídeos do TikTok
 * @returns {Promise<Array>} Array com os vídeos do TikTok
 */
export async function fetchTikTokVideos() {
  console.log('[TikTok Feed] Iniciando busca de vídeos...');
  console.log('[TikTok Feed] Hostname:', location.hostname);
  
  // Em desenvolvimento local, usa dados mockados se a API não estiver disponível
  const isDev = isLocalDevelopment();
  if (isDev) {
    console.log('[TikTok Feed] Ambiente local detectado');
  }
  
  try {
    // Tenta buscar via API do Vercel (usa o token do servidor)
    console.log('[TikTok Feed] Fazendo fetch para /api/tiktok-media...');
    const response = await fetch('/api/tiktok-media');
    
    console.log('[TikTok Feed] Resposta recebida:', response.status, response.statusText);
    
    if (!response.ok) {
      console.warn('[TikTok Feed] Erro ao buscar vídeos. Status:', response.status);
      
      // Tenta ler o corpo da resposta para ver o erro
      try {
        const errorData = await response.json();
        console.error('[TikTok Feed] Detalhes do erro:', errorData);
      } catch (e) {
        console.error('[TikTok Feed] Não foi possível ler o corpo do erro');
      }
      
      // Se falhar em desenvolvimento local, usa mock
      if (isDev) {
        console.log('[TikTok Feed] Usando dados mockados para desenvolvimento');
        return MOCK_VIDEOS;
      }
      
      return [];
    }
    
    const data = await response.json();
    console.log('[TikTok Feed] Dados recebidos:', data);
    
    if (data.error) {
      console.warn('[TikTok Feed] Erro na resposta:', data.error, data.details);
      
      // Se falhar em desenvolvimento local, usa mock
      if (isDev) {
        console.log('[TikTok Feed] Usando dados mockados para desenvolvimento');
        return MOCK_VIDEOS;
      }
      
      return [];
    }
    
    // Verifica se há uma mensagem informativa (conta sem vídeos)
    if (data.message) {
      console.info('[TikTok Feed]', data.message);
    }
    
    // Retorna os vídeos formatados
    const videos = (data.videos || []).map(video => ({
      id: video.id,
      title: video.title || '',
      description: video.description || '',
      cover_url: video.cover_url,
      embed_link: video.embed_link,
      duration: video.duration,
      created_at: video.created_at,
      platform: 'tiktok'
    }));
    
    if (videos.length === 0) {
      console.warn('[TikTok Feed] A conta @maialeonaa não possui vídeos públicos ou visíveis para o app.');
      // Em produção, mostra mensagem ao usuário. Em dev, usa mock.
      if (isDev) {
        console.log('[TikTok Feed] Usando dados mockados para desenvolvimento');
        return MOCK_VIDEOS;
      }
    }
    
    console.log('[TikTok Feed] ✅ Vídeos REAIS formatados:', videos.length);
    return videos;
    
  } catch (error) {
    console.error('[TikTok Feed] Erro ao buscar vídeos do TikTok:', error);
    
    // Se falhar em desenvolvimento local, usa mock
    if (isDev) {
      console.log('[TikTok Feed] Usando dados mockados para desenvolvimento');
      return MOCK_VIDEOS;
    }
    
    return [];
  }
}

/**
 * Formata uma data ISO para formato legível
 * @param {string} isoDate Data no formato ISO
 * @returns {string} Data formatada
 */
function formatDate(isoDate) {
  if (!isoDate) return '';
  
  try {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
}

/**
 * Formata a duração em segundos para mm:ss
 * @param {number} seconds Duração em segundos
 * @returns {string} Duração formatada
 */
function formatDuration(seconds) {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * Renderiza os vídeos do TikTok na seção
 * @param {Array} videos Array de vídeos do TikTok
 * @param {HTMLElement} container Elemento container
 */
export function renderTikTokVideos(videos, container) {
  console.log('[TikTok Feed] Renderizando vídeos...', { videos: videos?.length, hasContainer: !!container });
  
  if (!container) {
    console.error('[TikTok Feed] Container não encontrado!');
    return;
  }
  
  if (!videos || videos.length === 0) {
    // Exibe mensagem quando não há vídeos
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09);">
        <p style="font-size: 16px; color: rgba(255,255,255,.72); margin-bottom: 20px;">
          Acompanhe a Maia no TikTok.
        </p>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <a href="https://www.tiktok.com/@maialeonaa" 
             target="_blank" 
             rel="noopener noreferrer"
             style="display: inline-flex; align-items: center; gap: 8px; background: #3cc674; color: #0a1611; font-size: 11.5px; font-weight: 800; letter-spacing: .14em; padding: 12px 20px; text-decoration: none;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 3c.4 2.2 1.9 3.9 4.1 4.2v3c-1.6.1-3.1-.4-4.4-1.3v6.3c0 3.5-2.8 6.3-6.3 6.3S3.6 18.7 3.6 15.2c0-3.5 2.8-6.3 6.3-6.3.3 0 .6 0 .9.1v3.1c-.3 0-.6-.1-.9-.1-1.8 0-3.2 1.4-3.2 3.2s1.4 3.2 3.2 3.2c1.8 0 3.3-1.4 3.3-3.1V3h3.3z"/>
            </svg>
            SEGUIR NO TIKTOK
          </a>
        </div>
      </div>
    `;
    return;
  }
  
  // Renderiza os cards dos vídeos no formato vertical do TikTok
  container.innerHTML = videos.map((video, index) => {
    const description = (video.description || video.title || '').replace(/\s+/g, ' ').trim();
    const shortDescription = description.length > 80 ? description.slice(0, 80) + '...' : description;
    const date = formatDate(video.created_at);
    const duration = formatDuration(video.duration);
    
    return `
      <div class="video-card tiktok-card"
         data-rv 
         data-d="${index}"
         data-embed-link="${video.embed_link || ''}"
         data-description="${shortDescription}"
         style="background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09); transition: border-color .4s; display: block; text-decoration: none; color: inherit; cursor: pointer;">
        <div style="position: relative; padding-bottom: 177.78%; background: #061009; overflow: hidden;">
          ${video.cover_url ? `
            <img src="${video.cover_url}" 
                 alt="${shortDescription || 'Vídeo do TikTok'}" 
                 loading="lazy"
                 style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;">
          ` : ''}
          <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10,22,17,0) 50%, rgba(10,22,17,.92) 100%);"></div>
          
          <!-- Badge TikTok -->
          <div style="position: absolute; top: 14px; left: 14px; background: rgba(0,0,0,.85); color: #fff; font-size: 10px; font-weight: 800; letter-spacing: .12em; padding: 6px 10px; display: flex; align-items: center; gap: 6px; border-radius: 4px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF0050">
              <path d="M16.5 3c.4 2.2 1.9 3.9 4.1 4.2v3c-1.6.1-3.1-.4-4.4-1.3v6.3c0 3.5-2.8 6.3-6.3 6.3S3.6 18.7 3.6 15.2c0-3.5 2.8-6.3 6.3-6.3.3 0 .6 0 .9.1v3.1c-.3 0-.6-.1-.9-.1-1.8 0-3.2 1.4-3.2 3.2s1.4 3.2 3.2 3.2c1.8 0 3.3-1.4 3.3-3.1V3h3.3z"/>
            </svg>
            TIKTOK
          </div>
          
          ${duration ? `
            <div style="position: absolute; bottom: 16px; right: 16px; background: rgba(0,0,0,.8); color: #fff; font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 4px;">
              ${duration}
            </div>
          ` : ''}
          
          <!-- Play Icon -->
          <div class="tiktok-play-btn" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 54px; height: 54px; background: rgba(255,0,80,.9); display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: transform .35s;">
            <div style="width: 0; height: 0; border-left: 14px solid #fff; border-top: 9px solid transparent; border-bottom: 9px solid transparent; margin-left: 3px;"></div>
          </div>
        </div>
        
        <div style="padding: 18px 22px;">
          ${date ? `
            <div style="font-size: 11px; font-weight: 800; color: #FF0050; letter-spacing: .14em;">
              ${date}
            </div>
          ` : ''}
          ${shortDescription ? `
            <div style="font-weight: 600; font-size: 14px; line-height: 1.45; margin-top: 8px; color: rgba(255,255,255,.92);">
              ${shortDescription}
            </div>
          ` : `
            <div style="font-weight: 600; font-size: 14px; line-height: 1.45; margin-top: 8px; color: rgba(255,255,255,.6); font-style: italic;">
              Ver vídeo do TikTok
            </div>
          `}
        </div>
      </div>
    `;
  }).join('');
  
  // Inicializa os players
  initTikTokPlayers(container);
}
