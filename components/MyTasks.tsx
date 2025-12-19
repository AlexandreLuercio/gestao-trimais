import React, { useState, useMemo } from 'react';
import { Occurrence, User, Status, Role, getNormalizedStatus, Area } from '../types';
import TaskCard from './TaskCard';
import ExportOptionsModal from './ExportOptionsModal';

interface MyTasksProps {
  occurrences: Occurrence[];
  currentUser: User;
  users: User[];
  updateOccurrence: (occurrenceId: string, updates: Partial<Omit<Occurrence, 'id'>>) => void;
  onMoveToTrash?: (id: string) => void;
}

const MyTasks: React.FC<MyTasksProps> = ({ occurrences, currentUser, users, updateOccurrence, onMoveToTrash }) => {
  const [activeTab, setActiveTab] = useState<'todo' | 'reported'>('todo');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [dataToExport, setDataToExport] = useState<Occurrence[]>([]);
  const [exportTitle, setExportTitle] = useState('');

  const safeOccurrences = occurrences || [];
  const safeUsers = users || [];

  const rawAreaOccurrences = useMemo(() => {
    if (!currentUser) return [];
    const hasAreas = currentUser.allowedAreas && currentUser.allowedAreas.length > 0;
    if (currentUser.role === Role.Gestor || (currentUser.role === Role.Admin && hasAreas)) {
      const allowed = currentUser.allowedAreas || [];
      return safeOccurrences.filter(occ => allowed.includes(occ.area));
    }
    return [];
  }, [safeOccurrences, currentUser]);

  const rawReportedOccurrences = useMemo(() => {
      if (!currentUser) return [];
      const hasAreas = currentUser.allowedAreas && currentUser.allowedAreas.length > 0;
      if (currentUser.role === Role.Gestor || (currentUser.role === Role.Admin && hasAreas)) {
           const allowed = currentUser.allowedAreas || [];
           return safeOccurrences.filter(occ => occ.createdBy === currentUser.uid && !allowed.includes(occ.area));
      }
      return safeOccurrences.filter(occ => occ.createdBy === currentUser.uid);
  }, [safeOccurrences, currentUser]);

  const handleOpenExportModal = () => {
      let listToExport: Occurrence[] = activeTab === 'todo' ? rawAreaOccurrences : rawReportedOccurrences;
      if (listToExport.length === 0) {
          alert("Nenhuma tarefa para exportar nesta lista.");
          return;
      }
      setDataToExport(listToExport);
      setExportTitle(activeTab === 'todo' ? "Tarefas para Resolver" : "Minhas Solicitações");
      setIsExportModalOpen(true);
  };

  if (!currentUser) return <div className="p-8 text-center bg-white rounded shadow">Carregando perfil...</div>;

  const showGestorView = currentUser.role === Role.Gestor || (currentUser.role === Role.Admin && (currentUser.allowedAreas?.length || 0) > 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h2 className="text-2xl font-bold text-trimais-blue">Minhas Tarefas</h2></div>
        <button onClick={handleOpenExportModal} className="bg-green-600 text-white px-4 py-2 rounded-md font-bold text-sm hover:bg-green-700 transition-colors">Exportar Lista</button>
      </div>
      
      {showGestorView ? (
          <div>
              <div className="flex space-x-4 border-b mb-6 overflow-x-auto bg-white rounded-t p-1">
                  <button className={`py-3 px-6 whitespace-nowrap font-bold transition-all ${activeTab === 'todo' ? 'border-b-4 border-trimais-gold text-trimais-blue' : 'text-gray-400'}`} onClick={() => setActiveTab('todo')}>Para Resolver ({rawAreaOccurrences.length})</button>
                  <button className={`py-3 px-6 whitespace-nowrap font-bold transition-all ${activeTab === 'reported' ? 'border-b-4 border-trimais-gold text-trimais-blue' : 'text-gray-400'}`} onClick={() => setActiveTab('reported')}>Minhas Solicitações ({rawReportedOccurrences.length})</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                  {(activeTab === 'todo' ? rawAreaOccurrences : rawReportedOccurrences).map(occ => (
                      <TaskCard key={occ.id} occurrence={occ} updateOccurrence={updateOccurrence} onMoveToTrash={onMoveToTrash} currentUser={currentUser} users={safeUsers} />
                  ))}
                  {(activeTab === 'todo' ? rawAreaOccurrences : rawReportedOccurrences).length === 0 && (
                      <div className="col-span-full py-20 text-center bg-white/50 border-2 border-dashed rounded-lg text-gray-400">Nenhuma tarefa encontrada.</div>
                  )}
              </div>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {rawReportedOccurrences.map(occ => (
                  <TaskCard key={occ.id} occurrence={occ} updateOccurrence={updateOccurrence} currentUser={currentUser} users={safeUsers} />
              ))}
              {rawReportedOccurrences.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white/50 border-2 border-dashed rounded-lg text-gray-400">Nenhuma solicitação criada por você.</div>
              )}
          </div>
      )}
      <ExportOptionsModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} data={dataToExport} reportTitle={exportTitle} />
    </div>
  );
};

export default MyTasks;
