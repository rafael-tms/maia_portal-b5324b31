import React, { useEffect, useMemo, useRef, useState } from 'react'
import { SITE } from './PreviewModal'

export type PreviewOverrides = Record<string, any[] | any>

interface PortalPreviewProps {
  /** Âncora da seção real no portal: hero | sobre | trajetoria | midia | videos | galeria | contato */
  section: string
  /** Idioma que o preview deve exibir (pt, en, es, de, fr, it) */
  lang: string
  /** Linhas ainda NÃO salvas, no mesmo formato do banco, por tabela */
  overrides: PreviewOverrides
  /** Página do portal (padrão: home) */
  page?: string
  /** Altura visível do preview no modal */
  height?: number
}

/* Largura "de tela cheia" usada dentro do iframe. O conteúdo é reduzido por
 * transform: scale() para caber no modal, mantendo o layout idêntico ao do
 * portal em desktop (nada de breakpoints mobile aparecendo no preview). */
const FRAME_W = 1440
const FRAME_H = 900

/**
 * Renderiza a seção REAL do portal dentro de um iframe, alimentando os
 * renderizadores do site com os dados ainda não salvos do Admin.
 * O que aparece aqui é exatamente o que o visitante verá depois de salvar.
 */
const PortalPreview: React.FC<PortalPreviewProps> = ({
  section, lang, overrides, page = '/index.html', height = 520
}) => {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const overridesRef = useRef(overrides)
  const [scale, setScale] = useState(0.6)
  const [nonce, setNonce] = useState(0)
  // Idioma do preview: começa no da aba ativa, mas pode ser trocado para testar.
  const [viewLang, setViewLang] = useState(lang)

  useEffect(() => { setViewLang(lang) }, [lang])

  overridesRef.current = overrides

  const src = useMemo(
    () => `${page}?preview=1&lang=${viewLang}&n=${nonce}#${section}`,
    [page, viewLang, section, nonce]
  )


  // Responde ao pedido do iframe e reenvia sempre que os dados mudarem.
  useEffect(() => {
    const send = () => {
      frameRef.current?.contentWindow?.postMessage(
        { type: 'maia-preview-data', overrides: overridesRef.current },
        '*'
      )
    }
    const onMsg = (ev: MessageEvent) => {
      if (ev.data?.type === 'maia-preview-request') send()
    }
    window.addEventListener('message', onMsg)
    send()
    return () => window.removeEventListener('message', onMsg)
  }, [overrides])

  // Ajusta a escala para o iframe caber na largura do modal.
  useEffect(() => {
    const fit = () => {
      const w = wrapRef.current?.clientWidth || FRAME_W
      setScale(Math.min(1, w / FRAME_W))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '12px', color: SITE.textMuted }}>
          Seção real do portal ({section}) com as alterações ainda não salvas
        </span>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {PREVIEW_LANGS.map(l => (
            <button
              key={l.code}
              type="button"
              onClick={() => setViewLang(l.code)}
              title={l.name}
              style={{
                padding: '4px 8px',
                background: viewLang === l.code ? SITE.green : 'transparent',
                color: viewLang === l.code ? '#06210f' : SITE.text,
                border: `1px solid ${viewLang === l.code ? SITE.green : SITE.border}`,
                borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 700
              }}
            >
              {l.code.toUpperCase()}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setNonce(n => n + 1)}
            style={{
              padding: '6px 14px', background: 'transparent', color: SITE.green,
              border: `1px solid ${SITE.green}`, borderRadius: '8px', cursor: 'pointer',
              fontSize: '12px', fontWeight: 700
            }}
          >
            ↻ Recarregar
          </button>
        </div>

      </div>

      <div
        ref={wrapRef}
        style={{
          width: '100%',
          height: `${height}px`,
          overflow: 'hidden',
          borderRadius: '12px',
          border: `1px solid ${SITE.border}`,
          background: '#0a1611'
        }}
      >
        <iframe
          ref={frameRef}
          src={src}
          title="Pré-visualização do portal"
          style={{
            width: `${FRAME_W}px`,
            height: `${Math.max(FRAME_H, height / scale)}px`,
            border: 0,
            transform: `scale(${scale})`,
            transformOrigin: 'top left'
          }}
        />
      </div>
    </div>
  )
}

export default PortalPreview
