import { supabase } from './supabase-client.js'

// Cache local em memória
let cachedStats = null;
const STORAGE_KEY = 'maia_player_stats_v1';

async function updateStats(langOverride) {
  let currentLang = langOverride;
  
  // Se não foi passado override, tenta descobrir o idioma
  if (!currentLang) {
      if (window.MaiaI18n && window.MaiaI18n.getCurrentLanguage) {
          currentLang = window.MaiaI18n.getCurrentLanguage();
      } else {
          // Fallback para localStorage ou html lang se MaiaI18n não estiver pronto
          currentLang = localStorage.getItem('i18nextLng') || document.documentElement.lang || 'pt';
      }
  }

  // Normaliza para garantir que temos algo válido (ex: 'pt-BR' -> 'pt-BR')
  if (!currentLang) currentLang = 'pt';
  
  console.log('UpdateStats executando para idioma:', currentLang);

  // 1. Tenta carregar do LocalStorage primeiro (Instantâneo)
  if (!cachedStats) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
          try {
              cachedStats = JSON.parse(stored);
              console.log('Usando cache do LocalStorage');
              renderStats(cachedStats, currentLang);
          } catch (e) { console.warn('Cache inválido', e); }
      }
  } else {
      // Se já tem cache em memória, usa ele para renderizar (troca de idioma rápida)
      renderStats(cachedStats, currentLang);
  }

  // 2. Busca dados frescos do servidor (Background)
    try {
      console.log('Buscando dados para cálculo de estatísticas...');
      
      const [playerRes, todayRes, trajectoryRes] = await Promise.all([
        supabase
          .from('player_stats')
          .select('characteristics, translations')
          .limit(1)
          .maybeSingle(),
        
        supabase
          .from('today_cards')
          .select('stats_data')
          .eq('type', 'stats'),
          
        supabase
          .from('trajectory_cards')
          .select('stats_data')
      ]);

      if (playerRes.error) console.error('Erro player_stats:', playerRes.error);
      if (todayRes.error) console.error('Erro today_cards:', todayRes.error);
      if (trajectoryRes.error) console.error('Erro trajectory_cards:', trajectoryRes.error);

      const playerData = playerRes.data || {};
      const todayData = todayRes.data || [];
      const trajectoryData = trajectoryRes.data || [];

      // --- Cálculo Automático (Igual ao Editor) ---
      let totalGoals = 0;
      let totalMatches = 0;
      let totalAssists = 0;

      const processStatsItem = (item) => {
          if (!item || !item.text) return;
          // Extrai número da string (ex: "10 gols" -> 10)
          const val = parseInt(item.text.replace(/\D/g, '')) || 0;
          
          if (item.icon && item.icon.includes('goal-1.png')) totalGoals += val;
          if (item.icon && item.icon.includes('partidas.png')) totalMatches += val;
          if (item.icon && item.icon.includes('assitencia2.png')) totalAssists += val;
      };

      const safeParseJSON = (d) => {
        try { return typeof d === 'string' ? JSON.parse(d) : d; } 
        catch (e) { return null; }
      };

      // Processa Today
      todayData.forEach(card => {
          const s = safeParseJSON(card.stats_data);
          if (Array.isArray(s)) s.forEach(processStatsItem);
      });

      // Processa Trajectory
      trajectoryData.forEach(card => {
          const s = safeParseJSON(card.stats_data);
          if (Array.isArray(s)) {
             if (s.length > 0 && !s[0].items) {
                 s.forEach(processStatsItem);
             } else {
                 s.forEach(cat => {
                     if (cat.items && Array.isArray(cat.items)) {
                         cat.items.forEach(processStatsItem);
                     }
                 });
             }
          }
      });

      const goalsPerGame = totalMatches > 0 ? (totalGoals / totalMatches).toFixed(2).replace('.', ',') : '0,00';
      
      // Monta objeto final combinando dados calculados + characteristics do banco
      const finalData = {
          goals: totalGoals.toString(),
          matches: totalMatches.toString(),
          assists: totalAssists.toString(),
          goals_per_game: goalsPerGame,
          characteristics: playerData.characteristics,
          translations: playerData.translations
      };

      // Verifica mudança (comparando JSON do objeto final)
      const jsonStr = JSON.stringify(finalData);
      if (jsonStr !== localStorage.getItem(STORAGE_KEY)) {
          console.log('Dados calculados atualizados, re-renderizando...');
          cachedStats = finalData;
          localStorage.setItem(STORAGE_KEY, jsonStr);
          renderStats(finalData, currentLang);
      } else {
          console.log('Dados calculados iguais ao cache.');
          // Garante renderização mesmo se cache for igual, caso DOM não esteja pronto antes
          renderStats(finalData, currentLang); 
      }

    } catch (err) {
      console.error('Erro ao buscar/calcular estatísticas:', err)
    }
  }

