import React, { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabaseClient'

interface StatItem {
  text: string
  icon: string
}

interface StatCategory {
  id: string
  name: string
  section?: 'top' | 'bottom'
  items: StatItem[]
}

interface TrajectoryCard {
  id: string
  title: string
  left_image_url: string
  stats_data?: StatCategory[]
  display_order: number
}

// Ícones disponíveis
const availableIcons = [
  { label: 'Calendário/Temp.', value: 'images/calendar-1.png', preview: '📅' },
  { label: 'Partidas', value: 'images/partidas.png', preview: '👕' },
  { label: 'Gols', value: 'images/goal-1.png', preview: '⚽' },
  { label: 'Assistências', value: 'images/assitencia2.png', preview: '👟' },
  { label: 'Bola', value: 'images/soccer-ball-1.png', preview: '⚽' }
]

const categoryOptions = ['Sub 13', 'Sub 15', 'Sub 17', 'Sub 20', 'Sub 23', 'Principal']

// Componente ImageField
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

      const { error: uploadError } = await supabase.storage
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

const TrajectoryEditor: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<TrajectoryCard[]>([])
  const [message, setMessage] = useState({ text: '', type: '' })
  
  const [editingCard, setEditingCard] = useState<Partial<TrajectoryCard> | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    fetchCards()
    ensureBucket()
  }, [])

  const ensureBucket = async () => {
    await supabase.storage.createBucket('images', { public: true }).catch(() => {})
  }

  const fetchCards = async () => {
    try {
      const { data, error } = await supabase
        .from('trajectory_cards')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      
      const parsedData = data?.map(card => {
        let stats: StatCategory[] = []
        try {
          stats = typeof card.stats_data === 'string' ? JSON.parse(card.stats_data) : card.stats_data
          if (Array.isArray(stats) && stats.length > 0 && !stats[0].items) {
             stats = [{ id: 'legacy', name: card.category || 'Geral', section: 'top', items: stats as any }]
          }
          // Normalização de Legacy Data (adicionar section se não existir)
          if (Array.isArray(stats)) {
            stats = stats.map((s, idx) => ({
              ...s,
              section: s.section || (idx === 0 ? 'top' : 'bottom')
            }))
          }
        } catch (e) {
          stats = []
        }
        return { ...card, stats_data: stats }
      })
      
      setCards(parsedData || [])
    } catch (err) {
      console.error('Erro ao buscar cards:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este card?')) return
    try {
      const { error } = await supabase.from('trajectory_cards').delete().eq('id', id)
      if (error) throw error
      setCards(cards.filter(c => c.id !== id))
      setMessage({ text: 'Card removido!', type: 'success' })
    } catch (err: any) {
      setMessage({ text: `Erro: ${err.message}`, type: 'error' })
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCard) return

    try {
      const cardData = {
        title: editingCard.title,
        left_image_url: editingCard.left_image_url,
        stats_data: editingCard.stats_data,
        display_order: editingCard.display_order || (cards.length + 1)
      }

      let error
      if (isEditing && editingCard.id) {
        const { error: updateError } = await supabase
          .from('trajectory_cards')
          .update(cardData)
          .eq('id', editingCard.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase
          .from('trajectory_cards')
          .insert([cardData])
        error = insertError
      }

      if (error) throw error

      setMessage({ text: 'Card salvo com sucesso!', type: 'success' })
      setEditingCard(null)
      setIsEditing(false)
      fetchCards()
    } catch (err: any) {
      setMessage({ text: `Erro ao salvar: ${err.message}`, type: 'error' })
    }
  }

  const startNewCard = () => {
    setEditingCard({
      title: '',
      left_image_url: '',
      stats_data: [
        { 
          id: Math.random().toString(36).substr(2, 9), 
          name: '', 
          section: 'top',
          items: [{ text: '', icon: 'images/soccer-ball-1.png' }] 
        }
      ]
    })
    setIsEditing(false)
  }

  // --- Funções de Manipulação ---

  const addCategory = (section: 'top' | 'bottom') => {
    if (!editingCard) return
    const newCat: StatCategory = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      section,
      items: [{ text: '', icon: 'images/soccer-ball-1.png' }]
    }
    setEditingCard({ ...editingCard, stats_data: [...(editingCard.stats_data || []), newCat] })
  }

  const removeCategory = (id: string) => {
    if (!editingCard || !editingCard.stats_data) return
    const newData = editingCard.stats_data.filter((c) => c.id !== id)
    setEditingCard({ ...editingCard, stats_data: newData })
  }

  const updateCategoryName = (id: string, name: string) => {
    if (!editingCard || !editingCard.stats_data) return
    const newData = editingCard.stats_data.map(c => c.id === id ? { ...c, name } : c)
    setEditingCard({ ...editingCard, stats_data: newData })
  }

  const addItemToCategory = (catId: string) => {
    if (!editingCard || !editingCard.stats_data) return
    const newData = editingCard.stats_data.map(c => 
      c.id === catId ? { ...c, items: [...c.items, { text: '', icon: 'images/soccer-ball-1.png' }] } : c
    )
    setEditingCard({ ...editingCard, stats_data: newData })
  }

  const removeItemFromCategory = (catId: string, itemIndex: number) => {
    if (!editingCard || !editingCard.stats_data) return
    const newData = editingCard.stats_data.map(c => 
      c.id === catId ? { ...c, items: c.items.filter((_, i) => i !== itemIndex) } : c
    )
    setEditingCard({ ...editingCard, stats_data: newData })
  }

  const updateItem = (catId: string, itemIndex: number, field: 'text' | 'icon', value: string) => {
    if (!editingCard || !editingCard.stats_data) return
    const newData = editingCard.stats_data.map(c => 
      c.id === catId ? {
        ...c, 
        items: c.items.map((item, i) => i === itemIndex ? { ...item, [field]: value } : item)
      } : c
    )
    setEditingCard({ ...editingCard, stats_data: newData })
  }

  const renderCategoryForm = (cat: StatCategory, index: number, isMain: boolean) => (
    <div key={cat.id || index} style={{ backgroundColor: isMain ? '#2a3b2a' : '#252525', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: isMain ? '1px solid #3cc674' : '1px solid #333' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
        <div style={{ flex: 1, marginRight: '15px' }}>
          <label style={{ display: 'block', color: isMain ? '#3cc674' : '#888', fontSize: '12px', marginBottom: '4px' }}>
            {isMain ? 'Título da Categoria (Destaque/Topo)' : `Título da Coluna/Categoria`}
          </label>
          <input 
            type="text" 
            value={cat.name} 
            onChange={(e) => updateCategoryName(cat.id, e.target.value)}
            placeholder={isMain ? "Ex: Sub 20" : "Ex: Sub 17"}
            list="cat-suggestions"
            style={{ width: '100%', padding: '8px', backgroundColor: '#333', border: '1px solid #444', color: '#fff', fontWeight: 'bold', borderRadius: '4px' }}
          />
          <datalist id="cat-suggestions">
            {categoryOptions.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
        <button type="button" onClick={() => removeCategory(cat.id)} style={{ height: 'fit-content', padding: '8px', backgroundColor: '#ff4d4d33', color: '#ff4d4d', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '18px' }}>Remover</button>
      </div>

      {cat.items.map((item, itemIndex) => {
        const specialLabel = availableIcons.find(i => i.value === item.icon && ['Partidas', 'Gols', 'Assistências'].includes(i.label))?.label;
        
        return (
          <div key={itemIndex} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
            <select
              value={item.icon || 'images/soccer-ball-1.png'}
              onChange={e => updateItem(cat.id, itemIndex, 'icon', e.target.value)}
              style={{ padding: '8px', backgroundColor: '#333', border: '1px solid #444', color: '#fff', borderRadius: '4px', width: '140px' }}
            >
              {availableIcons.map(icon => (
                <option key={icon.value} value={icon.value}>{icon.preview} {icon.label}</option>
              ))}
            </select>
            
            <input 
              type={specialLabel ? "number" : "text"}
              value={item.text} 
              onChange={e => updateItem(cat.id, itemIndex, 'text', e.target.value)}
              placeholder={specialLabel ? "Apenas números" : "Ex: 14 Partidas"}
              style={{ flex: 1, padding: '8px', backgroundColor: '#333', border: '1px solid #444', color: '#fff', borderRadius: '4px' }}
            />
            {specialLabel && (
              <span style={{ color: '#fff', fontWeight: 'bold', minWidth: '80px' }}>
                {specialLabel}
              </span>
            )}
            <button type="button" onClick={() => removeItemFromCategory(cat.id, itemIndex)} style={{ padding: '0 10px', backgroundColor: '#444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>x</button>
          </div>
        )
      })}
      <button type="button" onClick={() => addItemToCategory(cat.id)} style={{ padding: '6px 12px', backgroundColor: '#333', color: '#aaa', border: '1px dashed #555', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', width: '100%', marginTop: '5px' }}>+ Adicionar Item</button>
    </div>
  )

  if (loading) return <div style={{ color: '#fff' }}>Carregando...</div>

  // Filtros de Seção
  const topCategories = editingCard?.stats_data?.filter(c => c.section === 'top') || []
  const bottomCategories = editingCard?.stats_data?.filter(c => c.section === 'bottom') || []

  return (
    <div>
      {message.text && (
        <div style={{ padding: '15px', marginBottom: '20px', borderRadius: '5px', backgroundColor: message.type === 'error' ? '#ff4d4d33' : '#3cc67433', color: '#fff' }}>
          {message.text}
        </div>
      )}

      {!editingCard ? (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            <button onClick={startNewCard} style={{ padding: '10px 20px', backgroundColor: '#3cc674', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
              + Novo Card de Trajetória
            </button>
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            {cards.map(card => (
              <div key={card.id} style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ width: '60px', height: '60px', backgroundColor: '#000', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={card.left_image_url} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 5px', color: '#fff' }}>{card.title}</h3>
                    <div style={{ color: '#888', fontSize: '12px' }}>
                      {card.stats_data?.length || 0} categorias
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => { setEditingCard(card); setIsEditing(true); }} style={{ padding: '8px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => handleDelete(card.id)} style={{ padding: '8px', backgroundColor: '#ff4d4d33', color: '#ff4d4d', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px' }}>
          <h2 style={{ marginBottom: '20px', color: '#fff' }}>{isEditing ? 'Editar Card' : 'Novo Card de Trajetória'}</h2>
          
          <form onSubmit={handleSave}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#888', marginBottom: '5px' }}>Título (Time/Clube)</label>
              <input 
                type="text" 
                value={editingCard.title} 
                onChange={e => setEditingCard({...editingCard, title: e.target.value})}
                required
                style={{ width: '100%', padding: '10px', backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '5px' }}
              />
            </div>

            <ImageField 
              label="Imagem Esquerda (Logo/Escudo)" 
              value={editingCard.left_image_url || ''} 
              onChange={(url) => setEditingCard({...editingCard, left_image_url: url})}
            />

            <div style={{ marginTop: '30px', borderTop: '1px solid #333', paddingTop: '20px' }}>
              <h3 style={{ color: '#3cc674', marginBottom: '15px' }}>1. Seção Principal (Topo)</h3>
              
              {topCategories.map((cat, index) => renderCategoryForm(cat, index, true))}

              {topCategories.length < 2 && (
                 <button type="button" onClick={() => addCategory('top')} style={{ padding: '10px', backgroundColor: '#333', color: '#3cc674', border: '1px dashed #3cc674', borderRadius: '5px', cursor: 'pointer', width: '100%' }}>
                   + Adicionar Segunda Categoria ao Topo (Máx 2)
                 </button>
              )}
            </div>

            <div style={{ marginTop: '30px', borderTop: '1px solid #333', paddingTop: '20px' }}>
              <h3 style={{ color: '#fff', marginBottom: '15px' }}>2. Seção Inferior (Colunas)</h3>
              
              {bottomCategories.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', backgroundColor: '#252525', borderRadius: '8px', border: '1px dashed #444' }}>
                  <p style={{ color: '#aaa', marginBottom: '15px' }}>Adicione uma segunda seção para listar mais categorias (até 3 colunas).</p>
                  <button type="button" onClick={() => addCategory('bottom')} style={{ padding: '10px 20px', backgroundColor: '#3cc674', color: '#000', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Criar Seção Inferior
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {bottomCategories.map((cat, index) => renderCategoryForm(cat, index, false))}
                  </div>

                  {bottomCategories.length < 3 && (
                    <button type="button" onClick={() => addCategory('bottom')} style={{ marginTop: '20px', padding: '12px', backgroundColor: '#333', color: '#fff', border: '1px dashed #555', borderRadius: '5px', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>+</span> Adicionar Nova Coluna (Máx 3)
                    </button>
                  )}
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '40px', borderTop: '1px solid #333', paddingTop: '20px' }}>
              <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: '#3cc674', color: '#000', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Salvar Card Completo</button>
              <button type="button" onClick={() => setEditingCard(null)} style={{ padding: '12px 20px', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '5px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default TrajectoryEditor