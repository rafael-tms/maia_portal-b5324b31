// Página de Vídeos (redesign). Substitui js/update-videos-page.js.
import { supabase } from './supabase-client.js'
import { applyI18n, wireLangMenu, wireReveal, dismissIntro, esc, fmtDate, tr, videoThumb, wirePlayers } from './redesign-shared.js'

const I18N = {
  pt: { back: 'VOLTAR PARA HOME', title: 'Vídeos', rights: '© 2026 Maia Rodrigues — Todos os direitos reservados', empty: 'Nenhum vídeo publicado ainda.' },
  en: { back: 'BACK TO HOME', title: 'Videos', rights: '© 2026 Maia Rodrigues — All rights reserved', empty: 'No videos published yet.' },
  es: { back: 'VOLVER AL INICIO', title: 'Vídeos', rights: '© 2026 Maia Rodrigues — Todos los derechos reservados', empty: 'Aún no hay vídeos publicados.' },
  de: { back: 'ZURÜCK ZUR STARTSEITE', title: 'Videos', rights: '© 2026 Maia Rodrigues — Alle Rechte vorbehalten', empty: 'Noch keine Videos veröffentlicht.' },
  fr: { back: "RETOUR À L'ACCUEIL", title: 'Vidéos', rights: '© 2026 Maia Rodrigues — Tous droits réservés', empty: 'Aucune vidéo publiée pour le moment.' },
  it: { back: 'TORNA ALLA HOME', title: 'Video', rights: '© 2026 Maia Rodrigues — Tutti i diritti riservati', empty: 'Nessun video pubblicato finora.' }
}

const reveal = wireReveal()

function render(videos) {
  const c = document.getElementById('videos-container')
  if (!c) return
  if (!videos.length) {
    c.innerHTML = `<p style="color:rgba(255,255,255,.5)">${esc((I18N[document.documentElement.lang] || I18N.pt).empty)}</p>`
    return
  }

  c.innerHTML = videos.map((v, i) => {
    const { title } = tr(v, ['title'])
    const thumb = videoThumb(v)
    return `<div class="video-card" data-rv data-d="${i % 3}">
      <div class="video-slot" data-src="${esc(v.video_url || '')}">
        ${thumb ? `<img src="${esc(thumb)}" alt="${esc(title)}" loading="lazy">` : ''}
        <div class="play-btn"><i></i></div>
      </div>
      <div style="padding:22px 26px">
        <div class="card-date">${esc(fmtDate(v.created_at))}</div>
        <div class="card-title">${esc(title)}</div>
      </div>
    </div>`
  }).join('')

  wirePlayers(c)
  reveal.observe(c)
}

applyI18n(I18N)
wireLangMenu()
dismissIntro()

supabase.from('videos').select('*').eq('is_active', true).order('created_at', { ascending: false })
  .then(({ data, error }) => {
    if (error) throw error
    render((data || []).filter(v => !v.deleted_at))
  })
  .catch(err => console.error('[page-videos] falha ao carregar vídeos:', err))
