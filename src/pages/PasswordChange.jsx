import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { userAPI } from '../api';

const PasswordChange = () => {
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (passwords.newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    try {
      await userAPI.changePassword(passwords.oldPassword, passwords.newPassword);
      setSuccess('Mot de passe modifié avec succès !');
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="password-change">
      <Header />
      <main>
        <h2>Changer le mot de passe</h2>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="oldPassword">Ancien mot de passe:</label>
            <input
              type="password"
              id="oldPassword"
              name="oldPassword"
              value={passwords.oldPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="newPassword">Nouveau mot de passe:</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwords.newPassword}
              onChange={handleChange}
              required
              disabled={loading}
              minLength="6"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword">Confirmer le nouveau mot de passe:</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              minLength="6"
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Modification...' : 'Changer le mot de passe'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default PasswordChange;
