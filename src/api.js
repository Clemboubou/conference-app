// CORRECTION COMPLÈTE du fichier api.js

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
      // CORRECTION : Nettoyer le token des guillemets parasites
      const cleanToken = token.replace(/^"|"$/g, '');
      config.headers.Authorization = `Bearer ${cleanToken}`;
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
  getAll: async () => {
    return await apiClient.get('/conferences');
  },

  getById: async (id) => {
    return await apiClient.get(`/conference/${id}`);
  },

  create: async (conferenceData) => {
    return await apiClient.post('/conference', conferenceData);
  },

  update: async (id, conferenceData) => {
    return await apiClient.patch(`/conference/${id}`, conferenceData);
  },

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
      // CORRECTION : Nettoyer le token avant stockage
      const cleanToken = token.replace(/^"|"$/g, '');
      localStorage.setItem('authToken', cleanToken);
      window.dispatchEvent(new Event('auth-changed'));
    }
    return data;
  },

  // Inscription utilisateur
  async signup(userData) {
    console.log('API signup called with:', userData);
    
    // Étape 1: Créer le compte (toujours en tant que 'user')
    const signupPayload = {
      id: userData.id,
      password: userData.password
      // Ne pas inclure le type - le serveur crée toujours en tant que 'user'
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
    // Nettoyer le token
    const cleanToken = token.replace(/^"|"$/g, '');
    console.log('Token obtained after signup:', cleanToken ? 'Token found' : 'No token');
    
    if (cleanToken) {
      localStorage.setItem('authToken', cleanToken);
      window.dispatchEvent(new Event('auth-changed'));
    }
    
    // Plus de tentative de promotion automatique
    // La promotion se fera manuellement via l'interface admin
    
    return { success: true, token: cleanToken };
  },

  // Récupérer tous les utilisateurs (nécessite authentification malgré la doc API)
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

  // CORRECTION : Changer le type d'un utilisateur (admin/user) - test avec paramètre dans l'URL
  changeUserType: async (userId, newType) => {
    return await apiClient.patch(`/usertype/${userId}`, { newType });
  },

  // CORRECTION : Supprimer un utilisateur - endpoint corrigé selon la doc API  
  delete: async (userId) => {
    await apiClient.delete(`/user?id=${userId}`);
    return true;
  },

  // Déconnexion (supprime le token local)
  logout: () => {
    localStorage.removeItem('authToken');
    window.dispatchEvent(new Event('auth-changed'));
    return Promise.resolve(true);
  },
};