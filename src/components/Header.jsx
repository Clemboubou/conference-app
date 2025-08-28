import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { userAPI } from '../api';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('authToken'));
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    const onAuthChanged = () => {
      checkAuthStatus();
    };
    window.addEventListener('auth-changed', onAuthChanged);
    return () => window.removeEventListener('auth-changed', onAuthChanged);
  }, [location.pathname]); // Re-vérifier à chaque changement de page et sur auth-changed

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsLoggedIn(true);
      try {
        const result = await userAPI.verifyCurrentUserIsAdmin();
        setIsAdmin(result === true);
      } catch (err) {
        setIsAdmin(false);
      }
    } else {
      setIsLoggedIn(false);
      setIsAdmin(false);
    }
  };

  const handleLogout = () => {
    userAPI.logout();
    setIsAdmin(false);
    setIsLoggedIn(false);
    // notifier l'appli et forcer re-render
    window.dispatchEvent(new Event('auth-changed'));
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-container">
        <h1>
          <Link to="/" className="logo">Conference App</Link>
        </h1>
        <nav>
          <ul>
            <li><Link to="/">Accueil</Link></li>
            {!isLoggedIn ? (
              <li><Link to="/login">Connexion</Link></li>
            ) : (
              <>
                {isAdmin && (
                  <>
                    <li><Link to="/admin">Admin</Link></li>
                    <li><Link to="/admin/users">Utilisateurs</Link></li>
                  </>
                )}
                <li><Link to="/password-change">Changer mot de passe</Link></li>
                <li>
                  <button onClick={handleLogout} className="logout-btn">
                    Déconnexion
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
