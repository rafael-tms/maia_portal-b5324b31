// Detalhe da notícia (redesign). Substitui js/update-news-detail.js.
import { supabase } from './supabase-client.js'
import { applyI18n, wireLangMenu, dismissIntro, wireBackLinks, esc, tr, lang } from './redesign-shared.js'

const I18N = {
  pt: { back: 'VOLTAR PARA NOTÍCIAS', rights: '© 2026 Maia Rodrigues — Todos os direitos reservados', missing: 'Notícia não encontrada', failed: 'Erro ao carregar a notícia' },
  en: { back: 'BACK TO NEWS', rights: '© 2026 Maia Rodrigues — All rights reserved', missing: 'Article not found', failed: 'Failed to load the article' },
  es: { back: 'VOLVER A NOTICIAS', rights: '© 2026 Maia Rodrigues — Todos los derechos reservados', missing: 'Noticia no encontrada', failed: 'Error al cargar la noticia' },
  de: { back: 'ZURÜCK ZU DEN NEWS', rights: '© 2026 Maia Rodrigues — Alle Rechte vorbehalten', missing: 'Artikel nicht gefunden', failed: 'Fehler beim Laden des Artikels' },
  fr: { back: 'RETOUR AUX ACTUALITÉS', rights: '© 2026 Maia Rodrigues — Tous droits réservés', missing: 'Article introuvable', failed: "Échec du chargement de l'article" },
  it: { back: 'TORNA ALLE NOTIZIE', rights: '© 2026 Maia Rodrigues — Tutti i diritti riservati', missing: 'Notizia non trovata', failed: 'Errore nel caricamento della notizia' }
}

const L = () => I18N[document.documentElement.lang] || I18N.pt
const el = id => document.getElementById(id)

// Data por extenso — mais adequada a um artigo que o formato curto das listas.
const longDate = d => {
  if (!d) return ''
  const dt = new Date(d)
  return isNaN(dt) ? String(d)
    : dt.toLocaleDateString(lang() === 'pt' ? 'pt-BR' : lang(), { day: '2-digit', month: 'long', year: 'numeric' })
}

const fail = msg => { el('news-title').textContent = msg }

async function load() {
  const id = new URLSearchParams(location.search).get('id')
  if (!id) { fail(L().missing); return }

  const { data, error } = await supabase.from('news').select('*').eq('id', id).single()
  if (error) throw error
  if (!data || data.deleted_at) { fail(L().missing); return }

  const { title, content, summary } = tr(data, ['title', 'content', 'summary'])
  el('news-title').textContent = title
  el('news-date').textContent = longDate(data.published_date)
  document.title = `${title} — Maia Rodrigues`

  if (data.image_url) {
    const img = el('news-image')
    img.src = data.image_url
    img.alt = title
    img.hidden = false
  }

  // O texto vem em linhas simples do editor; cada linha vira um parágrafo.
  const texto = content || summary || ''
  el('news-body').innerHTML = texto
    .split('\n')
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${esc(p)}</p>`)
    .join('')
}

applyI18n(I18N)
wireLangMenu()
wireBackLinks('noticias.html')
dismissIntro()

load().catch(err => {
  console.error('[page-noticia] falha ao carregar notícia:', err)
  fail(L().failed)
})
