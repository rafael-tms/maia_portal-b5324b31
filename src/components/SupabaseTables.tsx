import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { ScrollArea } from '@/components/ui/scroll-area'

const SupabaseTables: React.FC = () => {
  const [tables, setTables] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Para listar tabelas, precisamos usar uma consulta SQL direta
      // já que o Supabase não fornece uma API direta para listar tabelas
      const { data, error: queryError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name')

      if (queryError) {
        setError(`Erro ao buscar tabelas: ${queryError.message}`)
        console.error('Erro detalhado:', queryError)
        
        // Tentativa alternativa: buscar algumas tabelas comuns
        await tryCommonTables()
      } else if (data && data.length > 0) {
        const tableNames = data.map((item: any) => item.table_name)
        setTables(tableNames)
      } else {
        setTables([])
        setError('Nenhuma tabela encontrada no schema público')
      }
    } catch (err: any) {
      setError(`Erro inesperado: ${err.message}`)
      console.error('Erro completo:', err)
    } finally {
      setLoading(false)
    }
  }

  const tryCommonTables = async () => {
    // Tenta buscar dados de tabelas comuns para verificar se há dados
    const commonTables = ['profiles', 'users', 'matches', 'goals', 'players']
    const availableTables: string[] = []

    for (const table of commonTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (!error && data !== null) {
          availableTables.push(table)
        }
      } catch (e) {
        // Tabela não existe, continuar para próxima
      }
    }

    if (availableTables.length > 0) {
      setTables(availableTables)
      setError('')
    } else {
      setError('Não foi possível detectar tabelas automaticamente. O schema pode estar vazio.')
    }
  }

  const testConnection = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Teste simples de conexão
      const { error: connError } = await supabase.auth.getSession()
      
      if (connError) {
        setError(`Erro de conexão: ${connError.message}`)
      } else {
        await fetchTables() // Se conexão OK, buscar tabelas
      }
    } catch (err: any) {
      setError(`Erro no teste de conexão: ${err.message}`)
    }
  }

  return (
    <div style={{ 
      padding: '20px', 
      margin: '20px', 
      border: '1px solid #ccc',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9',
      maxWidth: '600px'
    }}>
      <h3>🔍 Tabelas do Supabase</h3>
      
      {loading && <p>🔄 Buscando tabelas...</p>}
      
      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#ffe6e6', 
          border: '1px solid #ffcccc',
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          <strong>❌ Erro:</strong> {error}
        </div>
      )}
      
      {!loading && tables.length > 0 && (
        <div>
          <h4>📋 Tabelas encontradas ({tables.length}):</h4>
          <ScrollArea style={{ height: '200px' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {tables.map((table, index) => (
                <li key={index} style={{
                  padding: '8px',
                  margin: '4px 0',
                  backgroundColor: '#e8f5e8',
                  borderRadius: '4px',
                  border: '1px solid #c8e6c9'
                }}>
                  🗂️ {table}
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}
      
      {!loading && tables.length === 0 && !error && (
        <p>📭 Nenhuma tabela encontrada no banco de dados.</p>
      )}
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={testConnection}
          style={{ 
            padding: '10px 15px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          🔄 Testar Conexão
        </button>
        
        <button 
          onClick={fetchTables}
          style={{ 
            padding: '10px 15px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📋 Buscar Tabelas
        </button>
      </div>
      
      <div style={{ 
        marginTop: '15px', 
        padding: '10px', 
        backgroundColor: '#e3f2fd',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <strong>💡 Dica:</strong> Se não houver tabelas, você pode criar uma pelo painel do Supabase em 
        <a href="https://supabase.com/dashboard" target="_blank" style={{ marginLeft: '5px' }}>
          supabase.com/dashboard
        </a>
      </div>
    </div>
  )
}

export default SupabaseTables