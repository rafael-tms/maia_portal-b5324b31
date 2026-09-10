// instagram-feed.js
// Busca e exibe os posts do Instagram na seção de Redes Sociais

/**
 * Dados mockados para desenvolvimento local
 */
const MOCK_POSTS = [
  {
    id: '1',
    caption: 'Treino intenso de hoje! 💪⚽ Preparação para o próximo jogo.',
    media_type: 'IMAGE',
    media_url: 'https://picsum.photos/400/400?random=1',
    permalink: 'https://www.instagram.com/p/example1/',
    timestamp: new Date().toISOString(),
    platform: 'instagram'
  },
  {
    id: '2',
    caption: 'Gol importante na última partida! 🎯 Vamos em busca de mais vitórias!',
    media_type: 'IMAGE',
    media_url: 'https://picsum.photos/400/400?random=2',
    permalink: 'https://www.instagram.com/p/example2/',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    platform: 'instagram'
  },
  {
    id: '3',
    caption: 'Concentração e foco sempre! 🔥 #Futebol #Atleta',
    media_type: 'IMAGE',
    media_url: 'https://picsum.photos/400/400?random=3',
    permalink: 'https://www.instagram.com/p/example3/',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    platform: 'instagram'
  }
];

/**
 * Verifica se está em ambiente de desenvolvimento local
 */
function isLocalDevelopment() {
  return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
}

/**
 * Busca os últimos posts do Instagram
 * @returns {Promise<Array>} Array com os posts do Instagram
 */
