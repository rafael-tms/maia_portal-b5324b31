import React from 'react'

interface PreviewModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

/**
 * Modal de pré-visualização usado no Admin.
 * Mostra como a alteração vai ficar no portal ANTES de salvar.
 */
const PreviewModal: React.FC<PreviewModalProps> = ({ open, onClose, title = 'Pré-visualização', children }) => {
  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 20px',
        overflowY: 'auto'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#0f0f0f',
          border: '1px solid #333',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '900px',
          color: '#fff',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #222' }}>
          <div>
            <h3 style={{ margin: 0, color: '#3cc674', fontSize: '18px' }}>{title}</h3>
            <span style={{ fontSize: '12px', color: '#888' }}>Alterações ainda não salvas</span>
          </div>
          <button
            onClick={onClose}
            style={{ padding: '8px 16px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Fechar
          </button>
        </div>

        <div style={{ padding: '24px', background: 'linear-gradient(180deg, #101410 0%, #0f0f0f 100%)', borderRadius: '0 0 12px 12px' }}>
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
      color: '#3cc674',
      border: '1px solid #3cc674',
      borderRadius: '5px',
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
