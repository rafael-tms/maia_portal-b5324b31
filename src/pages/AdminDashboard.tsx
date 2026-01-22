import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'

// Editors
import StatsEditor from './editors/StatsEditor'
import AboutEditor from './editors/AboutEditor'
import TodayEditor from './editors/TodayEditor'
import TrajectoryEditor from './editors/TrajectoryEditor'
import NewsEditor from './editors/NewsEditor'
import GalleryEditor from './editors/GalleryEditor'
import MontageEditor from './editors/MontageEditor'

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('stats')

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      navigate('/')
    } else {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>Carregando...</div>

  const tabs = [
    { id: 'stats', label: 'Estatísticas' },
    { id: 'about', label: 'Sobre' },
    { id: 'today', label: 'Hoje' },
    { id: 'trajectory', label: 'Trajetória' },
    { id: 'news', label: 'Notícias' },
  ]

  return (
    <div style={{ backgroundColor: '#0f0f0f', minHeight: '100vh', color: '#fff', padding: '20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: '#3cc674' }}>Painel Administrativo</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a 
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: '8px 16px', backgroundColor: '#3cc674', color: '#000', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}
            >
              Ver Site
            </a>
            <button 
              onClick={handleLogout}
              style={{ padding: '8px 16px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              Sair
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '10px', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px',
                backgroundColor: activeTab === tab.id ? '#3cc674' : 'transparent',
                color: activeTab === tab.id ? '#000' : '#888',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ minHeight: '500px' }}>
          {activeTab === 'stats' && <StatsEditor />}
          {activeTab === 'about' && <AboutEditor />}
          {activeTab === 'today' && <TodayEditor />}
          {activeTab === 'trajectory' && <TrajectoryEditor />}
          {activeTab === 'news' && <NewsEditor />}
          {activeTab === 'gallery' && <GalleryEditor />}
          {activeTab === 'montage' && <MontageEditor />}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
