import React, { useState } from 'react';
import { auth } from '../firebase/config';
import * as FirebaseAuth from 'firebase/auth';
const { signInWithEmailAndPassword } = FirebaseAuth as any;
import { APP_VERSION } from '../types';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        console.log('Iniciando tentativa de login para:', email.trim());
        
        try {
            await signInWithEmailAndPassword(auth, email.trim(), password);
            console.log('Login bem-sucedido!');
        } catch (err: any) {
            console.error('Erro de autenticação:', err.code, err.message);
            setIsLoading(false); 
            setError("E-mail ou senha inválidos. Verifique suas credenciais.");
        }
    };

    return (
        <div className="bg-trimais-blue flex items-center justify-center min-h-screen p-4 flex-col">
            <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 space-y-8 animate-fade-in">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-trimais-blue">Trimais Places</h1>
                    <p className="text-trimais-gold font-bold uppercase tracking-widest text-sm mt-1">Gestão de Operações</p>
                </div>
                <form className="space-y-5" onSubmit={handleLogin}>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">E-mail Corporativo</label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            autoComplete="email"
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 ring-trimais-blue outline-none transition-all" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Senha de Acesso</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            autoComplete="current-password"
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 ring-trimais-blue outline-none transition-all" 
                        />
                    </div>
                    {error && <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 text-center font-bold">{error}</div>}
                    <button type="submit" disabled={isLoading} className="w-full bg-trimais-blue text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-900 transition-colors shadow-lg active:scale-95 disabled:opacity-50">
                        {isLoading ? 'Autenticando...' : 'Acessar Sistema'}
                    </button>
                </form>
                <div className="text-center text-[10px] text-gray-300">Versão de Manutenção {APP_VERSION}</div>
            </div>
        </div>
    );
};

export default LoginPage;