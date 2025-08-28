import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { userAPI } from '../api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const data = await userAPI.getAll();
        setUsers(data);
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement des utilisateurs');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const isAdmin = await userAPI.verifyCurrentUserIsAdmin();
        if (!isAdmin) {
          setError('Vous devez être connecté en tant qu\'administrateur pour accéder à cette page');
          setTimeout(() => navigate('/'), 1500);
          return;
        }
        setIsAuthenticated(true);
        await loadUsers();
      } catch (err) {
        console.error('Non autorisé:', err);
        setError('Erreur d\'authentification. Veuillez vous reconnecter.');
        setTimeout(() => navigate('/login'), 1500);
      }
    };

    checkAuth();
  }, [navigate]);

  const promoteUser = async (userId) => {
    try {
      await userAPI.changeUserType(userId, 'admin');
      // Recharger la liste des utilisateurs
      const data = await userAPI.getAll();
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la promotion de l\'utilisateur');
    }
  };

  const demoteUser = async (userId) => {
    try {
      await userAPI.changeUserType(userId, 'user');
      // Recharger la liste des utilisateurs
      const data = await userAPI.getAll();
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la rétrogradation de l\'utilisateur');
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await userAPI.delete(userId);
        // Recharger la liste des utilisateurs
        const data = await userAPI.getAll();
        setUsers(data);
        setError(null);
      } catch (err) {
        setError('Erreur lors de la suppression de l\'utilisateur');
      }
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="user-management">
        <Header />
        <main>
          <div className="loading">{!isAuthenticated ? 'Vérification des droits d\'accès...' : 'Chargement des utilisateurs...'}</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-management">
        <Header />
        <main>
          <div className="error">{error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="user-management">
      <Header />
      <main>
        <h2>Gestion des utilisateurs</h2>
        <div className="users-list">
          {users.map((user) => (
            <div key={user.id} className="user-item">
              <span className="user-id">ID: {user.id}</span>
              <span className="user-type">Type: {user.type}</span>
              <div className="user-actions">
                {user.type === 'user' ? (
                  <button 
                    onClick={() => promoteUser(user.id)}
                    className="promote-btn"
                  >
                    Promouvoir en admin
                  </button>
                ) : (
                  <button 
                    onClick={() => demoteUser(user.id)}
                    className="promote-btn"
                    style={{ background: '#f59e0b' }}
                  >
                    Rétrograder en user
                  </button>
                )}
                <button 
                  onClick={() => deleteUser(user.id)}
                  className="delete-btn"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default UserManagement;
