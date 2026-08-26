// Página Na Mídia (redesign). Substitui js/update-news.js.
import { supabase } from './supabase-client.js'
import { applyI18n, wireLangMenu, wireReveal, dismissIntro, esc, fmtDate, tr, newsLink, isExternalLink, splitFeatured } from './redesign-shared.js'

const I18N = {
  pt: { back: 'VOLTAR PARA HOME', title: 'Na Mídia', featured: 'DESTAQUE', read_more: 'LER MAIS', rights: '© 2026 Maia Rodrigues — Todos os direitos reservados', empty: 'Nenhuma notícia publicada ainda.' },
  en: { back: 'BACK TO HOME', title: 'In the Media', featured: 'FEATURED', read_more: 'READ MORE', rights: '© 2026 Maia Rodrigues — All rights reserved', empty: 'No news published yet.' },
  es: { back: 'VOLVER AL INICIO', title: 'En los Medios', featured: 'DESTACADO', read_more: 'LEER MÁS', rights: '© 2026 Maia Rodrigues — Todos los derechos reservados', empty: 'Aún no hay noticias publicadas.' },
  de: { back: 'ZURÜCK ZUR STARTSEITE', title: 'In den Medien', featured: 'HIGHLIGHT', read_more: 'WEITERLESEN', rights: '© 2026 Maia Rodrigues — Alle Rechte vorbehalten', empty: 'Noch keine Nachrichten veröffentlicht.' },
  fr: { back: "RETOUR À L'ACCUEIL", title: 'Dans les Médias', featured: 'À LA UNE', read_more: 'LIRE PLUS', rights: '© 2026 Maia Rodrigues — Tous droits réservés', empty: 'Aucune actualité publiée pour le moment.' },
  it: { back: 'TORNA ALLA HOME', title: 'Nei Media', featured: 'IN EVIDENZA', read_more: 'LEGGI DI PIÙ', rights: '© 2026 Maia Rodrigues — Tutti i diritti riservati', empty: 'Nessuna notizia pubblicata finora.' }
}

const reveal = wireReveal()
const L = () => I18N[document.documentElement.lang] || I18N.pt

const linkOf = newsLink
const isExternal = n => isExternalLink(newsLink(n))

function render(news) {
  const featured = document.getElementById('news-featured')
  const grid = document.getElementById('news-container')
  if (!featured || !grid) return

  if (!news.length) {
    featured.innerHTML = ''
    grid.innerHTML = `<p style="color:rgba(16,28,20,.55)">${esc(L().empty)}</p>`
    return
  }

  const { destaque: first, demais: rest } = splitFeatured(news)

  // Sem notícia marcada no admin não há card de destaque; todas vão para a grade.
  const f = first ? tr(first, ['title']) : null
  featured.innerHTML = !first ? '' : `<a class="news-hero" data-rv href="${esc(linkOf(first))}"${isExternal(first) ? ' target="_blank" rel="noopener"' : ''}>
      ${first.image_url ? `<img src="${esc(first.image_url)}" alt="${esc(f.title)}">` : ''}
      <div class="veil"></div>
      <div class="copy">
        <div class="badge">${esc(L().featured)}</div>
        <div style="font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:clamp(26px,3.4vw,40px);line-height:1.08;max-width:700px">${esc(f.title)}</div>
        <div style="margin-top:12px;font-size:13px;color:rgba(255,255,255,.6);letter-spacing:.08em">${esc(fmtDate(first.published_date))}</div>
      </div>
    </a>`

  grid.innerHTML = rest.map((n, i) => {
    const t = tr(n, ['title', 'summary'])
    return `<a class="news-card" data-rv data-d="${i % 3}" href="${esc(linkOf(n))}"${isExternal(n) ? ' target="_blank" rel="noopener"' : ''}>
      ${n.image_url
        ? `<img class="thumb" src="${esc(n.image_url)}" alt="${esc(t.title)}" loading="lazy">`
        : '<div class="thumb"></div>'}
      <div style="padding:26px 28px;display:flex;flex-direction:column;flex:1">
        <div style="font-size:11.5px;font-weight:800;color:#17724a;letter-spacing:.14em">${esc(fmtDate(n.published_date))}</div>
        <div style="font-weight:800;font-size:19px;line-height:1.3;margin-top:10px">${esc(t.title)}</div>
        <div style="font-size:14px;line-height:1.6;color:rgba(16,28,20,.6);margin-top:10px;flex:1">${esc(t.summary || '')}</div>
        <div style="margin-top:18px;font-size:11.5px;font-weight:800;letter-spacing:.18em;color:#17724a">${esc(L().read_more)} →</div>
      </div>
    </a>`
  }).join('')

  reveal.observe(featured)
  reveal.observe(grid)
}

applyI18n(I18N)
wireLangMenu()
dismissIntro()

supabase.from('news').select('*').order('display_order', { ascending: true })
  .then(({ data, error }) => {
    if (error) throw error
    render((data || []).filter(n => !n.deleted_at))
  })
  .catch(err => console.error('[page-noticias] falha ao carregar notícias:', err))
