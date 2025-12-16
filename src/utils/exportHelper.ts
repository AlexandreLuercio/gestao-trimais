// src/utils/exportHelper.ts

import { Occurrence } from '../types'; // Importando a definição de Occurrence
import { format, parseISO } from 'date-fns';

// Definir o tipo SortOption
export type SortOption = 'dueDate' | 'priority' | 'status' | 'title' | 'createdAt';

// Função para ordenar ocorrências
export const sortOccurrencesForExport = (occurrences: Occurrence[], sortBy: SortOption): Occurrence[] => {
  const sorted = [...occurrences].sort((a, b) => {
    switch (sortBy) {
      case 'dueDate':
        // Converte para timestamp para comparação numérica. Ocorrências sem dueDate vêm primeiro.
        const dateA = a.dueDate ? parseISO(a.dueDate).getTime() : -Infinity;
        const dateB = b.dueDate ? parseISO(b.dueDate).getTime() : -Infinity;
        return dateA - dateB;
      case 'priority':
        // Mapeia prioridades para valores numéricos para ordenação
        const priorityOrder = { 'Baixa': 1, 'Média': 2, 'Alta': 3 };
        return (priorityOrder[a.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 0);
      case 'status':
        return a.status.localeCompare(b.status);
      case 'title':
        return a.title.localeCompare(b.title);
      case 'createdAt':
        // Converte para timestamp do Firestore para comparação
        const createdA = a.createdAt ? a.createdAt.toMillis() : -Infinity;
        const createdB = b.createdAt ? b.createdAt.toMillis() : -Infinity;
        return createdA - createdB;
      default:
        return 0;
    }
  });
  return sorted;
};

// Renomear e ajustar exportToCSV para generateCSV (agora chamada de generateCSV)
export const generateCSV = (data: Occurrence[], filename: string = 'ocorrencias.csv'): void => {
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
    // Tratamento para Firestore Timestamp e Date
    const created = occurrence.createdAt ? format(occurrence.createdAt.toDate(), 'yyyy-MM-dd HH:mm:ss') : '';
    const updated = occurrence.updatedAt ? format(occurrence.updatedAt.toDate(), 'yyyy-MM-dd HH:mm:ss') : '';
    const due = occurrence.dueDate ? format(parseISO(occurrence.dueDate), 'yyyy-MM-dd') : '';

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

// Ajustar exportToExcel para generateExcel e ter comportamento similar ao CSV
export const generateExcel = (data: Occurrence[], filename: string = 'ocorrencias.xlsx'): void => {
  alert('Funcionalidade de exportação para Excel não implementada. Usando CSV como alternativa.');
  generateCSV(data, filename.replace('.xlsx', '.csv')); // Por simplicidade, usa CSV
};

// Nova função generatePDF
export const generatePDF = (data: Occurrence[], filename: string = 'ocorrencias.pdf'): void => {
  alert('Funcionalidade de exportação para PDF não implementada.');
  // Em um projeto real, você usaria uma biblioteca como 'jspdf' ou 'pdf-lib' para gerar o arquivo PDF
};
