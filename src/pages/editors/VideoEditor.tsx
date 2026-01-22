import React, { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabaseClient'

interface Video {
  id: string
  title: string
  thumbnail_url: string | null
  video_url: string
  is_active: boolean
  show_on_home: boolean
  created_at: string
}

const VideoEditor: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [videos, setVideos] = useState<Video[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editingItem, setEditingItem] = useState<Partial<Video> | null>(null)

  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setVideos(data || [])
    } catch (error) {
      console.error('Error fetching videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDisplayThumbnail = (video: Video) => {
    if (video.thumbnail_url) return video.thumbnail_url
    const extracted = getVideoThumbnail(video.video_url)
    return extracted || null
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este vídeo?')) return

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      fetchVideos()
    } catch (error: any) {
      alert('Erro ao excluir: ' + error.message)
    }
  }

  const getVideoThumbnail = (url: string) => {
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = ''
      if (url.includes('youtu.be')) {
        videoId = url.split('/').pop() || ''
      } else {
        const urlParams = new URLSearchParams(new URL(url).search)
        videoId = urlParams.get('v') || ''
      }
      return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null
    }
    return null
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    // Check home limit
    if (editingItem.show_on_home) {
      const currentHomeCount = videos.filter(v => v.show_on_home && v.id !== editingItem.id).length
      if (currentHomeCount >= 4) {
        alert('Limite de 4 vídeos na Home atingido.')
        return
      }
    }

    try {
      let thumbUrl = editingItem.thumbnail_url
      
      // Se não tem thumbnail, tenta extrair do vídeo
      if (!thumbUrl && editingItem.video_url) {
        const extractedThumb = getVideoThumbnail(editingItem.video_url)
        if (extractedThumb) {
            thumbUrl = extractedThumb
        }
      }

      const videoData = {
        title: editingItem.title,
        video_url: editingItem.video_url,
        thumbnail_url: thumbUrl || null,
        is_active: editingItem.is_active,
        show_on_home: editingItem.show_on_home
      }

      if (editingItem.id) {
        const { error } = await supabase.from('videos').update(videoData).eq('id', editingItem.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('videos').insert([videoData])
        if (error) throw error
      }

      setEditingItem(null)
      setIsEditing(false)
      fetchVideos()
    } catch (error: any) {
      alert('Erro ao salvar vídeo: ' + error.message)
    }
  }

  const startNewItem = () => {
    setEditingItem({
      title: '',
      video_url: '',
      thumbnail_url: '',
      is_active: true,
      show_on_home: false
    })
    setIsEditing(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      // (Mantém a lógica de upload existente mas usando editingItem)
      try {
        const file = e.target.files?.[0]
        if (!file) return
  
        setUploading(true)
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `thumbnails/${fileName}`
  
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file)
  
        if (uploadError) throw uploadError
  
        const { data } = supabase.storage.from('images').getPublicUrl(filePath)
        setEditingItem(prev => prev ? ({ ...prev, thumbnail_url: data.publicUrl }) : null)
      } catch (error: any) {
        alert('Erro ao fazer upload da imagem: ' + error.message)
      } finally {
        setUploading(false)
      }
  }

  if (loading) return <div>Carregando...</div>

  return (
    <div style={{ color: '#fff' }}>
      
      {!isEditing ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 style={{ margin: 0 }}>Gerenciar Vídeos</h2>
            <button 
                onClick={startNewItem} 
                style={{ padding: '10px 20px', backgroundColor: '#3cc674', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              + Novo Vídeo
            </button>
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            {videos.length === 0 ? (
                <p style={{ color: '#888' }}>Nenhum vídeo cadastrado.</p>
            ) : (
                videos.map(video => (
                    <div key={video.id} style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div style={{ width: '120px', height: '68px', backgroundColor: '#000', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
                                {getDisplayThumbnail(video) ? (
                                    <img src={getDisplayThumbnail(video)!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '10px' }}>No Thumb</div>
                                )}
                                {video.show_on_home && (
                                    <div style={{ position: 'absolute', top: '5px', right: '5px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3cc674' }} title="Na Home"></div>
                                )}
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 5px', color: '#fff', fontSize: '16px' }}>{video.title}</h3>
                                <div style={{ color: '#888', fontSize: '12px', display: 'flex', gap: '10px' }}>
                                    <span>{new Date(video.created_at).toLocaleDateString('pt-BR')}</span>
                                    <span style={{ color: video.is_active ? '#3cc674' : '#666' }}>{video.is_active ? '● Visível' : '○ Oculto'}</span>
                                    {video.show_on_home && <span style={{ color: '#3cc674' }}>• Home</span>}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {video.video_url}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => { setEditingItem(video); setIsEditing(true); }} style={{ padding: '8px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>✏️</button>
                            <button onClick={() => handleDelete(video.id)} style={{ padding: '8px', backgroundColor: '#ff4d4d33', color: '#ff4d4d', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>🗑️</button>
                        </div>
                    </div>
                ))
            )}
          </div>
        </>
      ) : (
        <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px', maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '20px', color: '#fff' }}>{editingItem?.id ? 'Editar Vídeo' : 'Novo Vídeo'}</h2>
          
          <form onSubmit={handleSave}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Título *</label>
              <input 
                type="text" 
                value={editingItem?.title || ''}
                onChange={(e) => setEditingItem(prev => prev ? ({...prev, title: e.target.value}) : null)}
                required
                style={{ width: '100%', padding: '10px', backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '5px' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>URL do Vídeo (YouTube/Vimeo/MP4) *</label>
              <input 
                type="text" 
                value={editingItem?.video_url || ''}
                onChange={(e) => setEditingItem(prev => prev ? ({...prev, video_url: e.target.value}) : null)}
                required
                placeholder="https://..."
                style={{ width: '100%', padding: '10px', backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '5px' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Thumbnail (Opcional)</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ fontSize: '12px' }}
                />
                {uploading && <span style={{ fontSize: '12px', color: '#888' }}>Enviando...</span>}
              </div>
              {editingItem?.thumbnail_url && (
                <img src={editingItem.thumbnail_url} alt="Preview" style={{ marginTop: '10px', maxWidth: '100%', maxHeight: '150px', borderRadius: '5px' }} />
              )}
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#fff' }}>
                <input 
                  type="checkbox" 
                  checked={editingItem?.is_active ?? true}
                  onChange={(e) => setEditingItem(prev => prev ? ({...prev, is_active: e.target.checked}) : null)}
                  style={{ accentColor: '#3cc674', width: '20px', height: '20px' }}
                />
                Visível
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#fff' }}>
                <input 
                  type="checkbox" 
                  checked={editingItem?.show_on_home ?? false}
                  onChange={(e) => setEditingItem(prev => prev ? ({...prev, show_on_home: e.target.checked}) : null)}
                  style={{ accentColor: '#3cc674', width: '20px', height: '20px' }}
                />
                Destaque na Home
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: '#3cc674', color: '#000', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Salvar</button>
              <button type="button" onClick={() => { setIsEditing(false); setEditingItem(null); }} style={{ padding: '12px 20px', backgroundColor: 'transparent', color: '#888', border: '1px solid #333', borderRadius: '5px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default VideoEditor
