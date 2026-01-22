import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'

const SupabaseTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('Conectando...')
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      // Testa a conexão fazendo uma consulta simples
      const { data: testData, error } = await supabase
        .from('profiles') // Você pode mudar para uma tabela que existe no seu projeto
        .select('*')
        .limit(1)

      if (error) {
        setConnectionStatus(`Erro: ${error.message}`)
      } else {
        setConnectionStatus('Conexão bem-sucedida!')
        setData(testData || [])
      }
    } catch (error) {
      setConnectionStatus('Erro de conexão com o Supabase')
      console.error('Erro:', error)
    }
  }

  return (
    <div style={{ 
      padding: '20px', 
      margin: '20px', 
      border: '1px solid #ccc',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>Teste de Conexão Supabase</h3>
      <p>Status: <strong>{connectionStatus}</strong></p>
      
      {data.length > 0 && (
        <div>
          <h4>Dados encontrados:</h4>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
      
      <button 
        onClick={testConnection}
        style={{ 
          padding: '10px 15px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Testar Conexão Novamente
      </button>
    </div>
  )
}

export default SupabaseTest