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
    const embedLink = card.getAttribute('data-embed-link');
    const description = card.getAttribute('data-description');
    
    card.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (embedLink && embedLink !== '' && embedLink !== 'https://www.tiktok.com/@maialeonaa') {
        console.log('[TikTok Player] Abrindo modal para:', embedLink);
        openTikTokModal({ embedLink, description });
      } else {
        console.warn('[TikTok Player] Vídeo sem link de embed válido');
        // Fallback: abre o perfil
        window.open('https://www.tiktok.com/@maialeonaa', '_blank', 'noopener,noreferrer');
      }
    });
  });
  
  console.log('[TikTok Player] Inicializado com', cards.length, 'vídeos');
}

/**
 * Abre modal com vídeo do TikTok embarcado via iframe
 */
export function openTikTokModal(videoData) {
  const { embedLink, description } = videoData;
  
  console.log('[TikTok Player] Abrindo modal para vídeo:', embedLink);
  
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
  console.log('[TikTok Player] ID do vídeo:', videoId);
  
  // URL do iframe embed do TikTok (formato similar ao YouTube)
  const iframeUrl = `https://www.tiktok.com/embed/v2/${videoId}`;
  
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
      .tiktok-iframe-wrapper {
        position: relative;
        width: 100%;
        max-width: 400px;
        aspect-ratio: 9/16;
        background: #000;
        border-radius: 8px;
        overflow: hidden;
      }
      .tiktok-iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: none;
      }
    </style>
    <div style="position: relative;" class="tiktok-modal-content">
      <button id="close-tiktok-modal" style="position: absolute; top: -50px; right: 0; z-index: 10001; background: rgba(0,0,0,0.8); color: #fff; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; font-size: 24px; line-height: 1; display: flex; align-items: center; justify-content: center; transition: all 0.3s;" aria-label="Fechar">
        ×
      </button>
      <div class="tiktok-iframe-wrapper">
        <iframe 
          class="tiktok-iframe"
          src="${iframeUrl}"
          allowfullscreen
          scrolling="no"
          allow="encrypted-media; autoplay; fullscreen;"
          title="${description || 'Vídeo do TikTok'}"
        ></iframe>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  console.log('[TikTok Player] Modal criado com iframe:', iframeUrl);
  
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
 * Carrega o script de embed do TikTok (não mais necessário com iframe)
 */
function loadTikTokEmbedScript(callback) {
  // Mantido para compatibilidade, mas iframe não precisa
  if (callback) callback();
}
