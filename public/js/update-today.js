import { supabase } from './supabase-client.js'

// Normaliza caminhos de assets para garantir prefixo correto
function normalizeAssetPath(path) {
  if (!path) return 'images/soccer-ball-1.png';
  if (path.startsWith('http') || path.startsWith('/')) return path;
  if (!path.startsWith('images/')) return 'images/' + path;
  return path;
}

function getCategoryI18nKey(catName) {
  if (!catName) return null;
  const lower = catName.toLowerCase().trim();
  if (lower.includes('sub 13')) return 'cat_sub13';
  if (lower.includes('sub 15')) return 'cat_sub15';
  if (lower.includes('sub 17')) return 'cat_sub17';
  if (lower.includes('sub 20')) return 'cat_sub20';
  if (lower.includes('sub 23')) return 'cat_sub23';
  if (lower.includes('principal')) return 'cat_principal';
  if (lower.includes('geral')) return 'cat_geral';
  return null;
}

async function updateToday() {
  const container = document.getElementById('today-cards-container')
  if (!container) return

  // Detecta idioma atual (padrão 'pt')
  const currentLang = (window.MaiaI18n && window.MaiaI18n.getCurrentLanguage) 
    ? window.MaiaI18n.getCurrentLanguage() 
    : 'pt';

  try {
    const { data, error } = await supabase
      .from('today_cards')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) throw error

    if (data && data.length > 0) {
      container.innerHTML = '' // Limpa loading

      data.forEach(card => {
        // Parse translations if string
        let translations = card.translations;
        if (typeof translations === 'string') {
            try { translations = JSON.parse(translations); } catch(e) {}
        }
        
        // Fallback: Se translations vazio e for news, tenta pegar de stats_data
        if ((!translations || Object.keys(translations).length === 0) && card.type === 'news') {
             let statsData = card.stats_data;
             if (typeof statsData === 'string') {
                 try { statsData = JSON.parse(statsData) } catch(e){}
             }
             // Se statsData for objeto (não array), assumimos que são traduções
             if (statsData && !Array.isArray(statsData)) {
                 translations = statsData;
             }
        }
        
        // Define valores baseados no idioma
        let title = card.title;
        let newsText = card.news_text;
        let newsLink = card.news_link;
        // let category = card.category; // Categoria geralmente usa chaves fixas

        // Se houver tradução para o idioma atual (e não for PT), sobrescreve
        if (translations && translations[currentLang] && currentLang !== 'pt') {
            const t = translations[currentLang];
            if (t.title) title = t.title;
            if (t.news_text) newsText = t.news_text;
            if (t.news_link) newsLink = t.news_link;
        }

        // Estrutura principal
        const cardWrap = document.createElement('div')
        cardWrap.className = 'today-wrap'
        
        const grid = document.createElement('div')
        grid.className = 'today-grid'
        
        // Coluna Esquerda (Imagem)
        const leftCol = document.createElement('div')
        leftCol.className = 'container-3'
        leftCol.style.display = 'flex'
        leftCol.style.alignItems = 'center'
        leftCol.style.justifyContent = 'center'
        leftCol.style.overflow = 'hidden'
        leftCol.style.padding = '10px' // Ajuste de padding (50% menor conforme solicitado anteriormente)
        
        const logoImg = document.createElement('img')
        logoImg.src = card.left_image_url
        logoImg.alt = title
        
        if (card.type === 'news') {
            // Estilo para Notícias (Foto)
            logoImg.style.width = '150px'
            logoImg.style.height = '150px'
            logoImg.style.objectFit = 'contain'
            logoImg.style.borderRadius = '10px'
        } else {
            // Estilo para Estatísticas (Logo)
            logoImg.style.maxWidth = '100%'
            logoImg.style.maxHeight = '150px'
            logoImg.style.width = 'auto'
            logoImg.style.height = 'auto'
            logoImg.style.objectFit = 'contain'
        }
        
        logoImg.loading = 'lazy'
        
        leftCol.appendChild(logoImg)
        
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

        // Categoria (se houver)
        if (card.category) {
            const catDiv = document.createElement('div')
            catDiv.style.fontSize = '24px'
            catDiv.style.color = '#3cc674'
            catDiv.style.textTransform = 'uppercase'
            catDiv.style.fontWeight = 'bold'
            catDiv.style.marginBottom = '4px'
            catDiv.style.marginTop = '4px'
            
            const i18nKey = getCategoryI18nKey(card.category);
            if (i18nKey) {
                catDiv.setAttribute('data-i18n', i18nKey);
            }
            
            catDiv.textContent = card.category
            titleWrap.appendChild(catDiv)
        }
        
        // Conteúdo Específico
        const contentDiv = document.createElement('div')
        contentDiv.className = 'today-content'
        
        if (card.type === 'news') {
          // Layout de Notícia
          if (card.news_image_url) {
            const newsImg = document.createElement('img')
            newsImg.src = card.news_image_url
            newsImg.loading = 'lazy'
            newsImg.width = 144
            newsImg.height = 144
            newsImg.style.borderRadius = '10px'
            newsImg.style.marginRight = '20px'
            newsImg.style.objectFit = 'cover'
            contentDiv.appendChild(newsImg)
          }
          
          const textBlock = document.createElement('div')
          textBlock.className = 'w-layout-vflex flex-block'
          
          const p = document.createElement('p')
          p.className = 'text-m line-clamp-3'
          p.textContent = newsText
          
          textBlock.appendChild(p)
          
          if (newsLink && newsLink !== '#') {
            const link = document.createElement('a')
            link.className = 'text-m'
            link.textContent = 'Saiba mais' // Poderia ser traduzido via i18n também, mas fixo por enquanto ou data-i18n
            link.setAttribute('data-i18n', 'learn_more') // Adicionando suporte i18n se existir chave
            link.innerHTML = '<span data-i18n="learn_more">Saiba mais</span>'
            link.href = newsLink
            link.style.textDecoration = 'none'
            link.style.marginTop = '10px'
            link.style.display = 'block'
            link.style.color = '#fff'
            textBlock.appendChild(link)
          }
          
          contentDiv.appendChild(textBlock)
          
        } else if (card.type === 'stats') {
          // Layout de Estatística
          const listDiv = document.createElement('div')
          listDiv.className = 'today-list'
          
          if (card.stats_data && Array.isArray(card.stats_data)) {
            card.stats_data.forEach(stat => {
              const itemWrap = document.createElement('div')
              itemWrap.className = 'item-wrap'
              
              const iconWrap = document.createElement('div')
              iconWrap.className = 'icon-wrap small'
              
              const iconImg = document.createElement('img')
              iconImg.src = normalizeAssetPath(stat.icon)
              iconImg.loading = 'lazy'
              iconImg.width = 50
              
              iconWrap.appendChild(iconImg)
              
              const seasonDiv = document.createElement('div')
              seasonDiv.className = 'season'
              
              if (stat.icon && stat.icon.includes('partidas.png')) {
                seasonDiv.innerHTML = `${stat.text} <span data-i18n="matches">Partidas</span>`
              } else if (stat.icon && stat.icon.includes('goal-1.png')) {
                seasonDiv.innerHTML = `${stat.text} <span data-i18n="goals">Gols</span>`
              } else if (stat.icon && stat.icon.includes('assitencia2.png')) {
                seasonDiv.innerHTML = `${stat.text} <span data-i18n="assists">Assistências</span>`
              } else {
                if (stat.text && stat.text.includes('Temporada')) {
                    seasonDiv.innerHTML = stat.text.replace('Temporada', '<span data-i18n="season_label">Temporada</span>');
                } else {
                    seasonDiv.textContent = stat.text
                }
              }
              
              itemWrap.appendChild(iconWrap)
              itemWrap.appendChild(seasonDiv)
              listDiv.appendChild(itemWrap)
            })
          }
          contentDiv.appendChild(listDiv)
        }
        
        contentWrap.appendChild(titleWrap)
        contentWrap.appendChild(contentDiv)
        
        grid.appendChild(leftCol)
        grid.appendChild(contentWrap)
        cardWrap.appendChild(grid)
        
        container.appendChild(cardWrap)
      })
      
      // Atualiza traduções após renderizar (importante para elementos data-i18n injetados)
      if (window.MaiaI18n && window.MaiaI18n.updatePageTranslations) {
        window.MaiaI18n.updatePageTranslations();
      }
    } else {
      container.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">Nenhum card disponível.</div>'
    }
  } catch (err) {
    console.error('Erro ao atualizar Hoje:', err)
  }
}

// Inicializa
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateToday)
} else {
  updateToday()
}

// Ouve mudanças de idioma para re-renderizar
window.addEventListener('languageChanged', (e) => {
    // Prevent infinite loop or excessive re-rendering if dispatchEvent bubbles
    updateToday();
});
