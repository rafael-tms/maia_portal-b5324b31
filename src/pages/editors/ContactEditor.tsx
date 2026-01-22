import React, { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabaseClient'

interface ContactInfo {
  id: string
  title: string
  phone: string
  email: string
}

const ContactEditor: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [contact, setContact] = useState<ContactInfo | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchContact()
  }, [])

  const fetchContact = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_info')
        .select('*')
        .limit(1)
        .single()

      if (error) {
          // If no rows, try insert default? Already handled by migration but good fallback
          if (error.code === 'PGRST116') {
              // No rows
              setContact({ id: '', title: 'Fale com a Maia', phone: '', email: '' })
          } else {
              throw error
          }
      } else {
          setContact(data)
      }
    } catch (err: any) {
      console.error('Erro ao buscar contato:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!contact) return
    setSaving(true)
    try {
      if (contact.id) {
        const { error } = await supabase
          .from('contact_info')
          .update({
            title: contact.title,
            phone: contact.phone,
            email: contact.email,
            updated_at: new Date().toISOString()
          })
          .eq('id', contact.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
            .from('contact_info')
            .insert([{
                title: contact.title,
                phone: contact.phone,
                email: contact.email
            }])
            .select()
            .single()
        if (error) throw error
        setContact(data)
      }
      alert('Salvo com sucesso!')
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div>Carregando...</div>

  return (
    <div style={{ color: '#fff', maxWidth: '600px' }}>
      <h2>Editar Contato (Rodapé)</h2>
      
      <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Telefone</label>
          <input
            type="text"
            value={contact?.phone || ''}
            onChange={e => setContact(prev => prev ? { ...prev, phone: e.target.value } : null)}
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #333', backgroundColor: '#222', color: '#fff' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Email</label>
          <input
            type="text"
            value={contact?.email || ''}
            onChange={e => setContact(prev => prev ? { ...prev, email: e.target.value } : null)}
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #333', backgroundColor: '#222', color: '#fff' }}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3cc674',
            color: '#000',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
            opacity: saving ? 0.7 : 1
          }}
        >
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  )
}

export default ContactEditor
