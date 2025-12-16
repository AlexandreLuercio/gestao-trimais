
import React, { useEffect, useState } from 'react';

interface InstallGuidePageProps {
  onContinue: () => void;
}

const InstallGuidePage: React.FC<InstallGuidePageProps> = ({ onContinue }) => {
  const [os, setOs] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    
    // 1. Detectar Navegadores In-App (WhatsApp, Instagram, Facebook)
    // Esses navegadores ocultam o menu "Adicionar à Tela Inicial"
    if (/whatsapp|instagram|fban|fbav/.test(userAgent)) {
        setIsInAppBrowser(true);
    }

    // 2. Detectar SO
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setOs('ios');
    } else if (/android/.test(userAgent)) {
      setOs('android');
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[2000] bg-trimais-blue flex flex-col items-center justify-center p-6 text-white text-center overflow-y-auto">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      
      <div className="relative z-10 max-w-md w-full space-y-6 animate-fade-in flex flex-col justify-center min-h-full py-10">
        
        {/* HEADER */}
        <div>
           <div className="mx-auto bg-white/10 w-20 h-20 rounded-3xl flex items-center justify-center mb-4 border-4 border-trimais-gold shadow-2xl">
                <span className="text-4xl">📲</span>
           </div>
           <h1 className="text-2xl font-bold mb-2">Instalar App</h1>
        </div>

        {/* ALERTA DE WHATSAPP / IN-APP - ESSE É O PASSO CRÍTICO */}
        <div className="bg-yellow-50 text-gray-900 rounded-xl p-5 shadow-2xl border-l-4 border-yellow-500 text-left">
            <h3 className="text-lg font-bold flex items-center gap-2 text-yellow-800">
                ⚠️ Passo Obrigatório
            </h3>
            <p className="text-sm mt-2 font-medium">
                Você abriu pelo WhatsApp?
            </p>
            <p className="text-sm mt-1 mb-3">
                O navegador do WhatsApp bloqueia a instalação. Você precisa abrir no navegador principal.
            </p>
            <div className="bg-white p-3 rounded border border-yellow-200 text-sm font-bold text-gray-700">
                1. Toque nos <span className="text-xl inline-block align-middle">⋮</span> (3 pontinhos) no topo.<br/>
                2. Escolha <span className="text-blue-600">"Abrir no Chrome"</span> ou "Abrir no Navegador".
            </div>
        </div>

        {/* INSTRUÇÕES FINAIS (SÓ DEPOIS DE ABRIR NO CHROME) */}
        <div className="bg-white/10 rounded-xl p-5 border border-white/20 text-left">
             <h3 className="text-lg font-bold mb-3">Depois de abrir no Chrome:</h3>
             
             {os === 'android' && (
                 <div className="space-y-2 text-sm">
                     <p>1. Toque nos <span className="font-bold">3 pontinhos</span> do Chrome.</p>
                     <p>2. Selecione <span className="font-bold">"Adicionar à tela inicial"</span>.</p>
                     <p>3. Confirme e pronto!</p>
                 </div>
             )}

             {os === 'ios' && (
                 <div className="space-y-2 text-sm">
                     <p>1. Toque em <span className="font-bold">Compartilhar</span> (ícone quadrado com seta).</p>
                     <p>2. Selecione <span className="font-bold">"Adicionar à Tela de Início"</span>.</p>
                 </div>
             )}

            {os === 'desktop' && (
                 <p className="text-sm">No computador, adicione esta página aos seus favoritos (Ctrl+D).</p>
             )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="pt-4">
             <button 
                onClick={onContinue}
                className="w-full bg-trimais-gold text-trimais-blue font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-yellow-500 transition-colors"
            >
                Já fiz isso, entrar no sistema
            </button>
            <p className="text-xs text-white/50 mt-4">Ao clicar no botão acima, você acessará a versão web.</p>
        </div>

      </div>
    </div>
  );
};

export default InstallGuidePage;
