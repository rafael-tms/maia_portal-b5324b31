// Home (Redesign v3) — dados do Supabase + interações da página.
// Substitui, apenas nesta página, os antigos update-{stats,about,today,trajectory,
// home-media,home-videos,gallery-home,contact}.js, que emitiam markup do Webflow.
import { supabase } from './supabase-client.js'
import {
  lang, esc, json, tr, fmtDate,
  applyI18n, wireLangMenu, videoThumb, wirePlayers, cameFromSite, newsLink
} from './redesign-shared.js'

const I18N = {
  pt: { kicker:'FUTEBOLISTA — CENTRO AVANTE', hero_p:'Ambidestra, finalização precisa e leitura de jogo rara. A nova geração do ataque brasileiro — em campo na Alemanha, convocada pela seleção.', cta_hl:'VER HIGHLIGHTS', traj_title_u:'TRAJETÓRIA', goals:'GOLS', assists:'ASSISTÊNCIAS', matches:'PARTIDAS', gpg:'GOLS / JOGO', about_title:'Sobre<br>a Maia', about_p:'Ambidestra, boa finalização, bom posicionamento, boa leitura de jogo, cobradora de faltas e pênaltis.', langs_label:'IDIOMAS', traj_title:'Trajetória', midia_title:'Na Mídia', videos_title:'Vídeos', gal_title:'Galeria', see_all:'VER TODAS →', see_all_m:'VER TODOS →', see_all_f:'VER TODA →', contato_title:'Fale com<br>a Maia', contato_p:'Contato para clubes, imprensa e patrocinadores.', rights:'© 2026 Maia Rodrigues — Todos os direitos reservados', contato_btn:'CONTATO', today_label:'HOJE' , sec_01:'01 / SOBRE', sec_02:'02 / TRAJETÓRIA', sec_03:'03 / NA MÍDIA', sec_04:'04 / VÍDEOS', sec_05:'05 / GALERIA', sec_06:'06 / CONTATO', about_u:'SOBRE' },
  en: { kicker:'FOOTBALLER — STRIKER', hero_p:'Two-footed, clinical finishing and rare game vision. The new generation of Brazilian attack — playing in Germany, called up by the national team.', cta_hl:'WATCH HIGHLIGHTS', traj_title_u:'CAREER', goals:'GOALS', assists:'ASSISTS', matches:'MATCHES', gpg:'GOALS / GAME', about_title:'About<br>Maia', about_p:'Two-footed, strong finishing, positioning and game reading; free-kick and penalty taker.', langs_label:'LANGUAGES', traj_title:'Career', midia_title:'In the Media', videos_title:'Videos', gal_title:'Gallery', see_all:'SEE ALL →', see_all_m:'SEE ALL →', see_all_f:'SEE ALL →', contato_title:'Contact<br>Maia', contato_p:'Contact for clubs, press and sponsors.', rights:'© 2026 Maia Rodrigues — All rights reserved', contato_btn:'CONTACT', today_label:'TODAY' , sec_01:'01 / ABOUT', sec_02:'02 / CAREER', sec_03:'03 / IN THE MEDIA', sec_04:'04 / VIDEOS', sec_05:'05 / GALLERY', sec_06:'06 / CONTACT', about_u:'ABOUT' },
  es: { kicker:'FUTBOLISTA — DELANTERA CENTRO', hero_p:'Ambidiestra, definición precisa y una lectura de juego poco común. La nueva generación del ataque brasileño — jugando en Alemania, convocada por la selección.', cta_hl:'VER HIGHLIGHTS', traj_title_u:'TRAYECTORIA', goals:'GOLES', assists:'ASISTENCIAS', matches:'PARTIDOS', gpg:'GOLES / PARTIDO', about_title:'Sobre<br>Maia', about_p:'Ambidiestra, buena definición, buen posicionamiento, buena lectura de juego, lanzadora de faltas y penales.', langs_label:'IDIOMAS', traj_title:'Trayectoria', midia_title:'En los Medios', videos_title:'Vídeos', gal_title:'Galería', see_all:'VER TODO →', see_all_m:'VER TODO →', see_all_f:'VER TODO →', contato_title:'Habla con<br>Maia', contato_p:'Contacto para clubes, prensa y patrocinadores.', rights:'© 2026 Maia Rodrigues — Todos los derechos reservados', contato_btn:'CONTACTO', today_label:'HOY' , sec_01:'01 / SOBRE', sec_02:'02 / TRAYECTORIA', sec_03:'03 / EN LOS MEDIOS', sec_04:'04 / VÍDEOS', sec_05:'05 / GALERÍA', sec_06:'06 / CONTACTO', about_u:'SOBRE' },
  de: { kicker:'FUSSBALLERIN — MITTELSTÜRMERIN', hero_p:'Beidfüßig, präziser Abschluss und seltenes Spielverständnis. Die neue Generation des brasilianischen Angriffs — in Deutschland am Ball, für die Nationalmannschaft nominiert.', cta_hl:'HIGHLIGHTS ANSEHEN', traj_title_u:'WERDEGANG', goals:'TORE', assists:'VORLAGEN', matches:'SPIELE', gpg:'TORE / SPIEL', about_title:'Über<br>Maia', about_p:'Beidfüßig, starker Abschluss, gutes Stellungsspiel und Spielverständnis; Freistoß- und Elfmeterschützin.', langs_label:'SPRACHEN', traj_title:'Werdegang', midia_title:'In den Medien', videos_title:'Videos', gal_title:'Galerie', see_all:'ALLE ANSEHEN →', see_all_m:'ALLE ANSEHEN →', see_all_f:'ALLE ANSEHEN →', contato_title:'Kontakt zu<br>Maia', contato_p:'Kontakt für Vereine, Presse und Sponsoren.', rights:'© 2026 Maia Rodrigues — Alle Rechte vorbehalten', contato_btn:'KONTAKT', today_label:'HEUTE' , sec_01:'01 / ÜBER', sec_02:'02 / WERDEGANG', sec_03:'03 / IN DEN MEDIEN', sec_04:'04 / VIDEOS', sec_05:'05 / GALERIE', sec_06:'06 / KONTAKT', about_u:'ÜBER' },
  fr: { kicker:'FOOTBALLEUSE — AVANT-CENTRE', hero_p:"Ambidextre, finition précise et lecture du jeu rare. La nouvelle génération de l'attaque brésilienne — sur les terrains en Allemagne, convoquée en sélection.", cta_hl:'VOIR LES HIGHLIGHTS', traj_title_u:'PARCOURS', goals:'BUTS', assists:'PASSES DÉC.', matches:'MATCHS', gpg:'BUTS / MATCH', about_title:'À propos<br>de Maia', about_p:'Ambidextre, bonne finition, bon placement, bonne lecture du jeu ; tireuse de coups francs et de penaltys.', langs_label:'LANGUES', traj_title:'Parcours', midia_title:'Dans les Médias', videos_title:'Vidéos', gal_title:'Galerie', see_all:'TOUT VOIR →', see_all_m:'TOUT VOIR →', see_all_f:'TOUT VOIR →', contato_title:'Contacter<br>Maia', contato_p:'Contact pour clubs, presse et sponsors.', rights:'© 2026 Maia Rodrigues — Tous droits réservés', contato_btn:'CONTACT', today_label:"AUJOURD'HUI" , sec_01:'01 / À PROPOS', sec_02:'02 / PARCOURS', sec_03:'03 / DANS LES MÉDIAS', sec_04:'04 / VIDÉOS', sec_05:'05 / GALERIE', sec_06:'06 / CONTACT', about_u:'À PROPOS' },
  it: { kicker:'CALCIATRICE — CENTRAVANTI', hero_p:"Ambidestra, finalizzazione precisa e rara lettura del gioco. La nuova generazione dell'attacco brasiliano — in campo in Germania, convocata in nazionale.", cta_hl:'GUARDA GLI HIGHLIGHTS', traj_title_u:'CARRIERA', goals:'GOL', assists:'ASSIST', matches:'PARTITE', gpg:'GOL / PARTITA', about_title:'Su<br>Maia', about_p:'Ambidestra, buona finalizzazione, buon posizionamento, buona lettura del gioco; tiratrice di punizioni e rigori.', langs_label:'LINGUE', traj_title:'Carriera', midia_title:'Nei Media', videos_title:'Video', gal_title:'Galleria', see_all:'VEDI TUTTO →', see_all_m:'VEDI TUTTO →', see_all_f:'VEDI TUTTO →', contato_title:'Contatta<br>Maia', contato_p:'Contatto per club, stampa e sponsor.', rights:'© 2026 Maia Rodrigues — Tutti i diritti riservati', contato_btn:'CONTATTO', today_label:'OGGI' , sec_01:'01 / SU MAIA', sec_02:'02 / CARRIERA', sec_03:'03 / NEI MEDIA', sec_04:'04 / VIDEO', sec_05:'05 / GALLERIA', sec_06:'06 / CONTATTO', about_u:'SU MAIA' }
}

