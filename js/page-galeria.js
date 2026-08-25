// Página de Galeria (redesign). Substitui js/update-gallery.js.
import { supabase } from './supabase-client.js'
import { applyI18n, wireLangMenu, wireReveal, dismissIntro, esc, tr } from './redesign-shared.js'

const I18N = {
  pt: { back: 'VOLTAR PARA HOME', title: 'Galeria', rights: '© 2026 Maia Rodrigues — Todos os direitos reservados', empty: 'Nenhuma foto publicada ainda.', montage: 'MONTAGEM' },
  en: { back: 'BACK TO HOME', title: 'Gallery', rights: '© 2026 Maia Rodrigues — All rights reserved', empty: 'No photos published yet.', montage: 'MONTAGE' },
  es: { back: 'VOLVER AL INICIO', title: 'Galería', rights: '© 2026 Maia Rodrigues — Todos los derechos reservados', empty: 'Aún no hay fotos publicadas.', montage: 'MONTAJE' },
  de: { back: 'ZURÜCK ZUR STARTSEITE', title: 'Galerie', rights: '© 2026 Maia Rodrigues — Alle Rechte vorbehalten', empty: 'Noch keine Fotos veröffentlicht.', montage: 'COLLAGE' },
  fr: { back: "RETOUR À L'ACCUEIL", title: 'Galerie', rights: '© 2026 Maia Rodrigues — Tous droits réservés', empty: 'Aucune photo publiée pour le moment.', montage: 'MONTAGE' },
  it: { back: 'TORNA ALLA HOME', title: 'Galleria', rights: '© 2026 Maia Rodrigues — Tutti i diritti riservati', empty: 'Nessuna foto pubblicata finora.', montage: 'MONTAGGIO' }
}

const reveal = wireReveal()
const L = () => I18N[document.documentElement.lang] || I18N.pt

// Ritmo do mosaico do layout: a cada 6 células, a 1ª ocupa 2x2 e a 4ª é alta.
// Repetir esse ciclo mantém a grade preenchida com qualquer quantidade de fotos.
const shapeOf = i => {
  const n = i % 6
  if (n === 0) return ' wide'
  if (n === 3) return ' tall'
  return ''
}

function render(items) {
  const c = document.getElementById('gallery-container')
  if (!c) return
  if (!items.length) {
    c.innerHTML = `<p style="color:rgba(255,255,255,.5);grid-column:1/-1">${esc(L().empty)}</p>`
    return
  }

  c.innerHTML = items.map((it, i) => {
    const shape = `gal-cell${shapeOf(i)}`
    const rv = `data-rv data-d="${i % 4}"`

    if (!it.montage) {
      return `<div class="${shape}" ${rv}>
        <img src="${esc(it.image_url)}" alt="${esc(it.title || '')}" loading="lazy">
      </div>`
    }

    // Montagem: capa + selo, abrindo a composição completa.
    return `<a class="${shape} gal-montage" ${rv} href="montagem.html?id=${encodeURIComponent(it.id)}" title="${esc(it.title || '')}">
      ${it.cover
        ? `<img src="${esc(it.cover)}" alt="${esc(it.title || '')}" loading="lazy">`
        : '<div class="gal-empty"></div>'}
      <span class="gal-badge">${esc(L().montage)}</span>
      ${it.title ? `<span class="gal-caption">${esc(it.title)}</span>` : ''}
    </a>`
  }).join('')

  reveal.observe(c)
}

applyI18n(I18N)
wireLangMenu()
dismissIntro()

// Traz tudo que está habilitado para visualização: as montagens ativas (cada
// uma como um card que abre a composição) e as fotos avulsas da galeria.
async function load() {
  const [montagesRes, photosRes] = await Promise.all([
    supabase.from('montages').select('*').eq('is_active', true).order('created_at', { ascending: false }),
    supabase.from('gallery').select('*').eq('is_active', true).order('display_order', { ascending: true })
  ])
  if (montagesRes.error) throw montagesRes.error
  if (photosRes.error) throw photosRes.error

  const montages = (montagesRes.data || []).filter(m => !m.deleted_at)

  // Capa de cada montagem = sua primeira imagem ativa. Uma consulta só para
  // todas elas, em vez de uma por montagem.
  let covers = {}
  if (montages.length) {
    const { data: itemsData, error } = await supabase
      .from('montage_items')
      .select('montage_id, content, type, is_active, deleted_at, created_at')
      .in('montage_id', montages.map(m => m.id))
      .eq('type', 'image')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
    if (error) throw error
    ;(itemsData || []).filter(it => !it.deleted_at && it.content).forEach(it => {
      if (!covers[it.montage_id]) covers[it.montage_id] = it.content
    })
  }

  const items = [
    ...montages.map(m => ({ montage: true, id: m.id, title: tr(m, ['title']).title, cover: covers[m.id] || null })),
    ...(photosRes.data || [])
      .filter(p => !p.deleted_at && p.image_url)
      .map(p => ({ montage: false, image_url: p.image_url, title: tr(p, ['title']).title }))
  ]

  render(items)
}

load().catch(err => console.error('[page-galeria] falha ao carregar galeria:', err))
