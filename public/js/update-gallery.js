import { supabase } from './supabase-client.js'

async function updateGallery() {
  const container = document.getElementById('gallery-container')
  if (!container) return

  try {
    // 1. Fetch Gallery Images
    const { data: galleryData, error: galleryError } = await supabase
      .from('gallery')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (galleryError) throw galleryError

    // 2. Fetch Montages
    const { data: montagesData, error: montagesError } = await supabase
      .from('montages')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (montagesError) throw montagesError

    // 3. For each montage, fetch the first image to use as cover
    const montagesWithCover = await Promise.all(
      (montagesData || []).map(async (montage) => {
        const { data: items } = await supabase
          .from('montage_items')
          .select('content, type')
          .eq('montage_id', montage.id)
          .eq('type', 'image')
          .limit(1)
        
        return {
          ...montage,
          cover_url: items && items.length > 0 ? items[0].content : null,
          is_montage: true
        }
      })
    )

    // 4. Combine and Display
    // Note: User requested montages first.
    const allItems = [
      ...montagesWithCover,
      ...(galleryData || []).map(i => ({ ...i, is_montage: false }))
    ]

    if (allItems.length > 0) {
      container.innerHTML = ''
      
      allItems.forEach(item => {
        const card = document.createElement('div')
        card.className = 'gallery-card'
        
        // Image Element
        const img = document.createElement('img')
        img.className = 'gallery-image'
        img.loading = 'lazy'
        
        if (item.is_montage) {
          // If montage has no images, show a placeholder or skip
          img.src = item.cover_url || 'images/placeholder-montage.jpg' // You might need a placeholder
          img.alt = `Montagem: ${item.title}`
          
          // Add a "Montage" badge/indicator
          const badge = document.createElement('div')
          badge.style.position = 'absolute'
          badge.style.top = '10px'
          badge.style.right = '10px'
          badge.style.backgroundColor = '#3cc674'
          badge.style.color = '#000'
          badge.style.padding = '5px 10px'
          badge.style.borderRadius = '5px'
          badge.style.fontWeight = 'bold'
          badge.style.fontSize = '12px'
          badge.style.zIndex = '2'
          badge.textContent = 'MONTAGEM'
          card.appendChild(badge)

          // Link to montage view
          card.style.cursor = 'pointer'
          card.onclick = () => {
            window.location.href = `montagem.html?id=${item.id}`
          }
        } else {
          img.src = item.image_url
          img.alt = item.title || 'Imagem da galeria'
        }
        
        card.appendChild(img)
        
        // Title Overlay
        if (item.title) {
          const title = document.createElement('div')
          title.className = 'gallery-title'
          title.textContent = item.title
          card.appendChild(title)
        }
        
        container.appendChild(card)
      })
    } else {
      container.innerHTML = '<div style="text-align: center; color: #888; grid-column: 1/-1; padding: 40px;">Nenhuma imagem na galeria.</div>'
    }
  } catch (err) {
    console.error('Erro ao buscar galeria:', err)
    container.innerHTML = '<div style="text-align: center; color: #888; grid-column: 1/-1; padding: 40px;">Erro ao carregar galeria.</div>'
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateGallery)
} else {
  updateGallery()
}
