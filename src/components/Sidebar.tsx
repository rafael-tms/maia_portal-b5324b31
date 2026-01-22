import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const Sidebar: React.FC = () => {
  const location = useLocation()

  const menuItems = [
    { name: 'Estatísticas', path: '/dashboard' },
    { name: 'Sobre a Maia', path: '/dashboard/sobre' },
    { name: 'Hoje', path: '/dashboard/hoje' },
    { name: 'Trajetória', path: '/dashboard/trajetoria' },
    { name: 'Na Mídia', path: '/dashboard/midia' },
    { name: 'Vídeos', path: '/dashboard/videos' },
    { name: 'Galeria', path: '/dashboard/galeria' },
    { name: 'Contato', path: '/dashboard/contato' },
  ]

  return (
    <div style={{
      width: '250px',
      backgroundColor: '#1a1a1a',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      padding: '20px',
      borderRight: '1px solid #333',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ marginBottom: '40px', padding: '0 10px' }}>
        <h2 style={{ color: '#3cc674', margin: 0 }}>Maia Admin</h2>
      </div>

      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {menuItems.map((item) => (
            <li key={item.path} style={{ marginBottom: '10px' }}>
              <Link
                to={item.path}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 15px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: location.pathname === item.path ? '#000' : '#ccc',
                  backgroundColor: location.pathname === item.path ? '#3cc674' : 'transparent',
                  fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                  transition: 'all 0.2s'
                }}
              >
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div style={{ marginTop: 'auto', borderTop: '1px solid #333', paddingTop: '20px' }}>
        <button 
          onClick={async () => {
            const { supabase } = await import('../utils/supabaseClient');
            await supabase.auth.signOut();
            window.location.href = '/';
          }}
          style={{ 
            width: '100%',
            padding: '10px', 
            backgroundColor: '#2a1a1a', 
            color: '#ff4d4d', 
            border: '1px solid #ff4d4d33', 
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            textAlign: 'center'
          }}
        >
          Sair do Painel
        </button>
      </div>
    </div>
  )
}

export default Sidebar