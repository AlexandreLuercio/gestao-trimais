import { Occurrence, Status } from '../tipos';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export type SortOption = 'date_desc' | 'date_asc' | 'urgency' | 'status';

export const sortOccurrencesForExport = (data: Occurrence[], sortBy: SortOption): Occurrence[] => {
    const sorted = [...data];
    switch (sortBy) {
        case 'urgency':
            return sorted.sort((a, b) => (a.isUrgent === b.isUrgent ? 0 : a.isUrgent ? -1 : 1));
        case 'date_asc':
            return sorted.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        case 'date_desc':
            return sorted.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        case 'status':
            return sorted.sort((a, b) => a.status.localeCompare(b.status));
        default:
            return sorted;
    }
};

const prepareDataForExport = (occurrences: Occurrence[]) => {
    return occurrences.map(occ => ({
        'ID Único': occ.uniqueId || 'N/A',
        'Título': occ.title || '',
        'Área': occ.area || '',
        'Status': occ.status || '',
        'Urgente': occ.isUrgent ? 'SIM' : 'NÃO',
        'Data Criação': occ.timestamp ? format(parseISO(occ.timestamp), 'dd/MM/yyyy HH:mm') : '',
        'Autor': occ.creatorName || '',
        'Localização': occ.location || '',
        'Prazo': occ.estimatedCompletion ? format(parseISO(occ.estimatedCompletion), 'dd/MM/yyyy') : '-',
        'Descrição': occ.description ? occ.description.replace(/\n/g, ' ') : '',
    }));
};

export const generateExcel = (occurrences: Occurrence[], filename: string) => {
    const data = prepareDataForExport(occurrences);
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const generatePDF = (occurrences: Occurrence[], title: string, filename: string) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Trimais Places - Relatório", 14, 20);
    const tableColumn = ["ID", "Área", "Título", "Status", "Data", "Autor"];
    const tableRows = occurrences.map(occ => [
        occ.uniqueId || 'N/A',
        occ.area,
        occ.title,
        occ.status,
        format(parseISO(occ.timestamp), 'dd/MM/yyyy'),
        occ.creatorName
    ]);
    (doc as any).autoTable({ head: [tableColumn], body: tableRows, startY: 30 });
    doc.save(`${filename}.pdf`);
};