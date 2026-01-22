import { supabase } from './supabase-client.js'

function getEmbedUrl(url) {
  if (!url) return ''
  
  // YouTube
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    let videoId = ''
    if (url.includes('youtu.be')) {
      videoId = url.split('/').pop()
    } else {
      const urlParams = new URLSearchParams(new URL(url).search)
      videoId = urlParams.get('v')
    }
    return `https://www.youtube.com/embed/${videoId}`
  }
  
  // Vimeo
  if (url.includes('vimeo.com')) {
    const videoId = url.split('/').pop()
    return `https://player.vimeo.com/video/${videoId}`
  }
  
  return url
}

function isDirectVideo(url) {
  return url.match(/\.(mp4|webm|ogg)$/i)
}

function getVideoThumbnail(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    let videoId = ''
    if (url.includes('youtu.be')) {
      videoId = url.split('/').pop()
    } else {
      const urlParams = new URLSearchParams(new URL(url).search)
      videoId = urlParams.get('v')
    }
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null
  }
  return null
}

async function updateVideosPage() {
  const container = document.getElementById('videos-container')
  if (!container) return

  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    if (data && data.length > 0) {
      container.innerHTML = ''
      
      data.forEach(video => {
        const videoCard = document.createElement('div')
        videoCard.className = 'video-card'
        
        // Video Wrapper
        const videoWrapper = document.createElement('div')
        videoWrapper.className = 'video-wrapper'
        
        // Determine thumbnail
        let thumbUrl = video.thumbnail_url
        if (!thumbUrl) {
            thumbUrl = getVideoThumbnail(video.video_url)
        }

        const loadPlayer = () => {
            videoWrapper.innerHTML = '' // Clear cover
            const embedUrl = getEmbedUrl(video.video_url)
            
            if (isDirectVideo(video.video_url)) {
                const videoEl = document.createElement('video')
                videoEl.src = video.video_url
                videoEl.controls = true
                videoEl.autoplay = true
                videoWrapper.appendChild(videoEl)
            } else {
                const iframe = document.createElement('iframe')
                iframe.src = embedUrl + (embedUrl.includes('?') ? '&autoplay=1&rel=0' : '?autoplay=1&rel=0')
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                iframe.allowFullscreen = true
                videoWrapper.appendChild(iframe)
            }
        }

        if (thumbUrl) {
            // Show Cover with Blur
            const coverImg = document.createElement('img')
            coverImg.src = thumbUrl
            coverImg.style.position = 'absolute'
            coverImg.style.top = '0'
            coverImg.style.left = '0'
            coverImg.style.width = '100%'
            coverImg.style.height = '100%'
            coverImg.style.objectFit = 'cover'
            coverImg.style.cursor = 'pointer'
            
            // Requested Styles (Blur Only Here and Home)
            coverImg.style.opacity = '0.6'
            coverImg.style.filter = 'blur(2px)'
            
            // Play Button Overlay
            const playBtn = document.createElement('div')
            playBtn.innerHTML = '▶'
            playBtn.style.position = 'absolute'
            playBtn.style.top = '50%'
            playBtn.style.left = '50%'
            playBtn.style.transform = 'translate(-50%, -50%)'
            playBtn.style.fontSize = '40px'
            playBtn.style.color = '#fff'
            playBtn.style.cursor = 'pointer'
            playBtn.style.pointerEvents = 'none'
            playBtn.style.textShadow = '0 2px 4px rgba(0,0,0,0.5)'

            videoWrapper.appendChild(coverImg)
            videoWrapper.appendChild(playBtn)
            
            videoWrapper.onclick = loadPlayer
        } else {
            // No thumbnail, load player directly
            loadPlayer()
        }
        
        // Info
        const info = document.createElement('div')
        info.className = 'video-content'
        
        const date = document.createElement('div')
        date.className = 'video-date'
        date.textContent = new Date(video.created_at).toLocaleDateString('pt-BR')
        
        const title = document.createElement('div')
        title.className = 'video-title'
        title.textContent = video.title
        
        info.appendChild(date)
        info.appendChild(title)
        
        videoCard.appendChild(videoWrapper)
        videoCard.appendChild(info)
        
        container.appendChild(videoCard)
      })
    } else {
      container.innerHTML = '<div style="text-align: center; color: #888; grid-column: 1/-1; padding: 40px;">Nenhum vídeo disponível.</div>'
    }
  } catch (err) {
    console.error('Erro ao atualizar página de vídeos:', err)
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateVideosPage)
} else {
  updateVideosPage()
}
