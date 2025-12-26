import { createClient } from '@supabase/supabase-js';

// 1. Configuração do Supabase (Lendo da Cloudflare)
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. Exportações de compatibilidade
// Para não quebrar os outros arquivos que você ainda não editou, 
// vamos exportar o supabase com os nomes que o Firebase usava.
export const auth = supabase.auth;
export const db = supabase; 

// 3. Chave da Gemini (Mantida conforme seu original)
export const GEMINI_API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

// Log de diagnóstico (ajuda a saber se as chaves carregaram)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERRO: Chaves do Supabase não encontradas na Cloudflare!");
}
