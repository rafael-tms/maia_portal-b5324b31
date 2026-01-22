import React, { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { supabase } from '../utils/supabaseClient'

const AdminLayout: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f0f0f' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '250px', padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <a href="/" target="_blank" rel="noopener noreferrer" style={{ padding: '8px 16px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px', textDecoration: 'none' }}>
              Ver Portal <span style={{ marginLeft: '5px' }}>↗</span>
            </a>
        </div>
        <Outlet />
      </div>
    </div>
  )
}

export default AdminLayout