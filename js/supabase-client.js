// Supabase Client - jsDelivr CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://jwokndgjfvchpkyuntit.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3b2tuZGdqZnZjaHBreXVudGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NDUxOTUsImV4cCI6MjA4NDUyMTE5NX0.aUahdG9cMcw7Bzf-MVHTe0yjMiaXvgPEsWCnOy0-96M'

console.log('[supabase-client] Inicializando via jsDelivr...');

// Dedup concurrent requests + sessionStorage cache (stale-while-revalidate)
const inFlight = new Map();
const CACHE_PREFIX = 'sb-cache:';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

const customFetch = (input, init) => {
  const url = typeof input === 'string' ? input : input.url;
  const method = (init && init.method) || 'GET';

  // Cache apenas GETs à REST API
  if (method !== 'GET' || !url.includes('/rest/v1/')) {
    return fetch(input, init);
  }

  const cacheKey = CACHE_PREFIX + url;

  // Dedupe requisições idênticas concorrentes
  if (inFlight.has(cacheKey)) {
    return inFlight.get(cacheKey).then(r => r.clone());
  }

  const networkPromise = fetch(input, init).then(res => {
    if (res.ok) {
      res.clone().text().then(body => {
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), body }));
        } catch (e) { /* quota */ }
      });
    }
    inFlight.delete(cacheKey);
    return res;
  }).catch(err => {
    inFlight.delete(cacheKey);
    throw err;
  });

  inFlight.set(cacheKey, networkPromise);

  // Stale-while-revalidate: se há cache fresco, retorna instantaneamente
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { t, body } = JSON.parse(cached);
      if (Date.now() - t < CACHE_TTL_MS) {
        return Promise.resolve(new Response(body, {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
    }
  } catch (e) { /* ignore */ }

  return networkPromise.then(r => r.clone());
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    fetch: customFetch
  }
});

console.log('[supabase-client] ✅ Cliente criado (cache SWR ativo)');
