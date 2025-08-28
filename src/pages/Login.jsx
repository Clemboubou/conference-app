import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { userAPI } from '../api';

const Login = () => {
  const [credentials, setCredentials] = useState({
    id: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSignup, setIsSignup] = useState(false);
  const [signupData, setSignupData] = useState({
    id: '',
    password: '',
    type: 'user' // Par défaut user, la promotion se fera via l'interface admin
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignup) {
        console.log('=== DEBUG SIGNUP ===');
        console.log('signupData.type:', signupData.type);
        console.log('signupData complet:', JSON.stringify(signupData, null, 2));
        console.log('isSignup:', isSignup);
        console.log('==================');
        
        const signupResp = await userAPI.signup(signupData);
        console.log('Signup success:', signupResp);
        setError(null);
        
        // ✅ Message adapté selon le type demandé
        if (signupData.type === 'admin') {
          setSuccess('Compte créé en tant qu\'utilisateur. Un administrateur devra vous donner les droits admin via la page de gestion des utilisateurs.');
        } else {
          setSuccess('Compte créé avec succès !');
        }
        
        // Passer automatiquement en mode connexion avec les identifiants
        setIsSignup(false);
        setCredentials({
          id: signupData.id,
          password: signupData.password
        });
        
      } else {
        const signinResp = await userAPI.signin(credentials);
        console.log('Signin success:', signinResp);
        // Notifier l'application que l'auth a changé
        window.dispatchEvent(new Event('auth-changed'));
        setSuccess('Connexion réussie ! Redirection...');
        // Redirection légère après un court délai pour voir le message
        setTimeout(() => {
          navigate('/');
        }, 600);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Erreur lors de l\'authentification');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    if (isSignup) {
      setSignupData({
        ...signupData,
        [e.target.name]: e.target.value
      });
    } else {
      setCredentials({
        ...credentials,
        [e.target.name]: e.target.value
      });
    }
  };

  return (
    <div className="login">
      <Header />
      <main>
        <h2>{isSignup ? 'Créer un compte' : 'Connexion'}</h2>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="id">ID Utilisateur:</label>
            <input
              type="text"
              id="id"
              name="id"
              value={isSignup ? signupData.id : credentials.id}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Choisissez un identifiant unique"
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="password">Mot de passe:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={isSignup ? signupData.password : credentials.password}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Mot de passe sécurisé"
              autoComplete={isSignup ? "new-password" : "current-password"}
            />
          </div>
          {isSignup && (
            <div>
              <label htmlFor="type">Type d'utilisateur souhaité:</label>
              <select
                id="type"
                name="type"
                value={signupData.type}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur (nécessite validation)</option>
              </select>
              {signupData.type === 'admin' && (
                <small style={{ color: '#666', fontSize: '0.9em', display: 'block', marginTop: '0.5rem' }}>
                  Note : Votre compte sera créé en tant qu'utilisateur normal. 
                  Un administrateur existant devra vous promouvoir via la page de gestion des utilisateurs.
                </small>
              )}
            </div>
          )}
          <button type="submit" disabled={loading}>
            {loading 
              ? (isSignup ? 'Création...' : 'Connexion...') 
              : (isSignup ? 'Créer le compte' : 'Se connecter')
            }
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button 
            type="button" 
            onClick={() => {
              setIsSignup(!isSignup);
              setError(null);
              setSuccess(null);
            }}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#2563eb', 
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            {isSignup 
              ? 'Déjà un compte ? Se connecter' 
              : 'Pas de compte ? Créer un compte'
            }
          </button>
        </div>
      </main>
    </div>
  );
};

export default Login;