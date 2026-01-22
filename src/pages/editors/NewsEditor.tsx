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

interface NewsItem {
  id: string
  title: string
  summary: string
  content: string
  image_url: string
  link_url: string
  published_date: string
  show_on_home: boolean
  display_order: number
  translations?: Record<string, any>
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
      const filePath = `${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('images').getPublicUrl(filePath)
      onChange(data.publicUrl)
    } catch (error: any) {
      alert(`Erro no upload: ${error.message}. Verifique se o bucket 'images' existe e é público.`)
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

const NewsEditor: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<NewsItem[]>([])
  const [message, setMessage] = useState({ text: '', type: '' })
  
  const [editingItem, setEditingItem] = useState<Partial<NewsItem> | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('pt')

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
        .from('news')
        .select('*')
        .order('published_date', { ascending: false })

      if (error) throw error
      setItems(data || [])
    } catch (err) {
      console.error('Erro ao buscar notícias:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta notícia?')) return

    try {
      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id)

      if (error) throw error

      setItems(items.filter(item => item.id !== id))
      setMessage({ text: 'Notícia removida!', type: 'success' })
      setTimeout(() => setMessage({ text: '', type: '' }), 3000)
    } catch (err: any) {
      setMessage({ text: `Erro: ${err.message}`, type: 'error' })
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem || !editingItem.title) return

    try {
      const itemData: any = {
        title: editingItem.title,
        summary: editingItem.summary,
        content: editingItem.content,
        image_url: editingItem.image_url,
        link_url: editingItem.link_url || '#',
        published_date: editingItem.published_date || new Date().toISOString().split('T')[0],
        show_on_home: editingItem.show_on_home || false,
        display_order: editingItem.display_order || 0
      }

      if (editingItem.translations && Object.keys(editingItem.translations).length > 0) {
        itemData.translations = editingItem.translations
      }

      let error
      if (isEditing && editingItem.id) {
        const { error: updateError } = await supabase
          .from('news')
          .update(itemData)
          .eq('id', editingItem.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('news')
          .insert([itemData])
        error = insertError
      }

      if (error) throw error

      setMessage({ text: 'Notícia salva com sucesso!', type: 'success' })
      setEditingItem(null)
      setIsEditing(false)
      setActiveTab('pt')
      fetchItems()
      setTimeout(() => setMessage({ text: '', type: '' }), 3000)
    } catch (err: any) {
      setMessage({ text: `Erro ao salvar: ${err.message}`, type: 'error' })
    }
  }

  const startNewItem = () => {
    setEditingItem({
      title: '',
      summary: '',
      content: '',
      image_url: '',
      link_url: '#',
      published_date: new Date().toISOString().split('T')[0],
      show_on_home: false,
      translations: {}
    })
    setIsEditing(false)
    setActiveTab('pt')
  }

  const handleTabChange = (lang: string) => {
    setActiveTab(lang)
    if (lang === 'pt' || !editingItem) return

    // Se a tradução para este idioma ainda não existe ou está TOTALMENTE vazia, copia do PT
    const currentTrans = editingItem.translations?.[lang]
    
    // Verifica se existe algum conteúdo traduzido
    const hasTranslation = currentTrans && (
      (currentTrans.title && currentTrans.title.trim() !== '') ||
      (currentTrans.summary && currentTrans.summary.trim() !== '') ||
      (currentTrans.content && currentTrans.content.trim() !== '')
    );

    if (!hasTranslation) {
      const newTranslations = {
        ...(editingItem.translations || {}),
        [lang]: {
          title: editingItem.title,
          summary: editingItem.summary,
          content: editingItem.content
        }
      }
      setEditingItem({ ...editingItem, translations: newTranslations })
    }
  }

  const getFieldValue = (field: 'title' | 'summary' | 'content') => {
    if (!editingItem) return ''
    if (activeTab === 'pt') return editingItem[field] || ''
    return editingItem.translations?.[activeTab]?.[field] || ''
  }

  const handleFieldChange = (field: 'title' | 'summary' | 'content', value: string) => {
    if (!editingItem) return

    if (activeTab === 'pt') {
      // Atualiza raiz E também a entrada 'pt' nas traduções para consistência
      const newTranslations = {
          ...(editingItem.translations || {}),
          pt: {
              ...(editingItem.translations?.pt || {}),
              [field]: value
          }
      };
      setEditingItem({ ...editingItem, [field]: value, translations: newTranslations })
    } else {
      const newTranslations = {
        ...(editingItem.translations || {}),
        [activeTab]: {
          ...(editingItem.translations?.[activeTab] || {}),
          [field]: value
        }
      }
      setEditingItem({ ...editingItem, translations: newTranslations })
    }
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

      {!editingItem ? (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            <button onClick={startNewItem} style={{ padding: '10px 20px', backgroundColor: '#3cc674', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
              + Nova Notícia
            </button>
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            {items.length === 0 ? (
              <p style={{ color: '#888' }}>Nenhuma notícia cadastrada.</p>
            ) : (
              items.map((item) => (
                <div key={item.id} style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ width: '80px', height: '60px', backgroundColor: '#000', borderRadius: '5px', overflow: 'hidden' }}>
                      {item.image_url ? (
                        <img src={item.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>No Img</div>
                      )}
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 5px', color: '#fff' }}>{item.title}</h3>
                      <div style={{ color: '#888', fontSize: '12px', display: 'flex', gap: '10px' }}>
                        <span>{new Date(item.published_date).toLocaleDateString('pt-BR')}</span>
                        {item.show_on_home && <span style={{ color: '#3cc674' }}>• Exibir na Home</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => { setEditingItem(item); setIsEditing(true); }} style={{ padding: '8px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>✏️</button>
                    <button onClick={() => handleDeleteItem(item.id)} style={{ padding: '8px', backgroundColor: '#ff4d4d33', color: '#ff4d4d', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>🗑️</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px' }}>
          <h2 style={{ marginBottom: '20px', color: '#fff' }}>{isEditing ? 'Editar Notícia' : 'Nova Notícia'}</h2>
          
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

          <form onSubmit={handleSave}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Título * ({activeTab.toUpperCase()})</label>
              <input 
                type="text" 
                value={getFieldValue('title')}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                required
                style={{ width: '100%', padding: '10px', backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '5px' }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Data</label>
              <input 
                type="date" 
                value={editingItem.published_date}
                onChange={(e) => setEditingItem({...editingItem, published_date: e.target.value})}
                style={{ width: '100%', padding: '10px', backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '5px' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Resumo (aparece no card) ({activeTab.toUpperCase()})</label>
              <textarea 
                value={getFieldValue('summary')}
                onChange={(e) => handleFieldChange('summary', e.target.value)}
                style={{ width: '100%', padding: '10px', backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '5px', minHeight: '80px' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Conteúdo Completo ({activeTab.toUpperCase()})</label>
              <textarea 
                value={getFieldValue('content')}
                onChange={(e) => handleFieldChange('content', e.target.value)}
                style={{ width: '100%', padding: '10px', backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '5px', minHeight: '120px' }}
              />
            </div>

            <ImageField 
              label="Imagem da Notícia" 
              value={editingItem.image_url || ''} 
              onChange={(url) => setEditingItem({...editingItem, image_url: url})}
            />

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Link Externo (opcional)</label>
              <input 
                type="text" 
                value={editingItem.link_url || '#'}
                onChange={(e) => setEditingItem({...editingItem, link_url: e.target.value})}
                placeholder="https://..."
                style={{ width: '100%', padding: '10px', backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '5px' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#fff' }}>
                <input 
                  type="checkbox" 
                  checked={editingItem.show_on_home}
                  onChange={(e) => setEditingItem({...editingItem, show_on_home: e.target.checked})}
                  style={{ accentColor: '#3cc674', width: '20px', height: '20px' }}
                />
                Exibir na Home
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: '#3cc674', color: '#000', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Salvar</button>
              <button type="button" onClick={() => setEditingItem(null)} style={{ padding: '12px 20px', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '5px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default NewsEditor
