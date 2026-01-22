import { supabase } from './supabase-client.js'
import { renderMontage } from './montage-renderer.js'

let currentItems = []
let resizeObserver = null

async function loadMontage() {
  const params = new URLSearchParams(window.location.search)
  const montageId = params.get('id')
  
  if (!montageId) {
    window.location.href = 'galeria.html'
    return
  }

  const canvas = document.getElementById('montage-canvas')
  const titleEl = document.getElementById('montage-title')
  
  try {
    const { data: montage, error: mError } = await supabase
      .from('montages')
      .select('*')
      .eq('id', montageId)
      .single()
    
    if (mError) throw mError
    if (titleEl) titleEl.textContent = montage.title

    const { data: items, error: iError } = await supabase
      .from('montage_items')
      .select('*')
      .eq('montage_id', montageId)
      .eq('is_active', true) // Filter inactive items
      .order('created_at', { ascending: true })
    
    if (iError) throw iError

    if (items && items.length > 0) {
      currentItems = items
      renderMontage(canvas, items)
      
      // Setup responsive resizing
      if (resizeObserver) resizeObserver.disconnect()
      resizeObserver = new ResizeObserver(() => {
        renderMontage(canvas, currentItems)
      })
      resizeObserver.observe(canvas)
    } else {
        canvas.innerHTML = '<div style="color: #fff; padding: 20px; text-align: center;">Montagem vazia.</div>'
    }

  } catch (err) {
    console.error('Erro ao carregar montagem:', err)
    if (titleEl) titleEl.textContent = 'Erro ao carregar'
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadMontage)
} else {
  loadMontage()
}
