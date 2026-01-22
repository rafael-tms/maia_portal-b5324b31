import { supabase } from './supabase-client.js'

async function loadNewsDetail() {
  const container = document.getElementById('news-detail-content')
  if (!container) return

  const currentLang = (window.MaiaI18n && window.MaiaI18n.getCurrentLanguage) 
    ? window.MaiaI18n.getCurrentLanguage() 
    : 'pt';

  // Obtém ID da URL
  const params = new URLSearchParams(window.location.search)
  const id = params.get('id')

  if (!id) {
    container.innerHTML = '<div style="text-align: center; color: #888; padding: 40px;">Notícia não encontrada.</div>'
    return
  }

  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    if (data) {
      let title = data.title;
      let content = data.content || data.summary || '';

      // Verifica tradução
      if (currentLang !== 'pt' && data.translations && data.translations[currentLang]) {
          if (data.translations[currentLang].title) title = data.translations[currentLang].title;
          if (data.translations[currentLang].content) content = data.translations[currentLang].content;
          else if (data.translations[currentLang].summary) content = data.translations[currentLang].summary;
      }

      // Formata data
      const date = new Date(data.published_date)
      const dateStr = date.toLocaleDateString(currentLang === 'pt' ? 'pt-BR' : currentLang, { day: '2-digit', month: 'long', year: 'numeric' })
      
      // Formata conteúdo (quebra de linhas)
      const contentHtml = content
        .split('\n')
        .map(p => p.trim())
        .filter(p => p)
        .map(p => `<p>${p}</p>`)
        .join('')

      const imageHtml = data.image_url 
        ? `<div class="news-image-wrap"><img src="${data.image_url}" alt="${title}" class="news-image-full"></div>`
        : ''

      container.innerHTML = `
        <div class="news-detail-container">
          <div class="news-header">
            <div class="news-date">${dateStr}</div>
            <h1 class="news-title">${title}</h1>
          </div>
          ${imageHtml}
          <div class="news-body">
            ${contentHtml}
          </div>
        </div>
      `
    } else {
      container.innerHTML = '<div style="text-align: center; color: #888; padding: 40px;">Notícia não encontrada.</div>'
    }
  } catch (err) {
    console.error('Erro ao carregar notícia:', err)
    container.innerHTML = '<div style="text-align: center; color: #888; padding: 40px;">Erro ao carregar notícia.</div>'
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadNewsDetail)
} else {
  loadNewsDetail()
}

// Ouve mudanças de idioma
document.addEventListener('languageChanged', loadNewsDetail);