const LBL = {
  pt: { partidas:'PARTIDAS', gols:'GOLS', assist:'ASSIST.', destaque:'DESTAQUE', season:'TEMPORADA', seasons:'TEMPORADAS' },
  en: { partidas:'MATCHES', gols:'GOALS', assist:'ASSISTS', destaque:'FEATURED', season:'SEASON', seasons:'SEASONS' },
  es: { partidas:'PARTIDOS', gols:'GOLES', assist:'ASIST.', destaque:'DESTACADO', season:'TEMPORADA', seasons:'TEMPORADAS' },
  de: { partidas:'SPIELE', gols:'TORE', assist:'VORLAGEN', destaque:'HIGHLIGHT', season:'SAISON', seasons:'SAISONS' },
  fr: { partidas:'MATCHS', gols:'BUTS', assist:'PASSES', destaque:'À LA UNE', season:'SAISON', seasons:'SAISONS' },
  it: { partidas:'PARTITE', gols:'GOL', assist:'ASSIST', destaque:'IN EVIDENZA', season:'STAGIONE', seasons:'STAGIONI' }
}

const L = () => LBL[lang()] || LBL.pt

/* --------------------------------------------------- observers reutilizáveis */
const root = document.getElementById('snap-root')

/* Quem depende da posição do scroll (barra de progresso, dots da Trajetória)
 * assina aqui. Além do evento nativo, a própria navegação emite — o evento de
 * scroll não dispara em aba de fundo, e aí os indicadores congelavam. */
