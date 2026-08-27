import React, { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabaseClient'
import PreviewModal, { PreviewButton } from '../../components/PreviewModal'
import PortalPreview from '../../components/PortalPreview'

interface SocialPost {
  id: string
  platform: 'instagram' | 'tiktok'
  post_id: string
  permalink: string
  media_url: string | null
  caption: string | null
  posted_at: string | null
  hidden: boolean
  deleted_at?: string | null
}

const box: React.CSSProperties = {
  backgroundColor: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: 10,
  padding: 16
}

const SocialEditor: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => { fetchPosts() }, [])

  const fetchPosts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('social_posts')
      .select('*')
      .is('deleted_at', null)
      .order('posted_at', { ascending: false })

    if (error) {
      setMessage(
        error.message.includes('social_posts')
          ? 'A tabela social_posts ainda não existe. Rode o arquivo migration-social-posts.sql no banco.'
          : `Erro ao carregar: ${error.message}`
      )
    } else {
      setPosts((data || []) as SocialPost[])
    }
    setLoading(false)
  }

  /** Dispara a edge function que busca os posts novos no Instagram e no TikTok. */
  const sync = async () => {
    setSyncing(true)
    setMessage(null)
    const { data, error } = await supabase.functions.invoke('sync-social-posts', { body: {} })
    if (error) {
      const details = (error as any)?.context ? await (error as any).context.text() : error.message
      setMessage(`Falha na sincronização: ${details}`)
    } else {
      setMessage(`Sincronização concluída: ${data?.synced ?? 0} posts atualizados.`)
      await fetchPosts()
    }
    setSyncing(false)
  }

  const toggleHidden = async (p: SocialPost) => {
    const { error } = await supabase.from('social_posts').update({ hidden: !p.hidden }).eq('id', p.id)
    if (error) return setMessage(`Erro ao salvar: ${error.message}`)
    setPosts(prev => prev.map(x => (x.id === p.id ? { ...x, hidden: !p.hidden } : x)))
  }

  // Exclusão é sempre soft delete: o post some do portal mas fica no banco.
  const remove = async (p: SocialPost) => {
    if (!window.confirm('Tem certeza que deseja excluir este post do carrossel?')) return
    const { error } = await supabase
      .from('social_posts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', p.id)
    if (error) return setMessage(`Erro ao excluir: ${error.message}`)
    setPosts(prev => prev.filter(x => x.id !== p.id))
  }

  const visible = posts.filter(p => !p.hidden)

  return (
    <div style={{ color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Redes Sociais</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <PreviewButton onClick={() => setShowPreview(true)} />
          <button
            onClick={sync}
            disabled={syncing}
            style={{
              backgroundColor: '#3cc674', color: '#000', border: 'none', borderRadius: 8,
              padding: '10px 18px', fontWeight: 'bold', cursor: syncing ? 'wait' : 'pointer'
            }}
          >
            {syncing ? 'Sincronizando…' : '↻ Sincronizar agora'}
          </button>
        </div>
      </div>

      <p style={{ color: '#999', marginTop: 8 }}>
        Os posts de <strong>@maialeonaa</strong> (Instagram) e <strong>@maiakamperrodrigues</strong> (TikTok)
        são atualizados automaticamente a cada 6 horas. Aqui você pode ocultar ou excluir posts do carrossel da home.
      </p>

      {message && (
        <div style={{ ...box, borderColor: '#3cc674', marginBottom: 16, color: '#cfe' }}>{message}</div>
      )}

      {loading ? (
        <p style={{ color: '#999' }}>Carregando…</p>
      ) : posts.length === 0 ? (
        <div style={box}>
          <p style={{ margin: 0, color: '#999' }}>
            Nenhum post sincronizado ainda. Clique em “Sincronizar agora” depois de configurar as credenciais
            do Instagram e do TikTok.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
          {posts.map(p => (
            <div key={p.id} style={{ ...box, opacity: p.hidden ? 0.5 : 1, padding: 0, overflow: 'hidden' }}>
              <div style={{ position: 'relative', aspectRatio: '9 / 16', background: '#000' }}>
                {p.media_url && (
                  <img
                    src={p.media_url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                <span style={{
                  position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,.7)', color: '#3cc674',
                  fontSize: 10, fontWeight: 'bold', letterSpacing: '.1em', padding: '4px 8px', borderRadius: 4
                }}>
                  {p.platform === 'tiktok' ? 'TIKTOK' : 'INSTAGRAM'}
                </span>
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 11, color: '#888' }}>
                  {p.posted_at ? new Date(p.posted_at).toLocaleDateString('pt-BR') : '—'}
                </div>
                <div style={{ fontSize: 12, color: '#ddd', marginTop: 6, minHeight: 32 }}>
                  {(p.caption || '').slice(0, 70) || 'Sem legenda'}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <a
                    href={p.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, color: '#3cc674', textDecoration: 'none', alignSelf: 'center' }}
                  >
                    Abrir ↗
                  </a>
                  <button
                    onClick={() => toggleHidden(p)}
                    style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid #555', color: '#ccc', borderRadius: 6, fontSize: 11, padding: '5px 10px', cursor: 'pointer' }}
                  >
                    {p.hidden ? 'Mostrar' : 'Ocultar'}
                  </button>
                  <button
                    onClick={() => remove(p)}
                    style={{ background: 'transparent', border: '1px solid #7a2b2b', color: '#e88', borderRadius: 6, fontSize: 11, padding: '5px 10px', cursor: 'pointer' }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPreview && (
        <PreviewModal title="Redes Sociais — como aparece no portal" onClose={() => setShowPreview(false)}>
          <PortalPreview section="social" lang="pt" overrides={{ social_posts: visible }} />
        </PreviewModal>
      )}
    </div>
  )
}

export default SocialEditor
