export function renderMontage(canvas, items) {
  // Clear previous render
  canvas.innerHTML = ''

  // EDITOR CONFIGURATION (Reference)
  // The editor was built with width=1000, cols=12, rowHeight=97, margin=[10,10]
  const REF_WIDTH = 1000
  const BASE_ROW_HEIGHT = 97
  const MARGIN_X = 10
  const MARGIN_Y = 10
  const COLS = 12

  // Current Container Width
  const containerWidth = canvas.clientWidth || REF_WIDTH

  // Calculate Scale Factor to preserve aspect ratio of the original creation
  // If the container is 1200px, everything should scale up by 1.2x
  const scale = containerWidth / REF_WIDTH

  // Scaled Dimensions
  const rowHeight = BASE_ROW_HEIGHT * scale
  // Fixed margins to match ReactGridLayout default behavior
  const marginX = MARGIN_X 
  const marginY = MARGIN_Y

  // RGL Logic for Column Width with containerPadding=[0,0]
  // With 0 outer padding, we only subtract margins BETWEEN columns (cols - 1)
  // colWidth = (containerWidth - marginX * (cols - 1)) / cols
  const colWidth = (containerWidth - (marginX * (COLS - 1))) / COLS

  // Calculate total height needed
  let maxY = 0
  items.forEach(item => {
    const bottom = item.y + item.h
    if (bottom > maxY) maxY = bottom
  })
  
  // Set canvas height based on scaled row height and margins
  // With containerPadding=[0,0]:
  // Top = y * (rowHeight + marginY)
  // Height = h * rowHeight + (h - 1) * marginY
  // Bottom = Top + Height
  const totalPixelHeight = (maxY * rowHeight) + (Math.max(0, maxY - 1) * marginY)
  canvas.style.height = `${totalPixelHeight}px`

  items.forEach(item => {
    const el = document.createElement('div')
    el.className = 'montage-item'
    
    // RGL Position Math with containerPadding=[0,0]
    // Left = (colWidth + marginX) * x
    const left = (colWidth + marginX) * item.x
    
    // Top = (rowHeight + marginY) * item.y
    const top = (rowHeight + marginY) * item.y
    
    // Width = colWidth * w + (w - 1) * marginX
    const width = colWidth * item.w + Math.max(0, item.w - 1) * marginX
    
    // Height = rowHeight * h + (h - 1) * marginY
    const height = rowHeight * item.h + Math.max(0, item.h - 1) * marginY
    
    el.style.position = 'absolute'
    el.style.left = `${left}px`
    el.style.top = `${top}px`
    el.style.width = `${width}px`
    el.style.height = `${height}px`
    
    // Inner Content
    const inner = document.createElement('div')
    inner.style.width = '100%'
    inner.style.height = '100%'
    inner.style.borderRadius = '5px'
    inner.style.overflow = 'hidden'
    inner.style.position = 'relative'
    // Default background color matching editor
    inner.style.backgroundColor = 'transparent'
    inner.style.display = 'flex'
    inner.style.alignItems = 'center'
    inner.style.justifyContent = 'center'

    if (item.type === 'image') {
      const img = document.createElement('img')
      img.src = item.content
      img.loading = 'lazy'
      img.style.width = '100%'
      img.style.height = '100%'
      img.style.objectFit = 'cover'
      const posX = item.object_position_x ?? 50
      const posY = item.object_position_y ?? 50
      img.style.objectPosition = `${posX}% ${posY}%`
      img.style.display = 'block'
      inner.appendChild(img)
    } else {
      // Update styling for text items based on user request (Dark Card Style)
      inner.style.backgroundColor = '#0a1717'
      inner.style.backgroundImage = 'radial-gradient(circle, #3cc67424, #0000)'
      inner.style.border = '1px solid #275757'
      
      const textDiv = document.createElement('div')
      textDiv.className = 'montage-item-text'
      // Text styling
      textDiv.style.color = '#FFFFFF'
      textDiv.style.fontWeight = 'bold'
      textDiv.style.fontSize = '50px'
      textDiv.style.textTransform = 'uppercase'
      textDiv.style.textAlign = 'center'
      textDiv.style.backgroundColor = 'transparent' // Override any CSS class
      textDiv.textContent = item.content
      inner.appendChild(textDiv)
    }

    el.appendChild(inner)
    canvas.appendChild(el)
  })
}