const scrollHooks = []
const onScrollChange = fn => { scrollHooks.push(fn); fn() }
const emitScroll = () => scrollHooks.forEach(fn => fn())

/* Navegação até uma seção. wireInteractions() substitui por goTo(), para que
 * dots, roda e teclado usem exatamente a mesma animação e o mesmo lock. */
let navigateToSection = el => el?.scrollIntoView({ behavior: 'smooth' })

/* Distância do elemento até o topo do scroll. offsetTop sozinho não serve: os
 * marcadores da Trajetória ficam dentro de uma seção posicionada, então são
 * relativos a ela e não à raiz. */
const offsetIn = el => {
  let y = 0, n = el
  while (n && n !== root) { y += n.offsetTop; n = n.offsetParent }
  return y
}

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
}, { root, threshold: 0.15 })

const lv = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.style.width = '90px'; lv.unobserve(e.target) } })
}, { root, threshold: 0.4 })

const fmtNum = (v, dec) => dec ? v.toFixed(dec).replace('.', ',') : Math.round(v).toString()
const cu = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return
    cu.unobserve(e.target)
    const target = parseFloat(String(e.target.getAttribute('data-count')).replace(',', '.'))
    if (!isFinite(target)) return
    const dec = parseInt(e.target.getAttribute('data-dec') || '0', 10)
    const t0 = performance.now(), dur = 1400
    const tick = t => {
      const p = Math.min(1, (t - t0) / dur), ease = 1 - Math.pow(1 - p, 3)
      e.target.textContent = fmtNum(target * ease, dec)
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}, { root, threshold: 0.5 })

// Registra nós recém-injetados nos observers + hover magnético.
function observeIn(el) {
  if (!el) return
  el.querySelectorAll('[data-rv]').forEach(n => rv.observe(n))
  el.querySelectorAll('[data-rvl]').forEach(n => lv.observe(n))
  el.querySelectorAll('[data-count]').forEach(n => cu.observe(n))
  el.querySelectorAll('[data-mag]').forEach(wireMagnetic)
}

function wireMagnetic(btn) {
  if (btn.__mag) return
  btn.__mag = true
  btn.addEventListener('mousemove', ev => {
    const r = btn.getBoundingClientRect()
    const x = (ev.clientX - r.left) / r.width - 0.5
    const y = (ev.clientY - r.top) / r.height - 0.5
    btn.style.transform = `translate(${x * 10}px,${y * 8}px)`
  })
  btn.addEventListener('mouseleave', () => { btn.style.transform = 'none' })
}

/* ------------------------------------------------------------------ STATS */
// Mesma regra do editor: soma os itens de stats_data por ícone; cai para os
// totais persistidos em player_stats quando os cards não cobrem tudo.
function sumStats(todayCards, trajectoryCards) {
  let gols = 0, partidas = 0, assist = 0
  const one = item => {
    if (!item || !item.text) return
    const val = parseInt(String(item.text).replace(/\D/g, '')) || 0
    const icon = String(item.icon || '').toLowerCase().replace(/\.(png|jpe?g)(\?.*)?$/, '.webp')
    if (icon.includes('goal-1.webp')) gols += val
    if (icon.includes('partidas.webp')) partidas += val
    if (icon.includes('assitencia2.webp')) assist += val
  }
  const walk = card => {
    const s = json(card.stats_data)
    if (!Array.isArray(s)) return
    if (s.length && !s[0].items) s.forEach(one)
    else s.forEach(cat => Array.isArray(cat.items) && cat.items.forEach(one))
  }
  todayCards.forEach(walk)
  trajectoryCards.forEach(walk)
  return { gols, partidas, assist }
}

function renderStats(player, todayCards, trajectoryCards) {
  const sum = sumStats(todayCards, trajectoryCards)
  const gols = sum.gols || parseInt(player.goals, 10) || 0
  const partidas = sum.partidas || parseInt(player.matches, 10) || 0
  const assist = sum.assist || parseInt(player.assists, 10) || 0
  const gpg = partidas > 0
    ? (gols / partidas).toFixed(2).replace('.', ',')
    : (player.goals_per_game || '0,00')

  const set = (id, v, dec) => {
    const el = document.getElementById(id)
    if (!el) return
    el.setAttribute('data-count', String(v).replace(',', '.'))
    if (dec) el.setAttribute('data-dec', String(dec))
    el.textContent = dec ? String(v) : String(v)
    cu.observe(el)
  }
  set('stat-goals', gols)
  set('stat-assists', assist)
  set('stat-matches', partidas)
  set('stat-goals-per-game', gpg, 2)

  // Textos editáveis em Admin > Estatísticas. O dado do banco vence a tradução
  // estática do data-i18n; sem dado, o texto do HTML permanece.
  const t = json(player.translations)
  const cur = lang()
  const alt = (cur !== 'pt' && t) ? (t[cur] || t[cur.slice(0, 2)]) : null

  const aplicar = (id, campo) => {
    let texto = player[campo] || ''
    // Legado: traduções já foram gravadas dentro de characteristics após "|||".
    if (texto.includes('|||')) texto = texto.split('|||')[0]
    if (alt) {
      // Formato antigo guardava a string direto, sem o nome do campo.
      texto = (typeof alt === 'string' ? (campo === 'characteristics' ? alt : '') : alt[campo]) || texto
    }
    const el = document.getElementById(id)
    if (el && texto.trim()) { el.removeAttribute('data-i18n'); el.textContent = texto.trim() }
  }

  aplicar('stat-characteristics', 'characteristics')
  aplicar('hero-text', 'hero_text')
}

