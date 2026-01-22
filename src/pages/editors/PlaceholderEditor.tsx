import React from 'react'

interface Props {
  title: string
}

const PlaceholderEditor: React.FC<Props> = ({ title }) => {
  return (
    <div style={{ backgroundColor: '#1a1a1a', padding: '40px', borderRadius: '10px', textAlign: 'center', color: '#888' }}>
      <h2 style={{ color: '#fff', marginBottom: '20px' }}>{title}</h2>
      <p>Funcionalidade em desenvolvimento 🚧</p>
    </div>
  )
}

export default PlaceholderEditor