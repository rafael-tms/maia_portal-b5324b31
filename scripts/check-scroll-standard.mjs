/**
 * Verifica o padrão de scroll do sistema. Rode depois de `npm run build`:
 *   node scripts/check-scroll-standard.mjs
 *
 * Falha se algo silenciosamente regredir:
 *  - Tailwind parar de gerar as utilities do <ScrollArea> (ex.: preflight/content mexidos)
 *  - o Radix ScrollArea sair do bundle (componente virar código morto)
 *  - alguma página HTML deixar de linkar css/scrollbar.css
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import assert from 'node:assert/strict'

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const dist = join(root, 'dist')

assert.ok(existsSync(dist), 'dist/ não existe — rode `npm run build` primeiro')

const read = (dir, match) => {
  const f = readdirSync(dir).find(match)
  assert.ok(f, `nenhum arquivo casou em ${dir}`)
  return readFileSync(join(dir, f), 'utf8')
}

const assets = join(dist, 'assets')
const adminCss = read(assets, n => /^admin-.*\.css$/.test(n))
const adminJs = read(assets, n => /^admin-.*\.js$/.test(n))

// 1. Utilities do ScrollArea presentes no CSS do admin.
for (const cls of ['touch-none', 'select-none', 'rounded-full', 'w-2\\.5', 'h-2\\.5']) {
  assert.ok(adminCss.includes('.' + cls), `Tailwind não gerou a utility .${cls.replace('\\', '')}`)
}

// 2. O thumb do React lê a mesma variável das páginas estáticas.
assert.ok(
  adminCss.includes('var(--scrollbar-thumb)'),
  'thumb do <ScrollArea> não está lendo --scrollbar-thumb',
)

// 3. Radix ScrollArea realmente empacotado (não tree-shaken).
assert.match(adminJs, /scroll-area/, 'Radix ScrollArea não está no bundle do admin')

// 4. Toda página HTML linka o scrollbar.css global.
const pages = readdirSync(dist).filter(n => n.endsWith('.html'))
assert.ok(pages.length >= 6, `esperava >=6 páginas no dist, achei ${pages.length}`)
for (const page of pages) {
  const html = readFileSync(join(dist, page), 'utf8')
  assert.match(html, /scrollbar-[\w-]*\.css/, `${page} não linka o css/scrollbar.css`)
}

console.log(`OK — padrão de scroll íntegro (${pages.length} páginas, utilities + Radix presentes)`)
