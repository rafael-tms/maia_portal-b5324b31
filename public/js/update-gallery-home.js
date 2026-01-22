import { supabase } from './supabase-client.js'
import { renderMontage } from './montage-renderer.js'

let currentItems = []
let resizeObserver = null

async function updateGalleryHome() {
  const container = document.getElementById('home-gallery-montage-container')
  const fallback = document.getElementById('home-gallery-fallback')
  
  if (!container) return

  try {
    // 1. Fetch Montages and look for one starting with [HOME]
    const { data: montages, error: mError } = await supabase
      .from('montages')
      .select('*')
      .ilike('title', '[HOME] %')
      .limit(1)

    if (mError) {
      console.warn('Erro ao buscar montagem ativa para galeria:', mError)
      container.style.display = 'none'
      if (fallback) fallback.style.display = 'block'
      return
    }

    if (!montages || montages.length === 0) {
      // No active montage found
      container.style.display = 'none'
      if (fallback) fallback.style.display = 'block'
      return
    }

    const activeMontage = montages[0]

    // 2. Fetch Items
    const { data: items, error: iError } = await supabase
      .from('montage_items')
      .select('*')
      .eq('montage_id', activeMontage.id)
      .eq('is_active', true) // Filter inactive items
      .order('created_at', { ascending: true })

    if (iError) throw iError

    if (items && items.length > 0) {
      // Show container, HIDE fallback
      container.style.display = 'block'
      container.style.position = 'relative' // Respect layout flow
      container.style.width = '100%'
      container.style.height = 'auto' // Allow height to adapt or set min-height
      container.style.minHeight = '500px' // Default height for grid
      
      if (fallback) fallback.style.display = 'none'
      
      currentItems = items
      renderMontage(container, items)
      
      // Setup responsive resizing
      if (resizeObserver) resizeObserver.disconnect()
      resizeObserver = new ResizeObserver(() => {
        renderMontage(container, currentItems)
      })
      resizeObserver.observe(container)
    } else {
      // Empty montage
      container.style.display = 'none'
      if (fallback) fallback.style.display = 'block'
    }

  } catch (err) {
    console.error('Erro ao atualizar montagem da galeria na home:', err)
    container.style.display = 'none'
    if (fallback) fallback.style.display = 'block'
  }
}

// Run on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateGalleryHome)
} else {
  updateGalleryHome()
}
