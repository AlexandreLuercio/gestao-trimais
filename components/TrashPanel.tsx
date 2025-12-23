import React, { useState } from 'react';
import { Occurrence } from '../types';

interface TrashPanelProps {
  occurrences: Occurrence[];
  onRestore: (id: string) => void;
  onDeleteForever: (id: string) => void;
}

const TrashPanel: React.FC<TrashPanelProps> = ({ occurrences, onRestore, onDeleteForever }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // PROTEÇÃO TOTAL NO FILTRO
  const filtered = (occurrences || []).filter(occ => 
    (occ.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-2xl p-6 md:p-8 w-full min-h-[80vh]">
      <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-red-600">Lixeira</h3>
          <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500">Itens deletados</span>
      </div>
      <input 
        type="text" 
        placeholder="Pesquisar itens deletados..." 
        value={searchTerm} 
        onChange={e => setSearchTerm(e.target.value)} 
        className="w-full p-3 border rounded-lg mb-6 focus:ring-2 ring-red-200 outline-none" 
      />
      <div className="space-y-3">
        {filtered.map(occ => (
          <div key={occ.id} className="p-4 border rounded-lg flex justify-between items-center bg-gray-50 hover:bg-white transition-colors">
            <div>
                <p className="font-bold text-gray-800">{occ.title}</p>
                <p className="text-xs text-gray-400">{occ.uniqueId} | {occ.area}</p>
            </div>
            <div className="flex gap-4">
                <button onClick={() => onRestore(occ.id)} className="text-blue-600 text-sm font-bold uppercase hover:underline">Restaurar</button>
                <button onClick={() => { if(confirm("Apagar definitivamente?")) onDeleteForever(occ.id) }} className="text-red-600 text-sm font-bold uppercase hover:underline">Excluir</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
            <div className="text-center py-20 text-gray-400 border-2 border-dashed rounded-lg">A lixeira está vazia.</div>
        )}
      </div>
    </div>
  );
};

export default TrashPanel;