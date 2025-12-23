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
    const sorted = sortOccurrencesForExport(data || [], sortBy);
    const filename = `Relatorio_${format(new Date(), 'dd-MM-yyyy')}`;
    if (formatType === 'excel') generateExcel(sorted, filename);
    else generatePDF(sorted, reportTitle, filename);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-xl w-full max-w-md">
        <h3 className="text-xl font-bold mb-4 text-trimais-blue">Exportar {(data || []).length} itens</h3>
        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Ordenar por</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="w-full border p-2 rounded bg-gray-50"
          >
            <option value="date_desc">Data (Recentes)</option>
            <option value="date_asc">Data (Antigas)</option>
            <option value="urgency">Urgência</option>
            <option value="status">Status</option>
          </select>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={() => handleExport('excel')} className="flex-1 bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700">Excel</button>
          <button onClick={() => handleExport('pdf')} className="flex-1 bg-red-600 text-white py-2 rounded font-bold hover:bg-red-700">PDF</button>
        </div>
        <button onClick={onClose} className="w-full mt-2 text-gray-400 text-sm py-2">Cancelar</button>
      </div>
    </div>
  );
};

export default ExportOptionsModal;