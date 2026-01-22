import React, { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../utils/supabaseClient'
import * as RGLLib from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import _ from 'lodash'

// Safe import handling for Vite/ESM/CJS interop
const RGL = (RGLLib as any).default || RGLLib
const WidthProvider = (RGLLib as any).WidthProvider || RGLLib.WidthProvider

const ReactGridLayout = RGL
const Layout = (RGLLib as any).Layout

interface Montage {
  id: string
  title: string
  created_at: string
  is_active?: boolean
}

interface MontageItem {
  id: string
  montage_id: string
  type: 'image' | 'text'
  content: string
  x: number
  y: number
  w: number
  h: number
  object_position_x?: number
  object_position_y?: number
  created_at: string
  i?: string // For RGL
}

// Componente ImageField atualizado para múltiplos uploads
const ImageUploader: React.FC<{
  onUpload: (items: { url: string; w: number; h: number }[]) => void
}> = ({ onUpload }) => {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = e.target.files
      if (!files || files.length === 0) return

      setUploading(true)

      // Upload em paralelo
      const uploadPromises = Array.from(files).map(async (file) => {
        // Obter dimensões da imagem com timeout e error handling
        const dimensions = await new Promise<{ w: number; h: number }>((resolve) => {
          const img = new Image()
          img.onload = () => resolve({ w: img.width, h: img.height })
          img.onerror = () => resolve({ w: 0, h: 0 }) // Fallback
          // Timeout de 5s
          setTimeout(() => resolve({ w: 0, h: 0 }), 5000)
          img.src = URL.createObjectURL(file)
        })

        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `montage/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('images').getPublicUrl(filePath)
        return { url: data.publicUrl, w: dimensions.w, h: dimensions.h }
      })

      const results = await Promise.all(uploadPromises)
      onUpload(results)

    } catch (error: any) {
      alert(`Erro no upload: ${error.message}`)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
      <button type="button" style={{ padding: '10px 15px', backgroundColor: '#3cc674', color: '#000', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
        {uploading ? 'Enviando...' : '+ Adicionar Imagens'}
      </button>
      <input 
        type="file" 
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        disabled={uploading}
        style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
      />
    </div>
  )
}

const MontageEditor: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [montages, setMontages] = useState<Montage[]>([])
  const [selectedMontage, setSelectedMontage] = useState<Montage | null>(null)
  const [items, setItems] = useState<MontageItem[]>([])
  const [message, setMessage] = useState({ text: '', type: '' })
  const [activeMontageId, setActiveMontageId] = useState<string | null>(null)
  
  // New Montage State
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [containerWidth, setContainerWidth] = useState(1000)
  
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null)

  const handleUpdatePosition = async (id: string, x: number, y: number) => {
    // Update local state
    setItems(items.map(i => i.id === id ? { ...i, object_position_x: x, object_position_y: y } : i))
    
    // Debounce DB update? For now direct update is safer for data integrity but chatty
    // We can use a simple timeout or just update on mouse up (change vs input)
    // Here we will update immediately for responsiveness, maybe add debouncing later if needed
    try {
        await supabase.from('montage_items').update({
            object_position_x: x,
            object_position_y: y
        }).eq('id', id)
    } catch (err) {
        console.error(err)
    }
  }

  // Resize Observer to make grid responsive
  useEffect(() => {
    const handleResize = () => {
       const container = document.getElementById('montage-grid-container')
       if (container) {
         setContainerWidth(container.clientWidth)
       }
    }
    
    window.addEventListener('resize', handleResize)
    // Initial measure
    setTimeout(handleResize, 100)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [selectedMontage]) // Re-run when entering editor mode

  useEffect(() => {
    fetchMontages()
  }, [])

  useEffect(() => {
    if (selectedMontage) {
      fetchItems(selectedMontage.id)
    } else {
      setItems([])
    }
  }, [selectedMontage])

  const fetchMontages = async () => {
    try {
      const { data, error } = await supabase.from('montages').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setMontages(data || [])
    } catch (err) {
      console.error('Erro ao buscar montagens:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchItems = async (montageId: string) => {
    try {
      const { data, error } = await supabase
        .from('montage_items')
        .select('*')
        .eq('montage_id', montageId)
        .order('created_at', { ascending: true })
        
      if (error) throw error
      // Mapeia para formato RGL se necessário, mas já estamos usando x,y,w,h
      setItems(data || [])
    } catch (err) {
      console.error('Erro ao buscar itens:', err)
    }
  }

  const handleCreateMontage = async () => {
    if (!newTitle) return
    try {
      const { data, error } = await supabase.from('montages').insert([{ title: newTitle }]).select().single()
      if (error) throw error
      setMontages([data, ...montages])
      setSelectedMontage(data)
      setIsCreating(false)
      setNewTitle('')
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteMontage = async (id: string) => {
    if (!confirm('Tem certeza? Isso apagará a montagem e todos os itens.')) return
    try {
      const { error } = await supabase.from('montages').delete().eq('id', id)
      if (error) throw error
      setMontages(montages.filter(m => m.id !== id))
      if (selectedMontage?.id === id) setSelectedMontage(null)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      // Logic: Only one montage can be active on home at a time.
      // If we are activating this one, we must deactivate all others (remove [HOME] prefix).
      // If we are deactivating this one, we just remove the prefix.
      
      const montage = montages.find(m => m.id === id)
      if (!montage) return

      const cleanTitle = montage.title.replace('[HOME] ', '')
      const newTitle = !currentState ? `[HOME] ${cleanTitle}` : cleanTitle
      
      // 1. If activating, first remove [HOME] from all other montages
      if (!currentState) {
          const activeMontages = montages.filter(m => m.title.startsWith('[HOME] ') && m.id !== id)
          for (const m of activeMontages) {
              const cleaned = m.title.replace('[HOME] ', '')
              await supabase.from('montages').update({ title: cleaned }).eq('id', m.id)
          }
      }

      // 2. Update the target montage
      const { error } = await supabase
        .from('montages')
        .update({ title: newTitle })
        .eq('id', id)

      if (error) throw error
      
      // 3. Refresh list
      fetchMontages()
      
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message)
      fetchMontages() // Revert on error
    }
  }

  const handleToggleGalleryVisibility = async (id: string, currentStatus: boolean) => {
    try {
        const { error } = await supabase
            .from('montages')
            .update({ is_active: !currentStatus })
            .eq('id', id)

        if (error) throw error
        
        // Update local state
        setMontages(montages.map(m => 
            m.id === id ? { ...m, is_active: !currentStatus } : m
        ))
    } catch (err: any) {
        alert('Erro ao atualizar status: ' + err.message)
    }
  }

  // Função para adicionar múltiplos itens (imagens) com layout inteligente
  const handleAddItems = async (input: string[] | { url: string; w: number; h: number }[], type: 'image' | 'text') => {
    if (!selectedMontage) return
    
    try {
      // Calcular posições para grid
      // Vamos tentar fazer um grid de 3 colunas (total 12 / 4 de largura cada)
      const COLS = 12
      const ITEM_W = 4
      const ROW_HEIGHT = 30
      const MARGIN = 10
      
      // Calculate pixel width of one column (4 units)
      // containerWidth = 1000
      // With containerPadding=[0,0], we only subtract inner margins
      // width = cols * colWidth + (cols - 1) * margin
      // colWidth = (width - (cols - 1) * margin) / cols
      
      const currentWidth = containerWidth || 1000
      const colWidth = (currentWidth - MARGIN * (COLS - 1)) / COLS
      const itemPixelWidth = colWidth * ITEM_W + Math.max(0, ITEM_W - 1) * MARGIN
      
      // Calculate dynamic row height to match aspect ratio scaling
      // Base row height is 30 at 1000px width
      // At 2000px, everything is 2x wider, so rowHeight should be 2x taller (60) to keep aspect ratio
      const currentRowHeight = ROW_HEIGHT * (currentWidth / 1000)
      
      // Encontrar o ponto Y inicial (abaixo de tudo que já existe)
      let startY = items.reduce((max, item) => Math.max(max, item.y + item.h), 0)
      
      const contents = Array.isArray(input) ? input : []
      
      const newItemsPayload = (Array.isArray(input) ? input : []).map((item, index) => {
        const content = typeof item === 'string' ? item : item.url
        
        let itemH = 6 // Default height
        
        // Calculate height based on aspect ratio if available
        if (typeof item !== 'string' && item.w > 0 && item.h > 0) {
           const aspectRatio = item.w / item.h
           const targetHeightPx = itemPixelWidth / aspectRatio
           // Convert px to grid units
           // heightPx = rowHeight * h + margin * (h - 1)
           // targetHeightPx = h * (rowHeight + margin) - margin
           // h = (targetHeightPx + margin) / (rowHeight + margin)
           // Use dynamic margin? No margin is fixed in pixels usually or does it scale?
           // RGL margin prop is fixed pixels [10, 10].
           // So margin doesn't scale.
           // However, rowHeight scales.
           const calculatedH = Math.ceil((targetHeightPx + MARGIN) / (currentRowHeight + MARGIN))
           itemH = Math.max(2, calculatedH) // Ensure at least 2 units
        }

        // Calcular x e y baseados no índice relativo
        const colIndex = index % (COLS / ITEM_W) // 0, 1, 2
        const rowIndex = Math.floor(index / (COLS / ITEM_W))
        
        const x = colIndex * ITEM_W
        // Note: This simple grid logic stacks them nicely if they have same height, 
        // but with variable height it might overlap if we just use rowIndex * defaultHeight.
        // Ideally we should use a packer, but since we disabled compaction, let's just place them sequentially vertically if they wrap.
        // Actually, since we are calculating X,Y explicitly, we need to be careful.
        // For simplicity in this "append" mode:
        // We will just put them in the next available slot? 
        // Or simpler: Just stack them vertically? No, user wants grid.
        
        // Simple approach: Track Y for each column
        // But here we are processing a batch. 
        // Let's keep the simple logic but use the max height of the row for the next row?
        // Or just let the user arrange them?
        // Let's stick to the grid placement but use the calculated H.
        // Caveat: If items in the same row have different H, the next row calculation needs to account for the max Y of the previous row.
        // BUT, our current logic `y = startY + (rowIndex * ITEM_H)` assumes constant height.
        // We need to fix this loop to track Y.
        
        // However, `map` makes state tracking hard. Let's rewrite this map logic slightly or accept a minor imperfection that user fixes.
        // Better:
        return {
           content,
           w: ITEM_W,
           h: itemH,
           type
        }
      })
      
      // Fix positioning logic
      const processedItems = []
      let currentX = 0
      let currentY = startY
      let rowMaxH = 0
      
      for (const item of newItemsPayload) {
          if (currentX + item.w > COLS) {
              currentX = 0
              currentY += rowMaxH
              rowMaxH = 0
          }
          
          processedItems.push({
              montage_id: selectedMontage.id,
              type: item.type,
              content: item.content,
              x: currentX,
              y: currentY,
              w: item.w,
              h: item.h
          })
          
          rowMaxH = Math.max(rowMaxH, item.h)
          currentX += item.w
      }

      const { data, error } = await supabase.from('montage_items').insert(processedItems).select()
      
      if (error) throw error
      if (data) setItems([...items, ...data])
      
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Wrapper para adicionar um único item (texto)
  const handleAddSingleItem = (content: string, type: 'image' | 'text') => {
    handleAddItems([content], type)
  }

  const onLayoutChange = async (layout: Layout[]) => {
    // RGL returns layout items with i, x, y, w, h
    // We need to update our state and DB
    // Only update if changed
    const updates = []
    const newItems = [...items]

    let hasChanges = false

    layout.forEach(l => {
      const itemIndex = newItems.findIndex(i => i.id === l.i)
      if (itemIndex > -1) {
        const item = newItems[itemIndex]
        if (item.x !== l.x || item.y !== l.y || item.w !== l.w || item.h !== l.h) {
          hasChanges = true
          // Update local state
          newItems[itemIndex] = { ...item, x: l.x, y: l.y, w: l.w, h: l.h }
          // Prepare DB update
          updates.push({
            id: item.id,
            x: l.x,
            y: l.y,
            w: l.w,
            h: l.h
          })
        }
      }
    })

    if (hasChanges) {
      setItems(newItems)
      // Batch update DB
      // Supabase doesn't support batch update of different rows easily in one query without RPC
      // We'll do individual updates for now (debouncing could be good but let's keep it simple)
      for (const update of updates) {
        await supabase.from('montage_items').update({
          x: update.x,
          y: update.y,
          w: update.w,
          h: update.h
        }).eq('id', update.id)
      }
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Remover item?')) return
    try {
      const { error } = await supabase.from('montage_items').delete().eq('id', id)
      if (error) throw error
      setItems(items.filter(i => i.id !== id))
    } catch (err: any) {
      alert(err.message)
    }
  }

  const rglLayout = useMemo(() => {
    return items.map(item => ({
      i: item.id,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h
    }))
  }, [items])

  if (loading) return <div>Carregando...</div>

  return (
    <div style={{ color: '#fff' }}>
      {!selectedMontage ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2>Minhas Montagens</h2>
            <button 
              onClick={() => setIsCreating(true)}
              style={{ padding: '10px 20px', backgroundColor: '#3cc674', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              + Nova Montagem
            </button>
          </div>

          {isCreating && (
            <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
              <input 
                type="text" 
                placeholder="Nome da montagem"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                style={{ padding: '10px', width: '300px', marginRight: '10px', color: '#000' }}
              />
              <button onClick={handleCreateMontage} style={{ padding: '10px 20px', backgroundColor: '#3cc674', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Criar</button>
              <button onClick={() => setIsCreating(false)} style={{ padding: '10px 20px', backgroundColor: 'transparent', color: '#fff', border: 'none', cursor: 'pointer' }}>Cancelar</button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {montages.map(m => (
              <div key={m.id} style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', cursor: 'pointer' }} onClick={() => setSelectedMontage(m)}>
                <h3 style={{ marginTop: 0 }}>{m.title.replace('[HOME] ', '')}</h3>
                <p style={{ color: '#888', fontSize: '12px' }}>{new Date(m.created_at).toLocaleDateString()}</p>
                
                {/* Switch Active */}
                <div 
                  onClick={(e) => { e.stopPropagation(); handleToggleActive(m.id, m.title.startsWith('[HOME] ')) }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginTop: '10px',
                    marginBottom: '10px',
                    cursor: 'pointer'
                  }}
                  title="Exibir na Home"
                >
                  <div style={{
                    width: '40px',
                    height: '20px',
                    backgroundColor: m.title.startsWith('[HOME] ') ? '#3cc674' : '#444',
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
                      left: m.title.startsWith('[HOME] ') ? '22px' : '2px',
                      transition: 'left 0.3s'
                    }} />
                  </div>
                  <span style={{ fontSize: '12px', color: m.title.startsWith('[HOME] ') ? '#fff' : '#888' }}>
                    {m.title.startsWith('[HOME] ') ? 'Exibindo na Home' : 'Exibir na Home'}
                  </span>
                </div>

                {/* Switch Active Gallery */}
                <div 
                  onClick={(e) => { e.stopPropagation(); handleToggleGalleryVisibility(m.id, m.is_active !== false) }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginTop: '5px',
                    marginBottom: '10px',
                    cursor: 'pointer'
                  }}
                  title="Exibir na Galeria"
                >
                  <div style={{
                    width: '40px',
                    height: '20px',
                    backgroundColor: m.is_active !== false ? '#3cc674' : '#444',
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
                      left: m.is_active !== false ? '22px' : '2px',
                      transition: 'left 0.3s'
                    }} />
                  </div>
                  <span style={{ fontSize: '12px', color: m.is_active !== false ? '#fff' : '#888' }}>
                    {m.is_active !== false ? 'Visível na Galeria' : 'Oculto na Galeria'}
                  </span>
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteMontage(m.id) }}
                  style={{ marginTop: '10px', backgroundColor: '#ff4d4d33', color: '#ff4d4d', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
            <button onClick={() => setSelectedMontage(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>←</button>
            <h2 style={{ margin: 0 }}>Editando: {selectedMontage.title}</h2>
          </div>

          <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
            <ImageUploader onUpload={(urls) => handleAddItems(urls, 'image')} />
            
            <div style={{ borderLeft: '1px solid #333', paddingLeft: '20px', display: 'flex', gap: '10px' }}>
               <button onClick={() => {
                 const text = prompt('Digite o texto:')
                 if (text) handleAddSingleItem(text, 'text')
               }} style={{ padding: '10px 15px', backgroundColor: '#333', color: '#fff', border: '1px solid #444', borderRadius: '5px', cursor: 'pointer' }}>
                 + Adicionar Texto
               </button>
            </div>
            
            <div style={{ marginLeft: 'auto', color: '#888', fontSize: '14px' }}>
              Arraste para mover. Use a alça no canto inferior direito para redimensionar.
            </div>
          </div>

          <div id="montage-grid-container" style={{ backgroundColor: '#000', padding: '0', borderRadius: '10px', minHeight: '600px', overflow: 'hidden', margin: '0 auto', width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
            <ReactGridLayout
              className="layout"
              layout={rglLayout}
              cols={12}
              rowHeight={97 * (containerWidth / 1000)} // Scale rowHeight proportionally
              margin={[10, 10]} // Explicit margin matching calculations
              containerPadding={[0, 0]} // Remove outer padding to allow items to touch edges
              width={containerWidth} // Dynamic width
              compactType={null} // Prevent auto-compaction/reordering
              preventCollision={true} // Prevent items from overlapping/pushing aggressively
              onLayoutChange={onLayoutChange}
              draggableHandle=".drag-handle"
            >
              {items.map(item => (
                <div key={item.id} style={{ 
                    backgroundColor: item.type === 'text' ? '#0a1717' : 'transparent', 
                    backgroundImage: item.type === 'text' ? 'radial-gradient(circle, #3cc67424, #0000)' : 'none',
                    border: item.type === 'text' ? '1px solid #275757' : (item.is_active === false ? '2px dashed #ff4d4d' : 'none'),
                    borderRadius: '5px', 
                    overflow: 'hidden', 
                    position: 'relative', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    opacity: item.is_active === false ? 0.5 : 1,
                    filter: item.is_active === false ? 'grayscale(100%)' : 'none',
                    border: item.is_active === false ? '2px dashed #ff4d4d' : 'none'
                }}>
                  <div className="drag-handle" style={{ 
                    position: 'absolute', top: 0, left: 0, right: 0, height: '20px', 
                    background: 'rgba(0,0,0,0.5)', cursor: 'move', zIndex: 10,
                    display: 'flex', justifyContent: 'flex-end', padding: '0 5px', gap: '5px',
                    alignItems: 'center'
                  }}>
                    {/* Toggle Visibility */}
                    <span
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            // e.preventDefault(); 
                            // Need to be careful with drag/mousedown. RGL might capture it.
                            // onMouseDown stopPropagation is safer for RGL usually.
                            handleToggleItemActive(item.id, item.is_active !== false) 
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        title={item.is_active !== false ? "Ocultar" : "Mostrar"}
                        style={{ color: '#fff', cursor: 'pointer', fontSize: '14px' }}
                    >
                        {item.is_active !== false ? '👁️' : '🚫'}
                    </span>

                    {/* Edit Position Toggle */}
                    {item.type === 'image' && (
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditingPositionId(editingPositionId === item.id ? null : item.id)
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            title="Ajustar Posição da Imagem"
                            style={{ color: editingPositionId === item.id ? '#3cc674' : '#fff', cursor: 'pointer', fontSize: '14px' }}
                        >
                            📷
                        </span>
                    )}

                    <span 
                      onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id) }}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{ color: '#ff4d4d', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                    >
                      X
                    </span>
                  </div>
                  
                  
                  {item.type === 'image' ? (
                    <>
                    <img 
                      src={item.content} 
                      alt="" 
                      style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover', 
                          objectPosition: `${item.object_position_x ?? 50}% ${item.object_position_y ?? 50}%`,
                          display: 'block' 
                      }} 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.parentElement!.style.backgroundColor = '#ff0000'
                        e.currentTarget.parentElement!.innerText = 'Erro ao carregar imagem'
                        e.currentTarget.parentElement!.style.color = 'white'
                        e.currentTarget.parentElement!.style.display = 'flex'
                        e.currentTarget.parentElement!.style.alignItems = 'center'
                        e.currentTarget.parentElement!.style.justifyContent = 'center'
                        e.currentTarget.parentElement!.style.textAlign = 'center'
                        e.currentTarget.parentElement!.style.fontSize = '12px'
                      }}
                    />
                    
                    {/* Position Controls Overlay */}
                    {editingPositionId === item.id && (
                        <div 
                            className="position-controls"
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                padding: '10px',
                                background: 'rgba(0,0,0,0.8)',
                                zIndex: 20,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '5px'
                            }}
                            onMouseDown={e => e.stopPropagation()} // Prevent drag start
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px' }}>
                                <span>X:</span>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={item.object_position_x ?? 50} 
                                    onChange={(e) => handleUpdatePosition(item.id, parseInt(e.target.value), item.object_position_y ?? 50)}
                                    style={{ flex: 1 }}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px' }}>
                                <span>Y:</span>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={item.object_position_y ?? 50} 
                                    onChange={(e) => handleUpdatePosition(item.id, item.object_position_x ?? 50, parseInt(e.target.value))}
                                    style={{ flex: 1 }}
                                />
                            </div>
                        </div>
                    )}
                    </>
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 'bold', fontSize: '50px', textTransform: 'uppercase', textAlign: 'center' }}>
                      {item.content}
                    </div>
                  )}
                </div>
              ))}
            </ReactGridLayout>
          </div>
        </div>
      )}
    </div>
  )
}

export default MontageEditor
