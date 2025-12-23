
import React from 'react';
import { Occurrence, User, Status } from '../types';

interface DashboardProps {
  occurrences: Occurrence[];
  users: User[];
  currentUser: User;
}

const Dashboard: React.FC<DashboardProps> = ({ occurrences }) => {
  const stats = {
    total: occurrences.length,
    abertas: occurrences.filter(o => o.status === Status.Aberto).length,
    andamento: occurrences.filter(o => o.status === Status.EmAndamento).length,
    concluidas: occurrences.filter(o => o.status === Status.Concluido).length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-trimais-blue">
          <p className="text-xs text-gray-500 uppercase font-bold">Total</p>
          <p className="text-2xl font-bold text-trimais-blue">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-400">
          <p className="text-xs text-gray-500 uppercase font-bold">Abertas</p>
          <p className="text-2xl font-bold text-blue-600">{stats.abertas}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-400">
          <p className="text-xs text-gray-500 uppercase font-bold">Em Andamento</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.andamento}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-400">
          <p className="text-xs text-gray-500 uppercase font-bold">Concluídas</p>
          <p className="text-2xl font-bold text-green-600">{stats.concluidas}</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="font-bold text-trimais-blue mb-4 uppercase text-sm">Resumo de Atividades</h3>
        <p className="text-gray-400 italic">O painel detalhado está sendo processado...</p>
      </div>
    </div>
  );
};

export default Dashboard;
