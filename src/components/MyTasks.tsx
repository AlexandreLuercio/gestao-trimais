
import React from 'react';
import { Occurrence, User } from '../types';

interface MyTasksProps {
  occurrences: Occurrence[];
  currentUser: User;
  users: User[];
  updateOccurrence: (id: string, data: any) => void;
}

const MyTasks: React.FC<MyTasksProps> = ({ occurrences, currentUser }) => {
  const myOccs = occurrences.filter(o => o.createdBy === currentUser.uid);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-trimais-blue">Minhas Tarefas ({myOccs.length})</h2>
      <div className="grid gap-4">
        {myOccs.length === 0 ? (
          <div className="bg-white p-10 text-center rounded-lg border-2 border-dashed text-gray-400">
            Nenhuma tarefa encontrada.
          </div>
        ) : (
          myOccs.map(occ => (
            <div key={occ.id} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-trimais-gold">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-800">{occ.title}</h3>
                <span className="text-[10px] bg-gray-100 px-2 py-1 rounded font-bold uppercase">{occ.status}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{occ.location}</p>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{occ.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyTasks;
