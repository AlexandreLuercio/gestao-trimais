import React, { useState, useMemo } from 'react';
import { Occurrence, Area, Status, User, Role, getNormalizedStatus } from '../types';
import { subMonths, startOfDay, endOfDay, parseISO } from 'date-fns';
import { GoogleGenAI } from '@google/genai';
import FilteredOccurrencesModal from './FilteredOccurrencesModal';
import ExportOptionsModal from './ExportOptionsModal';

interface DashboardProps {
  occurrences: Occurrence[];
  users: User[];
  currentUser: User;
  onMoveToTrash?: (id: string) => void;
}

type Period = '1m' | '3m' | '6m' | '12m' | 'all' | 'custom';

const Dashboard: React.FC<DashboardProps> = ({ occurrences, users, currentUser, onMoveToTrash }) => {
  const [period, setPeriod] = useState<Period>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [modalFilters, setModalFilters] = useState<{ area?: Area; status: Status } | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // PROTEÇÃO INICIAL
  const safeOccurrences = occurrences || [];
  const safeUsers = users || [];

  const filteredOccurrences = useMemo(() => {
    let start: Date | null = null;
    let end: Date | null = new Date();
    switch (period) {
      case '1m': start = subMonths(end, 1); break;
      case '3m': start = subMonths(end, 3); break;
      case 'custom':
        start = startDate ? startOfDay(parseISO(startDate)) : null;
        end = endDate ? endOfDay(parseISO(endDate)) : null;
        break;
      default: start = null; end = null;
    }
    
    return (safeOccurrences || []).filter(occ => {
      try {
        const occDate = parseISO(occ.timestamp);
        return (start ? occDate >= start : true) && (end ? occDate <= end : true);
      } catch (e) { return false; }
    });
  }, [safeOccurrences, period, startDate, endDate]);
  
  const statsByArea = useMemo(() => {
    const initialStats = Object.fromEntries(
        Object.values(Area).map(area => [area, { totalCount: 0, statusCounts: { [Status.Aberto]: 0, [Status.EmAndamento]: 0, [Status.EmAtraso]: 0, [Status.Concluido]: 0 } }])
    );
    
    (filteredOccurrences || []).forEach(occ => {
        const norm = getNormalizedStatus(occ.status);
        if (occ.area && initialStats[occ.area]) {
            initialStats[occ.area].totalCount++;
            initialStats[occ.area].statusCounts[norm]++;
        }
    });
    return initialStats;
  }, [filteredOccurrences]);

  const geralSummary = useMemo(() => {
    return Object.values(statsByArea || {}).reduce((acc, areaStats) => {
        acc.total += areaStats.totalCount;
        acc.statusCounts[Status.Aberto] += areaStats.statusCounts[Status.Aberto];
        acc.statusCounts[Status.EmAndamento] += areaStats.statusCounts[Status.EmAndamento];
        acc.statusCounts[Status.EmAtraso] += areaStats.statusCounts[Status.EmAtraso];
        acc.statusCounts[Status.Concluido] += areaStats.statusCounts[Status.Concluido];
        return acc;
    }, { total: 0, statusCounts: { [Status.Aberto]: 0, [Status.EmAndamento]: 0, [Status.EmAtraso]: 0, [Status.Concluido]: 0 } });
  }, [statsByArea]);

  if (!currentUser) return <p className="p-8 text-center text-trimais-blue font-bold">Carregando dados do painel...</p>;

  return (
    <div className="bg-white rounded-lg shadow-2xl p-6 md:p-8 w-full">
      <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-trimais-blue">Painel de Eficiência</h3>
          <button onClick={() => setIsExportModalOpen(true)} className="bg-green-600 text-white px-4 py-2 rounded font-bold">Exportar</button>
      </div>
      
      <div className="bg-trimais-blue text-white p-6 rounded-lg mb-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {Object.values(Status).map(status => (
              <div key={status} className="bg-white/10 p-4 rounded border border-white/20">
                  <p className="text-xs uppercase opacity-70">{status}</p>
                  <p className="text-2xl font-bold">{geralSummary.statusCounts[status] || 0}</p>
              </div>
          ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(statsByArea || {}).filter(([_, s]) => s.totalCount > 0).map(([area, stats]) => (
              <div key={area} className="border p-4 rounded shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="font-bold text-trimais-blue border-b pb-2 mb-3">{area}</h4>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      {Object.values(Status).map(s => (
                          <div key={s} className="bg-gray-50 p-2 rounded">
                              <p className="text-gray-400">{s}</p>
                              <p className="font-bold">{stats.statusCounts[s] || 0}</p>
                          </div>
                      ))}
                  </div>
              </div>
          ))}
      </div>

      {modalFilters && <FilteredOccurrencesModal occurrences={safeOccurrences} users={safeUsers} currentUser={currentUser} filters={modalFilters} onClose={() => setModalFilters(null)} onMoveToTrash={onMoveToTrash} />}
      <ExportOptionsModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} data={filteredOccurrences} />
    </div>
  );
};

export default Dashboard;