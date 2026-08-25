// Página de Montagem (redesign). Substitui js/view-montage.js.
// A composição em si continua sendo desenhada por js/montage-renderer.js.
import { supabase } from './supabase-client.js'
import { renderMontage } from './montage-renderer.js'
import { applyI18n, wireLangMenu, dismissIntro, wireBackLinks, esc, tr } from './redesign-shared.js'

const I18N = {
  pt: { back: 'VOLTAR PARA GALERIA', rights: '© 2026 Maia Rodrigues — Todos os direitos reservados', empty: 'Montagem vazia.', missing: 'Montagem indisponível', failed: 'Erro ao carregar' },
  en: { back: 'BACK TO GALLERY', rights: '© 2026 Maia Rodrigues — All rights reserved', empty: 'Empty montage.', missing: 'Montage unavailable', failed: 'Failed to load' },
  es: { back: 'VOLVER A LA GALERÍA', rights: '© 2026 Maia Rodrigues — Todos los derechos reservados', empty: 'Montaje vacío.', missing: 'Montaje no disponible', failed: 'Error al cargar' },
  de: { back: 'ZURÜCK ZUR GALERIE', rights: '© 2026 Maia Rodrigues — Alle Rechte vorbehalten', empty: 'Leeres Collage.', missing: 'Collage nicht verfügbar', failed: 'Fehler beim Laden' },
  fr: { back: 'RETOUR À LA GALERIE', rights: '© 2026 Maia Rodrigues — Tous droits réservés', empty: 'Montage vide.', missing: 'Montage indisponible', failed: 'Échec du chargement' },
  it: { back: 'TORNA ALLA GALLERIA', rights: '© 2026 Maia Rodrigues — Tutti i diritti riservati', empty: 'Montaggio vuoto.', missing: 'Montaggio non disponibile', failed: 'Errore nel caricamento' }
}

const L = () => I18N[document.documentElement.lang] || I18N.pt
const titleEl = () => document.getElementById('montage-title')
const canvas = () => document.getElementById('montage-canvas')

async function load() {
  const id = new URLSearchParams(location.search).get('id')
  if (!id) { location.replace('galeria.html'); return }

  const { data: montage, error } = await supabase.from('montages').select('*').eq('id', id).single()
  if (error) throw error
  if (!montage || montage.deleted_at) {
    titleEl().textContent = L().missing
    return
  }
  const { title } = tr(montage, ['title'])
  titleEl().textContent = title
  document.title = `${title} — Maia Rodrigues`

  const { data: itemsRaw, error: iErr } = await supabase
    .from('montage_items').select('*')
    .eq('montage_id', id).eq('is_active', true)
    .order('created_at', { ascending: true })
  if (iErr) throw iErr

  const items = (itemsRaw || []).filter(i => !i.deleted_at)
  if (!items.length) {
    canvas().innerHTML = `<p style="color:rgba(255,255,255,.5)">${esc(L().empty)}</p>`
    return
  }

  const draw = () => renderMontage(canvas(), items)
  draw()
  // A composição é posicionada em px a partir da largura do canvas, então
  // precisa ser redesenhada quando a janela muda de tamanho.
  window.addEventListener('resize', draw)
}

applyI18n(I18N)
wireLangMenu()
wireBackLinks('galeria.html')
dismissIntro()

load().catch(err => {
  console.error('[page-montagem] falha ao carregar montagem:', err)
  titleEl().textContent = L().failed
})