/* ------------------------------------------------------------------ SOBRE */
function renderAbout(rows) {
  const c = document.getElementById('about-data-container')
  if (!c) return
  if (!rows.length) { c.style.display = 'none'; return }
  c.innerHTML = rows.map((r, i) => {
    const { label, value } = tr(r, ['label', 'value'])
    const left = i % 2 === 0
    return `<div data-rv data-d="${i}" style="padding:24px ${left ? '30px 24px 0' : '0 24px 30px'};border-bottom:1px solid rgba(16,28,20,.14);${left ? '' : 'border-left:1px solid rgba(16,28,20,.14);'}">
      <div style="font-size:11px;font-weight:800;letter-spacing:.22em;color:rgba(16,28,20,.45)">${esc(String(label).toUpperCase())}</div>
      <div style="font-weight:700;font-size:19px;margin-top:9px">${esc(value)}</div>
    </div>`
  }).join('')
  observeIn(c)
}

/* ------------------------------------------------------------------- HOJE */
// today_cards do tipo "stats" viram a faixa "HOJE · <clube>" abaixo dos dados.
function renderToday(cards) {
  const c = document.getElementById('today-cards-container')
  if (!c) return
  const card = cards.find(x => x.type === 'stats') || cards[0]
  if (!card) { c.style.display = 'none'; return }

  const { title, category } = tr(card, ['title', 'category'])
  const s = json(card.stats_data)
  const items = []
  if (Array.isArray(s)) {
    const flat = (s.length && !s[0].items) ? s : s.flatMap(cat => cat.items || [])
    flat.forEach(it => {
      const icon = String(it.icon || '').toLowerCase().replace(/\.(png|jpe?g)(\?.*)?$/, '.webp')
      const val = parseInt(String(it.text || '').replace(/\D/g, '')) || 0
      if (icon.includes('partidas.webp')) items.push({ k: L().partidas, v: val })
      else if (icon.includes('goal-1.webp')) items.push({ k: L().gols, v: val, hi: true })
      else if (icon.includes('assitencia2.webp')) items.push({ k: L().assist, v: val })
    })
  }

  c.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:36px;align-items:center;justify-content:space-between">
    <div style="display:flex;align-items:center;gap:20px">
      ${card.left_image_url
        ? `<div style="width:74px;height:74px;display:flex;align-items:center;justify-content:center;background:#fff;border:1px solid rgba(16,28,20,.1);padding:6px;box-sizing:border-box"><img src="${esc(card.left_image_url)}" alt="${esc(title)}" loading="lazy" style="max-width:100%;max-height:100%;object-fit:contain"></div>`
        : ''}
      <div>
        <div style="font-size:11px;font-weight:800;letter-spacing:.22em;color:rgba(16,28,20,.45)">${esc((I18N[lang()] || I18N.pt).today_label)}</div>
        <div style="font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:28px;letter-spacing:-.02em;margin-top:4px">${esc(title)}${category ? ` <span style="color:#17724a;font-size:17px;font-weight:700">/ ${esc(category)}</span>` : ''}</div>
      </div>
    </div>
    <div style="display:flex;gap:40px">
      ${items.map(i => `<div><div style="font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:32px;${i.hi ? 'color:#17724a' : ''}"><span data-count="${i.v}">${i.v}</span></div><div style="font-size:10.5px;font-weight:700;letter-spacing:.2em;color:rgba(16,28,20,.5);margin-top:4px">${esc(i.k)}</div></div>`).join('')}
    </div>
  </div>`
  observeIn(c)
}

/* -------------------------------------------------------------- TRAJETÓRIA */
function renderTrajectory(cards) {
  const c = document.getElementById('trajectory-cards-container')
  if (!c) return
  if (!cards.length) { c.innerHTML = ''; return }

  // Um card pode agrupar várias temporadas (um grupo de stats por temporada).
  // A linha do redesign representa uma temporada, então achatamos card → grupos.
  const STAT_ICONS = ['partidas', 'goal-1', 'assitencia2']
  const icon = x => String(x.icon || '').toLowerCase()
  const rows = cards.flatMap(card => {
    const { title, category } = tr(card, ['title', 'category'])

    // Traduções do card (backoffice): nome do clube, nome da categoria e texto
    // de cada item. Ícones e números ficam só na raiz — não mudam com o idioma.
    const t = json(card.translations)
    const cur = lang()
    const trad = (t && cur !== 'pt') ? (t[cur] || t[cur.slice(0, 2)]) : null
    const catsTrad = (trad && trad.cats) || {}

    let s = json(card.stats_data)
    if (!Array.isArray(s)) s = []
    if (s.length && !s[0].items) s = [{ name: category || '', items: s }]
    if (!s.length) s = [{ name: category || '', items: [] }]

    return s.map(group => {
      const items = group.items || []
      const g = catsTrad[group.id] || {}
      // Cai para o texto original sempre que a tradução daquele item faltar.
      const texto = idx => String((g.items && g.items[idx]) || items[idx]?.text || '').trim()

      const pick = key => {
        const i = items.findIndex(x => icon(x).includes(key))
        // Números vêm sempre da raiz: traduzir "26" não faria sentido.
        return i >= 0 ? (parseInt(String(items[i].text).replace(/\D/g, '')) || 0) : null
      }
      // O primeiro item de calendário do grupo é o período; o resto vira nota.
      const periodIdx = items.findIndex(x => icon(x).includes('calendar-1'))
      return {
        logo: card.left_image_url,
        clube: (trad && trad.title) || title,
        categoria: g.name || group.name || category || '',
        periodo: periodIdx >= 0 ? texto(periodIdx) : '',
        partidas: pick('partidas'),
        gols: pick('goal-1'),
        assist: pick('assitencia2'),
        nota: items
          .map((x, idx) => ({ x, idx }))
          .filter(({ x, idx }) => idx !== periodIdx && !STAT_ICONS.some(k => icon(x).includes(k)))
          .map(({ idx }) => texto(idx))
          .filter(Boolean)
          .join(' · ')
      }
    })
  })

  // Um card por clube: temporadas do mesmo time voltam a ficar juntas.
  const clubs = []
  const byKey = new Map()
  rows.forEach(r => {
    const key = r.clube.trim().toLowerCase()
    let club = byKey.get(key)
    if (!club) {
      club = { clube: r.clube.trim(), logo: r.logo, seasons: [] }
      byKey.set(key, club)
      clubs.push(club)
    }
    if (!club.logo) club.logo = r.logo
    club.seasons.push(r)
  })

  // Até 2 clubes por seção, na ordem em que foram cadastrados (display_order).
  const PER_SLIDE = 2
  const slides = []
  for (let i = 0; i < clubs.length; i += PER_SLIDE) slides.push(clubs.slice(i, i + PER_SLIDE))

  // O valor real já vai no HTML: se o rAF não rodar (aba em background, aba
  // oculta), o número fica correto — a contagem é só o enfeite por cima.
  const num = (v, k, hi) => v === null ? '' :
    `<div><div class="traj-num" ${hi ? 'style="color:#17724a"' : ''}><span data-count="${v}">${v}</span></div><div style="font-size:9.5px;font-weight:700;letter-spacing:.18em;color:rgba(16,28,20,.45);margin-top:3px">${esc(k)}</div></div>`

  const clubHtml = club => `<article class="traj-club">
      <div class="traj-club-head">
        <div class="traj-logo">
          ${club.logo ? `<img src="${esc(club.logo)}" alt="${esc(club.clube)}" loading="lazy" style="max-width:100%;max-height:100%;object-fit:contain">` : ''}
        </div>
        <div>
          <div style="font-size:10px;font-weight:800;letter-spacing:.22em;color:rgba(16,28,20,.45)">${club.seasons.length} ${club.seasons.length === 1 ? L().season : L().seasons}</div>
          <h3 class="traj-club-name">${esc(club.clube)}</h3>
        </div>
      </div>
      ${club.seasons.map(s => `<div class="traj-season">
        <div style="font-family:'Bricolage Grotesque',sans-serif;font-weight:700;font-size:15px;color:#17724a">${esc(s.periodo)}</div>
        <div>
          ${s.categoria ? `<div style="font-weight:700;font-size:14px;color:rgba(16,28,20,.6)">${esc(s.categoria)}</div>` : ''}
          ${s.nota ? `<div class="traj-note" title="${esc(s.nota)}">${esc(s.nota)}</div>` : ''}
        </div>
        <div class="traj-stats" style="display:flex;gap:30px;text-align:right;justify-content:flex-end">
          ${num(s.partidas, L().partidas)}${num(s.gols, L().gols, true)}${num(s.assist, L().assist)}
        </div>
      </div>`).join('')}
    </article>`

  // Trilho: uma página por grupo. A seção fica pinada e só o trilho anda.
  // Dots à esquerda — o dot-nav de seções do site fica fixo à direita.
  c.innerHTML = `<div class="traj-viewport">
      <div class="traj-track">
        ${slides.map(group => `<div class="traj-page"><div class="traj-slide">${group.map(clubHtml).join('')}</div></div>`).join('')}
      </div>
    </div>
    <div class="traj-dots" style="position:absolute;left:-30px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:12px">
      ${slides.map((group, i) => `<button class="traj-dot" data-traj-go="${i}" title="${esc(group.map(g => g.clube).join(' · '))}"></button>`).join('')}
    </div>`

  // Cada passo é um marcador invisível: entra em secs() como qualquer seção,
  // então roda, teclado e dot-nav do site navegam por eles sem caso especial.
  const section = document.getElementById('trajetoria')
  section.querySelectorAll('.traj-marker').forEach(n => n.remove())
  section.style.height = (slides.length * 100) + 'vh'
  const markers = slides.map((_, i) => {
    const m = document.createElement('div')
    m.className = 'traj-marker'
    m.setAttribute('data-sec', 'trajetoria')
    m.style.top = (i * 100) + 'vh'
    section.appendChild(m)
    return m
  })

  observeIn(c)
  wireTrajectoryPin(section, c, markers)
}

/* Move o trilho de clubes conforme a rolagem geral avança pela seção pinada.
 * O deslocamento é contínuo e derivado do scrollTop — não há scroll aninhado
 * nem estado próprio para dessincronizar. */
function wireTrajectoryPin(section, container, markers) {
  const viewport = container.querySelector('.traj-viewport')
  const track = container.querySelector('.traj-track')
  const dots = Array.from(container.querySelectorAll('[data-traj-go]'))
  const steps = markers.length - 1

  dots.forEach(d => d.addEventListener('click', () => {
    navigateToSection(markers[parseInt(d.getAttribute('data-traj-go'), 10)])
  }))

  const pin = section.querySelector('.traj-pin')

  // As páginas do trilho precisam da altura exata do viewport, que vem do flex
  // e só existe em runtime. Recalculada aqui a cada atualização: um ResizeObserver
  // dependeria de frames e ficava obsoleto em aba de fundo.
  const update = () => {
    const h = viewport.clientHeight
    container.style.setProperty('--traj-page-h', h + 'px')
    if (!steps) return
    const span = section.offsetHeight - pin.offsetHeight
    if (span <= 0) return
    const p = Math.max(0, Math.min(1, (root.scrollTop - offsetIn(section)) / span))
    track.style.transform = `translateY(${-p * steps * h}px)`
    const active = Math.round(p * steps)
    dots.forEach(d => d.setAttribute('aria-current', String(parseInt(d.getAttribute('data-traj-go'), 10) === active)))
  }

  window.addEventListener('resize', update)
  onScrollChange(update)
}

/* ---------------------------------------------------------------- NA MÍDIA */
function renderMedia(news) {
  const c = document.getElementById('home-media-container')
  if (!c) return
  if (!news.length) { c.innerHTML = ''; return }

  const [feat, ...rest] = news
  const f = tr(feat, ['title', 'summary'])
  const featHref = newsLink(feat)

  const featured = `<a class="feature-card" href="${esc(featHref)}" data-rv data-d="1" style="position:relative;min-height:440px;overflow:hidden;background:#061009;display:block;color:#fff">
    ${feat.image_url ? `<img class="feature-img" src="${esc(feat.image_url)}" alt="${esc(f.title)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 1.2s cubic-bezier(.2,.65,.2,1)">` : ''}
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,22,17,0) 40%,rgba(10,22,17,.95) 100%);pointer-events:none"></div>
    <div style="position:absolute;left:38px;right:38px;bottom:34px;pointer-events:none">
      <div style="display:inline-block;background:#3cc674;color:#0a1611;font-size:10.5px;font-weight:800;letter-spacing:.2em;padding:8px 15px;margin-bottom:16px">${esc(L().destaque)}</div>
      <div style="font-family:'Bricolage Grotesque',sans-serif;font-weight:800;font-size:33px;line-height:1.08">${esc(f.title)}</div>
      <div style="margin-top:11px;font-size:12.5px;color:rgba(255,255,255,.55);letter-spacing:.08em">${esc(fmtDate(feat.published_date))}</div>
    </div>
  </a>`

  const side = `<div style="display:grid;grid-template-rows:repeat(${Math.max(rest.length, 1)},1fr);gap:2px">
    ${rest.map((n, i) => {
      const t = tr(n, ['title'])
      const href = newsLink(n)
      return `<a class="news-card" href="${esc(href)}" data-rv data-d="${i + 1}" style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);padding:26px 30px;display:flex;flex-direction:column;justify-content:center;transition:background .4s,border-color .4s;color:#fff">
        <div style="font-size:11px;font-weight:800;color:#3cc674;letter-spacing:.14em">${esc(fmtDate(n.published_date))}</div>
        <div style="font-weight:700;font-size:17px;line-height:1.35;margin-top:9px">${esc(t.title)}</div>
      </a>`
    }).join('')}
  </div>`

  c.innerHTML = featured + (rest.length ? side : '')
  observeIn(c)
}

/* ------------------------------------------------------------------ VÍDEOS */
function renderVideos(videos) {
  const c = document.getElementById('home-videos-container')
  if (!c) return
  if (!videos.length) { c.innerHTML = ''; return }

  c.innerHTML = videos.map((v, i) => {
    const thumb = videoThumb(v)
    return `<div class="video-card" data-rv data-d="${i}" style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);transition:border-color .4s">
      <div class="video-slot" data-src="${esc(v.video_url || '')}" style="position:relative;padding-bottom:56.25%;background:#061009;overflow:hidden;cursor:pointer">
        ${thumb ? `<img src="${esc(thumb)}" alt="${esc(v.title)}" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">` : ''}
        <div class="play-btn" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:54px;height:54px;background:#3cc674;display:flex;align-items:center;justify-content:center;transition:transform .35s;animation:pulse 2.4s infinite"><div style="width:0;height:0;border-left:14px solid #0a1611;border-top:9px solid transparent;border-bottom:9px solid transparent;margin-left:3px"></div></div>
      </div>
      <div style="padding:22px 26px">
        <div style="font-size:11px;font-weight:800;color:#3cc674;letter-spacing:.14em">${esc(fmtDate(v.created_at))}</div>
        <div style="font-weight:700;font-size:16.5px;line-height:1.35;margin-top:8px">${esc(v.title)}</div>
      </div>
    </div>`
  }).join('')

  wirePlayers(c)
  observeIn(c)
}

/* ----------------------------------------------------------------- GALERIA */
// A faixa é um marquee horizontal: alimentada pela tabela `gallery` (imagens
// simples). O editor de montagem continua servindo a página galeria.html.
function renderGallery(items) {
  const strip = document.getElementById('home-gallery-strip')
  if (!strip) return
  const pics = items.map(g => g.image_url).filter(Boolean)
  if (!pics.length) {
    strip.parentElement.style.display = 'none'
    return
  }
  const widths = ['34vw', '22vw', '28vw']
  const cell = (src, i) => `<div style="width:${widths[i % widths.length]};height:44vh;position:relative;overflow:hidden;flex:none"><img src="${esc(src)}" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover"></div>`
  // duplicado: o keyframe `marquee` desloca -50%, então precisa de dois ciclos
  strip.innerHTML = pics.map(cell).join('') + pics.map(cell).join('')
}

