import { supabase } from './supabase-client.js'
import { renderMontage } from './montage-renderer.js'

let currentItems = []
let resizeObserver = null

async function updateHomeMontage() {
  const container = document.getElementById('home-montage-container')
  const fallback = document.getElementById('home-montage-fallback')
  
  if (!container) return

  // FORCED RESET: Hide montage, show fallback
  if (fallback) fallback.style.display = 'block'
  container.style.display = 'none'
  
  // To re-enable, uncomment the logic below and fix the "middle of the home" positioning issue
  /*
  try {
    // 1. Fetch Montages and look for one starting with [HOME]
    const { data: montages, error: mError } = await supabase
      .from('montages')
      .select('*')
      .ilike('title', '[HOME] %')
      .limit(1)

    if (mError) {
      console.warn('Erro ao buscar montagem ativa:', mError)
      if (fallback) fallback.style.display = 'block'
      container.style.display = 'none'
      return
    }

    if (!montages || montages.length === 0) {
      // No active montage found
      if (fallback) fallback.style.display = 'block'
      container.style.display = 'none'
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
      // Show container, Hide fallback
      // if (fallback) fallback.style.display = 'none' // User requested to keep the image (overlay mode)
      
      container.style.display = 'block'
      container.style.position = 'absolute'
      container.style.bottom = '0'
      container.style.zIndex = '5'
      
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
      if (fallback) fallback.style.display = 'block'
      container.style.display = 'none'
    }

  } catch (err) {
    console.error('Erro ao atualizar montagem da home:', err)
    if (fallback) fallback.style.display = 'block'
    container.style.display = 'none'
  }
  */
}

// Run on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateHomeMontage)
} else {
  updateHomeMontage()
}
