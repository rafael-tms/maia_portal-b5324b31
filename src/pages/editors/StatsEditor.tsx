import React, { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabaseClient'

const LANGUAGES = [
  { code: 'pt', label: 'Português', flag: 'https://flagcdn.com/w40/pt.png' },
  { code: 'en', label: 'English', flag: 'https://flagcdn.com/w40/gb.png' },
  { code: 'es', label: 'Español', flag: 'https://flagcdn.com/w40/es.png' },
  { code: 'de', label: 'Deutsch', flag: 'https://flagcdn.com/w40/de.png' },
  { code: 'fr', label: 'Français', flag: 'https://flagcdn.com/w40/fr.png' },
  { code: 'it', label: 'Italiano', flag: 'https://flagcdn.com/w40/it.png' }
]

const StatsEditor: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [activeTab, setActiveTab] = useState('pt')
  
  const [stats, setStats] = useState({
    id: 'db940e8a-aed5-41cd-a2e8-a7adcf44a457', // ID Padrão/Fallback
    goals: '',
    goals_per_game: '',
    assists: '',
    matches: '',
    characteristics: '',
    translations: {} as Record<string, any>
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      console.log('Buscando estatísticas...')
      
      const [manualRes, todayRes, trajectoryRes] = await Promise.all([
        // 1. Busca estatísticas manuais
        supabase
          .from('player_stats')
          .select('*')
          .limit(1)
          .maybeSingle(),
        
        // 2. Busca dados de Today (Stats cards)
        supabase
          .from('today_cards')
          .select('stats_data')
          .eq('type', 'stats'),

        // 3. Busca dados de Trajectory
        supabase
          .from('trajectory_cards')
          .select('stats_data')
      ]);

      const { data: manualData, error: manualError } = manualRes;
      const { data: todayData, error: todayError } = todayRes;
      const { data: trajectoryData, error: trajectoryError } = trajectoryRes;

      if (manualError) {
          console.error('Erro ao buscar dados manuais:', manualError);
          // Não bloqueia o carregamento, mas avisa
          setMessage({ text: `Erro ao carregar dados manuais: ${manualError.message}`, type: 'error' });
      } else if (!manualData) {
          console.warn('Tabela player_stats vazia ou sem registro.');
      }
      
      if (todayError) {
          console.error('Erro ao buscar Today Stats:', todayError);
      }
      
      if (trajectoryError) {
          console.error('Erro ao buscar Trajectory Stats:', trajectoryError);
      }

      // --- Cálculo Automático ---
      let totalGoals = 0;
      let totalMatches = 0;
      let totalAssists = 0;

      const processStatsItem = (item: any) => {
          if (!item || !item.text) return;
          const val = parseInt(item.text.replace(/\D/g, '')) || 0;
          
          if (item.icon?.includes('goal-1.png')) totalGoals += val;
          if (item.icon?.includes('partidas.png')) totalMatches += val;
          if (item.icon?.includes('assitencia2.png')) totalAssists += val;
      }

      const safeParseJSON = (data: any) => {
        try {
          return typeof data === 'string' ? JSON.parse(data) : data;
        } catch (e) {
          console.warn('Erro ao processar JSON de stats:', e);
          return null;
        }
      }

      // Processa Today
      if (todayData) {
        todayData.forEach(card => {
            const stats = safeParseJSON(card.stats_data);
            if (Array.isArray(stats)) {
                stats.forEach(processStatsItem);
            }
        });
      }

      // Processa Trajectory
      if (trajectoryData) {
        trajectoryData.forEach(card => {
            const stats = safeParseJSON(card.stats_data);
            // Trajectory structure might be complex (categories), normalize it
            if (Array.isArray(stats)) {
               // Se for estrutura antiga (array direto de items)
               if (stats.length > 0 && !stats[0].items) {
                   stats.forEach(processStatsItem);
               } else {
                   // Estrutura nova (categorias)
                   stats.forEach((cat: any) => {
                       if (cat.items && Array.isArray(cat.items)) {
                           cat.items.forEach(processStatsItem);
                       }
                   });
               }
            }
        });
      }

      const goalsPerGame = totalMatches > 0 ? (totalGoals / totalMatches).toFixed(2).replace('.', ',') : '0,00';

      console.log('Cálculo Automático:', { totalGoals, totalMatches, totalAssists, goalsPerGame });

      // Prepara os dados finais para o estado
      let finalCharacteristics = 'Ambidestra, boa finalização, bom posicionamento, boa leitura de jogo, cobradora de faltas e penaltis.';
       let finalTranslations = {};
       let finalId = stats.id;

       if (manualData) {
         if (manualData.id) finalId = manualData.id;
         finalCharacteristics = manualData.characteristics || finalCharacteristics;
        
        // Tenta extrair do fallback hack (legado)
        if (finalCharacteristics && finalCharacteristics.includes('|||')) {
            const parts = finalCharacteristics.split('|||');
            finalCharacteristics = parts[0];
            try {
                const fallbackTrans = JSON.parse(parts[1]);
                if (fallbackTrans) finalTranslations = fallbackTrans;
            } catch(e) {}
        }

        try {
            // Tenta ler de translations (prioridade se existir coluna)
            if (manualData.translations) {
                const realTrans = typeof manualData.translations === 'string' ? JSON.parse(manualData.translations) : manualData.translations;
                if (realTrans && Object.keys(realTrans).length > 0) finalTranslations = realTrans;
            }
        } catch (e) { console.warn('Erro parse translations', e) }
      }

      setStats({
         id: finalId,
         goals: totalGoals.toString(),
         goals_per_game: goalsPerGame,
         assists: totalAssists.toString(),
         matches: totalMatches.toString(),
         characteristics: finalCharacteristics,
         translations: finalTranslations
       })
      
    } catch (err: any) {
      console.error('Erro na requisição:', err)
      setMessage({ text: `Erro ao carregar dados: ${err.message || 'Erro desconhecido'}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCharacteristicsChange = (value: string) => {
      if (activeTab === 'pt') {
          // Atualiza raiz e a entrada PT
          const newTranslations = {
              ...stats.translations,
              pt: {
                  ...(stats.translations.pt || {}),
                  characteristics: value
              }
          };
          setStats(prev => ({ ...prev, characteristics: value, translations: newTranslations }));
      } else {
          // Atualiza apenas a tradução específica
          const newTranslations = {
              ...stats.translations,
              [activeTab]: {
                  ...(stats.translations[activeTab] || {}),
                  characteristics: value
              }
          };
          setStats(prev => ({ ...prev, translations: newTranslations }));
      }
  }

  const handleTabChange = (lang: string) => {
    setActiveTab(lang)
    if (lang === 'pt') return

    // Se a tradução para este idioma ainda não existe ou está vazia, copia do PT
    const langTrans = stats.translations[lang];
    if (!langTrans || !langTrans.characteristics) {
        const newTranslations = {
            ...stats.translations,
            [lang]: {
                characteristics: stats.characteristics
            }
        };
        setStats(prev => ({ ...prev, translations: newTranslations }));
    }
  }

  const getCharacteristicsValue = () => {
      if (activeTab === 'pt') return stats.characteristics;
      return stats.translations[activeTab]?.characteristics || '';
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage({ text: 'Salvando...', type: 'info' })

    // Garante que PT está salvo nas traduções também
    const finalTranslations = { ...stats.translations };
    if (!finalTranslations.pt) {
        finalTranslations.pt = { characteristics: stats.characteristics };
    }

    try {
      const payload: any = {
          id: stats.id, 
          goals: stats.goals,
          goals_per_game: stats.goals_per_game,
          assists: stats.assists,
          matches: stats.matches,
          characteristics: stats.characteristics, 
          updated_at: new Date().toISOString()
      };

      // Tenta incluir translations, se falhar removemos
      if (finalTranslations && Object.keys(finalTranslations).length > 0) {
          payload.translations = finalTranslations;
      }

      const { error } = await supabase
        .from('player_stats')
        .upsert(payload)

      if (error) {
          console.error('Erro detalhado ao salvar:', error);
          
          // Se erro for de coluna ausente OU erro genérico que impede salvamento
          // Vamos tentar salvar APENAS na coluna characteristics com o HACK
          if (error.message?.includes('translations') || error.code === '42703') { 
              console.warn('Usando fallback HACK para salvar traduções.');
              
              const fallbackCharacteristics = `${stats.characteristics}|||${JSON.stringify(finalTranslations)}`;
              
              // Payload limpo sem translations
              const fallbackPayload = {
                  id: payload.id,
                  goals: payload.goals,
                  goals_per_game: payload.goals_per_game,
                  assists: payload.assists,
                  matches: payload.matches,
                  characteristics: fallbackCharacteristics,
                  updated_at: payload.updated_at
              };

              const { error: retryError } = await supabase.from('player_stats').upsert(fallbackPayload);
              if (retryError) {
                  console.error('Erro fatal no fallback:', retryError);
                  throw retryError;
              }
          } else {
              throw error;
          }
      }

      setMessage({ text: 'Estatísticas atualizadas com sucesso! 🚀', type: 'success' })
      setActiveTab('pt')
      
      setTimeout(() => setMessage({ text: '', type: '' }), 3000)
    } catch (err: any) {
      console.error('Erro ao salvar:', err)
      setMessage({ text: `Erro ao salvar: ${err.message || 'Verifique se a tabela existe'}`, type: 'error' })
    }
  }

  if (loading) return <div style={{ color: '#fff', textAlign: 'center' }}>Carregando estatísticas...</div>

  return (
    <div>
      {message.text && (
        <div style={{ 
          padding: '15px', 
          marginBottom: '20px', 
          borderRadius: '5px',
          backgroundColor: message.type === 'error' ? '#ff4d4d33' : message.type === 'success' ? '#3cc67433' : '#333',
          border: `1px solid ${message.type === 'error' ? '#ff4d4d' : message.type === 'success' ? '#3cc674' : '#666'}`,
          color: message.type === 'error' ? '#ff4d4d' : message.type === 'success' ? '#3cc674' : '#fff'
        }}>
          {message.text}
        </div>
      )}

      <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px' }}>
        <h2 style={{ marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px', color: '#fff' }}>Atualizar Estatísticas</h2>
        
        <form onSubmit={handleUpdate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div style={{ opacity: 0.7, pointerEvents: 'none' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Gols (Calculado Automaticamente)</label>
              <input 
                type="text" 
                value={stats.goals}
                readOnly
                style={{ width: '100%', padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '5px' }}
              />
            </div>
            <div style={{ opacity: 0.7, pointerEvents: 'none' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Gols/Jogo (Calculado Automaticamente)</label>
              <input 
                type="text" 
                value={stats.goals_per_game}
                readOnly
                style={{ width: '100%', padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '5px' }}
              />
            </div>
            <div style={{ opacity: 0.7, pointerEvents: 'none' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Assistências (Calculado Automaticamente)</label>
              <input 
                type="text" 
                value={stats.assists}
                readOnly
                style={{ width: '100%', padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '5px' }}
              />
            </div>
            <div style={{ opacity: 0.7, pointerEvents: 'none' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Partidas (Calculado Automaticamente)</label>
              <input 
                type="text" 
                value={stats.matches}
                readOnly
                style={{ width: '100%', padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '5px' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '10px', color: '#888' }}>Principais Características ({activeTab.toUpperCase()})</label>
            
            {/* Abas de Idioma */}
            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                {LANGUAGES.map(lang => (
                    <div 
                        key={lang.code}
                        onClick={() => handleTabChange(lang.code)}
                        style={{ 
                            padding: '8px 15px', 
                            cursor: 'pointer', 
                            borderRadius: '5px',
                            backgroundColor: activeTab === lang.code ? '#3cc674' : 'transparent',
                            color: activeTab === lang.code ? '#000' : '#888',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: activeTab === lang.code ? 'none' : '1px solid #333'
                        }}
                    >
                        <img src={lang.flag} alt={lang.code} style={{ width: '20px', height: '15px', objectFit: 'cover', borderRadius: '2px' }} />
                        <span style={{ fontWeight: 'bold' }}>{lang.code.toUpperCase()}</span>
                    </div>
                ))}
            </div>

            <textarea 
              value={getCharacteristicsValue()}
              onChange={(e) => handleCharacteristicsChange(e.target.value)}
              rows={4}
              style={{ width: '100%', padding: '10px', backgroundColor: '#2a2a2a', border: '1px solid #333', color: '#fff', borderRadius: '5px', resize: 'vertical' }}
            />
          </div>

          <button 
            type="submit"
            style={{ padding: '12px 24px', backgroundColor: '#3cc674', color: '#000', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', width: '100%' }}
          >
            Salvar Alterações
          </button>
        </form>
      </div>
    </div>
  )
}

export default StatsEditor
