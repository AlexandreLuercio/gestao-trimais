import React, { useState, useMemo, useEffect } from 'react';
import { Occurrence, Area, Status, User, Role, getNormalizedStatus } from '../types';
import { subMonths, startOfDay, endOfDay, parseISO } from 'date-fns';
import { GoogleGenAI } from '@google/generative-ai'; // <-- Corrigido aqui
import FilteredOccurrencesModal from './FilteredOccurrencesModal';
import ExportOptionsModal from './ExportOptionsModal';


interface DashboardProps {
  occurrences: Occurrence[];
  users: User[];
  currentUser: User;
  onMoveToTrash?: (id: string) => void;
}

type Period = '1m' | '3m' | '6m' | '12m' | 'all' | 'custom';

interface AreaSummary {
  area: Area;
  totalCount: number;
  percentageOfAll: number;
  statusCounts: Record<Status, number>;
  statusPercentages: Record<Status, number>;
  efficiencyScore: number;
}

type AreaStats = {
    totalCount: number;
    statusCounts: Record<Status, number>;
};

const Dashboard: React.FC<DashboardProps> = ({ occurrences, users, currentUser, onMoveToTrash }) => {
  const [period, setPeriod] = useState<Period>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [aiSummaries, setAiSummaries] = useState<Record<Area, string>>({} as Record<Area, string>);
  const [loadingAi, setLoadingAi] = useState<Record<Area, boolean>>({} as Record<Area, boolean>);
  const [modalFilters, setModalFilters] = useState<{ area?: Area; status: Status } | null>(null);
  
  // Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [dataToExport, setDataToExport] = useState<Occurrence[]>([]);
  
  // State to determine if the modal should filter by current user
  const [limitModalToUser, setLimitModalToUser] = useState(false);

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      setStartDate('');
      setEndDate('');
    }
  };

  const filteredOccurrences = useMemo(() => {
    let start: Date | null = null;
    let end: Date | null = new Date();

    switch (period) {
      case '1m': start = subMonths(end, 1); break;
      case '3m': start = subMonths(end, 3); break;
      case '6m': start = subMonths(end, 6); break;
      case '12m': start = subMonths(end, 12); break;
      case 'custom':
        start = startDate ? startOfDay(parseISO(startDate)) : null;
        end = endDate ? endOfDay(parseISO(endDate)) : null;
        break;
      case 'all': default:
        start = null; end = null;
    }

    if (!start && !end) return occurrences;
    return occurrences.filter(occ => {
      try {
        const occDate = parseISO(occ.timestamp);
        const isAfterStart = start ? occDate >= start : true;
        const isBeforeEnd = end ? occDate <= end : true;
        return isAfterStart && isBeforeEnd;
      } catch (e) {
        return false; // Ignore occurrences with invalid timestamps
      }
    });
  }, [occurrences, period, startDate, endDate]);
  
  useEffect(() => {
    setAiSummaries({} as Record<Area, string>);
  }, [filteredOccurrences]);
  
  const statsByArea = useMemo(() => {
    const initialStats: Record<Area, AreaStats> = Object.fromEntries(
        Object.values(Area).map(area => [
            area,
            {
                totalCount: 0,
                statusCounts: {
                    [Status.Aberto]: 0,
                    [Status.EmAndamento]: 0,
                    [Status.EmAtraso]: 0,
                    [Status.Concluido]: 0,
                },
            }
        ])
    ) as Record<Area, AreaStats>;

    for (const occ of filteredOccurrences) {
        const normalizedStatus = getNormalizedStatus(occ.status);
        if (occ.area && initialStats[occ.area] && normalizedStatus) {
            initialStats[occ.area].totalCount++;
            // Ensure the key exists in statusCounts before incrementing
            if (initialStats[occ.area].statusCounts[normalizedStatus] !== undefined) {
                initialStats[occ.area].statusCounts[normalizedStatus]++;
            }
        }
    }
    return initialStats;
  }, [filteredOccurrences]);


  const geralSummary = useMemo(() => {
    const initialSummary = {
        total: 0,
        statusCounts: {
            [Status.Aberto]: 0,
            [Status.EmAndamento]: 0,
            [Status.EmAtraso]: 0,
            [Status.Concluido]: 0,
        },
    };

    return Object.values(statsByArea).reduce<typeof initialSummary>((acc, areaStats: AreaStats) => {
        acc.total += areaStats.totalCount;
        acc.statusCounts[Status.Aberto] += areaStats.statusCounts[Status.Aberto];
        acc.statusCounts[Status.EmAndamento] += areaStats.statusCounts[Status.EmAndamento];
        acc.statusCounts[Status.EmAtraso] += areaStats.statusCounts[Status.EmAtraso];
        acc.statusCounts[Status.Concluido] += areaStats.statusCounts[Status.Concluido];
        return acc;
    }, initialSummary);
  }, [statsByArea]);

  const rankedSummaryData = useMemo(() => {
    const totalCountInPeriod = filteredOccurrences.length;
    
    if (totalCountInPeriod === 0) {
        return [];
    }
    
    const summaries: AreaSummary[] = Object.entries(statsByArea).map(([area, stats]) => {
      const areaStats = stats as AreaStats;
      const { totalCount: areaCount, statusCounts } = areaStats;
      const efficiencyScore = (statusCounts[Status.Concluido] * 2) + (statusCounts[Status.EmAndamento] * 1) - (statusCounts[Status.EmAtraso] * 3) - (statusCounts[Status.Aberto] * 1);
      
      return {
        area: area as Area,
        totalCount: areaCount,
        percentageOfAll: totalCountInPeriod > 0 ? (areaCount / totalCountInPeriod) * 100 : 0,
        statusCounts,
        efficiencyScore,
        statusPercentages: {
          [Status.Aberto]: areaCount > 0 ? (statusCounts[Status.Aberto] / areaCount) * 100 : 0,
          [Status.EmAndamento]: areaCount > 0 ? (statusCounts[Status.EmAndamento] / areaCount) * 100 : 0,
          [Status.EmAtraso]: areaCount > 0 ? (statusCounts[Status.EmAtraso] / areaCount) * 100 : 0,
          [Status.Concluido]: areaCount > 0 ? (statusCounts[Status.Concluido] / areaCount) * 100 : 0,
        },
      };
    });

    return summaries.sort((a, b) => b.totalCount - a.totalCount);
  }, [statsByArea, filteredOccurrences.length]);

  // HELPER: Determine if current user can view details for a specific context
  const canViewDetails = (area?: Area) => {
      // Admin and Diretor see everything
      if (currentUser.role === Role.Admin || currentUser.role === Role.Diretor) return true;
      
      // Gestor logic
      if (currentUser.role === Role.Gestor) {
          // General Overview (area undefined) -> No Access
          if (!area) return false;
          
          // Specific Area -> Only if in allowedAreas
          const allowed = currentUser.allowedAreas || [];
          return allowed.includes(area);
      }
      
      // Default (e.g. Monitor) - Assume true for now as they are read-only anyway
      return true;
  };
  
  // Click handler logic
  const handleAreaClick = (area: Area, status: Status) => {
      if (statsByArea[area].statusCounts[status] === 0) return;
      
      // Permission Check
      if (!canViewDetails(area)) return;

      setLimitModalToUser(false);
      setModalFilters({ area, status });
  };

  const handleGeneralClick = (status: Status) => {
      if (geralSummary.statusCounts[status] === 0) return;

      // Permission Check
      if (!canViewDetails()) return;

      setLimitModalToUser(false); 
      setModalFilters({ status });
  };

  const handleOpenExportModal = () => {
      let filteredData = [...filteredOccurrences];

      // SILO LOGIC FOR EXPORT
      if (currentUser.role === Role.Gestor) {
          const allowed = currentUser.allowedAreas || [];
          filteredData = filteredData.filter(occ => 
              allowed.includes(occ.area) || occ.createdBy === currentUser.uid
          );
      }
      if (currentUser.role === Role.Monitor) {
          filteredData = filteredData.filter(occ => occ.createdBy === currentUser.uid);
      }
      
      if (filteredData.length === 0) {
          alert("Não há dados disponíveis para exportar neste período.");
          return;
      }

      setDataToExport(filteredData);
      setIsExportModalOpen(true);
  };


  const handleGenerateSummary = async (area: Area) => {
    setLoadingAi(prev => ({ ...prev, [area]: true }));
    setAiSummaries(prev => ({...prev, [area]: ''}));

    const occurrencesForArea = filteredOccurrences.filter(o => o.area === area);
    const usersInArea = users.filter(u => u.allowedAreas?.includes(area));
    if (occurrencesForArea.length === 0) {
      setAiSummaries(prev => ({...prev, [area]: 'Não há dados suficientes para análise nesta área e período.'}));
      setLoadingAi(prev => ({ ...prev, [area]: false }));
      return;
    }

    const prompt = `
      Você é um assistente de gestão para o shopping center Trimais Places. Analise os seguintes dados da área de ${area} e forneça um relatório conciso em português do Brasil, usando markdown para formatação. O relatório deve conter:
      1.  **Resumo da Situação:** Uma visão geral do estado atual da área.
      2.  **Prioridades Urgentes:** Quais tarefas (use o título) precisam de atenção imediata e por quê (ex: muito tempo em aberto, em atraso, alta complexidade).
      3.  **Análise de Produtividade da Equipe:** Com base nos gestores listados, quem está com mais tarefas e como está o andamento geral.
      4.  **Problemas Recorrentes:** Identifique padrões nos títulos e descrições das tarefas para apontar os tipos de problemas mais comuns.

      **Dados das Tarefas (JSON):**
      ${JSON.stringify(occurrencesForArea.map(({id, photos, audioUrl, ...occ}) => occ ))}

      **Membros da Equipe na Área (JSON):**
      ${JSON.stringify(usersInArea)}

      Seja direto, objetivo e foque em insights que ajudem o gestor da área a tomar decisões.
    `;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      setAiSummaries(prev => ({ ...prev, [area]: response.text || "Não foi possível gerar a análise." }));
    } catch (error) {
      console.error("Erro na análise da IA:", error);
      setAiSummaries(prev => ({ ...prev, [area]: 'Ocorreu um erro ao gerar a análise. Tente novamente.' }));
    } finally {
      setLoadingAi(prev => ({ ...prev, [area]: false }));
    }
  };
  
  const periodButtons: { label: string; value: Period }[] = [
    { label: '1 Mês', value: '1m' }, { label: '3 Meses', value: '3m' },
    { label: '6 Meses', value: '6m' }, { label: '12 Meses', value: '12m' },
    { label: 'Todo o Período', value: 'all' },
  ];

  const statusColors: Record<Status, string> = {
    [Status.Aberto]: 'bg-blue-100 text-blue-800', [Status.EmAndamento]: 'bg-yellow-100 text-yellow-800',
    [Status.EmAtraso]: 'bg-red-100 text-red-800', [Status.Concluido]: 'bg-green-100 text-green-800',
  };

  const overviewStatusClasses: Record<Status, string> = {
    [Status.Aberto]: 'bg-blue-400/80 hover:bg-blue-300 text-white',
    [Status.EmAndamento]: 'bg-yellow-400/80 hover:bg-yellow-300 text-black',
    [Status.EmAtraso]: 'bg-red-500/80 hover:bg-red-400 text-white',
    [Status.Concluido]: 'bg-green-500/80 hover:bg-green-400 text-white',
  };
  
  const rankColors = ['bg-amber-400', 'bg-slate-400', 'bg-amber-600'];

  // Check general permission once
  const generalAccess = canViewDetails();

  return (
    <div className="bg-white rounded-lg shadow-2xl p-6 md:p-8 w-full">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <h3 className="text-2xl font-bold text-trimais-blue">Painel de Controle e Eficiência</h3>
          <button 
            onClick={handleOpenExportModal}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md font-bold hover:bg-green-700 transition-colors shadow-sm"
            title="Baixar relatório PDF ou Excel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar Relatório
          </button>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm font-medium text-gray-700 mr-2">Período:</span>
          {periodButtons.map(btn => (
             <button key={btn.value} onClick={() => handlePeriodChange(btn.value)} className={`px-3 py-1 text-sm rounded-md transition-colors ${period === btn.value ? 'bg-trimais-blue text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
              {btn.label}
            </button>
          ))}
           <button onClick={() => handlePeriodChange('custom')} className={`px-3 py-1 text-sm rounded-md transition-colors ${period === 'custom' ? 'bg-trimais-blue text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            Personalizado
          </button>
        </div>
        {period === 'custom' && (
          <div className="grid sm:grid-cols-2 gap-4 animate-fade-in-up">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Início</label>
              <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-trimais-blue focus:border-trimais-blue" />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">Fim</label>
              <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-trimais-blue focus:border-trimais-blue" />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-8">
        <div className="border-2 border-trimais-gold rounded-lg shadow-lg p-4 sm:p-6 bg-gradient-to-br from-trimais-blue to-blue-900 text-white">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                <h4 className="text-xl font-bold text-white">Visão Geral do Shopping</h4>
                <div className="text-right">
                    <p className="font-bold text-3xl">{geralSummary.total}</p>
                    <p className="text-xs text-trimais-gold uppercase tracking-wider">Total de Tarefas</p>
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {Object.values(Status).map(status => {
                    const count = geralSummary.statusCounts[status];
                    const total = geralSummary.total;
                    const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : '0';
                    const hasItems = count > 0;
                    const clickable = hasItems && generalAccess;
                    
                    return (
                        <button 
                            key={status}
                            onClick={() => handleGeneralClick(status)}
                            disabled={!clickable}
                            className={`p-3 rounded-lg w-full text-center transition-all duration-200 ${overviewStatusClasses[status]} ${clickable ? 'hover:scale-105 hover:shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-trimais-gold' : 'cursor-default opacity-90'}`}
                            style={{ cursor: clickable ? 'pointer' : 'default' }}
                        >
                            <p className="text-sm font-semibold">{status}</p>
                            <p className="text-xl font-bold">
                                {count}
                                <span className="text-sm font-medium ml-1 opacity-90">({percentage}%)</span>
                            </p>
                        </button>
                    );
                })}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {rankedSummaryData.map((summary, index) => {
              const areaAccess = canViewDetails(summary.area);
              return (
                <div key={summary.area} className="bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col transition-all duration-300 hover:scale-[1.01]">
                <div className="p-4 border-b bg-gray-50 rounded-t-lg flex justify-between items-center gap-2">
                    <div className="flex items-center gap-3">
                        <span className={`flex-shrink-0 w-8 h-8 rounded-full text-white font-bold text-lg flex items-center justify-center ${rankColors[index] || 'bg-gray-400'}`}>
                        {index + 1}º
                        </span>
                        <h4 className="text-lg font-bold text-trimais-blue">{summary.area}</h4>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-2xl text-gray-800">{summary.totalCount}</p>
                        <p className="text-xs text-gray-500">{summary.percentageOfAll.toFixed(1)}% do total</p>
                    </div>
                </div>
                
                <div className="p-4 flex-grow bg-white">
                    {/* FORCED 4 COLUMN GRID ON ALL SCREENS LARGER THAN XS TO MATCH OVERVIEW */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                    {Object.values(Status).map(status => {
                        const hasItems = summary.statusCounts[status] > 0;
                        const clickable = hasItems && areaAccess;
                        const percentage = summary.totalCount > 0 ? summary.statusPercentages[status].toFixed(0) : '0';
                        
                        return (
                            <button 
                            key={status}
                            onClick={() => handleAreaClick(summary.area, status)}
                            disabled={!clickable}
                            className={`p-2 rounded-md ${statusColors[status]} w-full text-center transition-all duration-200 ${clickable ? 'hover:scale-105 hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-trimais-blue' : 'cursor-default opacity-80'}`}
                            style={{ cursor: clickable ? 'pointer' : 'default' }}
                            >
                            <p className="text-[10px] uppercase font-bold tracking-wide opacity-80 mb-0.5">{status}</p>
                            <p className="text-lg font-extrabold flex items-center justify-center gap-1">
                                {summary.statusCounts[status]}
                                <span className="text-xs font-medium opacity-100">({percentage}%)</span>
                            </p>
                            </button>
                        );
                    })}
                    </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-b-lg mt-auto border-t border-gray-100">
                    <button 
                    onClick={() => handleGenerateSummary(summary.area)}
                    disabled={loadingAi[summary.area]}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-trimais-gold rounded-md shadow-sm hover:bg-yellow-600 disabled:bg-gray-400 transition-colors"
                    >
                    {loadingAi[summary.area] ? 'Analisando...' : 'Analisar com IA'}
                    </button>
                    {loadingAi[summary.area] && <div className="mt-2 text-sm text-gray-600">Aguarde, a inteligência artificial está processando os dados...</div>}
                    {aiSummaries[summary.area] && (
                    <div className="prose prose-sm max-w-none mt-4 p-4 bg-white rounded-md border border-gray-200" dangerouslySetInnerHTML={{ __html: aiSummaries[summary.area].replace(/\n/g, '<br />') }}></div>
                    )}
                </div>
                </div>
              );
          })}
        </div>

        {filteredOccurrences.length === 0 && (
            <div className="text-center py-10 text-gray-500">
                <p>Nenhuma tarefa encontrada para o período selecionado.</p>
            </div>
        )}
      </div>

      {modalFilters && (
        <FilteredOccurrencesModal
          occurrences={filteredOccurrences}
          users={users}
          currentUser={currentUser}
          filters={modalFilters}
          onClose={() => setModalFilters(null)}
          onMoveToTrash={onMoveToTrash}
          limitToUser={limitModalToUser}
        />
      )}

      <ExportOptionsModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        data={dataToExport}
        reportTitle="Relatório Geral do Painel"
      />

    </div>
  );
};

export default Dashboard;
