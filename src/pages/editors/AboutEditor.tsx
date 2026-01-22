import React, { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabaseClient'

const LANGUAGES = [
  { code: 'pt', label: 'Português', flag: 'https://flagcdn.com/w40/pt.png' },
  { code: 'en', label: 'English', flag: 'https://flagcdn.com/w40/gb.png' },
  { code: 'es', label: 'Español', flag: 'https://flagcdn.com/w40/es.png' },
  { code: 'de', label: 'Deutsch', flag: 'https://flagcdn.com/w40/de.png' },
  { code: 'fr', label: 'Français', flag: 'https://flagcdn.com/w40/fr.png' },
  { code: 'it', label: 'Italiano', flag: 'https://flagcdn.com/w40/it.png' }
]

interface AboutItem {
  id: string
  label: string
  value: string
  display_order: number
  translations?: Record<string, any>
}

const AboutEditor: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<AboutItem[]>([])
  const [newItem, setNewItem] = useState({ label: '', value: '' })
  const [message, setMessage] = useState({ text: '', type: '' })
  const [activeTab, setActiveTab] = useState('pt')

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('about_info')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setItems(data || [])
    } catch (err) {
      console.error('Erro ao buscar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.label || !newItem.value) return

    try {
      // Pega o maior display_order atual para adicionar no final
      const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.display_order)) : 0
      
      const { data, error } = await supabase
        .from('about_info')
        .insert([{ 
          label: newItem.label, 
          value: newItem.value,
          display_order: maxOrder + 1,
          translations: {}
        }])
        .select()

      if (error) throw error

      setItems([...items, data[0]])
      setNewItem({ label: '', value: '' })
      setMessage({ text: 'Campo adicionado com sucesso!', type: 'success' })
      setTimeout(() => setMessage({ text: '', type: '' }), 3000)
    } catch (err: any) {
      setMessage({ text: `Erro: ${err.message}`, type: 'error' })
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este campo?')) return

    try {
      const { error } = await supabase
        .from('about_info')
        .delete()
        .eq('id', id)

      if (error) throw error

      setItems(items.filter(item => item.id !== id))
      setMessage({ text: 'Campo removido!', type: 'success' })
      setTimeout(() => setMessage({ text: '', type: '' }), 3000)
    } catch (err: any) {
      setMessage({ text: `Erro: ${err.message}`, type: 'error' })
    }
  }

  const handleUpdateItem = (id: string, field: 'label' | 'value', newValue: string) => {
    // Atualiza estado local imediatamente para UX fluida
    const updatedItems = items.map(item => {
      if (item.id !== id) return item

      if (activeTab === 'pt') {
        return { ...item, [field]: newValue }
      } else {
        const newTranslations = {
          ...(item.translations || {}),
          [activeTab]: {
            ...(item.translations?.[activeTab] || {}),
            [field]: newValue
          }
        }
        return { ...item, translations: newTranslations }
      }
    })
    setItems(updatedItems)
  }

  const handleSaveAll = async () => {
    setMessage({ text: 'Salvando todas as alterações...', type: 'info' })
    try {
      const updates = items.map(item => {
        const payload: any = {
          id: item.id,
          label: item.label,
          value: item.value,
          updated_at: new Date().toISOString()
        }

        if (item.translations && Object.keys(item.translations).length > 0) {
          payload.translations = item.translations
        }
        return payload
      })

      const { error } = await supabase
        .from('about_info')
        .upsert(updates)

      if (error) throw error
      setMessage({ text: 'Todos os campos atualizados com sucesso!', type: 'success' })
      setTimeout(() => setMessage({ text: '', type: '' }), 3000)
    } catch (err: any) {
      setMessage({ text: `Erro ao salvar: ${err.message}`, type: 'error' })
    }
  }

  const handleTabChange = (lang: string) => {
    setActiveTab(lang)
    if (lang === 'pt') return

    // Se a tradução para este idioma ainda não existe ou está vazia, copia do PT
    const newItems = items.map(item => {
      const itemTrans = item.translations?.[lang]
      if (!itemTrans || (!itemTrans.label && !itemTrans.value)) {
        return {
          ...item,
          translations: {
            ...(item.translations || {}),
            [lang]: {
              label: item.label,
              value: item.value
            }
          }
        }
      }
      return item
    })
    
    // Verifica se houve mudança antes de atualizar estado
    if (JSON.stringify(newItems) !== JSON.stringify(items)) {
        setItems(newItems)
    }
  }

  const getItemValue = (item: AboutItem, field: 'label' | 'value') => {
    if (activeTab === 'pt') return item[field]
    return item.translations?.[activeTab]?.[field] || ''
  }

  if (loading) return <div style={{ color: '#fff', textAlign: 'center' }}>Carregando...</div>

  return (
    <div>
      {message.text && (
        <div style={{ 
          padding: '15px', 
          marginBottom: '20px', 
          borderRadius: '5px',
          backgroundColor: message.type === 'error' ? '#ff4d4d33' : message.type === 'success' ? '#3cc67433' : '#333',
          border: `1px solid ${message.type === 'error' ? '#ff4d4d' : message.type === 'success' ? '#3cc674' : '#666'}`,
          color: message.type === 'error' ? '#ff4d4d' : message.type === 'success' ? '#3cc674' : '#fff'
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        {/* Lista de Itens Existentes */}
        <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
             <h2 style={{ color: '#fff', margin: 0 }}>Campos Existentes</h2>
             <button 
                onClick={handleSaveAll}
                style={{ 
                    padding: '8px 20px', 
                    backgroundColor: '#3cc674', 
                    color: '#000', 
                    border: 'none', 
                    borderRadius: '5px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer',
                    fontSize: '14px'
                }}
             >
                Salvar Alterações
             </button>
          </div>
          
          {/* Abas de Idioma */}
          <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
              {LANGUAGES.map(lang => (
                  <div 
                      key={lang.code}
                      onClick={() => handleTabChange(lang.code)}
                      style={{ 
                          padding: '8px 15px', 
                          cursor: 'pointer', 
                          borderRadius: '5px',
                          backgroundColor: activeTab === lang.code ? '#3cc674' : 'transparent',
                          color: activeTab === lang.code ? '#000' : '#888',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          border: activeTab === lang.code ? 'none' : '1px solid #333'
                      }}
                  >
                      <img src={lang.flag} alt={lang.code} style={{ width: '20px', height: '15px', objectFit: 'cover', borderRadius: '2px' }} />
                      <span style={{ fontWeight: 'bold' }}>{lang.code.toUpperCase()}</span>
                  </div>
              ))}
          </div>

          {items.length === 0 ? (
            <p style={{ color: '#888' }}>Nenhum campo cadastrado.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {items.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>Título do Campo</label>
                    <input 
                      type="text" 
                      value={getItemValue(item, 'label')}
                      onChange={(e) => handleUpdateItem(item.id, 'label', e.target.value)}
                      style={{ width: '100%', padding: '8px', backgroundColor: '#333', border: '1px solid #444', color: '#fff', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>Conteúdo</label>
                    <input 
                      type="text" 
                      value={getItemValue(item, 'value')}
                      onChange={(e) => handleUpdateItem(item.id, 'value', e.target.value)}
                      style={{ width: '100%', padding: '8px', backgroundColor: '#333', border: '1px solid #444', color: '#fff', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ paddingTop: '18px' }}>
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      style={{ padding: '8px', backgroundColor: '#ff4d4d33', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: '4px', cursor: 'pointer' }}
                      title="Excluir"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Adicionar Novo Item */}
        <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px', height: 'fit-content' }}>
          <h2 style={{ marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px', color: '#fff' }}>Novo Campo</h2>
          
          <form onSubmit={handleAddItem}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Título (ex: Tamanho)</label>
              <input 
                type="text" 
                value={newItem.label}
                onChange={(e) => setNewItem({...newItem, label: e.target.value})}
                placeholder="Nome do campo"
                required
                style={{ width: '100%', padding: '10px', backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '5px' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Texto (ex: 37)</label>
              <input 
                type="text" 
                value={newItem.value}
                onChange={(e) => setNewItem({...newItem, value: e.target.value})}
                placeholder="Valor do campo"
                required
                style={{ width: '100%', padding: '10px', backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '5px' }}
              />
            </div>
            <button 
              type="submit"
              style={{ width: '100%', padding: '12px', backgroundColor: '#3cc674', color: '#000', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Adicionar Campo
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AboutEditor