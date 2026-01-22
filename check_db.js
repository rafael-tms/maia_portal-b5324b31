
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://jwokndgjfvchpkyuntit.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3b2tuZGdqZnZjaHBreXVudGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NDUxOTUsImV4cCI6MjA4NDUyMTE5NX0.aUahdG9cMcw7Bzf-MVHTe0yjMiaXvgPEsWCnOy0-96M'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkStats() {
  const { data, error } = await supabase
    .from('player_stats')
    .select('characteristics, translations')
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Data in DB:', JSON.stringify(data, null, 2))
  }
}

checkStats()
