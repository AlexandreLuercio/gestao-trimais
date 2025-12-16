// src/utils/exportHelper.ts

import { Occurrence } from '../types'; // Importando a definição de Occurrence
import { format } from 'date-fns';

export const exportToCSV = (data: Occurrence[], filename: string = 'ocorrencias.csv'): void => {
  if (!data || data.length === 0) {
    alert('Nenhum dado para exportar.');
    return;
  }

  // Define os cabeçalhos do CSV
  const headers = [
    'ID', 'Título', 'Descrição', 'Status', 'Prioridade', 'Área', 'Criado Em', 'Atualizado Em', 'Vencimento'
  ];

  // Mapeia os dados para o formato CSV
  const csvContent = data.map(occurrence => {
    const created = occurrence.createdAt ? format(occurrence.createdAt.toDate(), 'yyyy-MM-dd HH:mm:ss') : '';
    const updated = occurrence.updatedAt ? format(occurrence.updatedAt.toDate(), 'yyyy-MM-dd HH:mm:ss') : '';
    const due = occurrence.dueDate ? format(new Date(occurrence.dueDate), 'yyyy-MM-dd') : '';

    return [
      `"${occurrence.id}"`,
      `"${occurrence.title}"`,
      `"${occurrence.description ? occurrence.description.replace(/"/g, '""') : ''}"`, // Escapa aspas duplas
      `"${occurrence.status}"`,
      `"${occurrence.priority || ''}"`,
      `"${occurrence.area || ''}"`,
      `"${created}"`,
      `"${updated}"`,
      `"${due}"`,
    ].join(',');
  }).join('\n');

  const finalCsv = `${headers.join(',')}\n${csvContent}`;

  const blob = new Blob([finalCsv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) { // Feature detection
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToExcel = (data: Occurrence[], filename: string = 'ocorrencias.xlsx'): void => {
  alert('Funcionalidade de exportação para Excel não implementada. Por favor, use CSV.');
  // Em um projeto real, você usaria uma biblioteca como 'xlsx' para gerar o arquivo Excel
  // Ex: import * as XLSX from 'xlsx';
  // const ws = XLSX.utils.json_to_sheet(data);
  // const wb = XLSX.utils.book_new();
  // XLSX.utils.book_append_sheet(wb, ws, "Ocorrências");
  // XLSX.writeFile(wb, filename);
};
