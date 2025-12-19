import React, { useState } from 'react';
import { Occurrence } from '../tipos';
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
    const sorted = sortOccurrencesForExport(data, sortBy);
    const filename = `Relatorio_${format(new Date(), 'dd-MM-yyyy')}`;
    if (formatType === 'excel') generateExcel(sorted, filename);
    else generatePDF(sorted, reportTitle, filename);
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"><div className="bg-white p-6 rounded-xl w-full max-w-md"><h3>Exportar {data.length} itens</h3><div className="flex gap-2 mt-4"><button onClick={() => handleExport('excel')} className="flex-1 bg-green-600 text-white py-2 rounded">Excel</button><button onClick={() => handleExport('pdf')} className="flex-1 bg-red-600 text-white py-2 rounded">PDF</button></div></div></div>
  );
};

export default ExportOptionsModal;