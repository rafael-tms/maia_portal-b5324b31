import React, { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabaseClient'
import { convertImageToWebp } from '../../utils/imageToWebp'

interface StatItem {
  text: string
  icon: string
}

interface TranslationData {
  title?: string
  news_text?: string
  news_link?: string
  category?: string
  // Texto de cada item de stats_data, pelo índice. Ícones ficam só na raiz:
  // não mudam com o idioma.
  items?: string[]
}

interface TodayCard {
  id: string
  type: 'news' | 'stats'
  title: string
  left_image_url: string
  news_image_url?: string
  news_text?: string
  news_link?: string
  stats_data?: StatItem[]
  category?: string
  display_order: number
  translations?: Record<string, TranslationData>
}

// Ícones disponíveis para seleção
const availableIcons = [
  { label: 'Calendário/Temp.', value: 'images/calendar-1.webp', preview: '📅' },
  { label: 'Partidas', value: 'images/partidas.webp', preview: '👕' },
  { label: 'Gols', value: 'images/goal-1.webp', preview: '⚽' },
  { label: 'Assistências', value: 'images/assitencia2.webp', preview: '👟' },
  { label: 'Bola', value: 'images/soccer-ball-1.webp', preview: '⚽' }
]

const categories = ['', 'Sub 13', 'Sub 15', 'Sub 17', 'Sub 20', 'Sub 23', 'Principal']

const LANGUAGES = [
  { code: 'pt', label: 'Português', flag: 'https://flagcdn.com/w40/pt.png' },
  { code: 'en', label: 'English', flag: 'https://flagcdn.com/w40/gb.png' },
  { code: 'es', label: 'Español', flag: 'https://flagcdn.com/w40/es.png' },
  { code: 'de', label: 'Deutsch', flag: 'https://flagcdn.com/w40/de.png' },
  { code: 'fr', label: 'Français', flag: 'https://flagcdn.com/w40/fr.png' },
  { code: 'it', label: 'Italiano', flag: 'https://flagcdn.com/w40/it.png' }
]

// Componente auxiliar para Upload/URL de Imagem (Mantido igual)
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

const TodayEditor: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<TodayCard[]>([])
  const [message, setMessage] = useState({ text: '', type: '' })
  
  const [editingCard, setEditingCard] = useState<Partial<TodayCard> | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('pt')

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
        .from('today_cards')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error
      
      // Parse stats_data e translations
      const parsedData = data?.filter((card: any) => !card.deleted_at).map(card => {
        let translations = {};
        try {
            translations = typeof card.translations === 'string' ? JSON.parse(card.translations) : (card.translations || {})
        } catch (e) { console.warn('Erro parse translations', e) }

        let stats_data = undefined;
        try {
            stats_data = typeof card.stats_data === 'string' ? JSON.parse(card.stats_data) : card.stats_data
        } catch (e) { console.warn('Erro parse stats_data', e) }
        
        // Recupera do fallback se necessário (apenas para NEWS)
        // Se stats_data for um objeto (não array) e translations estiver vazio, assumimos que é o fallback
        if (card.type === 'news') {
            if ((!translations || Object.keys(translations).length === 0) && stats_data && !Array.isArray(stats_data)) {
                translations = stats_data;
            }
            // Para news, stats_data visualmente não importa, mas mantemos undefined para não quebrar a UI
            stats_data = undefined; 
        }

        return {
            ...card,
            stats_data,
            translations
        }
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
      const { error } = await supabase.from('today_cards').update({ deleted_at: new Date().toISOString() }).eq('id', id)
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
      // Prepara os dados
      const cardData: any = {
        type: editingCard.type,
        title: editingCard.title,
        left_image_url: editingCard.left_image_url,
        news_image_url: editingCard.news_image_url,
        news_text: editingCard.news_text,
        news_link: editingCard.news_link,
        category: editingCard.category,
        stats_data: editingCard.stats_data,
        display_order: editingCard.display_order || (cards.length + 1)
      }

      const gravar = async (comTraducoes: boolean) => {
        const dados = comTraducoes
          ? { ...cardData, translations: editingCard.translations || {} }
          : cardData
        if (isEditing && editingCard.id) {
          return (await supabase.from('today_cards').update(dados).eq('id', editingCard.id)).error
        }
        return (await supabase.from('today_cards').insert([dados])).error
      }

      let error = await gravar(true)

      // A coluna translations pode não existir ainda (migration pendente).
      // Salva o resto em vez de perder a edição — e nunca dentro de stats_data,
      // que é onde a versão anterior gravava e destruía as estatísticas do card.
      if (error && (error.code === '42703' || /translations/.test(error.message || ''))) {
        error = await gravar(false)
        if (!error) {
          setMessage({
            text: 'Card salvo, mas as traduções não foram gravadas: falta rodar a migration que cria a coluna "translations" em today_cards.',
            type: 'error'
          })
          setEditingCard(null); setIsEditing(false); setActiveTab('pt'); fetchCards();
          return
        }
      }

      if (error) throw error

      setMessage({ text: 'Card salvo com sucesso!', type: 'success' })
      setEditingCard(null)
      setIsEditing(false)
      setActiveTab('pt')
      fetchCards()
    } catch (err: any) {
      setMessage({ text: `Erro ao salvar: ${err.message}`, type: 'error' })
    }
  }

  const startNewCard = (type: 'news' | 'stats') => {
    setEditingCard({
      type,
      title: '',
      left_image_url: '',
      news_image_url: '',
      news_text: '',
      news_link: '#',
      category: '',
      stats_data: type === 'stats' ? [{ text: '', icon: 'images/soccer-ball-1.webp' }] : undefined,
      translations: {}
    })
    setIsEditing(false)
    setActiveTab('pt')
  }

  const handleStatChange = (index: number, field: 'text' | 'icon', value: string) => {
    if (!editingCard || !editingCard.stats_data) return
    const newStats = [...editingCard.stats_data]
    newStats[index] = { ...newStats[index], [field]: value }
    setEditingCard({ ...editingCard, stats_data: newStats })
  }

  const addStatField = () => {
    if (!editingCard) return
    const currentStats = editingCard.stats_data || []
    setEditingCard({ ...editingCard, stats_data: [...currentStats, { text: '', icon: 'images/soccer-ball-1.webp' }] })
  }

  const removeStatField = (index: number) => {
    if (!editingCard || !editingCard.stats_data) return
    const newStats = editingCard.stats_data.filter((_, i) => i !== index)
    setEditingCard({ ...editingCard, stats_data: newStats })
  }

  // Função para manipular mudanças nos campos (com suporte a idiomas)
  const handleFieldChange = (field: keyof TranslationData | 'title', value: string) => {
    if (!editingCard) return

    if (activeTab === 'pt') {
      // Edição direta nos campos raiz (PT)
      // Também atualizamos a tradução 'pt' dentro do objeto translations para consistência
      const translations = editingCard.translations || {}
      
      setEditingCard({ 
          ...editingCard, 
          [field]: value,
          translations: {
              ...translations,
              pt: {
                  ...(translations.pt || {}),
                  [field]: value
              }
          }
      })
    } else {
      // Edição nas traduções
      const translations = editingCard.translations || {}
      const langTrans = translations[activeTab] || {}
      
      const newTranslations = {
          ...translations,
          [activeTab]: {
            ...langTrans,
            [field]: value
          }
      };

      setEditingCard({
        ...editingCard,
        translations: newTranslations
      })
    }
  }

  // Ao trocar de aba, se a tradução estiver vazia, copia do PT
  const handleTabChange = (lang: string) => {
    setActiveTab(lang)
    if (lang === 'pt') return
    if (!editingCard) return

    const translations = editingCard.translations || {}
    const langTrans = translations[lang];

    // Se a tradução para este idioma ainda não existe ou está vazia
    if (!langTrans || Object.keys(langTrans).length === 0) {
        // Copia dados atuais do root (que são PT)
        const newTranslations = {
            ...translations,
            [lang]: {
                title: editingCard.title,
                news_text: editingCard.news_text,
                news_link: editingCard.news_link,
                category: editingCard.category,
                items: (editingCard.stats_data || []).map(i => i.text)
            }
        };

        setEditingCard({
            ...editingCard,
            translations: newTranslations
        })
    }
  }

  const getStatText = (index: number) => {
    if (!editingCard) return ''
    if (activeTab === 'pt') return editingCard.stats_data?.[index]?.text || ''
    return editingCard.translations?.[activeTab]?.items?.[index] || ''
  }

  const setStatText = (index: number, value: string) => {
    if (!editingCard) return
    if (activeTab === 'pt') { handleStatChange(index, 'text', value); return }
    const translations = editingCard.translations || {}
    const atual = translations[activeTab] || {}
    const items = [...(atual.items || [])]
    items[index] = value
    setEditingCard({
      ...editingCard,
      translations: { ...translations, [activeTab]: { ...atual, items } }
    })
  }

  const getValue = (field: keyof TranslationData | 'title') => {
    if (!editingCard) return ''
    if (activeTab === 'pt') {
      return (editingCard[field as keyof TodayCard] as string) || ''
    }
    return editingCard.translations?.[activeTab]?.[field as keyof TranslationData] || ''
  }

  if (loading) return <div style={{ color: '#fff' }}>Carregando...</div>

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
            <button onClick={() => startNewCard('news')} style={{ padding: '10px 20px', backgroundColor: '#3cc674', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
              + Novo Card Notícia
            </button>
            <button onClick={() => startNewCard('stats')} style={{ padding: '10px 20px', backgroundColor: '#3cc674', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
              + Novo Card Estatística
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
                    <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>
                      {card.type === 'news' ? 'Notícia' : 'Estatística'} {card.category && `• ${card.category}`}
                    </div>
                    <h3 style={{ margin: '5px 0 0', color: '#fff' }}>{card.title}</h3>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => { setEditingCard(card); setIsEditing(true); setActiveTab('pt'); }} style={{ padding: '8px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>✏️</button>
                  <button onClick={() => handleDelete(card.id)} style={{ padding: '8px', backgroundColor: '#ff4d4d33', color: '#ff4d4d', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px' }}>
          <h2 style={{ marginBottom: '20px', color: '#fff' }}>{isEditing ? 'Editar Card' : `Novo Card de ${editingCard.type === 'news' ? 'Notícia' : 'Estatística'}`}</h2>
          
          <form onSubmit={handleSave}>
            
            {/* Imagem é comum a todos os idiomas */}
            <ImageField 
              label="Imagem Esquerda (Logo/Escudo)" 
              value={editingCard.left_image_url || ''} 
              onChange={(url) => setEditingCard({...editingCard, left_image_url: url})}
            />

            {/* Abas de Idioma — valem para os dois tipos de card */}
            {(
                <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px', flexWrap: 'wrap' }}>
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
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#888', marginBottom: '5px' }}>Título ({activeTab.toUpperCase()})</label>
              <input 
                type="text" 
                value={getValue('title')} 
                onChange={e => handleFieldChange('title', e.target.value)}
                required
                style={{ width: '100%', padding: '10px', backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '5px' }}
              />
            </div>

            {editingCard.type === 'stats' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#888', marginBottom: '5px' }}>Categoria ({activeTab.toUpperCase()})</label>
                {/* input + datalist: sugere as categorias de sempre e aceita
                    texto livre — mesmo padrão do editor de Trajetória. */}
                <input
                  type="text"
                  value={getValue('category')}
                  onChange={e => handleFieldChange('category', e.target.value)}
                  placeholder="Selecione ou digite..."
                  list="today-cat-suggestions"
                  style={{ width: '100%', padding: '10px', backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '5px' }}
                />
                <datalist id="today-cat-suggestions">
                  {categories.filter(Boolean).map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            )}

            {editingCard.type === 'news' && (
              <>
                {/* Imagem da Notícia é comum */}
                <ImageField 
                  label="Imagem da Notícia (Comum a todos idiomas)" 
                  value={editingCard.news_image_url || ''} 
                  onChange={(url) => setEditingCard({...editingCard, news_image_url: url})}
                />

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: '#888', marginBottom: '5px' }}>Texto da Notícia ({activeTab.toUpperCase()})</label>
                  <textarea 
                    value={getValue('news_text')} 
                    onChange={e => handleFieldChange('news_text', e.target.value)}
                    rows={3}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '5px' }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: '#888', marginBottom: '5px' }}>Link "Saiba mais" ({activeTab.toUpperCase()})</label>
                  <input 
                    type="text" 
                    value={getValue('news_link')} 
                    onChange={e => handleFieldChange('news_link', e.target.value)}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '5px' }}
                  />
                </div>
              </>
            )}

            {editingCard.type === 'stats' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#888', marginBottom: '10px' }}>Itens de Estatística</label>
                {editingCard.stats_data?.map((stat, index) => {
                  const specialLabel = availableIcons.find(i => i.value === stat.icon && ['Partidas', 'Gols', 'Assistências'].includes(i.label))?.label;
                  
                  return (
                    <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                      <select
                        value={stat.icon || 'images/soccer-ball-1.webp'}
                        onChange={e => handleStatChange(index, 'icon', e.target.value)}
                        style={{ padding: '10px', backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '5px', width: '150px' }}
                      >
                        {availableIcons.map(icon => (
                          <option key={icon.value} value={icon.value}>{icon.preview} {icon.label}</option>
                        ))}
                      </select>
                      
                      <input 
                        type={specialLabel ? "number" : "text"} 
                        value={getStatText(index)} 
                        onChange={e => setStatText(index, e.target.value)}
                        placeholder={specialLabel ? "Apenas números" : "Ex: 2024/2025"}
                        style={{ flex: 1, padding: '10px', backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '5px' }}
                      />
                      {specialLabel && (
                        <span style={{ color: '#fff', fontWeight: 'bold', minWidth: '80px' }}>
                          {specialLabel}
                        </span>
                      )}
                      <button type="button" onClick={() => removeStatField(index)} style={{ padding: '0 15px', backgroundColor: '#ff4d4d33', color: '#ff4d4d', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>X</button>
                    </div>
                  )
                })}
                <button type="button" onClick={addStatField} style={{ padding: '8px 16px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>+ Adicionar Item</button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: '#3cc674', color: '#000', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Salvar</button>
              <button type="button" onClick={() => setEditingCard(null)} style={{ padding: '12px 20px', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '5px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default TodayEditor
