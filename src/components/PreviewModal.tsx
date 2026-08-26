import React, { useEffect } from 'react'

interface PreviewModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

// Tokens visuais copiados do portal (index.html / css/redesign.css)
export const SITE = {
  bg: '#0a1611',
  bgDeep: '#061009',
  card: '#0f2018',
  border: '#1e3a2a',
  green: '#3cc674',
  text: '#eef2ec',
  textMuted: 'rgba(238,242,236,.6)',
  headingFont: "'Bricolage Grotesque', sans-serif",
  bodyFont: 'Manrope, sans-serif'
}

let fontsLoaded = false
function loadSiteFonts() {
  if (fontsLoaded || typeof document === 'undefined') return
  fontsLoaded = true
  const pre1 = document.createElement('link')
  pre1.rel = 'preconnect'
  pre1.href = 'https://fonts.googleapis.com'
  const pre2 = document.createElement('link')
  pre2.rel = 'preconnect'
  pre2.href = 'https://fonts.gstatic.com'
  pre2.crossOrigin = 'anonymous'
  const css = document.createElement('link')
  css.rel = 'stylesheet'
  css.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Manrope:wght@400;500;600;700;800&display=swap'
  document.head.append(pre1, pre2, css)
}

/**
 * Modal de pré-visualização usado no Admin.
 * Renderiza o conteúdo com o MESMO visual do portal (fundo verde-escuro,
 * Bricolage Grotesque nos títulos, Manrope no texto, verde #3cc674),
 * mostrando como a alteração vai ficar no site ANTES de salvar.
 */
const PreviewModal: React.FC<PreviewModalProps> = ({ open, onClose, title = 'Pré-visualização', children }) => {
  useEffect(() => { loadSiteFonts() }, [])
  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(6,16,9,0.85)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 20px',
        overflowY: 'auto',
        fontFamily: SITE.bodyFont
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: SITE.bg,
          border: `1px solid ${SITE.border}`,
          borderRadius: '16px',
          width: '100%',
          maxWidth: '960px',
          color: SITE.text,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: `1px solid ${SITE.border}`, backgroundColor: SITE.bgDeep }}>
          <div>
            <h3 style={{ margin: 0, color: SITE.green, fontSize: '20px', fontFamily: SITE.headingFont, fontWeight: 800, letterSpacing: '-.02em' }}>{title}</h3>
            <span style={{ fontSize: '12px', color: SITE.textMuted }}>Alterações ainda não salvas — visual idêntico ao portal</span>
          </div>
          <button
            onClick={onClose}
            style={{ padding: '8px 16px', backgroundColor: 'transparent', color: SITE.text, border: `1px solid ${SITE.border}`, borderRadius: '8px', cursor: 'pointer', fontFamily: SITE.bodyFont, fontWeight: 600 }}
          >
            Fechar
          </button>
        </div>

        <div style={{ padding: '32px', background: `linear-gradient(180deg, ${SITE.card} 0%, ${SITE.bg} 100%)`, fontFamily: SITE.bodyFont }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export const PreviewButton: React.FC<{ onClick: () => void; label?: string }> = ({ onClick, label = 'Pré-visualizar' }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: '8px 18px',
      backgroundColor: 'transparent',
      color: SITE.green,
      border: `1px solid ${SITE.green}`,
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '14px',
      whiteSpace: 'nowrap'
    }}
  >
    👁 {label}
  </button>
)

export default PreviewModal
