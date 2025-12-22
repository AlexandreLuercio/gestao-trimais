import React, { useState, useMemo, useEffect } from 'react';
import { Occurrence, User, Area, Status, Role, getNormalizedStatus } from '../types';

interface FilteredOccurrencesModalProps {
  occurrences: Occurrence[];
  users: User[];
  currentUser: User;
  filters: { area?: Area; status: Status };
  onClose: () => void;
  onMoveToTrash?: (id: string) => void;
  limitToUser?: boolean;
}

const FilteredOccurrencesModal: React.FC<FilteredOccurrencesModalProps> = ({ occurrences, users, currentUser, filters, onClose, onMoveToTrash, limitToUser }) => {
    const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<string | null>(null);
    
    const filteredList = useMemo(() => {
        const safeList = occurrences || [];
        return safeList.filter(o => {
            const areaMatch = filters.area ? o.area === filters.area : true;
            const statusMatch = getNormalizedStatus(o.status) === filters.status;
            const userMatch = limitToUser ? o.createdBy === currentUser.uid : true;
            return areaMatch && statusMatch && userMatch;
        }).sort((a,b) => (a.isUrgent ? -1 : 1));
    }, [occurrences, filters, limitToUser, currentUser.uid]);

    const selectedOccurrence = useMemo(() => (filteredList || []).find(o => o.id === selectedOccurrenceId) || null, [selectedOccurrenceId, filteredList]);
    
    useEffect(() => { 
        if ((filteredList || []).length > 0 && !selectedOccurrenceId) {
            setSelectedOccurrenceId(filteredList[0].id); 
        }
    }, [filteredList]);

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-trimais-blue">{filters.area || 'Visão Geral'} - {filters.status}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">✕</button>
                </header>
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {selectedOccurrence ? (
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                                <h3 className="text-2xl font-bold text-gray-900">{selectedOccurrence.title}</h3>
                                <p className="text-gray-500 font-mono text-sm">{selectedOccurrence.uniqueId} | {selectedOccurrence.location}</p>
                            </div>
                            <div className="prose max-w-none">
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Descrição da Ocorrência</h4>
                                <p className="text-gray-800 whitespace-pre-wrap">{selectedOccurrence.description}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <svg className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            <p className="font-bold">Nenhuma tarefa encontrada neste filtro.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FilteredOccurrencesModal;