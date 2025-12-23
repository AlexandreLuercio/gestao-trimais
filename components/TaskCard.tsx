import React, { useState } from 'react';
import { Occurrence, Status, User, Role, Complexity, OccurrenceUpdate, DeadlineHistory, getNormalizedStatus } from '../types';
import { format, parseISO, add, endOfDay } from 'date-fns';

interface TaskCardProps {
  occurrence: Occurrence;
  updateOccurrence: (occurrenceId: string, updates: Partial<Omit<Occurrence, 'id'>>) => void;
  onMoveToTrash?: (id: string) => void;
  currentUser: User;
  users?: User[];
}

const TaskCard: React.FC<TaskCardProps> = ({ occurrence, updateOccurrence, onMoveToTrash, currentUser, users }) => {
  const isAreaManager = currentUser?.role === Role.Admin || (currentUser?.role === Role.Gestor && currentUser?.allowedAreas?.includes(occurrence.area));
  const isCreator = currentUser?.uid === occurrence.createdBy;
  const canEditDetails = isAreaManager;
  const canDelete = (isAreaManager || isCreator) && !!onMoveToTrash;

  const normalizedStatus = getNormalizedStatus(occurrence.status);
  const [newUpdate, setNewUpdate] = useState('');
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [complexity, setComplexity] = useState<Complexity | undefined>(occurrence.complexity);
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState('');
  const [estimatedCompletionTime, setEstimatedCompletionTime] = useState('');

  const getCreatorSignature = () => {
      const safeUsersList = users || [];
      let creator = safeUsersList.find(u => u.uid === occurrence.createdBy || u.id === occurrence.createdBy);
      let targetName = occurrence.creatorName;
      if (!creator && targetName) creator = safeUsersList.find(u => (u.name || '').trim().toLowerCase() === targetName.trim().toLowerCase());
      const displayName = creator?.name || targetName || 'Colaborador';
      let details = creator ? `(${creator.role}${creator.allowedAreas?.length ? ` - ${creator.allowedAreas.join(', ')}` : ''})` : '(Ex-colaborador)';
      return { name: displayName, details };
  }

  const handleSelectComplexity = (sel: Complexity) => {
    setComplexity(sel);
    let d: Date = new Date();
    if (sel === Complexity.Simples) d = add(d, { days: 1 });
    else if (sel === Complexity.Media) d = add(d, { days: 3 });
    else if (sel === Complexity.Alta) d = add(d, { days: 7 });
    setEstimatedCompletionDate(format(d, 'yyyy-MM-dd'));
    if (occurrence.isUrgent) setEstimatedCompletionTime(format(d, 'HH:mm'));
  };

  const handleCompleteTask = () => {
    const log: OccurrenceUpdate = { text: `Finalizado por ${currentUser.name}.`, timestamp: new Date().toISOString(), authorName: currentUser.name };
    updateOccurrence(occurrence.id, { status: Status.Concluido, updatesLog: [...(occurrence.updatesLog || []), log] });
  };

  const statusConfig = { 
    [Status.Aberto]: { bgColor: 'bg-blue-50', borderColor: 'border-blue-500', textColor: 'text-blue-800' }, 
    [Status.EmAndamento]: { bgColor: 'bg-yellow-50', borderColor: 'border-yellow-500', textColor: 'text-yellow-800' }, 
    [Status.EmAtraso]: { bgColor: 'bg-red-50', borderColor: 'border-red-500', textColor: 'text-red-800' }, 
    [Status.Concluido]: { bgColor: 'bg-green-50', borderColor: 'border-green-500', textColor: 'text-green-800' } 
  };
  
  const config = statusConfig[normalizedStatus] || statusConfig[Status.Aberto];
  const urgencyBorder = occurrence.isUrgent ? "border-red-600 border-4 animate-pulse shadow-lg" : `border-l-4 ${config.borderColor}`;

  return (
    <div className={`rounded-lg shadow-md ${config.bgColor} flex flex-col transition-transform duration-200 ${urgencyBorder}`}>
      <div className="flex justify-between items-center p-3 border-b bg-white/30">
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-trimais-blue">{occurrence.uniqueId}</span>
            {occurrence.isUrgent && <span className="text-xs font-bold text-red-600">⚠️ URGENTE</span>}
        </div>
        <div className="flex gap-2">
            {canDelete && <button onClick={() => onMoveToTrash?.(occurrence.id)} className="text-gray-400 hover:text-red-600">🗑️</button>}
        </div>
      </div>
      <div className="p-5 flex-grow">
          <h3 className="font-bold text-lg text-gray-800">{occurrence.title}</h3>
          <p className="text-sm text-gray-500">{occurrence.location}</p>
          <p className="text-sm text-gray-700 mt-4 line-clamp-3">{occurrence.description}</p>
      </div>
      <div className={`p-4 mt-auto rounded-b-lg ${config.bgColor} border-t ${config.borderColor}`}>
          {canEditDetails ? (
              normalizedStatus === Status.Aberto ? 
              <button onClick={() => handleSelectComplexity(Complexity.Simples)} className="w-full bg-trimais-blue text-white py-2 rounded font-bold">Iniciar Atendimento</button> : 
              normalizedStatus !== Status.Concluido ? 
              <button onClick={handleCompleteTask} className="w-full bg-green-600 text-white py-2 rounded font-bold">Finalizar Tarefa</button> :
              <p className="text-xs text-center font-bold text-green-700 uppercase">Tarefa Concluída</p>
          ) : <p className="text-xs text-center text-gray-500 italic">Visualização restrita à área</p>}
      </div>
    </div>
  );
};

export default TaskCard;