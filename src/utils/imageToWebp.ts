// Converts an image File to WebP in the browser using a Canvas.
// - Skips GIFs (animation would be lost) and SVGs (vector).
// - Skips files that are already WebP.
// - Optionally downscales very large images to maxDimension (default 2400px) on the longest side.
// - Returns a new File with `.webp` extension. On any failure, returns the original file.

export interface WebpOptions {
  quality?: number          // 0..1 (default 0.85)
  maxDimension?: number     // longest side in px (default 2400)
}

export async function convertImageToWebp(
  file: File,
  options: WebpOptions = {}
): Promise<File> {
  const { quality = 0.85, maxDimension = 2400 } = options

  try {
    if (!file || !file.type.startsWith('image/')) return file
    if (file.type === 'image/webp') return file
    if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file

    const bitmap = await loadBitmap(file)
    const { width: w, height: h } = bitmap

    // Compute target size
    const longest = Math.max(w, h)
    const scale = longest > maxDimension ? maxDimension / longest : 1
    const targetW = Math.max(1, Math.round(w * scale))
    const targetH = Math.max(1, Math.round(h * scale))

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap as any, 0, 0, targetW, targetH)

    const blob: Blob | null = await new Promise(resolve =>
      canvas.toBlob(b => resolve(b), 'image/webp', quality)
    )
    if (!blob) return file

    // Only use the WebP version if it's actually smaller than the original
    if (blob.size >= file.size && file.type !== 'image/png') return file

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
    return new File([blob], `${baseName}.webp`, { type: 'image/webp' })
  } catch (err) {
    console.warn('[imageToWebp] conversion failed, using original:', err)
    return file
  }
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // Prefer createImageBitmap when available (faster, off-main-thread decode)
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file)
    } catch {
      // fall through to HTMLImageElement
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}
