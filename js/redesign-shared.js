// Helpers compartilhados pelas páginas do redesign (home, vídeos, galeria, notícias).
// Mantém idioma, escapes, datas, vídeo e as interações de cromo em um lugar só.

export const LANG_KEY = 'maia-site-lang' // mesma chave do js/i18n.js — idioma segue entre páginas
export const SUPPORTED = ['pt', 'es', 'de', 'fr', 'en', 'it']
export const FLAGS = { pt: 'br', es: 'es', de: 'de', fr: 'fr', en: 'gb', it: 'it' }

export const lang = () => {
  const raw = localStorage.getItem(LANG_KEY) || (navigator.language || 'pt').slice(0, 2)
  return SUPPORTED.includes(raw) ? raw : (SUPPORTED.includes(raw.slice(0, 2)) ? raw.slice(0, 2) : 'pt')
}

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export const json = (d) => { try { return typeof d === 'string' ? JSON.parse(d) : d } catch { return null } }

/** Aplica translations[lang] de uma linha do Supabase sobre os campos pedidos. */
export function tr(row, fields) {
  const out = {}
  const t = json(row.translations)
  const cur = lang()
  const alt = (t && cur !== 'pt') ? (t[cur] || t[cur.slice(0, 2)]) : null
  fields.forEach(f => { out[f] = (alt && alt[f]) || row[f] })
  return out
}

export const fmtDate = (d) => {
  if (!d) return ''
  const dt = new Date(d)
  return isNaN(dt) ? String(d)
    : dt.toLocaleDateString(lang() === 'pt' ? 'pt-BR' : lang(), { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Preenche [data-i18n] com o dicionário do idioma atual e acerta o botão. */
export function applyI18n(dicts) {
  const l = lang()
  const d = dicts[l] || dicts.pt
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = d[el.getAttribute('data-i18n')]
    if (v != null) el.innerHTML = v
  })
  const lbl = document.getElementById('lang-label')
  const flg = document.getElementById('lang-flag')
  if (lbl) lbl.textContent = l.toUpperCase()
  if (flg) flg.src = 'https://flagcdn.com/w40/' + FLAGS[l] + '.png'
  document.documentElement.lang = l
}

const LANG_NAMES = { pt: 'Português', es: 'Español', de: 'Deutsch', fr: 'Français', en: 'English', it: 'Italiano' }

/** Menu de idiomas. Recarrega ao trocar, para re-renderizar os dados do banco. */
export function wireLangMenu() {
  const btn = document.getElementById('lang-btn')
  const menu = document.getElementById('lang-menu')
  if (!btn || !menu) return

  // As opções são puro dado — renderizadas aqui para não repetir em cada página.
  if (!menu.children.length) {
    menu.innerHTML = SUPPORTED.map(l =>
      `<div class="lang-opt" data-lang="${l}"><img src="https://flagcdn.com/w40/${FLAGS[l]}.png" width="20" height="14" alt="">${LANG_NAMES[l]}</div>`).join('')
  }
  btn.addEventListener('click', ev => {
    ev.stopPropagation()
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex'
  })
  document.addEventListener('click', () => { menu.style.display = 'none' })
  menu.querySelectorAll('[data-lang]').forEach(opt => {
    opt.addEventListener('click', () => {
      localStorage.setItem(LANG_KEY, opt.getAttribute('data-lang'))
      location.reload()
    })
  })
}

/** Revela [data-rv] ao entrar na tela, escalonado por data-d. */
export function wireReveal(scope = document) {
  const rv = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return
      const d = parseInt(e.target.getAttribute('data-d') || '0', 10)
      e.target.style.transitionDelay = (d * 0.12) + 's'
      e.target.style.opacity = '1'
      e.target.style.transform = 'none'
      e.target.style.filter = 'none'
      setTimeout(() => { e.target.style.transitionDelay = '0s' }, 1100 + d * 120)
      rv.unobserve(e.target)
    })
  }, { threshold: 0.12 })
  return {
    observe: el => (el || scope).querySelectorAll('[data-rv]').forEach(n => rv.observe(n))
  }
}

/** true quando a navegação veio de outra página do próprio site. */
export const cameFromSite = () => {
  try { return !!document.referrer && new URL(document.referrer).origin === location.origin }
  catch { return false }
}

/**
 * A cortina de entrada some via CSS; remover evita que ela capture cliques.
 * Em navegação interna ela nem chega a aparecer — a animação de abertura é
 * para quem chega ao site, não para quem volta de uma página interna.
 */
export function dismissIntro(id = 'intro', ms = 2000) {
  const el = document.getElementById(id)
  if (!el) return
  if (cameFromSite()) { el.remove(); return }
  setTimeout(() => el.remove(), ms)
}

/** Volta para a página de origem real; cai no fallback em acesso direto. */
export function backTarget(fallback) {
  try {
    const ref = new URL(document.referrer)
    if (ref.origin === location.origin && ref.pathname !== location.pathname) {
      return ref.pathname + ref.search + ref.hash
    }
  } catch { /* sem referrer */ }
  return fallback
}

/** Aponta os links de voltar para a origem real da visita. */
export function wireBackLinks(fallback) {
  const href = backTarget(fallback)
  document.querySelectorAll('[data-back]').forEach(a => a.setAttribute('href', href))
}

/* --------------------------------------------------------------- notícias */
/**
 * Destino de uma notícia: o link externo cadastrado ou a página de detalhe.
 * Alguns registros trazem "#" ou espaços no link_url — isso é "sem link",
 * não um link válido, senão o card não leva a lugar nenhum.
 */
export function newsLink(n) {
  const url = String(n.link_url || '').trim()
  if (url && url !== '#') return url
  return `noticia-detalhe.html?id=${encodeURIComponent(n.id)}`
}

export const isExternalLink = url => /^https?:/i.test(url)

/* ------------------------------------------------------------------ vídeo */
export function youtubeId(url) {
  try {
    if (url.includes('youtu.be')) return url.split('/').pop().split('?')[0]
    if (url.includes('youtube.com')) return new URLSearchParams(new URL(url).search).get('v')
  } catch { /* url inválida */ }
  return null
}

export function embedUrl(url) {
  const yt = youtubeId(url)
  if (yt) return `https://www.youtube.com/embed/${yt}?autoplay=1&rel=0`
  if (url.includes('vimeo.com')) return `https://player.vimeo.com/video/${url.split('/').pop()}?autoplay=1`
  return url
}

export const isDirectVideo = url => /\.(mp4|webm|ogg)(\?.*)?$/i.test(url)

export const videoThumb = v => {
  if (v.thumbnail_url) return v.thumbnail_url
  const yt = youtubeId(v.video_url || '')
  return yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : ''
}

/** Troca a capa pelo player no primeiro clique. */
export function wirePlayers(scope) {
  scope.querySelectorAll('.video-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      const url = slot.getAttribute('data-src')
      if (!url) return
      slot.innerHTML = isDirectVideo(url)
        ? `<video src="${esc(url)}" controls autoplay playsinline style="position:absolute;inset:0;width:100%;height:100%"></video>`
        : `<iframe src="${esc(embedUrl(url))}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>`
      slot.style.cursor = 'default'
    }, { once: true })
  })
}
