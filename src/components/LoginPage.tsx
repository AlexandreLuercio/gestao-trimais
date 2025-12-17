import React, { useState, useEffect } from 'react';
import { auth } from '../firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth'; // <-- Corrigido aqui
import { APP_VERSION } from '../App';

interface LoginPageProps {
    initialError?: string;
    // onInstallClick prop removed
}

const LoginPage: React.FC<LoginPageProps> = ({ initialError }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(initialError || '');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    useEffect(() => {
        if (initialError) {
            setError(initialError);
        }
    }, [initialError]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            setIsSuccess(true);
        } catch (err: any) {
            setIsLoading(false); 
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
                setError("Email ou senha inválidos. Verifique os dados e tente novamente.");
            } else if (err.code === 'auth/invalid-email') {
                setError("Email inválido. Verifique o formato do email.");
            } else if (err.code === 'auth/network-request-failed') {
                setError("Erro de conexão. Verifique sua internet e tente novamente.");
            } else if (err.code === 'auth/too-many-requests') {
                setError("Muitas tentativas falhas. Tente novamente mais tarde.");
            } else {
                setError("Ocorreu um erro inesperado ao tentar fazer login.");
                console.error(err);
            }
        }
    };

    if (isSuccess) {
        return (
            <div className="bg-gray-100 flex items-center justify-center min-h-screen flex-col gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-trimais-blue"></div>
                <div className="text-center">
                    <h2 className="text-xl font-bold text-trimais-blue">Login Aceito</h2>
                    <p className="text-gray-500">Carregando sistema...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 flex items-center justify-center min-h-screen p-4 flex-col">
            <div className="w-full max-w-md bg-white rounded-lg shadow-2xl p-8 space-y-6">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-trimais-blue">Gestão de Tarefas</h1>
                    <p className="text-trimais-gold font-medium">Trimais Places</p>
                </div>

                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            placeholder="seu.email@trimais.com"
                            className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-trimais-blue focus:border-trimais-blue transition-all"
                        />
                    </div>
                    <div>
                        <label htmlFor="password"className="block text-sm font-medium text-gray-700">Senha</label>
                        <div className="relative mt-1">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                placeholder="••••••"
                                className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-trimais-blue focus:border-trimais-blue transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-trimais-blue transition-colors"
                                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074L3.707 2.293zM10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                        <path d="M2 10s3.939-7 8-7 8 7 8 7-3.939 7-8 7-8-7-8-7zm7.894-3.106a3.986 3.986 0 00-3.788 3.788l3.788-3.788z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 animate-fade-in">{error}</div>}
                    <button type="submit" disabled={isLoading} className="w-full bg-trimais-blue text-white py-3 px-4 rounded-lg shadow-lg hover:bg-blue-900 disabled:bg-gray-400 transition-all transform hover:scale-[1.02] flex justify-center items-center gap-2 font-bold text-lg">
                        {isLoading && (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isLoading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
                 <div className="text-center text-sm text-gray-500 border-t pt-6 mt-2">
                  <p>
                    Acesso restrito a funcionários autorizados.
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">Versão {APP_VERSION}</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
