import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { userAPI } from '../api';
import Header from './Header.jsx';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const [allowed, setAllowed] = useState(null); // null = loading, true = ok, false = denied
  const location = useLocation();

  useEffect(() => {
    const check = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setAllowed(false);
        return;
      }
      if (!adminOnly) {
        setAllowed(true);
        return;
      }
      try {
        const isAdmin = await userAPI.verifyCurrentUserIsAdmin();
        setAllowed(!!isAdmin);
      } catch (e) {
        setAllowed(false);
      }
    };

    check();
  }, [adminOnly, location.pathname]);

  if (allowed === null) {
    return (
      <div>
        <Header />
        <main>
          <div className="loading">Vérification des accès...</div>
        </main>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