/* ----------------------------------------------------------------- CONTATO */
function renderContact(info) {
  if (!info) return
  const setLink = (spanId, linkId, value, scheme) => {
    const span = document.getElementById(spanId)
    const link = document.getElementById(linkId)
    if (!span || !link) return
    if (!value) { link.style.display = 'none'; return }
    span.textContent = value
    // O campo pode listar vários números ("+49 … / +55 …"); o link usa o primeiro.
    link.href = scheme + (scheme === 'tel:' ? value.split('/')[0].replace(/[^\d+]/g, '') : value)
  }
  setLink('footer-contact-phone', 'footer-contact-phone-link', info.phone, 'tel:')
  setLink('footer-contact-email', 'footer-contact-email-link', info.email, 'mailto:')
}

/* ------------------------------------------------------------- interações */
function wireInteractions() {
  if (!root) return

  root.querySelectorAll('[data-rv]').forEach(el => rv.observe(el))
  root.querySelectorAll('[data-rvl]').forEach(el => lv.observe(el))
  root.querySelectorAll('[data-count]').forEach(el => cu.observe(el))
  document.querySelectorAll('[data-mag]').forEach(wireMagnetic)

  // Ponto ativo da navegação lateral
  const dots = {}
  document.querySelectorAll('[data-dot]').forEach(d => { dots[d.getAttribute('data-dot')] = d })
  const sec = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return
      const id = e.target.getAttribute('data-sec')
      Object.entries(dots).forEach(([k, d]) => {
        d.style.background = k === id ? '#3cc674' : 'rgba(120,140,128,.5)'
        d.style.transform = k === id ? 'scale(1.5)' : 'none'
      })
    })
  }, { root, threshold: 0.55 })
  root.querySelectorAll('[data-sec]').forEach(s => sec.observe(s))

  // Navegação por seção inteira: um gesto = próxima/anterior.
  let lock = false
  const secs = () => Array.from(root.querySelectorAll('[data-sec]'))

  // O índice sai da posição real do scroll. Antes vinha de um IntersectionObserver
  // e dessincronizava quando a seção era alcançada por âncora, #hash ou scroll
  // programático — aí o gesto seguinte pulava para a seção errada.
  const currentIndex = () => {
    const ss = secs()
    let best = 0, dist = Infinity
    ss.forEach((s, i) => {
      const d = Math.abs(root.scrollTop - offsetIn(s))
      if (d < dist) { dist = d; best = i }
    })
    return best
  }
  if (matchMedia('(pointer:fine)').matches) root.style.scrollSnapType = 'none'

  let lockTimer
  const animateTo = (target, dur) => {
    const from = root.scrollTop, dist = target - from, t0 = performance.now()
    // O rAF não roda em aba de fundo/minimizada. Sem esta rede o `lock` nunca
    // seria liberado e a navegação entre seções travava de vez.
    clearTimeout(lockTimer)
    lockTimer = setTimeout(() => { root.scrollTop = target; lock = false; emitScroll() }, dur + 150)
    const step = t => {
      const p = Math.min(1, (t - t0) / dur)
      root.scrollTop = from + dist * (1 - Math.pow(1 - p, 3))
      emitScroll()
      if (p < 1) requestAnimationFrame(step)
      else { clearTimeout(lockTimer); lock = false }
    }
    requestAnimationFrame(step)
  }
  const goTo = i => {
    const ss = secs()
    if (!ss.length) return
    i = Math.max(0, Math.min(ss.length - 1, i))
    if (Math.abs(root.scrollTop - offsetIn(ss[i])) < 4) return
    lock = true
    animateTo(offsetIn(ss[i]), 620)
  }

  navigateToSection = el => { const i = secs().indexOf(el); if (i >= 0) goTo(i) }

  // Só sequestra a roda em ponteiro fino; no touch o scroll nativo resolve.
  window.addEventListener('wheel', ev => {
    if (!matchMedia('(pointer:fine)').matches) return
    ev.preventDefault()
    if (lock || Math.abs(ev.deltaY) < 3) return
    goTo(currentIndex() + (ev.deltaY > 0 ? 1 : -1))
  }, { passive: false })

  window.addEventListener('keydown', ev => {
    if (['ArrowDown', 'PageDown', ' '].includes(ev.key)) { ev.preventDefault(); goTo(currentIndex() + 1) }
    if (['ArrowUp', 'PageUp'].includes(ev.key)) { ev.preventDefault(); goTo(currentIndex() - 1) }
  })

  // Barra de progresso
  const bar = document.getElementById('scroll-progress')
  root.addEventListener('scroll', emitScroll, { passive: true })
  onScrollChange(() => {
    const p = root.scrollTop / (root.scrollHeight - root.clientHeight)
    if (bar) bar.style.width = (p * 100) + '%'
  })

  // Parallax da foto do hero
  const hero = document.getElementById('hero')
  const photo = document.getElementById('hero-photo')
  if (hero && photo) {
    hero.addEventListener('mousemove', ev => {
      const r = hero.getBoundingClientRect()
      const x = (ev.clientX - r.left) / r.width - 0.5
      const y = (ev.clientY - r.top) / r.height - 0.5
      photo.style.transform = `translate(${x * -18}px,${y * -12}px)`
    })
    hero.addEventListener('mouseleave', () => { photo.style.transform = 'none' })
  }

  // A cortina de intro fica com pointer-events; remove após a animação.
  setTimeout(() => { const i = document.getElementById('intro'); if (i) i.remove() }, 3200)
}

