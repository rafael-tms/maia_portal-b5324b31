import { supabase } from './supabase-client.js'
import { getCurrentLanguage } from './i18n.js';
import { translations } from './translations.js?v=nocache2';

async function updateNews() {
  const container = document.getElementById('news-container')
  if (!container) return

  const currentLang = (window.MaiaI18n && window.MaiaI18n.getCurrentLanguage) 
    ? window.MaiaI18n.getCurrentLanguage() 
    : 'pt';

  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('published_date', { ascending: false })

    if (error) throw error

    if (data && data.length > 0) {
      container.innerHTML = '' // Limpa loading

      data.forEach(item => {
        let title = item.title;
        let summary = item.summary;

        // Verifica tradução
        if (currentLang !== 'pt' && item.translations && item.translations[currentLang]) {
            if (item.translations[currentLang].title) title = item.translations[currentLang].title;
            if (item.translations[currentLang].summary) summary = item.translations[currentLang].summary;
        }

        const card = document.createElement('div')
        card.className = 'news-card'
        
        // Formata data
        const date = new Date(item.published_date)
        const dateStr = date.toLocaleDateString(currentLang === 'pt' ? 'pt-BR' : currentLang, { day: '2-digit', month: 'long', year: 'numeric' })
        
        // Lógica de Link:
        // Se houver link externo explícito (diferente de #), usa ele.
        // Se não, usa o link interno para a página de detalhes com o ID.
        let linkUrl = '#'
        let isExternal = false

        if (item.link_url && item.link_url !== '#') {
          linkUrl = item.link_url
          isExternal = true
        } else {
          linkUrl = `noticia-detalhe.html?id=${item.id}`
          isExternal = false
        }
        
        const imageHtml = item.image_url 
          ? `<img src="${item.image_url}" alt="${title}" class="news-image" loading="lazy">` 
          : ''
          
        // Obtém o texto do botão "Saiba mais" traduzido
        let learnMoreText = 'Saiba mais';
        if (translations && translations[currentLang] && translations[currentLang].learn_more) {
            learnMoreText = translations[currentLang].learn_more;
        } else if (currentLang !== 'pt') {
             // Fallback simples caso translations não esteja carregado
             learnMoreText = 'Learn more';
        }

        card.innerHTML = `
          ${imageHtml}
          <div class="news-content">
            <div class="news-date">${dateStr}</div>
            <div class="news-title">${title}</div>
            ${summary ? `<div class="news-summary">${summary}</div>` : ''}
            <a href="${linkUrl}" class="news-link" ${isExternal ? 'target="_blank"' : ''}>
              <span data-i18n="learn_more">${learnMoreText}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
          </div>
        `
        
        container.appendChild(card)
      })
    } else {
      container.innerHTML = '<div style="text-align: center; color: #888; grid-column: 1/-1; padding: 40px;">Nenhuma notícia encontrada.</div>'
    }
  } catch (err) {
    console.error('Erro ao atualizar notícias:', err)
    container.innerHTML = '<div style="text-align: center; color: #888; grid-column: 1/-1; padding: 40px;">Erro ao carregar notícias.</div>'
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateNews)
} else {
  updateNews()
}

// Ouve mudanças de idioma
document.addEventListener('languageChanged', updateNews);
