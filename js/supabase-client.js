import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://jwokndgjfvchpkyuntit.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3b2tuZGdqZnZjaHBreXVudGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NDUxOTUsImV4cCI6MjA4NDUyMTE5NX0.aUahdG9cMcw7Bzf-MVHTe0yjMiaXvgPEsWCnOy0-96M'

// Configurações otimizadas para evitar AbortError
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Desativa persistência temporariamente para teste
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  }
})
