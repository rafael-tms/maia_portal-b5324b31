import { supabase } from './supabase-client.js'

async function updateAbout() {
  const container = document.getElementById('about-data-container')
  if (!container) return

  const currentLang = (window.MaiaI18n && window.MaiaI18n.getCurrentLanguage) 
    ? window.MaiaI18n.getCurrentLanguage() 
    : 'pt';

  try {
    const { data, error } = await supabase
      .from('about_info')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) throw error

    if (data && data.length > 0) {
      container.innerHTML = '' // Limpa loading

      data.forEach(item => {
        let label = item.label;
        let value = item.value;

        // Verifica tradução
        if (currentLang !== 'pt' && item.translations && item.translations[currentLang]) {
            if (item.translations[currentLang].label) label = item.translations[currentLang].label;
            if (item.translations[currentLang].value) value = item.translations[currentLang].value;
        }

        const itemDiv = document.createElement('div')
        itemDiv.className = 'dados-item'
        
        const labelDiv = document.createElement('div')
        labelDiv.className = 'text'
        labelDiv.textContent = label + ':'
        
        const valueDiv = document.createElement('div')
        valueDiv.className = 'text-g'
        valueDiv.textContent = value
        
        itemDiv.appendChild(labelDiv)
        itemDiv.appendChild(valueDiv)
        container.appendChild(itemDiv)
      })
    } else {
      // Se não houver dados, mostra mensagem
      container.innerHTML = '<div class="dados-item"><div class="text">Nenhuma informação disponível.</div></div>'
    }
  } catch (err) {
    console.error('Erro ao atualizar Sobre:', err)
    // container.innerHTML = '<div class="dados-item"><div class="text">Erro ao carregar dados.</div></div>'
  }
}

// Executa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateAbout)
} else {
  updateAbout()
}

// Ouve mudanças de idioma
window.addEventListener('languageChanged', (e) => {
    updateAbout();
});
