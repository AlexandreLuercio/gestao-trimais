// @ts-nocheck
/**
 * ARQUIVO DE CONFIGURAÇÃO - GESTÃO TRIMAIS
 * ---------------------------------------
 * O FIREBASE FOI REMOVIDO DESTE PROJETO.
 * TODA A LÓGICA DE DADOS AGORA RESIDE EM: src/lib/supabaseClient.ts
 */

const metaEnv = (import.meta as any).env || {};

// Chave da Gemini (Mantida para funcionalidades de IA se necessário)
// Certifique-se de configurar VITE_GEMINI_API_KEY na Cloudflare se for usar
export const GEMINI_API_KEY = metaEnv.VITE_GEMINI_API_KEY || metaEnv.VITE_FIREBASE_API_KEY;

// Nota: Não exportamos mais 'auth', 'db' ou 'storage' do Firebase.
// Os componentes corrigidos agora utilizam a constante 'supabase'.
