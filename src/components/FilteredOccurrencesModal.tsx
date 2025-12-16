
import React, { useState, useMemo, useEffect } from 'react';
import { Occurrence, User, Area, Status, Role, getNormalizedStatus } from '../types';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FilteredOccurrencesModalProps {
  occurrences: Occurrence[];
  users: User[];
  currentUser: User;
  filters: { area?: Area; status: Status };
  onClose: () => void;
  onMoveToTrash?: (id: string) => void;
  limitToUser?: boolean; // New prop for Silo view
}

const statusConfig: Record<Status, { colors: string, label: string }> = {
    [Status.Aberto]: { colors: 'bg-blue-100 text-blue-800 border-blue-500', label: 'Abertas'},
    [Status.EmAndamento]: { colors: 'bg-yellow-100 text-yellow-800 border-yellow-500', label: 'Em Andamento'},
    [Status.EmAtraso]: { colors: 'bg-red-100 text-red-800 border-red-500', label: 'Em Atraso'}, 
    [Status.Concluido]: { colors: 'bg-green-100 text-green-800 border-green-500', label: 'Concluídas'},
};

const FilteredOccurrencesModal: React.FC<FilteredOccurrencesModalProps> = ({ occurrences, users, currentUser, filters, onClose, onMoveToTrash, limitToUser }) => {
    const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<string | null>(null);

    const filteredList = useMemo(() => {
        return occurrences
            .filter(o => {
                const areaMatch = filters.area ? o.area === filters.area : true;
                // Normalize status before comparing
                const statusMatch = getNormalizedStatus(o.status) === filters.status;
                // Silo logic: If limitToUser is true, only show createdBy current user
                const userMatch = limitToUser ? o.createdBy === currentUser.uid : true;
                return areaMatch && statusMatch && userMatch;
            })
            .sort((a,b) => {
                if (a.isUrgent && !b.isUrgent) return -1;
                if (!a.isUrgent && b.isUrgent) return 1;
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            });
    }, [occurrences, filters, limitToUser, currentUser.uid]);

    const selectedOccurrence = useMemo(() => {
        return filteredList.find(o => o.id === selectedOccurrenceId) || null;
    }, [selectedOccurrenceId, filteredList]);
    
    useEffect(() => {
        if (filteredList.length > 0 && !filteredList.some(o => o.id === selectedOccurrenceId)) {
            setSelectedOccurrenceId(filteredList[0].id);
        } else if (filteredList.length === 0) {
            setSelectedOccurrenceId(null);
        }
    }, [filteredList, selectedOccurrenceId]); 

    useEffect(() => {
        if (selectedOccurrenceId && !selectedOccurrence) {
            if (filteredList.length > 0) {
                setSelectedOccurrenceId(filteredList[0].id);
            } else {
                setSelectedOccurrenceId(null);
            }
        }
    }, [occurrences, selectedOccurrenceId, selectedOccurrence, filteredList]);


    const getUserName = (uid: string | undefined) => users.find(u => u.uid === uid)?.name || 'N/A';
    
    // Helper to get Creator Details (Unified Logic with Quantum Reconciliation)
    const getCreatorSignature = () => {
        if (!selectedOccurrence) return { name: '', details: '' };

        // 1. PRIMARY: ID MATCH
        let creator = users?.find(u => u.uid === selectedOccurrence.createdBy || u.id === selectedOccurrence.createdBy);
        
        // 2. FORENSIC EXTRACTION
        let targetName = selectedOccurrence.creatorName;
        if ((!targetName || targetName === 'Autor não identificado' || targetName === 'Usuário Desconhecido') && selectedOccurrence.updatesLog && selectedOccurrence.updatesLog.length > 0) {
            const firstLog = selectedOccurrence.updatesLog[0].text;
            const match = firstLog.match(/(?:Ocorrência|Tarefa) criada por (.+?)\.?$/i);
            if (match && match[1]) {
                targetName = match[1].replace('.', '').trim();
            }
        }

        // 3. SECONDARY LOOKUP: Name Match (The Reconciliation)
        if (!creator && targetName) {
            creator = users?.find(u => u.name.trim().toLowerCase() === targetName.trim().toLowerCase());
        }

        // 4. Fallback Name
        const displayName = creator?.name || targetName || 'Colaborador';
        
        // 5. Details Construction
        let details = '';
        if (creator) {
            // ACTIVE USER FOUND via ID or Name match
            const areas = creator.allowedAreas && creator.allowedAreas.length > 0 ? ` - ${creator.allowedAreas.join(', ')}` : '';
            details = `(${creator.role}${areas})`;
        } else {
            // NO ACTIVE USER FOUND
            if (displayName !== 'Colaborador' && displayName !== 'Autor não identificado' && displayName !== 'Usuário Desconhecido') {
                 details = '(Ex-colaborador)';
            }
        }
        
        return { name: displayName, details };
    }


    const getDisplayId = (occ: Occurrence | null, type: 'list' | 'details'): string => {
        if (!occ) return '';
        if (occ.uniqueId) {
            return occ.uniqueId;
        }
        if (type === 'list') {
            return `Legado #${occ.id.substring(0, 5)}...`;
        }
        return `LEGADO #${occ.id.substring(0, 6).toUpperCase()}`;
    }

    // Permission Check for Deletion
    const canDelete = (occ: Occurrence) => {
        if (currentUser.role === Role.Admin) return true;
        // Check if area is in allowed list array
        if (currentUser.role === Role.Gestor && currentUser.allowedAreas?.includes(occ.area)) return true;
        // Director and Monitor cannot delete
        return false;
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        // No preventDefault here to keep button native behavior, just StopPropagation
        if (selectedOccurrence && onMoveToTrash && canDelete(selectedOccurrence)) {
            onMoveToTrash(selectedOccurrence.id);
        }
    };


    const creatorSig = getCreatorSignature();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-2 sm:p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* FIXED HEADER */}
                <header className="flex justify-between items-center p-4 border-b flex-shrink-0 bg-white rounded-t-lg z-10">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-trimais-blue">
                            {filters.area || 'Visão Geral'} {limitToUser ? '(Meus Reportes)' : ''} - <span className={`${statusConfig[filters.status].colors.replace('bg-','text-').replace('-100', '-800')}`}>{statusConfig[filters.status].label}</span>
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-3">
                         {/* DELETE BUTTON IN HEADER */}
                        {selectedOccurrence && canDelete(selectedOccurrence) && onMoveToTrash && (
                            <button 
                                type="button"
                                onClick={handleDelete}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-red-600 border border-red-200 bg-red-50 rounded-md hover:bg-red-100 transition-colors mr-4"
                                title="Mover tarefa atual para a lixeira"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Excluir Tarefa
                            </button>
                        )}

                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </header>
                
                {/* BODY */}
                <div className="flex flex-1 overflow-hidden">
                    {/* LEFT LIST */}
                    <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50 overflow-hidden hidden md:flex">
                        <div className="p-3 bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                            Lista de Tarefas ({filteredList.length})
                        </div>
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            {filteredList.map(occ => (
                                <div 
                                    key={occ.id} 
                                    onClick={() => setSelectedOccurrenceId(occ.id)}
                                    className={`p-4 border-b cursor-pointer transition-colors hover:bg-white ${selectedOccurrenceId === occ.id ? 'bg-white border-l-4 border-l-trimais-gold shadow-sm' : 'border-l-4 border-l-transparent'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${occ.uniqueId ? 'bg-trimais-blue text-white' : 'bg-gray-200 text-gray-600'}`}>
                                            {getDisplayId(occ, 'list')}
                                        </span>
                                        {occ.isUrgent && (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <h4 className={`text-sm font-bold mb-1 line-clamp-2 ${selectedOccurrenceId === occ.id ? 'text-trimais-blue' : 'text-gray-700'}`}>{occ.title}</h4>
                                    <div className="flex justify-between items-end">
                                        <p className="text-xs text-gray-500 truncate max-w-[70%]">{occ.location}</p>
                                        <span className="text-[10px] text-gray-400">{format(parseISO(occ.timestamp), 'dd/MM')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT DETAILS */}
                    <div className="flex-1 overflow-y-auto bg-white p-4 md:p-8 custom-scrollbar">
                        {selectedOccurrence ? (
                            <div className="max-w-3xl mx-auto space-y-6">
                                {/* HEADER INFO */}
                                <div className="border-b pb-4">
                                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                                        <h1 className="text-2xl font-bold text-gray-800">{selectedOccurrence.title}</h1>
                                        {selectedOccurrence.isUrgent && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">
                                                ⚠️ URGENTE
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                                        <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                                            <span className="font-bold text-trimais-blue">{getDisplayId(selectedOccurrence, 'details')}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                            {selectedOccurrence.location}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                            Criado por: <strong>{creatorSig.name}</strong>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                            {format(parseISO(selectedOccurrence.timestamp), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                        </div>
                                        {selectedOccurrence.assigneeId && (
                                            <div className="flex items-center gap-1 text-blue-600">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                                                Responsável: {getUserName(selectedOccurrence.assigneeId)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* DESCRIPTION */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h3 className="font-bold text-gray-800 mb-2">Descrição</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedOccurrence.description}</p>
                                </div>

                                {/* DEADLINE HISTORY */}
                                {(selectedOccurrence.deadlineHistory && selectedOccurrence.deadlineHistory.length > 0) && (
                                     <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                        <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            Histórico de Prazos
                                        </h3>
                                        <div className="space-y-2">
                                            {selectedOccurrence.deadlineHistory.map((hist, idx) => {
                                                const d = parseISO(hist.deadline);
                                                const diff = differenceInDays(new Date(), d);
                                                const isLate = diff > 0;
                                                const isCompleted = selectedOccurrence.status === Status.Concluido;

                                                return (
                                                    <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-blue-100">
                                                        <div>
                                                            <span className="font-semibold text-gray-700">Prazo {idx + 1}: {format(d, "dd/MM/yyyy" + (selectedOccurrence.isUrgent ? " HH:mm" : ""))}</span>
                                                            <span className="text-xs text-gray-500 block">Definido por {hist.setBy} em {format(parseISO(hist.setAt), "dd/MM HH:mm")}</span>
                                                        </div>
                                                        <div className="font-bold">
                                                            {isCompleted ? (
                                                                <span className="text-green-600">Concluído</span>
                                                            ) : isLate ? (
                                                                <span className="text-red-600">{diff} dias de atraso</span>
                                                            ) : (
                                                                <span className="text-blue-600">{Math.abs(diff)} dias restantes</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                     </div>
                                )}

                                {/* MEDIA */}
                                {(selectedOccurrence.photos.length > 0 || selectedOccurrence.audioUrl) && (
                                    <div>
                                        <h3 className="font-bold text-gray-800 mb-3">Mídia e Evidências</h3>
                                        <div className="flex flex-wrap gap-4">
                                            {selectedOccurrence.photos.map((photo, index) => (
                                                <a key={index} href={photo} target="_blank" rel="noopener noreferrer" className="block w-32 h-32 rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                                    <img src={photo} alt={`Evidência ${index + 1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                                                </a>
                                            ))}
                                            {selectedOccurrence.audioUrl && (
                                                <div className="w-full sm:w-auto flex items-center justify-center bg-gray-100 rounded-lg p-4 border border-gray-200">
                                                    <audio src={selectedOccurrence.audioUrl} controls className="w-64" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* UPDATES LOG */}
                                <div className="border-t pt-6">
                                    <h3 className="font-bold text-gray-800 mb-4">Histórico de Atividades</h3>
                                    <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                                        {selectedOccurrence.updatesLog?.filter(log => !log.text.match(/(Ocorrência|Tarefa).*criada por/i)).map((update, index) => {
                                             // LIVE LOOKUP FOR AUTHOR DETAILS IN CHAT
                                            const authorUser = users?.find(u => u.name === update.authorName);
                                            const roleInfo = authorUser ? `(${authorUser.role}${authorUser.allowedAreas?.length ? ` - ${authorUser.allowedAreas.join(', ')}` : ''})` : '';

                                            return (
                                                <div key={index} className="relative">
                                                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-gray-300 border-2 border-white"></div>
                                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="font-bold text-trimais-blue">
                                                                {update.authorName || 'Usuário'}
                                                                {roleInfo && <span className="text-xs text-gray-500 font-normal ml-1">{roleInfo}</span>}
                                                            </span>
                                                            <span className="text-xs text-gray-500">{format(parseISO(update.timestamp), "dd/MM/yyyy HH:mm")}</span>
                                                        </div>
                                                        <p className="text-gray-700">{update.text}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        
                                        {/* Creation Footer - UNIFIED */}
                                        <div className="relative">
                                            <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-trimais-blue border-2 border-white"></div>
                                            <div className="text-sm text-gray-500 italic">
                                                Tarefa criada por <span className="font-semibold text-gray-700">{creatorSig.name}</span> <span className="text-gray-500 font-medium">{creatorSig.details}</span> em {format(parseISO(selectedOccurrence.timestamp), "dd/MM/yyyy HH:mm")}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                                <p>Selecione uma tarefa para ver os detalhes</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilteredOccurrencesModal;
