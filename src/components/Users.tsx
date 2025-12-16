import React, { useEffect, useState, useContext } from 'react';
import { collection, query, getDocs, doc, deleteDoc, updateDoc } from '@firebase/firestore';
import { db } from '../firebase/config';
import { AuthContext } from '../contexts/AuthContext';
import { User, UserRole } from '../types'; // Importa o tipo User e UserRole de '../types'
import LoadingSpinner from './LoadingSpinner';
import ConfirmModal from './ConfirmModal'; // Reutiliza o ConfirmModal

const Users: React.FC = () => {
  const { currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser || currentUser.role !== 'admin') {
        setError('Você não tem permissão para visualizar esta página.');
        setLoading(false);
        return;
      }
      try {
        const q = query(collection(db, 'users'));
        const querySnapshot = await getDocs(q);
        const usersList: User[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<User, 'id'> // Converte o data para o tipo User, omitindo o id
        }));
        setUsers(usersList);
      } catch (err: any) {
        console.error("Erro ao buscar usuários:", err);
        setError('Erro ao carregar usuários.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  const handleDeleteUser = async (user: User) => {
    setUserToDelete(user);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteDoc(doc(db, 'users', userToDelete.id));
      setUsers(users.filter(u => u.id !== userToDelete.id));
      // TODO: Adicionar lógica para deletar o usuário do Firebase Authentication também
    } catch (err) {
      console.error("Erro ao deletar usuário:", err);
      setError('Erro ao deletar usuário.');
    } finally {
      setShowConfirmModal(false);
      setUserToDelete(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(user => user.id === userId ? { ...user, role: newRole } : user));
    } catch (err) {
      console.error("Erro ao atualizar papel do usuário:", err);
      setError('Erro ao atualizar papel do usuário.');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  return (
    <div className="container mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Gerenciamento de Usuários</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Email
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Papel
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">{user.email}</p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    className="block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-trimais-blue focus:border-trimais-blue sm:text-sm"
                    disabled={user.id === currentUser?.id} // Não permitir que o usuário mude seu próprio papel
                  >
                    <option value="user">Usuário</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">{user.status}</p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <button
                    onClick={() => handleDeleteUser(user)}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={user.id === currentUser?.id} // Não permitir que o usuário delete a si mesmo
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Você realmente deseja excluir o usuário "${userToDelete?.email}"? Esta ação é irreversível.`}
      />
    </div>
  );
};

export default Users;
