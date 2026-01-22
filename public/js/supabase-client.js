// Supabase Client - jsDelivr CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://jwokndgjfvchpkyuntit.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3b2tuZGdqZnZjaHBreXVudGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NDUxOTUsImV4cCI6MjA4NDUyMTE5NX0.aUahdG9cMcw7Bzf-MVHTe0yjMiaXvgPEsWCnOy0-96M'

console.log('[supabase-client] Inicializando via jsDelivr...');

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  }
});

console.log('[supabase-client] ✅ Cliente criado');
