import { supabase } from './supabase-client.js'
import { getCurrentLanguage } from './i18n.js';
import { translations } from './translations.js?v=nocache2';

async function updateHomeMedia() {
  const container = document.getElementById('home-media-container')
  if (!container) return

  const currentLang = (window.MaiaI18n && window.MaiaI18n.getCurrentLanguage) 
    ? window.MaiaI18n.getCurrentLanguage() 
    : 'pt';

  try {
    console.log('[maia] update-home-media: buscando news com show_on_home=true...')
    // Busca TODAS as notícias marcadas para aparecer na home
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('show_on_home', true)
      .order('published_date', { ascending: false })

    console.log('[maia] update-home-media: resposta', { count: data?.length, error, data })

    if (error) throw error

    if (data && data.length > 0) {
      container.innerHTML = '' // Limpa container

      data.forEach(item => {
        let title = item.title;
        let summary = item.summary;

        // Verifica tradução
        if (currentLang !== 'pt' && item.translations && item.translations[currentLang]) {
            if (item.translations[currentLang].title) title = item.translations[currentLang].title;
            if (item.translations[currentLang].summary) summary = item.translations[currentLang].summary;
        }

        const linkUrl = item.link_url && item.link_url !== '#' ? item.link_url : `noticia-detalhe.html?id=${item.id}`
        const isExternal = item.link_url && item.link_url !== '#'

        // Cria o card usando a estrutura da seção Hoje
        const cardWrap = document.createElement('div')
        cardWrap.className = 'today-wrap'
        cardWrap.style.marginBottom = '20px' // Espaçamento entre cards
        
        const grid = document.createElement('div')
        grid.className = 'today-grid'
        
        // Coluna Esquerda (Imagem Principal)
        const leftCol = document.createElement('div')
        leftCol.className = 'container-3'
        leftCol.style.display = 'flex'
        leftCol.style.alignItems = 'center'
        leftCol.style.justifyContent = 'center'
        leftCol.style.overflow = 'hidden'
        leftCol.style.backgroundColor = 'transparent' // Remove fundo branco
        leftCol.style.padding = '0' // Remove espaçamento interno
        
        // Usando a imagem da notícia como imagem principal (logo/destaque)
        const mainImg = document.createElement('img')
        mainImg.src = item.image_url || 'images/soccer-ball-1.png' // Fallback
        mainImg.alt = item.title
        mainImg.loading = 'lazy'
        // Ajustes para parecer uma foto de destaque e não um logo pequeno
        mainImg.style.width = '100%'
        mainImg.style.height = '100%'
        mainImg.style.objectFit = 'cover' 
        mainImg.style.borderRadius = '10px'
        
        leftCol.appendChild(mainImg)
        
        // Coluna Direita (Conteúdo)
        const contentWrap = document.createElement('div')
        contentWrap.className = 'content-wrap'
        
        // Título
        const titleWrap = document.createElement('div')
        titleWrap.className = 'today-title'
        
        const titleDiv = document.createElement('div')
        titleDiv.className = 'title-style'
        titleDiv.textContent = title
        titleWrap.appendChild(titleDiv)

        const divider = document.createElement('img')
        divider.src = 'https://cdn.prod.website-files.com/696fb9404f3174fa45d7794e/696fcd3744455232974fc0e2_Divider.svg'
        divider.className = 'divider'
        divider.loading = 'lazy'
        divider.width = 50
        divider.height = 4
        titleWrap.appendChild(divider)
        
        // Conteúdo
        const contentDiv = document.createElement('div')
        contentDiv.className = 'today-content'
        
        const textBlock = document.createElement('div')
        textBlock.className = 'w-layout-vflex flex-block'
        
        const p = document.createElement('p')
        p.className = 'text-m'
        p.textContent = summary || ''
        textBlock.appendChild(p)
        
        // Obtém o texto do botão "Saiba mais" traduzido
        let learnMoreText = 'Saiba mais';
        if (translations && translations[currentLang] && translations[currentLang].learn_more) {
            learnMoreText = translations[currentLang].learn_more;
        } else if (currentLang !== 'pt') {
             // Fallback simples caso translations não esteja carregado
             learnMoreText = 'Learn more';
        }

        const link = document.createElement('a')
        link.className = 'text-m'
        link.textContent = learnMoreText
        link.href = linkUrl
        if (isExternal) link.target = '_blank'
        link.style.textDecoration = 'none'
        link.style.marginTop = '10px'
        link.style.display = 'block'
        link.style.color = '#fff'
        link.style.cursor = 'pointer'
        link.setAttribute('data-i18n', 'learn_more') // Adiciona atributo para tradução dinâmica
        textBlock.appendChild(link)
        
        contentDiv.appendChild(textBlock)
        contentWrap.appendChild(titleWrap)
        contentWrap.appendChild(contentDiv)
        
        grid.appendChild(leftCol)
        grid.appendChild(contentWrap)
        cardWrap.appendChild(grid)
        
        container.appendChild(cardWrap)
      })
    } else {
      container.innerHTML = ''
    }
  } catch (err) {
    console.error('Erro ao atualizar notícias da home:', err)
    container.innerHTML = '<div style="text-align: center; color: #888; padding: 40px;">Erro ao carregar notícias.</div>'
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateHomeMedia)
} else {
  updateHomeMedia()
}

// Ouve mudanças de idioma para re-renderizar
window.addEventListener('languageChanged', (e) => {
    updateHomeMedia();
});
