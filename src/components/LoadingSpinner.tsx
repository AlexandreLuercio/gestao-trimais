import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-trimais-blue"></div>
      <p className="ml-4 text-xl text-gray-700">Carregando...</p>
    </div>
  );
};

export default LoadingSpinner;
