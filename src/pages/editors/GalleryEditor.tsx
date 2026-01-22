import React, { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabaseClient'
import MontageEditor from './MontageEditor'

interface GalleryItem {
  id: string
  title: string
  image_url: string
  display_order: number
  is_active?: boolean
}

// Componente ImageField reutilizável
const ImageField: React.FC<{
  label: string
  value: string
  onChange: (url: string) => void
}> = ({ label, value, onChange }) => {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file) return

      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `gallery/${fileName}` // Pasta gallery

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('images').getPublicUrl(filePath)
      onChange(data.publicUrl)
    } catch (error: any) {
      alert(`Erro no upload: ${error.message}`)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', color: '#888', marginBottom: '5px' }}>{label}</label>
      
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
        <input 
          type="text" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          placeholder="Cole a URL ou faça upload..."
          style={{ flex: 1, padding: '10px', backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '5px' }}
        />
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <button type="button" style={{ padding: '10px 15px', backgroundColor: '#333', color: '#fff', border: '1px solid #444', borderRadius: '5px', cursor: 'pointer' }}>
            {uploading ? '...' : '📁 Upload'}
          </button>
          <input 
            type="file" 
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
          />
        </div>
      </div>

      {value && (
        <div style={{ padding: '5px', border: '1px solid #333', borderRadius: '5px', display: 'inline-block', backgroundColor: '#000' }}>
          <img src={value} alt="Preview" style={{ height: '80px', maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
        </div>
      )}
    </div>
  )
}

const GalleryEditor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'photos' | 'montages'>('photos')
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<GalleryItem[]>([])
  const [message, setMessage] = useState({ text: '', type: '' })
  
  const [editingItem, setEditingItem] = useState<Partial<GalleryItem> | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    fetchItems()
    ensureBucket()
  }, [])

  const ensureBucket = async () => {
    await supabase.storage.createBucket('images', { public: true }).catch(() => {})
  }

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      setItems(data || [])
    } catch (err) {
      console.error('Erro ao buscar galeria:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta imagem?')) return

    try {
      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('id', id)

      if (error) throw error

      setItems(items.filter(item => item.id !== id))
      setMessage({ text: 'Imagem removida!', type: 'success' })
      setTimeout(() => setMessage({ text: '', type: '' }), 3000)
    } catch (err: any) {
      setMessage({ text: `Erro: ${err.message}`, type: 'error' })
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
        const { error } = await supabase
            .from('gallery')
            .update({ is_active: !currentStatus })
            .eq('id', id)

        if (error) throw error
        
        // Update local state
        setItems(items.map(item => 
            item.id === id ? { ...item, is_active: !currentStatus } : item
        ))
    } catch (err: any) {
        alert('Erro ao atualizar status: ' + err.message)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem || !editingItem.image_url) {
        setMessage({ text: 'A imagem é obrigatória', type: 'error' })
        return
    }

    try {
      const itemData = {
        title: editingItem.title || '',
        image_url: editingItem.image_url,
        display_order: editingItem.display_order || 0
      }

      let error
      if (isEditing && editingItem.id) {
        const { error: updateError } = await supabase
          .from('gallery')
          .update(itemData)
          .eq('id', editingItem.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('gallery')
          .insert([itemData])
        error = insertError
      }

      if (error) throw error

      setMessage({ text: 'Imagem salva com sucesso!', type: 'success' })
      setEditingItem(null)
      setIsEditing(false)
      fetchItems()
      setTimeout(() => setMessage({ text: '', type: '' }), 3000)
    } catch (err: any) {
      setMessage({ text: `Erro ao salvar: ${err.message}`, type: 'error' })
    }
  }

  const startNewItem = () => {
    setEditingItem({
      title: '',
      image_url: '',
      display_order: items.length + 1
    })
    setIsEditing(false)
  }

  if (loading) return <div style={{ color: '#fff', textAlign: 'center' }}>Carregando...</div>

  return (
    <div>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
        <button 
          onClick={() => setActiveTab('photos')}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: activeTab === 'photos' ? '#3cc674' : '#888', 
            fontSize: '18px', 
            fontWeight: activeTab === 'photos' ? 'bold' : 'normal',
            cursor: 'pointer',
            borderBottom: activeTab === 'photos' ? '2px solid #3cc674' : 'none',
            paddingBottom: '5px'
          }}
        >
          Fotos
        </button>
        <button 
          onClick={() => setActiveTab('montages')}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: activeTab === 'montages' ? '#3cc674' : '#888', 
            fontSize: '18px', 
            fontWeight: activeTab === 'montages' ? 'bold' : 'normal',
            cursor: 'pointer',
            borderBottom: activeTab === 'montages' ? '2px solid #3cc674' : 'none',
            paddingBottom: '5px'
          }}
        >
          Montagens
        </button>
      </div>

      {activeTab === 'montages' ? (
        <MontageEditor />
      ) : (
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

          {!editingItem ? (
            <>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                <button onClick={startNewItem} style={{ padding: '10px 20px', backgroundColor: '#3cc674', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                  + Nova Imagem
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                {items.length === 0 ? (
                  <p style={{ color: '#888', gridColumn: '1/-1' }}>Nenhuma imagem cadastrada.</p>
                ) : (
                  items.map((item) => (
                    <div key={item.id} style={{ backgroundColor: '#1a1a1a', padding: '10px', borderRadius: '10px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ flex: 1, backgroundColor: '#000', borderRadius: '5px', overflow: 'hidden', marginBottom: '10px' }}>
                          <img src={item.image_url} alt="Preview" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                      </div>
                      {item.title && <h3 style={{ margin: '0 0 10px', color: '#fff', fontSize: '14px' }}>{item.title}</h3>}
                      
                      {/* Toggle Active */}
                      <div 
                        onClick={() => handleToggleActive(item.id, item.is_active !== false)}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            marginBottom: '10px',
                            cursor: 'pointer'
                        }}
                      >
                        <div style={{
                            width: '40px',
                            height: '20px',
                            backgroundColor: item.is_active !== false ? '#3cc674' : '#444',
                            borderRadius: '20px',
                            position: 'relative',
                            transition: 'background-color 0.3s',
                            marginRight: '10px'
                        }}>
                            <div style={{
                                width: '16px',
                                height: '16px',
                                backgroundColor: '#fff',
                                borderRadius: '50%',
                                position: 'absolute',
                                top: '2px',
                                left: item.is_active !== false ? '22px' : '2px',
                                transition: 'left 0.3s'
                            }} />
                        </div>
                        <span style={{ fontSize: '12px', color: item.is_active !== false ? '#fff' : '#888' }}>
                            {item.is_active !== false ? 'Visível na Galeria' : 'Oculto na Galeria'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                        <button onClick={() => { setEditingItem(item); setIsEditing(true); }} style={{ flex: 1, padding: '8px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>✏️</button>
                        <button onClick={() => handleDeleteItem(item.id)} style={{ flex: 1, padding: '8px', backgroundColor: '#ff4d4d33', color: '#ff4d4d', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>🗑️</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px' }}>
              <h2 style={{ marginBottom: '20px', color: '#fff' }}>{isEditing ? 'Editar Imagem' : 'Nova Imagem'}</h2>
              
              <form onSubmit={handleSave}>
                <ImageField 
                  label="Imagem *" 
                  value={editingItem.image_url || ''} 
                  onChange={(url) => setEditingItem({...editingItem, image_url: url})}
                />

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Título / Legenda (Opcional)</label>
                  <input 
                    type="text" 
                    value={editingItem.title}
                    onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '5px' }}
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Ordem de Exibição</label>
                  <input 
                    type="number" 
                    value={editingItem.display_order}
                    onChange={(e) => setEditingItem({...editingItem, display_order: parseInt(e.target.value)})}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '5px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                  <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: '#3cc674', color: '#000', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Salvar</button>
                  <button type="button" onClick={() => setEditingItem(null)} style={{ padding: '12px 20px', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '5px', cursor: 'pointer' }}>Cancelar</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GalleryEditor
