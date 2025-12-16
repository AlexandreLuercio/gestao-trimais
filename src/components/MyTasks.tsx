
import React, { useState, useMemo } from 'react';
import { Occurrence, User, Status, Role, getNormalizedStatus, Complexity, Area } from '../types';
import TaskCard from './TaskCard';
import ExportOptionsModal from './ExportOptionsModal';
import { format, parseISO } from 'date-fns';

interface MyTasksProps {
  occurrences: Occurrence[];
  currentUser: User;
  users: User[];
  updateOccurrence: (occurrenceId: string, updates: Partial<Omit<Occurrence, 'id'>>) => void;
  onMoveToTrash?: (id: string) => void;
}

type SortOption = 'urgency' | 'newest' | 'oldest' | 'deadline';

const MyTasks: React.FC<MyTasksProps> = ({ occurrences, currentUser, users, updateOccurrence, onMoveToTrash }) => {
  // Tab state for Gestores (and Admins with Areas)
  const [activeTab, setActiveTab] = useState<'todo' | 'reported'>('todo');
  
  // Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [dataToExport, setDataToExport] = useState<Occurrence[]>([]);
  const [exportTitle, setExportTitle] = useState('');

  // --- FILTERS STATE ---
  const [filterText, setFilterText] = useState('');
  const [filterArea, setFilterArea] = useState<string>('all'); // 'all' or specific Area
  const [filterComplexity, setFilterComplexity] = useState<string>('all'); // 'all', 'Simples', 'Média', 'Alta', 'none'
  const [sortBy, setSortBy] = useState<SortOption>('urgency');

  const statusOrder = {
    [Status.EmAtraso]: 1,
    [Status.Aberto]: 2,
    [Status.EmAndamento]: 3,
    [Status.Concluido]: 4,
  };

  // --- PROCESSING LOGIC ---
  const processTasks = (list: Occurrence[]) => {
      let processed = [...list];

      // 1. Filter by Text (Title, ID, Creator)
      if (filterText) {
          const lowerText = filterText.toLowerCase();
          processed = processed.filter(o => 
             o.title.toLowerCase().includes(lowerText) ||
             o.uniqueId?.toLowerCase().includes(lowerText) ||
             o.creatorName.toLowerCase().includes(lowerText) ||
             o.description.toLowerCase().includes(lowerText)
          );
      }

      // 2. Filter by Area (Multi-Area Support)
      if (filterArea !== 'all') {
          processed = processed.filter(o => o.area === filterArea);
      }

      // 3. Filter by Complexity
      if (filterComplexity !== 'all') {
          if (filterComplexity === 'none') {
              processed = processed.filter(o => !o.complexity);
          } else {
              processed = processed.filter(o => o.complexity === filterComplexity);
          }
      }

      // 4. Sorting
      return processed.sort((a, b) => {
          // Sort Logic
          switch (sortBy) {
              case 'newest':
                  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
              
              case 'oldest':
                   return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();

              case 'deadline':
                   // Items with deadline come first, sorted by closest date
                   const dateA = a.estimatedCompletion ? new Date(a.estimatedCompletion).getTime() : 9999999999999;
                   const dateB = b.estimatedCompletion ? new Date(b.estimatedCompletion).getTime() : 9999999999999;
                   return dateA - dateB;

              case 'urgency':
              default:
                  // 1. Urgency Flag
                  if (a.isUrgent && !b.isUrgent) return -1;
                  if (!a.isUrgent && b.isUrgent) return 1;
                  
                  // 2. Status Priority
                  const statusA = getNormalizedStatus(a.status);
                  const statusB = getNormalizedStatus(b.status);
                  const statusDiff = statusOrder[statusA] - statusOrder[statusB];
                  if (statusDiff !== 0) return statusDiff;

                  // 3. Date (Newest first)
                  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          }
      });
  };


  // 1. Raw Lists
  const rawAreaOccurrences = useMemo(() => {
    // If User is Gestor OR Admin with assigned areas, show tasks for those areas
    const hasAreas = currentUser.allowedAreas && currentUser.allowedAreas.length > 0;
    
    if (currentUser.role === Role.Gestor || (currentUser.role === Role.Admin && hasAreas)) {
      const allowed = currentUser.allowedAreas || [];
      return occurrences.filter(occ => allowed.includes(occ.area));
    }
    return [];
  }, [occurrences, currentUser]);

  const rawReportedOccurrences = useMemo(() => {
      // Logic for Gestor/Admin with Areas: Show tasks created by me that represent requests to OTHER areas
      const hasAreas = currentUser.allowedAreas && currentUser.allowedAreas.length > 0;

      if (currentUser.role === Role.Gestor || (currentUser.role === Role.Admin && hasAreas)) {
           const allowed = currentUser.allowedAreas || [];
           return occurrences.filter(occ => occ.createdBy === currentUser.uid && !allowed.includes(occ.area));
      }
      
      // For Admin without Areas / Director / Monitor: Show everything created by them
      return occurrences.filter(occ => occ.createdBy === currentUser.uid);
  }, [occurrences, currentUser]);

  // 2. Processed Lists (Filtered & Sorted)
  const areaOccurrences = useMemo(() => processTasks(rawAreaOccurrences), [rawAreaOccurrences, filterText, filterArea, filterComplexity, sortBy]);
  const reportedOccurrences = useMemo(() => processTasks(rawReportedOccurrences), [rawReportedOccurrences, filterText, filterArea, filterComplexity, sortBy]);


  const handleOpenExportModal = () => {
      let listToExport: Occurrence[] = [];
      let title = '';

      // Determine view type based on role/areas
      const hasAreas = currentUser.allowedAreas && currentUser.allowedAreas.length > 0;
      const isOperatingAsGestor = currentUser.role === Role.Gestor || (currentUser.role === Role.Admin && hasAreas);

      if (isOperatingAsGestor) {
          if (activeTab === 'todo') {
              listToExport = areaOccurrences;
              title = `Tarefas Para Resolver - ${currentUser.allowedAreas?.join(', ')}`;
          } else {
              listToExport = reportedOccurrences;
              title = `Minhas Solicitações - ${currentUser.name}`;
          }
      } else {
          listToExport = reportedOccurrences;
          title = `Histórico de Reportes - ${currentUser.name}`;
      }

      if (listToExport.length === 0) {
          alert("Não há dados visíveis nesta lista para exportar (verifique seus filtros).");
          return;
      }

      setDataToExport(listToExport);
      setExportTitle(title);
      setIsExportModalOpen(true);
  };

  // --- RENDER HELPERS ---

  const renderFiltersBar = () => (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in shadow-sm">
          
          {/* SEARCH */}
          <div className="relative">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Busca Rápida</label>
              <div className="relative">
                <input 
                    type="text" 
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Título, Solicitante ou ID..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-trimais-blue focus:border-trimais-blue"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
          </div>

          {/* AREA FILTER (Only if user has multiple areas) */}
          {currentUser.allowedAreas && currentUser.allowedAreas.length > 1 && (
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Filtrar por Área</label>
                <select 
                    value={filterArea} 
                    onChange={(e) => setFilterArea(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-trimais-blue focus:border-trimais-blue bg-white"
                >
                    <option value="all">Todas as Áreas</option>
                    {currentUser.allowedAreas.map(area => (
                        <option key={area} value={area}>{area}</option>
                    ))}
                </select>
             </div>
          )}

          {/* COMPLEXITY FILTER */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Complexidade</label>
            <select 
                value={filterComplexity} 
                onChange={(e) => setFilterComplexity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-trimais-blue focus:border-trimais-blue bg-white"
            >
                <option value="all">Todas</option>
                <option value={Complexity.Simples}>Simples</option>
                <option value={Complexity.Media}>Média</option>
                <option value={Complexity.Alta}>Alta</option>
                <option value="none">Não Classificada</option>
            </select>
          </div>

          {/* SORTING */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ordenação</label>
            <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-trimais-blue focus:border-trimais-blue bg-white"
            >
                <option value="urgency">Urgência e Status (Padrão)</option>
                <option value="deadline">Prazo (Mais Próximo)</option>
                <option value="newest">Data de Criação (Recente)</option>
                <option value="oldest">Data de Criação (Antiga)</option>
            </select>
          </div>
      </div>
  );

  const renderGestorView = () => {
      return (
          <div>
              <div className="flex space-x-4 border-b border-gray-300 mb-6 overflow-x-auto">
                  <button 
                    className={`py-2 px-4 font-medium focus:outline-none whitespace-nowrap ${activeTab === 'todo' ? 'border-b-2 border-trimais-blue text-trimais-blue' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('todo')}
                  >
                      Para Resolver ({rawAreaOccurrences.length})
                  </button>
                  <button 
                    className={`py-2 px-4 font-medium focus:outline-none whitespace-nowrap ${activeTab === 'reported' ? 'border-b-2 border-trimais-blue text-trimais-blue' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('reported')}
                  >
                      Minhas Solicitações ({rawReportedOccurrences.length})
                  </button>
              </div>

              {renderFiltersBar()}

              {activeTab === 'todo' ? (
                  areaOccurrences.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in-up">
                        {areaOccurrences.map(occurrence => (
                            <TaskCard 
                                key={occurrence.id}
                                occurrence={occurrence}
                                updateOccurrence={updateOccurrence}
                                onMoveToTrash={onMoveToTrash}
                                currentUser={currentUser}
                                users={users}
                            />
                        ))}
                    </div>
                  ) : <NoTasksMessage text={rawAreaOccurrences.length > 0 ? "Nenhuma tarefa encontrada com esses filtros." : "Você está em dia com suas áreas!"} />
              ) : (
                  reportedOccurrences.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in-up">
                        {reportedOccurrences.map(occurrence => (
                            <TaskCard 
                                key={occurrence.id}
                                occurrence={occurrence}
                                updateOccurrence={updateOccurrence}
                                onMoveToTrash={onMoveToTrash}
                                currentUser={currentUser}
                                users={users}
                            />
                        ))}
                    </div>
                  ) : <NoTasksMessage text={rawReportedOccurrences.length > 0 ? "Nenhuma solicitação encontrada com esses filtros." : "Você não abriu solicitações para outras áreas."} />
              )}
          </div>
      )
  }

  const renderMonitorView = () => {
      return (
          <div>
               <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">Acompanhamento de Solicitações</h3>
               </div>
               
               {renderFiltersBar()}

               {reportedOccurrences.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in-up">
                        {reportedOccurrences.map(occurrence => (
                            <TaskCard 
                                key={occurrence.id}
                                occurrence={occurrence}
                                updateOccurrence={updateOccurrence}
                                currentUser={currentUser}
                                users={users}
                            />
                        ))}
                    </div>
                  ) : <NoTasksMessage text={rawReportedOccurrences.length > 0 ? "Nenhuma tarefa encontrada com esses filtros." : "Nenhuma tarefa relatada por você."} />
               }
          </div>
      )
  }

  // Determine if User should see Gestor View or Monitor View
  const hasAreas = currentUser.allowedAreas && currentUser.allowedAreas.length > 0;
  const showGestorView = currentUser.role === Role.Gestor || (currentUser.role === Role.Admin && hasAreas);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-trimais-blue">
            Minhas Tarefas - <span className="text-trimais-gold">{currentUser.role}</span>
            </h2>
            {showGestorView && (
                <p className="text-sm text-gray-500 mt-1">
                    Responsável por: {currentUser.allowedAreas?.join(', ') || 'Nenhuma'}
                </p>
            )}
        </div>
        <button 
            onClick={handleOpenExportModal}
            className="flex items-center gap-2 text-sm bg-green-600 text-white px-3 py-2 rounded-md font-bold hover:bg-green-700 transition-colors shadow-sm"
            title="Baixar lista em PDF ou Excel"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar Lista Atual
        </button>
      </div>
      
      {showGestorView ? renderGestorView() : renderMonitorView()}

      <ExportOptionsModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        data={dataToExport}
        reportTitle={exportTitle}
      />
    </div>
  );
};

const NoTasksMessage: React.FC<{text: string}> = ({ text }) => (
  <div className="text-center py-16 bg-white rounded-lg shadow-lg">
    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <h3 className="mt-2 text-sm font-medium text-gray-900">Lista Vazia</h3>
    <p className="mt-1 text-sm text-gray-500">{text}</p>
  </div>
);

export default MyTasks;
