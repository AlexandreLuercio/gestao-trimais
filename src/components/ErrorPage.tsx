import React from 'react';
import { useNavigate } from 'react-router-dom';

const ErrorPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 text-center">
      <div className="max-w-md w-full space-y-8">
        <h1 className="text-6xl font-extrabold text-red-600">404</h1>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Página Não Encontrada
        </h2>
        <p className="mt-2 text-lg text-gray-600">
          Desculpe, a página que você está procurando não existe ou foi removida.
        </p>
        <div className="mt-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="group relative flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-trimais-blue hover:bg-trimais-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-trimais-blue"
          >
            Voltar para a Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
