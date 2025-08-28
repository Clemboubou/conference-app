import axios from 'axios';
import config from './assets/config.json';

// Configuration de base pour l'API (chargée depuis assets/config.json)
const API_BASE_URL = config.backend_URL;

// Configuration d'axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter automatiquement le token d'authentification
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et erreurs
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('Erreur API:', error);
    console.error('Détails de l\'erreur:', JSON.stringify(error.response?.data, null, 2));
    console.error('Status:', error.response?.status);
    console.error('Request URL:', error.config?.url);
    console.error('Request method:', error.config?.method);
    console.error('Request headers:', JSON.stringify(error.config?.headers, null, 2));
    console.error('Request data:', JSON.stringify(error.config?.data, null, 2));
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      // Ne pas déconnecter quand on vérifie juste si l'utilisateur est admin
      // Un 401/403 sur /isadmin ne signifie pas que le token est invalide pour un user standard
      if (!url.includes('/isadmin')) {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
    }
    throw new Error(error.response?.data?.message || error.message);
  }
);

// Fonctions pour gérer les conférences
export const conferenceAPI = {
  // Récupérer toutes les conférences
  getAll: async () => {
    return await apiClient.get('/conferences');
  },

  // Récupérer une conférence par ID
  getById: async (id) => {
    return await apiClient.get(`/conference/${id}`);
  },

  // Créer une nouvelle conférence
  create: async (conferenceData) => {
    return await apiClient.post('/conference', conferenceData);
  },

  // Mettre à jour une conférence
  update: async (id, conferenceData) => {
    return await apiClient.patch(`/conference/${id}`, conferenceData);
  },

  // Supprimer une conférence
  delete: async (id) => {
    await apiClient.delete(`/conference/${id}`);
    return true;
  },
};

// Fonctions pour la gestion des utilisateurs
export const userAPI = {
  // Connexion utilisateur
  signin: async (credentials) => {
    const data = await apiClient.post('/login', credentials);
    const token = typeof data === 'string' ? data : data?.token;
    if (token) {
      localStorage.setItem('authToken', token);
      window.dispatchEvent(new Event('auth-changed'));
    }
    return data;
  },

  // Inscription utilisateur
  async signup(userData) {
    console.log('API signup called with:', userData);
    
    // Étape 1: Créer le compte
    const signupPayload = {
      id: userData.id,
      password: userData.password
    };

    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signupPayload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erreur signup:', response.status, errorData);
      throw new Error(`Erreur ${response.status}: ${errorData}`);
    }

    const signupData = await response.json();
    console.log('Signup response data:', signupData);
    
    // Étape 2: Se connecter immédiatement pour obtenir le token
    console.log('Logging in immediately after signup to get token...');
    const loginResponse = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: userData.id,
        password: userData.password
      })
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.text();
      console.error('Erreur login après signup:', loginResponse.status, errorData);
      throw new Error(`Erreur login: ${loginResponse.status}: ${errorData}`);
    }

    const token = await loginResponse.text();
    // Remove any extra quotes that might be wrapping the token
    const cleanToken = token.replace(/^"|"$/g, '');
    console.log('Token obtained after signup:', cleanToken ? 'Token found' : 'No token', cleanToken?.substring(0, 20) + '...');
    
    if (cleanToken) {
      localStorage.setItem('authToken', cleanToken);
      window.dispatchEvent(new Event('auth-changed'));
    }
    
    // Étape 3: Si le type demandé est 'admin', promouvoir l'utilisateur
    if (userData.type === 'admin' && cleanToken) {
      try {
        console.log('Promoting user to admin:', userData.id);
        console.log('Using token for promotion:', cleanToken.substring(0, 20) + '...');
        
        const promoteResponse = await fetch(`${API_BASE_URL}/usertype/${userData.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cleanToken}`
          },
          body: JSON.stringify({ newType: 'admin' })
        });

        if (!promoteResponse.ok) {
          const errorData = await promoteResponse.text();
          console.error('Erreur promotion admin:', promoteResponse.status, errorData);
          console.error('Headers sent:', {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cleanToken.substring(0, 20)}...`
          });
          throw new Error(`Erreur ${promoteResponse.status}: ${errorData}`);
        }
        
        console.log('User promoted to admin successfully');
      } catch (err) {
        console.error('Erreur lors de la promotion en admin:', err);
        throw err;
      }
    }

    return { success: true, token: cleanToken };
  },

  // Récupérer tous les utilisateurs
  getAll: async () => {
    return await apiClient.get('/users');
  },

  // Vérifier si l'utilisateur actuel est admin
  verifyCurrentUserIsAdmin: async () => {
    const data = await apiClient.get('/isadmin');
    return data.isAdmin;
  },

  // Changer le mot de passe
  changePassword: async (oldPassword, newPassword) => {
    return await apiClient.patch('/userpassword', { oldPassword, password: newPassword });
  },

  // Changer le type d'un utilisateur (admin/user)
  changeUserType: async (userId, newType) => {
    const response = await fetch(`${API_BASE_URL}/usertype/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ newType })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erreur changeUserType:', response.status, errorData);
      throw new Error(`Erreur ${response.status}: ${errorData}`);
    }

    return response.json();
  },

  // Supprimer un utilisateur
  delete: async (userId) => {
    await apiClient.delete(`/user/${userId}`);
    return true;
  },

  // Déconnexion (supprime le token local)
  logout: () => {
    localStorage.removeItem('authToken');
    window.dispatchEvent(new Event('auth-changed'));
    return Promise.resolve(true);
  },
};
