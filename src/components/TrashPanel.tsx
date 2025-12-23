
import React from 'react';
import { Occurrence } from '../types';

interface TrashPanelProps {
  occurrences: Occurrence[];
  onRestore: (id: string) => void;
  onDeleteForever: (id: string) => void;
}

const TrashPanel: React.FC<TrashPanelProps> = ({ occurrences }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-red-600 mb-4">Lixeira ({occurrences.length})</h2>
      <p className="text-gray-500 italic">Itens excluídos temporariamente.</p>
    </div>
  );
};

export default TrashPanel;