/* --------------------------------------------------------------------- go */
async function load() {
  const [player, today, trajectory, news, videos, gallery, contact] = await Promise.all([
    // '*' e não a lista de colunas: hero_text pode ainda não existir no banco.
    supabase.from('player_stats').select('*').limit(1).maybeSingle(),
    supabase.from('today_cards').select('*').order('display_order', { ascending: true }),
    supabase.from('trajectory_cards').select('*').order('display_order', { ascending: true }),
    supabase.from('news').select('*').eq('show_on_home', true).order('display_order', { ascending: true }).limit(4),
    supabase.from('videos').select('*').eq('is_active', true).eq('show_on_home', true).order('created_at', { ascending: false }).limit(3),
    supabase.from('gallery').select('*').eq('is_active', true).order('display_order', { ascending: true }).limit(12),
    supabase.from('contact_info').select('*').limit(1).maybeSingle()
  ])

  const alive = res => (res.data || []).filter(r => !r.deleted_at)
  const todayCards = alive(today)
  const trajectoryCards = alive(trajectory)

  renderStats(player.data || {}, todayCards, trajectoryCards)
  renderToday(todayCards)
  renderTrajectory(trajectoryCards)
  renderMedia(alive(news))
  renderVideos(alive(videos))
  renderGallery(alive(gallery))
  renderContact(contact.data)
}

async function loadAbout() {
  const { data } = await supabase.from('about_info').select('*').order('display_order', { ascending: true })
  renderAbout((data || []).filter(r => !r.deleted_at))
}

/* Voltando de uma página interna (index.html#videos, por exemplo): sem cortina
 * de abertura e direto na seção de origem. O salto só pode acontecer depois de
 * renderTrajectory(), que define a altura da seção pinada e desloca tudo abaixo. */
function skipIntroOnReturn() {
  if (location.hash || cameFromSite()) document.getElementById('intro')?.remove()
}

function jumpToHash() {
  if (!location.hash) return
  let target
  try { target = document.querySelector(location.hash) } catch { return }
  if (!target || !root) return
  const prev = root.style.scrollBehavior
  root.style.scrollBehavior = 'auto' // sem rolagem animada: chega já na seção
  root.scrollTop = offsetIn(target)
  root.style.scrollBehavior = prev
  emitScroll()
}

applyI18n(I18N)
wireLangMenu()
wireInteractions()
skipIntroOnReturn()
load()
  .then(jumpToHash)
  .catch(err => console.error('[home-redesign] falha ao carregar dados:', err))
loadAbout().catch(err => console.error('[home-redesign] falha ao carregar sobre:', err))
