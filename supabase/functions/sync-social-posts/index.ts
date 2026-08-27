// Sincroniza os posts recentes do Instagram (@maialeonaa) e do TikTok
// (@maiakamperrodrigues) na tabela `social_posts`.
//
// Deploy:  supabase functions deploy sync-social-posts --no-verify-jwt=false
// Secrets: IG_ACCESS_TOKEN, TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET,
//          TIKTOK_REFRESH_TOKEN (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já
//          existem no runtime das functions).
//
// As capas do Instagram expiram em ~24h, por isso são rehospedadas no bucket
// `images` com cache de 1 ano.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

const BUCKET = 'images'
const PREFIX = 'social'
const LIMIT = 12

type Post = {
  platform: 'instagram' | 'tiktok'
  post_id: string
  permalink: string
  media_url: string | null
  caption: string | null
  posted_at: string | null
}

const env = (k: string) => Deno.env.get(k) ?? ''

const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false }
})

/* --------------------------------------------------------------- Instagram */
async function fetchInstagram(): Promise<Post[]> {
  const token = env('IG_ACCESS_TOKEN')
  if (!token) return []

  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp'
  const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=${LIMIT}&access_token=${token}`
  const res = await fetch(url)
  const body = await res.json()
  if (!res.ok) throw new Error(`Instagram [${res.status}]: ${JSON.stringify(body)}`)

  return (body.data ?? []).map((m: any): Post => ({
    platform: 'instagram',
    post_id: String(m.id),
    permalink: m.permalink,
    media_url: m.media_type === 'VIDEO' ? (m.thumbnail_url ?? m.media_url) : m.media_url,
    caption: m.caption ?? null,
    posted_at: m.timestamp ?? null
  }))
}

/* ------------------------------------------------------------------ TikTok */
async function tiktokAccessToken(): Promise<string> {
  const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: env('TIKTOK_CLIENT_KEY'),
      client_secret: env('TIKTOK_CLIENT_SECRET'),
      grant_type: 'refresh_token',
      refresh_token: env('TIKTOK_REFRESH_TOKEN')
    })
  })
  const body = await res.json()
  if (!res.ok || !body.access_token) {
    throw new Error(`TikTok token [${res.status}]: ${JSON.stringify(body)}`)
  }
  return body.access_token as string
}

async function fetchTikTok(): Promise<Post[]> {
  if (!env('TIKTOK_CLIENT_KEY') || !env('TIKTOK_REFRESH_TOKEN')) return []

  const token = await tiktokAccessToken()
  const fields = 'id,title,cover_image_url,share_url,create_time,video_description'
  const res = await fetch(`https://open.tiktokapis.com/v2/video/list/?fields=${fields}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ max_count: LIMIT })
  })
  const body = await res.json()
  if (!res.ok) throw new Error(`TikTok list [${res.status}]: ${JSON.stringify(body)}`)

  return (body.data?.videos ?? []).map((v: any): Post => ({
    platform: 'tiktok',
    post_id: String(v.id),
    permalink: v.share_url,
    media_url: v.cover_image_url ?? null,
    caption: v.video_description || v.title || null,
    posted_at: v.create_time ? new Date(v.create_time * 1000).toISOString() : null
  }))
}

/* ------------------------------------------------- rehospedagem das capas */
async function rehost(post: Post): Promise<string | null> {
  if (!post.media_url) return null
  try {
    const res = await fetch(post.media_url)
    if (!res.ok) return post.media_url
    const bytes = new Uint8Array(await res.arrayBuffer())
    const type = res.headers.get('content-type') ?? 'image/jpeg'
    const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg'
    const path = `${PREFIX}/${post.platform}-${post.post_id}.${ext}`

    const up = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: type,
      cacheControl: '31536000',
      upsert: true
    })
    if (up.error) return post.media_url

    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  } catch {
    return post.media_url
  }
}

/* --------------------------------------------------------------------- go */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const results = await Promise.allSettled([fetchInstagram(), fetchTikTok()])
    const errors = results.filter(r => r.status === 'rejected').map(r => String((r as PromiseRejectedResult).reason))
    const posts = results.flatMap(r => (r.status === 'fulfilled' ? r.value : []))

    if (!posts.length) {
      return new Response(JSON.stringify({ synced: 0, errors }), {
        status: errors.length ? 502 : 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const rows = []
    for (const p of posts) {
      rows.push({ ...p, media_url: await rehost(p), updated_at: new Date().toISOString() })
    }

    const { error } = await supabase
      .from('social_posts')
      .upsert(rows, { onConflict: 'platform,post_id', ignoreDuplicates: false })

    if (error) throw new Error(`Supabase upsert: ${error.message}`)

    return new Response(JSON.stringify({ synced: rows.length, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
