import { supabase } from './supabase-client.js'

async function updateContact() {
  try {
    const { data, error } = await supabase
      .from('contact_info')
      .select('*')
      .limit(1)
      .single()

    if (error) {
        if (error.code !== 'PGRST116') {
            console.error('Erro ao buscar contato:', error)
        }
        return
    }

    if (data) {
        // Título agora é fixo/traduzido via i18n
        // const titleEl = document.getElementById('footer-contact-title')
        // if (titleEl) titleEl.textContent = data.title || 'Fale com a Maia'

        const phoneEl = document.getElementById('footer-contact-phone')
        const emailEl = document.getElementById('footer-contact-email')

        if (phoneEl) phoneEl.textContent = data.phone || ''
        if (emailEl) emailEl.textContent = data.email || ''
    }

  } catch (err) {
    console.error('Erro ao atualizar contato:', err)
  }
}

// Run on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateContact)
} else {
  updateContact()
}
