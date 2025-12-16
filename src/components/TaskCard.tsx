import React from 'react';
import { Occurrence } from '../types'; // Assumindo que 'Occurrence' é importado de ../types
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskCardProps {
  occurrence: Occurrence;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onViewDetails: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ occurrence, onEdit, onDelete, onComplete, onViewDetails }) => {
  const isCompleted = occurrence.status === 'Concluída';

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 mb-4 flex flex-col transition-all duration-300 ${isCompleted ? 'border-l-4 border-green-500 opacity-70' : 'border-l-4 border-trimais-blue'}`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className={`text-lg font-bold ${isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
          {occurrence.title}
        </h4>
        <div className="flex space-x-2">
          {occurrence.priority && (
            <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Prioridade: {occurrence.priority}
            </span>
          )}
          {occurrence.dueDate && (
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Vencimento: {format(parseISO(occurrence.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          )}
        </div>
      </div>
      
      <p className={`text-sm ${isCompleted ? 'line-through text-gray-400' : 'text-gray-600'} mb-3`}>
        {occurrence.description || 'Sem descrição.'}
      </p>

      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Área: {occurrence.area || 'N/A'}</span>
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${isCompleted ? 'bg-green-100 text-green-800' : 'bg-trimais-blue text-white'}`}>
          {occurrence.status || 'Pendente'}
        </span>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end space-x-2">
        <button
          onClick={() => onViewDetails(occurrence.id)}
          className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
          title="Ver Detalhes"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        </button>
        {!isCompleted && (
          <button
            onClick={() => onComplete(occurrence.id)}
            className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
            title="Marcar como Concluída"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
        )}
        <button
          onClick={() => onEdit(occurrence.id)}
          className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
          title="Editar Tarefa"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
        <button
          onClick={() => onDelete(occurrence.id)}
          className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
          title="Excluir Tarefa"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
