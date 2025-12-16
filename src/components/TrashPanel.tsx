
import React, { useState } from 'react';
import { Occurrence } from '../types';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ConfirmModal from './ConfirmModal';

interface TrashPanelProps {
  occurrences: Occurrence[];
  onRestore: (id: string) => void;
  onDeleteForever: (id: string) => void;
}

const TrashPanel: React.FC<TrashPanelProps> = ({ occurrences, onRestore, onDeleteForever }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for Delete Confirmation Modal
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({
      isOpen: false,
      id: null
  });

  const filteredOccurrences = occurrences.filter(occ => {
    const searchLower = searchTerm.toLowerCase();
    return (
      occ.title.toLowerCase().includes(searchLower) ||
      occ.uniqueId?.toLowerCase().includes(searchLower) ||
      occ.area.toLowerCase().includes(searchLower)
    );
  });

  const getDaysRemaining = (deletedAt: string) => {
    const deletionDate = parseISO(deletedAt);
    const autoDeleteDate = addDays(deletionDate, 30);
    const today = new Date();
    return differenceInDays(autoDeleteDate, today);
  };

  const handleDeleteClick = (id: string) => {
      setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = () => {
      if (deleteModal.id) {
          onDeleteForever(deleteModal.id);
          setDeleteModal({ isOpen: false, id: null });
      }
  };

  return (
    <div className="bg-white rounded-lg shadow-2xl p-6 md:p-8 w-full min-h-[80vh]">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
            <h3 className="text-2xl font-bold text-trimais-blue flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Lixeira
            </h3>
            <p className="text-sm text-gray-500 mt-1">Itens na lixeira há mais de 30 dias serão excluídos automaticamente.</p>
        </div>
        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder="Pesquisar na lixeira..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-trimais-blue focus:border-trimais-blue"
          />
        </div>
      </div>

      {filteredOccurrences.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">A lixeira está vazia</h3>
          <p className="mt-1 text-sm text-gray-500">Tarefas excluídas aparecerão aqui.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarefa</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Área</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Exclusão</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expira em</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOccurrences.map(occ => {
                const daysRemaining = occ.deletedAt ? getDaysRemaining(occ.deletedAt) : 30;
                return (
                  <tr key={occ.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{occ.title}</span>
                        <span className="text-xs text-gray-500">{occ.uniqueId || `ID: ${occ.id.substring(0,6)}`}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{occ.area}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {occ.deletedAt ? format(parseISO(occ.deletedAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                       <span className={`px-2 py-1 rounded-full text-xs font-bold ${daysRemaining < 5 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                         {daysRemaining} dias
                       </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3 items-center">
                          <button 
                            onClick={() => onRestore(occ.id)} 
                            className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 border border-blue-200 transition-colors"
                            title="Restaurar Tarefa"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v3.27a1 1 0 01-2 0V13.1a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                          </button>
                          
                          <button 
                            onClick={() => handleDeleteClick(occ.id)} 
                            className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 border border-red-200 transition-colors"
                            title="Excluir Definitivamente"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Exclusão Definitiva"
        message="Tem certeza que deseja excluir esta tarefa permanentemente? Esta ação não pode ser desfeita e todo o histórico será perdido."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, id: null })}
        confirmText="Sim, excluir para sempre"
        cancelText="Cancelar"
        isDangerous={true}
      />
    </div>
  );
};

export default TrashPanel;