export async function fetchInstagramPosts() {
  console.log('[Instagram Feed] Iniciando busca de posts...');
  
  // Em desenvolvimento local, usa dados mockados se a API não estiver disponível
  if (isLocalDevelopment()) {
    console.log('[Instagram Feed] Ambiente local detectado');
  }
  
  try {
    // Tenta buscar via API do Vercel (usa o token do servidor)
    const response = await fetch('/api/instagram-media');
    
    console.log('[Instagram Feed] Resposta recebida:', response.status);
    
    if (!response.ok) {
      console.warn('[Instagram Feed] Erro ao buscar posts:', response.status);
      
      // Se falhar em desenvolvimento local, usa mock
      if (isLocalDevelopment()) {
        console.log('[Instagram Feed] Usando dados mockados para desenvolvimento');
        return MOCK_POSTS;
      }
      
      return [];
    }
    
    const data = await response.json();
    console.log('[Instagram Feed] Dados recebidos:', data);
    
    if (data.error) {
      console.warn('[Instagram Feed] Erro na resposta:', data.error);
      
      // Se falhar em desenvolvimento local, usa mock
      if (isLocalDevelopment()) {
        console.log('[Instagram Feed] Usando dados mockados para desenvolvimento');
        return MOCK_POSTS;
      }
      
      return [];
    }
    
    // Retorna os posts formatados
    const posts = (data.posts || []).slice(0, 3).map(post => ({
      id: post.id,
      caption: post.caption || '',
      media_type: post.media_type,
      media_url: post.media_type === 'VIDEO' ? (post.thumbnail_url || post.media_url) : post.media_url,
      permalink: post.permalink,
      timestamp: post.timestamp,
      platform: 'instagram'
    }));
    
    console.log('[Instagram Feed] Posts formatados:', posts.length);
    return posts;
    
  } catch (error) {
    console.error('[Instagram Feed] Erro ao buscar posts do Instagram:', error);
    
    // Se falhar em desenvolvimento local, usa mock
    if (isLocalDevelopment()) {
      console.log('[Instagram Feed] Usando dados mockados para desenvolvimento');
      return MOCK_POSTS;
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
 * Renderiza os posts do Instagram na seção
 * @param {Array} posts Array de posts do Instagram
 * @param {HTMLElement} container Elemento container
 */
export function renderInstagramPosts(posts, container) {
  console.log('[Instagram Feed] Renderizando posts...', { posts: posts?.length, hasContainer: !!container });
  
  if (!container) {
    console.error('[Instagram Feed] Container não encontrado!');
    return;
  }
  
  if (!posts || posts.length === 0) {
    // Exibe mensagem quando não há posts
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09);">
        <p style="font-size: 16px; color: rgba(255,255,255,.72); margin-bottom: 20px;">
          Acompanhe a Maia no Instagram e no TikTok.
        </p>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <a href="https://www.instagram.com/maiakamperrodrigues/" 
             target="_blank" 
             rel="noopener noreferrer"
             style="display: inline-flex; align-items: center; gap: 8px; background: #3cc674; color: #0a1611; font-size: 11.5px; font-weight: 800; letter-spacing: .14em; padding: 12px 20px; text-decoration: none;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="2" width="20" height="20" rx="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/>
            </svg>
            INSTAGRAM
          </a>
          <a href="https://www.tiktok.com/@maialeonaa" 
             target="_blank" 
             rel="noopener noreferrer"
             style="display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(60,198,116,.55); color: #3cc674; font-size: 11.5px; font-weight: 800; letter-spacing: .14em; padding: 12px 20px; text-decoration: none;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 3c.4 2.2 1.9 3.9 4.1 4.2v3c-1.6.1-3.1-.4-4.4-1.3v6.3c0 3.5-2.8 6.3-6.3 6.3S3.6 18.7 3.6 15.2c0-3.5 2.8-6.3 6.3-6.3.3 0 .6 0 .9.1v3.1c-.3 0-.6-.1-.9-.1-1.8 0-3.2 1.4-3.2 3.2s1.4 3.2 3.2 3.2c1.8 0 3.3-1.4 3.3-3.1V3h3.3z"/>
            </svg>
            TIKTOK
          </a>
        </div>
      </div>
    `;
    return;
  }
  
  // Renderiza os cards dos posts
  container.innerHTML = posts.map((post, index) => {
    const caption = (post.caption || '').replace(/\s+/g, ' ').trim();
    const shortCaption = caption.length > 100 ? caption.slice(0, 100) + '...' : caption;
    const date = formatDate(post.timestamp);
    
    return `
      <a href="${post.permalink || 'https://www.instagram.com/maiakamperrodrigues/'}" 
         target="_blank" 
         rel="noopener noreferrer"
         class="video-card"
         data-rv 
         data-d="${index}"
         style="background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.09); transition: border-color .4s; display: block; text-decoration: none; color: inherit;">
        <div style="position: relative; padding-bottom: 100%; background: #061009; overflow: hidden;">
          ${post.media_url ? `
            <img src="${post.media_url}" 
                 alt="${shortCaption || 'Post do Instagram'}" 
                 loading="lazy"
                 style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;">
          ` : ''}
          <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10,22,17,0) 60%, rgba(10,22,17,.85) 100%);"></div>
          <div style="position: absolute; top: 14px; left: 14px; background: rgba(60,198,116,.9); color: #0a1611; font-size: 10px; font-weight: 800; letter-spacing: .12em; padding: 6px 10px; display: flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="2" width="20" height="20" rx="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/>
            </svg>
            INSTAGRAM
          </div>
        </div>
        <div style="padding: 22px 26px;">
          ${date ? `
            <div style="font-size: 11px; font-weight: 800; color: #3cc674; letter-spacing: .14em;">
              ${date}
            </div>
          ` : ''}
          ${shortCaption ? `
            <div style="font-weight: 600; font-size: 14px; line-height: 1.45; margin-top: 8px; color: rgba(255,255,255,.92);">
              ${shortCaption}
            </div>
          ` : `
            <div style="font-weight: 600; font-size: 14px; line-height: 1.45; margin-top: 8px; color: rgba(255,255,255,.6); font-style: italic;">
              Ver post no Instagram
            </div>
          `}
        </div>
      </a>
    `;
  }).join('');
}
