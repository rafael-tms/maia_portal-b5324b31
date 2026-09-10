// tiktok-player.js
// Player de vídeos do TikTok com embed inline

/**
 * Inicializa event listeners para reproduzir vídeos do TikTok em modal
 * @param {HTMLElement} container Container com os cards de vídeo
 */
export function initTikTokPlayers(container) {
  if (!container) return;
  
  const cards = container.querySelectorAll('.tiktok-card');
  
  cards.forEach(card => {
    // Remove href para não abrir em nova aba
    card.removeAttribute('href');
    card.removeAttribute('target');
    card.removeAttribute('rel');
    card.style.cursor = 'pointer';
    
    // Extrai dados do card
    const embedLink = card.querySelector('img')?.alt || card.textContent;
    const videoData = extractVideoData(card);
    
    card.addEventListener('click', (e) => {
      e.preventDefault();
      
      if (videoData.embedLink) {
        openTikTokModal(videoData);
      } else {
        console.warn('[TikTok Player] Vídeo sem link de embed');
        // Fallback: tenta abrir o perfil
        window.open('https://www.tiktok.com/@maialeonaa', '_blank', 'noopener,noreferrer');
      }
    });
  });
}

/**
 * Extrai dados do vídeo do card HTML
 */
function extractVideoData(card) {
  // Busca o link nas âncoras filhas
  const link = card.href || card.querySelector('a')?.href || '';
  
  // Extrai descrição
  const descEl = card.querySelector('[style*="font-weight: 600"]');
  const description = descEl?.textContent || '';
  
  return {
    embedLink: link,
    description: description.replace('...', '').trim()
  };
}

/**
 * Abre modal com vídeo do TikTok embarcado
 */
export function openTikTokModal(videoData) {
  const { embedLink, description } = videoData;
  
  // Remove modal existente se houver
  const existingModal = document.getElementById('tiktok-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Extrai o ID do vídeo do embed link
  // Formato: https://www.tiktok.com/@username/video/1234567890
  const videoIdMatch = embedLink.match(/video\/(\d+)/);
  
  if (!videoIdMatch) {
    console.error('[TikTok Player] Não foi possível extrair ID do vídeo:', embedLink);
    // Fallback: abre em nova aba
    window.open(embedLink, '_blank', 'noopener,noreferrer');
    return;
  }
  
  const videoId = videoIdMatch[1];
  
  // Cria o modal
  const modal = document.createElement('div');
  modal.id = 'tiktok-modal';
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.3s ease-out;
  `;
  
  modal.innerHTML = `
    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { 
          opacity: 0;
          transform: translateY(30px);
        }
        to { 
          opacity: 1;
          transform: translateY(0);
        }
      }
      .tiktok-modal-content {
        animation: slideUp 0.4s ease-out;
      }
      #close-tiktok-modal:hover {
        background: rgba(255,255,255,0.2) !important;
        transform: scale(1.1);
      }
    </style>
    <div style="position: relative; max-width: 605px; width: 100%; max-height: 90vh; background: #000; border-radius: 8px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.8);" class="tiktok-modal-content">
      <button id="close-tiktok-modal" style="position: absolute; top: 10px; right: 10px; z-index: 10000; background: rgba(0,0,0,0.8); color: #fff; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 24px; line-height: 1; display: flex; align-items: center; justify-content: center; transition: all 0.3s;" aria-label="Fechar">
        ×
      </button>
      <blockquote 
        class="tiktok-embed" 
        cite="${embedLink}" 
        data-video-id="${videoId}"
        style="max-width: 605px; min-width: 325px; margin: 0;">
        <section>
          <a target="_blank" rel="noopener noreferrer" href="${embedLink}">
            ${description || 'Ver vídeo no TikTok'}
          </a>
        </section>
      </blockquote>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Carrega o script de embed do TikTok
  loadTikTokEmbedScript();
  
  // Fecha o modal
  const closeModal = () => {
    modal.style.animation = 'fadeIn 0.2s ease-out reverse';
    setTimeout(() => {
      modal.remove();
      document.body.style.overflow = '';
    }, 200);
  };
  
  document.getElementById('close-tiktok-modal').addEventListener('click', closeModal);
  
  // Fecha ao clicar fora do conteúdo
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Fecha com ESC
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

/**
 * Carrega o script de embed do TikTok
 */
function loadTikTokEmbedScript() {
  if (!document.getElementById('tiktok-embed-script')) {
    const script = document.createElement('script');
    script.id = 'tiktok-embed-script';
    script.async = true;
    script.src = 'https://www.tiktok.com/embed.js';
    document.body.appendChild(script);
  } else {
    // Se o script já existe, força re-render dos embeds
    if (window.tiktokEmbed && typeof window.tiktokEmbed === 'function') {
      window.tiktokEmbed();
    }
  }
}
