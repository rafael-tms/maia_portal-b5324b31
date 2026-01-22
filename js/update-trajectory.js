import { supabase } from './supabase-client.js'

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

async function updateTrajectory() {
  const container = document.getElementById('trajectory-cards-container')
  if (!container) return

  try {
    const { data, error } = await supabase
      .from('trajectory_cards')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) throw error

    if (data && data.length > 0) {
      container.innerHTML = '' // Limpa loading

      data.forEach(card => {
        // Normaliza stats_data
        let statsData = card.stats_data
        if (typeof statsData === 'string') {
            try { statsData = JSON.parse(statsData) } catch(e) {}
        }
        if (Array.isArray(statsData) && statsData.length > 0 && !statsData[0].items) {
            statsData = [{ name: card.category || '', items: statsData, section: 'top' }]
        }
        if (!statsData || !Array.isArray(statsData)) statsData = []

        // Normaliza sections para dados antigos
        statsData = statsData.map((s, idx) => ({
            ...s,
            section: s.section || (idx === 0 ? 'top' : 'bottom')
        }))

        // Separa categorias
        const topCategories = statsData.filter(s => s.section === 'top')
        const bottomCategories = statsData.filter(s => s.section === 'bottom').slice(0, 3) // Max 3

        // --- Estrutura Principal do Card ---
        const cardWrap = document.createElement('div')
        cardWrap.className = 'today-wrap'
        cardWrap.style.display = 'flex'
        cardWrap.style.flexDirection = 'column'
        
        // --- Parte Superior (Grid Original) ---
        const grid = document.createElement('div')
        grid.className = 'today-grid'
        
        // Coluna Esquerda (Logo)
        const leftCol = document.createElement('div')
        leftCol.className = 'container-3'
        leftCol.style.display = 'flex'
        leftCol.style.alignItems = 'center'
        leftCol.style.justifyContent = 'center'
        leftCol.style.overflow = 'hidden'
        
        const logoImg = document.createElement('img')
        logoImg.src = card.left_image_url
        logoImg.alt = card.title
        logoImg.style.maxWidth = '100%'
        logoImg.style.maxHeight = '150px'
        logoImg.style.width = 'auto'
        logoImg.style.height = 'auto'
        logoImg.style.objectFit = 'contain'
        logoImg.loading = 'lazy'
        leftCol.appendChild(logoImg)
        
        // Coluna Direita (Título + Categoria Topo)
        const contentWrap = document.createElement('div')
        contentWrap.className = 'content-wrap'
        
        const titleWrap = document.createElement('div')
        titleWrap.className = 'today-title'
        
        const titleDiv = document.createElement('div')
        titleDiv.className = 'title-style'
        titleDiv.textContent = card.title
        titleWrap.appendChild(titleDiv)

        const divider = document.createElement('img')
        divider.src = 'https://cdn.prod.website-files.com/696fb9404f3174fa45d7794e/696fcd3744455232974fc0e2_Divider.svg'
        divider.className = 'divider'
        divider.loading = 'lazy'
        divider.width = 50
        divider.height = 4
        titleWrap.appendChild(divider)
        
        const contentDiv = document.createElement('div')
        contentDiv.className = 'today-content'
        
        // Se houver mais de uma categoria no topo, usa Grid com 2 colunas
        if (topCategories.length > 1) {
            contentDiv.style.display = 'grid'
            contentDiv.style.gridTemplateColumns = '1fr 1fr'
            contentDiv.style.gap = '20px'
        }

        // Renderiza Categorias do Topo (Pode ter mais de uma)
        topCategories.forEach((cat, index) => {
            const catContainer = document.createElement('div')
            // Remove margin-top logic if grid is used, or keep it for vertical stacking if needed (though grid handles gap)
            if (index > 0 && topCategories.length === 1) catContainer.style.marginTop = '20px' 

            if (cat.name) {
                const catTitle = document.createElement('div')
                
                const i18nKey = getCategoryI18nKey(cat.name);
                if (i18nKey) {
                    catTitle.setAttribute('data-i18n', i18nKey);
                }

                catTitle.textContent = cat.name
                catTitle.style.color = '#3cc674'
                catTitle.style.fontWeight = 'bold'
                catTitle.style.marginBottom = '10px'
                catTitle.style.fontSize = '16px'
                catTitle.style.textTransform = 'uppercase'
                catContainer.appendChild(catTitle)
            }

            const listDiv = document.createElement('div')
            listDiv.className = 'today-list'
            
            if (cat.items && Array.isArray(cat.items)) {
                cat.items.forEach(stat => {
                    const itemWrap = document.createElement('div')
                    itemWrap.className = 'item-wrap'
                    const iconWrap = document.createElement('div')
                    iconWrap.className = 'icon-wrap small'
                    const iconImg = document.createElement('img')
                    iconImg.src = stat.icon || 'images/soccer-ball-1.png'
                    iconImg.loading = 'lazy'
                    iconImg.width = 50
                    iconWrap.appendChild(iconImg)
                    const seasonDiv = document.createElement('div')
                    seasonDiv.className = 'season'
                    
                    const icon = stat.icon || 'images/soccer-ball-1.png'
                    if (icon.includes('partidas.png')) {
                        seasonDiv.innerHTML = `${stat.text} <span data-i18n="matches">Partidas</span>`
                    } else if (icon.includes('goal-1.png')) {
                        seasonDiv.innerHTML = `${stat.text} <span data-i18n="goals">Gols</span>`
                    } else if (icon.includes('assitencia2.png')) {
                        seasonDiv.innerHTML = `${stat.text} <span data-i18n="assists">Assistências</span>`
                    } else {
                        seasonDiv.textContent = stat.text
                    }
                    itemWrap.appendChild(iconWrap)
                    itemWrap.appendChild(seasonDiv)
                    listDiv.appendChild(itemWrap)
                })
            }
            catContainer.appendChild(listDiv)
            contentDiv.appendChild(catContainer)
        })

        contentWrap.appendChild(titleWrap)
        contentWrap.appendChild(contentDiv)
        grid.appendChild(leftCol)
        grid.appendChild(contentWrap)
        cardWrap.appendChild(grid) // Adiciona parte superior ao card

        // --- Parte Inferior (Categorias Extras) ---
        if (bottomCategories.length > 0) {
            const bottomContainer = document.createElement('div')
            bottomContainer.style.display = 'grid'
            // Cria colunas iguais baseadas no número de categorias (max 3)
            bottomContainer.style.gridTemplateColumns = `repeat(${bottomCategories.length}, 1fr)` 
            bottomContainer.style.gap = '20px'
            bottomContainer.style.marginTop = '20px'
            bottomContainer.style.paddingTop = '20px'
            bottomContainer.style.borderTop = '1px solid rgba(255,255,255,0.1)'
            bottomContainer.style.position = 'relative'
            bottomContainer.style.marginLeft = '75px'

            bottomCategories.forEach((cat, index) => {
                const catCol = document.createElement('div')
                catCol.style.position = 'relative'
                // Adiciona linha tracejada à esquerda se não for o primeiro
                if (index > 0) {
                    catCol.style.borderLeft = '1px dashed rgba(255,255,255,0.2)'
                    catCol.style.paddingLeft = '20px'
                }

                if (cat.name) {
                    const catTitle = document.createElement('div')
                    catTitle.textContent = cat.name
                    catTitle.style.color = '#3cc674'
                    catTitle.style.fontWeight = 'bold'
                    catTitle.style.marginBottom = '15px'
                    catTitle.style.fontSize = '16px'
                    catTitle.style.textTransform = 'uppercase'
                    catCol.appendChild(catTitle)
                }

                const listDiv = document.createElement('div')
                listDiv.className = 'today-list'
                
                if (cat.items && Array.isArray(cat.items)) {
                    cat.items.forEach(stat => {
                        const itemWrap = document.createElement('div')
                        itemWrap.className = 'item-wrap'
                        itemWrap.style.marginBottom = '8px' // Ajuste de espaçamento
                        const iconWrap = document.createElement('div')
                        iconWrap.className = 'icon-wrap small'
                        const iconImg = document.createElement('img')
                        iconImg.src = stat.icon || 'images/soccer-ball-1.png'
                        iconImg.loading = 'lazy'
                        iconImg.width = 50
                        iconWrap.appendChild(iconImg)
                        const seasonDiv = document.createElement('div')
                        seasonDiv.className = 'season'
                        
                        const icon = stat.icon || 'images/soccer-ball-1.png'
                        if (icon.includes('partidas.png')) {
                            seasonDiv.innerHTML = `${stat.text} <span data-i18n="matches">Partidas</span>`
                        } else if (icon.includes('goal-1.png')) {
                            seasonDiv.innerHTML = `${stat.text} <span data-i18n="goals">Gols</span>`
                        } else if (icon.includes('assitencia2.png')) {
                            seasonDiv.innerHTML = `${stat.text} <span data-i18n="assists">Assistências</span>`
                        } else {
                            seasonDiv.textContent = stat.text
                        }
                        itemWrap.appendChild(iconWrap)
                        itemWrap.appendChild(seasonDiv)
                        listDiv.appendChild(itemWrap)
                    })
                }
                catCol.appendChild(listDiv)
                bottomContainer.appendChild(catCol)
            })
            
            cardWrap.appendChild(bottomContainer)
        }
        
        container.appendChild(cardWrap)
      })

      // Atualiza traduções após renderizar
      if (window.MaiaI18n && window.MaiaI18n.updatePageTranslations) {
        window.MaiaI18n.updatePageTranslations();
      }
    } else {
      container.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">Nenhum card de trajetória disponível.</div>'
    }
  } catch (err) {
    console.error('Erro ao atualizar Trajetória:', err)
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateTrajectory)
} else {
  updateTrajectory()
}