function renderStats(data, currentLang) {
      // Parse translations
      let translations = {};
      let characteristics = data.characteristics;
      
      // Fallback: Se characteristics vier vazio do banco, usa texto padrão
      if (!characteristics) {
          characteristics = 'Ambidestra, boa finalização, bom posicionamento, boa leitura de jogo, cobradora de faltas e penaltis.';
      }

      // --- CRITICAL FIX: Ensure 'translations' is initialized from cache/data properly ---
      if (data.translations) {
         try {
             const realTrans = typeof data.translations === 'string' ? JSON.parse(data.translations) : data.translations;
             if (realTrans && Object.keys(realTrans).length > 0) translations = realTrans;
         } catch (e) { console.warn('Erro parse translations', e) }
      }
      // ----------------------------------------------------------------------------------

      // Fallback Hack Extraction
      // O banco está retornando o JSON dentro da string characteristics separado por |||
      if (characteristics && typeof characteristics === 'string' && characteristics.includes('|||')) {
          const parts = characteristics.split('|||');
          characteristics = parts[0]; // Texto limpo para PT
          
          try {
              const jsonStr = parts[1].trim(); 
              // Tenta parsear o JSON de tradução
              const fallbackTrans = JSON.parse(jsonStr);
              
              if (fallbackTrans) {
                  // Debug
                  console.log('Traduções extraídas do fallback hack:', fallbackTrans);
                  
                  // Se translations estiver vazio, usa o do fallback
                  if (Object.keys(translations).length === 0) {
                      translations = fallbackTrans;
                  } else {
                      // Se já tem translations, faz merge (prioridade para o que já existia ou fallback?)
                      // Vamos dar prioridade ao fallback pois parece ser onde os dados estão salvos atualmente
                      translations = { ...translations, ...fallbackTrans };
                  }
              }
          } catch(e) { console.warn('Erro ao parsear fallback hack JSON:', e) }
      }
      
      // Removed duplicate translations parsing block from here to avoid overwriting or redundant logic
      // ...
      
      // Se houver tradução para o idioma atual, usa
      if (currentLang !== 'pt' && translations) {
          // Normaliza o código do idioma (ex: 'pt-BR' -> 'pt')
          const langKey = currentLang.substring(0, 2);
          
          // Tenta pegar do objeto translations usando a chave completa ou a curta
          // Prioridade para a chave exata (ex: 'pt-BR'), depois a curta ('pt')
          const transItem = translations[currentLang] || translations[langKey];

          if (transItem) {
             if (transItem.characteristics) {
                 characteristics = transItem.characteristics;
             } else if (typeof transItem === 'string') {
                 // Suporte a formato legado onde o valor era direto a string
                 characteristics = transItem;
             }
          }
      }

      const setSafeText = (id, text) => {
        const el = document.getElementById(id)
        if (el) {
            // Remove o atributo data-i18n para evitar sobrescrita pelo sistema de tradução
            // assim que tivermos dados reais do banco
            if (text != null && text !== 'Carregando...') {
                el.removeAttribute('data-i18n');
                el.textContent = text;
            }
        }
      }

      // --- Debug Block ---
      console.log('Stats Render Debug:', {
          currentLang,
          originalCharacteristics: data.characteristics,
          parsedTranslations: translations,
          finalCharacteristics: characteristics
      });
      // -------------------

      // Força atualização imediata se a tradução foi encontrada
      if (currentLang !== 'pt' && characteristics !== data.characteristics) {
          console.log('Aplicando tradução:', characteristics);
      }

      setSafeText('stat-goals', data.goals)
      setSafeText('stat-assists', data.assists)
      setSafeText('stat-matches', data.matches)
      
      // Prioridade máxima para carregar characteristics
      if (characteristics) {
         setSafeText('stat-characteristics', characteristics)
      } else {
         console.warn('Campo characteristics vazio no banco de dados');
      }

      setSafeText('stat-goals-per-game', data.goals_per_game)
}

// Executa imediatamente se já carregou, ou espera
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateStats)
} else {
  updateStats()
}

// Ouve mudanças de idioma para re-renderizar
// Corrigido para ouvir no window, onde o evento é disparado
window.addEventListener('languageChanged', (e) => {
    // Tenta extrair o idioma do evento
    const newLang = (e.detail && typeof e.detail === 'object') ? e.detail.language : e.detail;
    console.log('Evento languageChanged recebido em update-stats:', newLang);
    
    // Passa o novo idioma explicitamente para evitar condições de corrida com o estado global
    updateStats(newLang);
});
