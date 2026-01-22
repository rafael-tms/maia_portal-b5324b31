// Script para verificar tabelas do Supabase
import('dotenv/config').then(async () => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('🔗 Conectando ao Supabase...');
    console.log('URL:', supabaseUrl);
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Testar conexão
    console.log('🧪 Testando conexão...');
    const { error: connError } = await supabase.auth.getSession();
    
    if (connError) {
      console.error('❌ Erro de conexão:', connError.message);
      return;
    }
    
    console.log('✅ Conexão bem-sucedida!');
    
    // Tentar listar tabelas usando SQL direto
    console.log('📋 Tentando listar tabelas...');
    
    try {
      // Método 1: Usando information_schema
      const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (error) {
        console.log('⚠️  Não foi possível usar information_schema, tentando método alternativo...');
        
        // Método 2: Tentar tabelas comuns
        const commonTables = ['profiles', 'users', 'matches', 'players', 'goals', 'teams', 'statistics'];
        const availableTables = [];
        
        for (const table of commonTables) {
          try {
            const { data, error: tableError } = await supabase
              .from(table)
              .select('*')
              .limit(1);
            
            if (!tableError && data !== null) {
              availableTables.push(table);
            }
          } catch (e) {
            // Tabela não existe
          }
        }
        
        if (availableTables.length > 0) {
          console.log('✅ Tabelas encontradas:', availableTables);
        } else {
          console.log('📭 Nenhuma tabela encontrada. O banco está vazio.');
        }
        
      } else if (tables && tables.length > 0) {
        const tableNames = tables.map(t => t.table_name);
        console.log('✅ Tabelas encontradas (' + tableNames.length + '):');
        tableNames.forEach((table, index) => {
          console.log(`   ${index + 1}. ${table}`);
        });
      } else {
        console.log('📭 Nenhuma tabela encontrada no schema público.');
      }
      
    } catch (err) {
      console.error('❌ Erro ao buscar tabelas:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Erro ao importar módulos:', error.message);
  }
}).catch(error => {
  console.error('❌ Erro ao carregar dotenv:', error.message);
});