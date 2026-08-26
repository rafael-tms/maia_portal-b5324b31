import React, { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabaseClient'
import PreviewModal, { PreviewButton } from '../../components/PreviewModal'
import { convertImageToWebp } from '../../utils/imageToWebp'

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

// Tradução de um card. Ícones e ordem ficam só na raiz — não mudam com o idioma.
// As categorias são referenciadas pelo id para sobreviver a reordenações.
interface CatTranslation {
  name?: string
  items?: string[]
}

interface TrajTranslation {
  title?: string
  cats?: Record<string, CatTranslation>
}

interface TrajectoryCard {
  id: string
  title: string
  left_image_url: string
  stats_data?: StatCategory[]
  display_order: number
  translations?: Record<string, TrajTranslation>
}

const LANGUAGES = [
  { code: 'pt', label: 'Português', flag: 'https://flagcdn.com/w40/br.png' },
  { code: 'en', label: 'English', flag: 'https://flagcdn.com/w40/gb.png' },
  { code: 'es', label: 'Español', flag: 'https://flagcdn.com/w40/es.png' },
  { code: 'de', label: 'Deutsch', flag: 'https://flagcdn.com/w40/de.png' },
  { code: 'fr', label: 'Français', flag: 'https://flagcdn.com/w40/fr.png' },
  { code: 'it', label: 'Italiano', flag: 'https://flagcdn.com/w40/it.png' }
]

// Ícones disponíveis
const availableIcons = [
  { label: 'Calendário/Temp.', value: 'images/calendar-1.webp', preview: '📅' },
  { label: 'Partidas', value: 'images/partidas.webp', preview: '👕' },
  { label: 'Gols', value: 'images/goal-1.webp', preview: '⚽' },
  { label: 'Assistências', value: 'images/assitencia2.webp', preview: '👟' },
  { label: 'Bola', value: 'images/soccer-ball-1.webp', preview: '⚽' }
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
      const optimized = await convertImageToWebp(file)
      const fileExt = optimized.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, optimized, { contentType: optimized.type })

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
  const [activeTab, setActiveTab] = useState('pt')
  const [showPreview, setShowPreview] = useState(false)

  /* ---------------------------------------------------- edição por idioma */
  // Em PT grava na raiz (é a fonte); nos demais, dentro de translations[lang].
  const isPt = activeTab === 'pt'

  const patchTranslation = (mutate: (t: TrajTranslation) => TrajTranslation) => {
    if (!editingCard) return
    const all = editingCard.translations || {}
    setEditingCard({
      ...editingCard,
      translations: { ...all, [activeTab]: mutate(all[activeTab] || {}) }
    })
  }

  const getTitle = () =>
    isPt ? (editingCard?.title || '') : (editingCard?.translations?.[activeTab]?.title || '')

  const setTitle = (value: string) => {
    if (!editingCard) return
    if (isPt) setEditingCard({ ...editingCard, title: value })
    else patchTranslation(t => ({ ...t, title: value }))
  }

  const getCatName = (cat: StatCategory) =>
    isPt ? (cat.name || '') : (editingCard?.translations?.[activeTab]?.cats?.[cat.id]?.name || '')

  const setCatName = (cat: StatCategory, value: string) => {
    if (isPt) { updateCategoryName(cat.id, value); return }
    patchTranslation(t => ({
      ...t,
      cats: { ...(t.cats || {}), [cat.id]: { ...(t.cats?.[cat.id] || {}), name: value } }
    }))
  }

  const getItemText = (cat: StatCategory, index: number) =>
    isPt
      ? (cat.items[index]?.text || '')
      : (editingCard?.translations?.[activeTab]?.cats?.[cat.id]?.items?.[index] || '')

  const setItemText = (cat: StatCategory, index: number, value: string) => {
    if (isPt) { updateItem(cat.id, index, 'text', value); return }
    patchTranslation(t => {
      const atual = t.cats?.[cat.id] || {}
      const items = [...(atual.items || [])]
      items[index] = value
      return { ...t, cats: { ...(t.cats || {}), [cat.id]: { ...atual, items } } }
    })
  }

  // Ao abrir um idioma vazio, parte do PT em vez de campos em branco.
  const handleTabChange = (lang: string) => {
    setActiveTab(lang)
    if (lang === 'pt' || !editingCard) return
    const all = editingCard.translations || {}
    if (all[lang] && Object.keys(all[lang]).length) return

    const cats: Record<string, CatTranslation> = {}
    ;(editingCard.stats_data || []).forEach(c => {
      cats[c.id] = { name: c.name, items: c.items.map(i => i.text) }
    })
    setEditingCard({
      ...editingCard,
      translations: { ...all, [lang]: { title: editingCard.title, cats } }
    })
  }

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
      
      const parsedData = data?.filter((card: any) => !card.deleted_at).map(card => {
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
      const { error } = await supabase.from('trajectory_cards').update({ deleted_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
      setCards(cards.filter(c => c.id !== id))
      setMessage({ text: 'Card removido!', type: 'success' })
    } catch (err: any) {
      setMessage({ text: `Erro: ${err.message}`, type: 'error' })
    }
  }

  // Persiste a ordem atual da lista (display_order = posição)
  const persistOrder = async (list: TrajectoryCard[]) => {
    try {
      await Promise.all(
        list.map((card, index) =>
          supabase.from('trajectory_cards').update({ display_order: index + 1 }).eq('id', card.id)
        )
      )
    } catch (err: any) {
      setMessage({ text: `Erro ao salvar ordem: ${err.message}`, type: 'error' })
    }
  }

  const moveCard = async (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= cards.length) return
    const newCards = [...cards]
    const tmp = newCards[index]
    newCards[index] = newCards[target]
    newCards[target] = tmp
    const reordered = newCards.map((c, i) => ({ ...c, display_order: i + 1 }))
    setCards(reordered)
    await persistOrder(reordered)
    setMessage({ text: 'Ordem atualizada!', type: 'success' })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCard) return

    try {
      const minOrder = cards.length > 0 ? Math.min(...cards.map(c => c.display_order ?? 0)) : 1

      const gravar = async (comTraducoes: boolean) => {
        const dados: Record<string, unknown> = {
          title: editingCard.title,
          left_image_url: editingCard.left_image_url,
          stats_data: editingCard.stats_data
        }
        if (comTraducoes) dados.translations = editingCard.translations || {}

        if (isEditing && editingCard.id) {
          dados.display_order = editingCard.display_order
          return (await supabase.from('trajectory_cards').update(dados).eq('id', editingCard.id)).error
        }
        // Novo card entra no topo da lista
        dados.display_order = minOrder - 1
        return (await supabase.from('trajectory_cards').insert([dados])).error
      }

      let error = await gravar(true)

      // A coluna translations pode não existir ainda (migration pendente).
      // Salva o resto em vez de perder a edição inteira, e avisa.
      const colunaAusente = error && (error.code === '42703' || /translations/.test(error.message || ''))
      if (colunaAusente) {
        error = await gravar(false)
        if (!error) {
          setMessage({
            text: 'Card salvo, mas as traduções não foram gravadas: falta rodar a migration que cria a coluna "translations" em trajectory_cards.',
            type: 'error'
          })
          setEditingCard(null)
          setIsEditing(false)
          await fetchCards()
          return
        }
      }

      if (error) throw error

      setMessage({ text: 'Card salvo com sucesso!', type: 'success' })
      setEditingCard(null)
      setIsEditing(false)
      await fetchCards()
    } catch (err: any) {
      setMessage({ text: `Erro ao salvar: ${err.message}`, type: 'error' })
    }
  }

  const startNewCard = () => {
    setActiveTab('pt')
    setEditingCard({
      title: '',
      left_image_url: '',
      stats_data: [
        { 
          id: Math.random().toString(36).substr(2, 9), 
          name: '', 
          section: 'top',
          items: [{ text: '', icon: 'images/soccer-ball-1.webp' }] 
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
      items: [{ text: '', icon: 'images/soccer-ball-1.webp' }]
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
      c.id === catId ? { ...c, items: [...c.items, { text: '', icon: 'images/soccer-ball-1.webp' }] } : c
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
            value={getCatName(cat)} 
            onChange={(e) => setCatName(cat, e.target.value)}
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
              value={item.icon || 'images/soccer-ball-1.webp'}
              onChange={e => updateItem(cat.id, itemIndex, 'icon', e.target.value)}
              style={{ padding: '8px', backgroundColor: '#333', border: '1px solid #444', color: '#fff', borderRadius: '4px', width: '140px' }}
            >
              {availableIcons.map(icon => (
                <option key={icon.value} value={icon.value}>{icon.preview} {icon.label}</option>
              ))}
            </select>
            
            <input 
              type={specialLabel ? "number" : "text"}
              value={getItemText(cat, itemIndex)} 
              onChange={e => setItemText(cat, itemIndex, e.target.value)}
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
            {cards.map((card, index) => (
              <div key={card.id} style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button
                      type="button"
                      title="Mover para cima"
                      disabled={index === 0}
                      onClick={() => moveCard(index, -1)}
                      style={{ padding: '2px 8px', backgroundColor: '#333', color: index === 0 ? '#555' : '#3cc674', border: 'none', borderRadius: '4px', cursor: index === 0 ? 'default' : 'pointer' }}
                    >▲</button>
                    <button
                      type="button"
                      title="Mover para baixo"
                      disabled={index === cards.length - 1}
                      onClick={() => moveCard(index, 1)}
                      style={{ padding: '2px 8px', backgroundColor: '#333', color: index === cards.length - 1 ? '#555' : '#3cc674', border: 'none', borderRadius: '4px', cursor: index === cards.length - 1 ? 'default' : 'pointer' }}
                    >▼</button>
                  </div>
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
                  <button onClick={() => { setActiveTab('pt'); setEditingCard(card); setIsEditing(true); }} style={{ padding: '8px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => handleDelete(card.id)} style={{ padding: '8px', backgroundColor: '#ff4d4d33', color: '#ff4d4d', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, color: '#fff' }}>{isEditing ? 'Editar Card' : 'Novo Card de Trajetória'}</h2>
            <PreviewButton onClick={() => setShowPreview(true)} />
          </div>

          <PreviewModal open={showPreview} onClose={() => setShowPreview(false)} title={`Pré-visualização — Trajetória (${activeTab.toUpperCase()})`}>
            <div style={{ backgroundColor: '#151515', border: '1px solid #222', borderRadius: '10px', padding: '20px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ width: '80px', height: '80px', flexShrink: 0, backgroundColor: '#000', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {editingCard.left_image_url
                    ? <img src={editingCard.left_image_url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    : <span style={{ color: '#444', fontSize: '11px' }}>sem imagem</span>}
                </div>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '22px' }}>{getTitle() || 'Sem título'}</h3>
              </div>

              {(editingCard.stats_data || []).map(cat => (
                <div key={cat.id} style={{ marginBottom: '18px' }}>
                  <div style={{ fontSize: '12px', color: '#3cc674', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                    {getCatName(cat) || '—'}{cat.section === 'top' ? ' • destaque' : ''}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {cat.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#101010', border: '1px solid #222', borderRadius: '6px', padding: '8px 10px' }}>
                        <img src={'/' + (item.icon || '').replace(/^\//, '')} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                        <span style={{ color: '#fff' }}>{getItemText(cat, i) || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </PreviewModal>
          
          <form onSubmit={handleSave}>
            {/* Abas de idioma: PT edita a raiz, os demais gravam em translations. */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px', flexWrap: 'wrap' }}>
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleTabChange(l.code)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 14px', borderRadius: '5px', cursor: 'pointer', border: 'none',
                    backgroundColor: activeTab === l.code ? '#3cc674' : 'transparent',
                    color: activeTab === l.code ? '#000' : '#888',
                    fontWeight: activeTab === l.code ? 'bold' : 'normal'
                  }}
                >
                  <img src={l.flag} alt="" width={20} height={14} style={{ objectFit: 'cover' }} />
                  {l.label}
                </button>
              ))}
            </div>

            {!isPt && (
              <div style={{ marginBottom: '20px', padding: '10px 14px', backgroundColor: '#3cc67414', border: '1px solid #3cc67440', borderRadius: '5px', color: '#3cc674', fontSize: '13px' }}>
                Editando a tradução em <strong>{LANGUAGES.find(l => l.code === activeTab)?.label}</strong>. Imagem, ícones e ordem são comuns a todos os idiomas.
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#888', marginBottom: '5px' }}>Título (Time/Clube)</label>
              <input 
                type="text" 
                value={getTitle()} 
                onChange={e => setTitle(e.target.value)}
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