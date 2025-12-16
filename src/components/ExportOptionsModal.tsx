
import React, { useState } from 'react';
import { Occurrence } from '../types';
import { generateExcel, generatePDF, sortOccurrencesForExport, SortOption } from '../utils/exportHelper';
import { format } from 'date-fns';

interface ExportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Occurrence[];
  reportTitle?: string;
}

const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({ isOpen, onClose, data, reportTitle = "Relatório Geral" }) => {
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');

  if (!isOpen) return null;

  const handleExport = (formatType: 'pdf' | 'excel') => {
    const sortedData = sortOccurrencesForExport(data, sortBy);
    const filename = `Relatorio_Trimais_${format(new Date(), 'dd-MM-yyyy_HHmm')}`;

    if (formatType === 'excel') {
        generateExcel(sortedData, filename);
    } else {
        generatePDF(sortedData, reportTitle, filename);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex justify-center items-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-trimais-blue">Exportar Relatório</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-100">
            <p className="text-sm text-blue-800">
                <strong>{data.length}</strong> tarefas selecionadas para exportação.
            </p>
        </div>

        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Priorizar / Ordenar por:</label>
            <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-trimais-blue focus:border-trimais-blue"
            >
                <option value="date_desc">Data de Criação (Mais Recente)</option>
                <option value="date_asc">Data de Criação (Mais Antiga)</option>
                <option value="urgency">Urgência (Alta Prioridade Primeiro)</option>
                <option value="status">Status (Agrupado)</option>
            </select>
        </div>

        <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Escolha o formato:</p>
            <button 
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center justify-center gap-3 p-3 rounded-lg border-2 border-red-100 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300 transition-all font-bold"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                Baixar como PDF (Imprimir)
            </button>
            <button 
                onClick={() => handleExport('excel')}
                className="w-full flex items-center justify-center gap-3 p-3 rounded-lg border-2 border-green-100 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300 transition-all font-bold"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Baixar como Excel (Planilha)
            </button>
        </div>
      </div>
    </div>
  );
};

export default ExportOptionsModal;
