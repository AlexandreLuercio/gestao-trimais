import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc } from '@firebase/firestore';
import { db } from '../firebase/config';
import { User } from '../types'; // Importa o tipo User
import LoadingSpinner from './LoadingSpinner';

const ProfilePage: React.FC = () => {
  const { currentUser, setCurrentUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser) {
        setLoading(true);
        try {
          const userDocRef = doc(db, 'users', currentUser.id);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as Omit<User, 'id'>;
            setEditedUser({ ...userData, id: userDocSnap.id });
          } else {
            setError('Dados do perfil não encontrados.');
          }
        } catch (err) {
          console.error("Erro ao carregar perfil:", err);
          setError('Erro ao carregar dados do perfil.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedUser(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSaveProfile = async () => {
    if (!editedUser || !currentUser) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const userDocRef = doc(db, 'users', currentUser.id);
      await updateDoc(userDocRef, {
        displayName: editedUser.displayName || '',
        // Adicione outros campos que você deseja permitir a edição
        updatedAt: new Date(),
      });

      // Atualiza o contexto do usuário
      setCurrentUser(editedUser);
      setIsEditing(false);
      setSuccess('Perfil atualizado com sucesso!');
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      setError('Erro ao salvar as alterações do perfil.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser || !editedUser) {
    return <div className="text-red-500 text-center mt-8">Nenhum perfil de usuário disponível.</div>;
  }

  return (
    <div className="container mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Meu Perfil</h2>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      {success && <p className="text-green-500 text-sm mb-4">{success}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email:</label>
          <p className="mt-1 text-lg text-gray-900">{editedUser.email}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nome de Exibição:</label>
          {isEditing ? (
            <input
              type="text"
              name="displayName"
              value={editedUser.displayName || ''}
              onChange={handleEditChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-trimais-blue focus:border-trimais-blue sm:text-sm"
            />
          ) : (
            <p className="mt-1 text-lg text-gray-900">{editedUser.displayName || 'Não definido'}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Papel:</label>
          <p className="mt-1 text-lg text-gray-900">{editedUser.role}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status:</label>
          <p className="mt-1 text-lg text-gray-900">{editedUser.status}</p>
        </div>
        {/* Adicione outros campos de exibição ou edição aqui */}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-3">
        {isEditing ? (
          <>
            <button
              onClick={handleSaveProfile}
              className="px-4 py-2 bg-trimais-blue text-white rounded-md hover:bg-trimais-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-trimais-blue"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditedUser(currentUser); // Reverte para os dados originais
                setError(null);
                setSuccess(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
          >
            Editar Perfil
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
