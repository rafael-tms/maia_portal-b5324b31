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

async function updateHomeVideos() {
  const container = document.getElementById('home-videos-container')
  if (!container) return

  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('is_active', true)
      .eq('show_on_home', true)
      .limit(4)
      .order('created_at', { ascending: false })

    if (error) throw error

    if (data && data.length > 0) {
      container.innerHTML = ''
      
      // Criar Grid Wrapper 2x2
      const gridWrapper = document.createElement('div')
      gridWrapper.style.display = 'grid'
      // Ajuste para garantir 2 colunas em telas maiores
      gridWrapper.style.gridTemplateColumns = 'repeat(2, 1fr)'
      gridWrapper.style.gap = '20px'
      gridWrapper.style.width = '100%'
      
      // Responsividade via media query in JS (ou apenas CSS inline com lógica básica)
      if (window.innerWidth < 768) {
          gridWrapper.style.gridTemplateColumns = '1fr'
      }
      
      // Listener para resize
      window.addEventListener('resize', () => {
          if (window.innerWidth < 768) {
              gridWrapper.style.gridTemplateColumns = '1fr'
          } else {
              gridWrapper.style.gridTemplateColumns = 'repeat(2, 1fr)'
          }
      })

      data.forEach(video => {
        const card = document.createElement('div')
        card.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
        card.style.borderRadius = '10px'
        card.style.overflow = 'hidden'
        card.style.display = 'flex'
        card.style.flexDirection = 'column'
        
        // Video Wrapper
        const videoWrapper = document.createElement('div')
        videoWrapper.style.position = 'relative'
        videoWrapper.style.paddingBottom = '56.25%' // 16:9
        videoWrapper.style.height = '0'
        videoWrapper.style.backgroundColor = '#000'
        
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
                videoEl.style.position = 'absolute'
                videoEl.style.top = '0'
                videoEl.style.left = '0'
                videoEl.style.width = '100%'
                videoEl.style.height = '100%'
                videoWrapper.appendChild(videoEl)
            } else {
                const iframe = document.createElement('iframe')
                iframe.src = embedUrl + (embedUrl.includes('?') ? '&autoplay=1&rel=0' : '?autoplay=1&rel=0')
                iframe.style.position = 'absolute'
                iframe.style.top = '0'
                iframe.style.left = '0'
                iframe.style.width = '100%'
                iframe.style.height = '100%'
                iframe.style.border = '0'
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
            
            // Requested Styles
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
            playBtn.style.pointerEvents = 'none' // Click goes to image/wrapper
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
        info.style.padding = '15px'
        
        const title = document.createElement('h3')
        title.textContent = video.title
        title.style.margin = '0 0 5px 0'
        title.style.fontSize = '16px'
        title.style.color = '#fff'
        title.style.fontWeight = 'bold'
        title.style.lineHeight = '1.4'

        const date = document.createElement('div')
        date.textContent = new Date(video.created_at).toLocaleDateString('pt-BR')
        date.style.fontSize = '12px'
        date.style.color = '#3cc674'
        
        info.appendChild(title)
        info.appendChild(date)
        
        card.appendChild(videoWrapper)
        card.appendChild(info)
        
        gridWrapper.appendChild(card)
      })

      container.appendChild(gridWrapper)
    } else {
      container.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">Nenhum vídeo em destaque.</div>'
    }
  } catch (err) {
    console.error('Erro ao atualizar vídeos da home:', err)
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateHomeVideos)
} else {
  updateHomeVideos()
}
