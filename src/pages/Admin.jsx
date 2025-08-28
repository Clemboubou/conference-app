import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { conferenceAPI, userAPI } from '../api';

const Admin = () => {
  const navigate = useNavigate();
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [newConference, setNewConference] = useState({
    title: '',
    description: '',
    date: '',
    img: '',
    content: '',
    duration: '',
    location: '',
    design: {
      mainColor: '#2563eb',
      secondColor: '#1d4ed8'
    }
  });
  const [editingConference, setEditingConference] = useState(null);

  // Mémoïser la fonction pour satisfaire eslint exhaustive-deps
  const checkAuthentication = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      // Vérifier si l'utilisateur est admin
      const isAdmin = await userAPI.verifyCurrentUserIsAdmin();
      if (!isAdmin) throw new Error('not-admin');
      setIsAuthenticated(true);
      loadConferences();
    } catch (err) {
      console.error('Non autorisé:', err);
      setError('Vous devez être connecté en tant qu\'administrateur pour accéder à cette page');
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [navigate]);

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  const loadConferences = async () => {
    try {
      setLoading(true);
      const data = await conferenceAPI.getAll();
      setConferences(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des conférences');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validation du format d'image (PNG ou JPG uniquement)
      const imgUrl = (newConference.img || '').trim();
      const isValidImage = /\.(png|jpe?g)(\?.*)?$/i.test(imgUrl);
      if (!isValidImage) {
        throw new Error("L'image doit être au format PNG ou JPG (.png, .jpg, .jpeg)");
      }

      // Générer un id requis par l'API (voir contexte.md) basé sur le titre + date
      const base = `${newConference.title} ${newConference.date}`.toString();
      let slug = base
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retirer accents
        .toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      if (!slug) slug = `conf-${Date.now()}`;
      // Ajouter un suffixe temporel pour éviter les collisions
      const generatedId = `${slug}-${Date.now()}`;

      // Créer l'objet avec seulement les champs requis selon l'API
      const conferencePayload = {
        id: generatedId,
        title: newConference.title,
        description: newConference.description,
        date: newConference.date,
        img: newConference.img,
        content: newConference.content,
        // Fournir des tableaux vides si backend exige la présence des clés
        speakers: [],
        stakeholders: [],
        ...(newConference.duration && { duration: newConference.duration }),
        ...(newConference.location && { location: newConference.location }),
        design: {
          mainColor: newConference.design.mainColor,
          secondColor: newConference.design.secondColor
        }
      };

      console.log('Payload à envoyer:', conferencePayload);
      await conferenceAPI.create(conferencePayload);
      
      // Réinitialiser le formulaire
      setNewConference({
        title: '',
        description: '',
        date: '',
        img: '',
        content: '',
        duration: '',
        location: '',
        design: {
          mainColor: '#2563eb',
          secondColor: '#1d4ed8'
        }
      });
      // Recharger la liste des conférences
      await loadConferences();
    } catch (err) {
      setError(`Erreur lors de la création de la conférence: ${err.message}`);
      console.error('Erreur:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'mainColor' || name === 'secondColor') {
      setNewConference({
        ...newConference,
        design: {
          ...newConference.design,
          [name]: value
        }
      });
    } else {
      setNewConference({
        ...newConference,
        [name]: value
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette conférence ?')) {
      try {
        await conferenceAPI.delete(id);
        await loadConferences();
      } catch (err) {
        setError('Erreur lors de la suppression de la conférence');
        console.error('Erreur:', err);
      }
    }
  };

  const handleEdit = (conference) => {
    setEditingConference({
      ...conference,
      location: conference.location || '',
      duration: conference.duration || '',
      design: conference.design || { mainColor: '#2563eb', secondColor: '#1d4ed8' }
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const updatePayload = {
        title: editingConference.title,
        description: editingConference.description,
        date: editingConference.date,
        img: editingConference.img,
        content: editingConference.content,
        speakers: editingConference.speakers || [],
        stakeholders: editingConference.stakeholders || [],
        ...(editingConference.duration && { duration: editingConference.duration }),
        ...(editingConference.location && { location: editingConference.location }),
        design: editingConference.design
      };

      await conferenceAPI.update(editingConference.id, updatePayload);
      setEditingConference(null);
      await loadConferences();
    } catch (err) {
      setError(`Erreur lors de la modification: ${err.message}`);
      console.error('Erreur:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'mainColor' || name === 'secondColor') {
      setEditingConference({
        ...editingConference,
        design: {
          ...editingConference.design,
          [name]: value
        }
      });
    } else {
      setEditingConference({
        ...editingConference,
        [name]: value
      });
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="admin">
        <Header />
        <main>
          <div className="loading">
            {!isAuthenticated ? 'Vérification des droits d\'accès...' : 'Chargement des conférences...'}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin">
      <Header />
      <main>
        <h2>Administration des conférences</h2>
        
        {error && <div className="error">{error}</div>}
        
        {editingConference && (
          <section>
            <h3>Modifier la conférence</h3>
            <form onSubmit={handleUpdate}>
              <div>
                <label htmlFor="edit-title">Titre *:</label>
                <input
                  type="text"
                  id="edit-title"
                  name="title"
                  value={editingConference.title}
                  onChange={handleEditChange}
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label htmlFor="edit-description">Description *:</label>
                <textarea
                  id="edit-description"
                  name="description"
                  value={editingConference.description}
                  onChange={handleEditChange}
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label htmlFor="edit-date">Date *:</label>
                <input
                  type="date"
                  id="edit-date"
                  name="date"
                  value={editingConference.date}
                  onChange={handleEditChange}
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label htmlFor="edit-img">URL de l'image *:</label>
                <input
                  type="url"
                  id="edit-img"
                  name="img"
                  value={editingConference.img}
                  onChange={handleEditChange}
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label htmlFor="edit-content">Contenu détaillé *:</label>
                <textarea
                  id="edit-content"
                  name="content"
                  value={editingConference.content}
                  onChange={handleEditChange}
                  required
                  disabled={submitting}
                  rows="6"
                />
              </div>
              <div>
                <label htmlFor="edit-duration">Durée:</label>
                <input
                  type="text"
                  id="edit-duration"
                  name="duration"
                  value={editingConference.duration}
                  onChange={handleEditChange}
                  disabled={submitting}
                />
              </div>
              <div>
                <label htmlFor="edit-location">Lieu:</label>
                <input
                  type="text"
                  id="edit-location"
                  name="location"
                  value={editingConference.location}
                  onChange={handleEditChange}
                  disabled={submitting}
                />
              </div>
              <div>
                <label htmlFor="edit-mainColor">Couleur principale:</label>
                <input
                  type="color"
                  id="edit-mainColor"
                  name="mainColor"
                  value={editingConference.design.mainColor}
                  onChange={handleEditChange}
                  disabled={submitting}
                />
              </div>
              <div>
                <label htmlFor="edit-secondColor">Couleur secondaire:</label>
                <input
                  type="color"
                  id="edit-secondColor"
                  name="secondColor"
                  value={editingConference.design.secondColor}
                  onChange={handleEditChange}
                  disabled={submitting}
                />
              </div>
              <button type="submit" disabled={submitting}>
                {submitting ? 'Modification...' : 'Modifier'}
              </button>
              <button type="button" onClick={() => setEditingConference(null)}>
                Annuler
              </button>
            </form>
          </section>
        )}

        <section>
          <h3>Ajouter une conférence</h3>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="title">Titre *:</label>
              <input
                type="text"
                id="title"
                name="title"
                value={newConference.title}
                onChange={handleChange}
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="description">Description *:</label>
              <textarea
                id="description"
                name="description"
                value={newConference.description}
                onChange={handleChange}
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="date">Date *:</label>
              <input
                type="date"
                id="date"
                name="date"
                value={newConference.date}
                onChange={handleChange}
                required
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="img">URL de l'image *:</label>
              <input
                type="url"
                id="img"
                name="img"
                value={newConference.img}
                onChange={handleChange}
                required
                disabled={submitting}
                placeholder="https://example.com/image.jpg"
                pattern="https?://.*\.(png|jpe?g)(\?.*)?$"
                title="URL d'image en .png, .jpg ou .jpeg"
              />
            </div>
            <div>
              <label htmlFor="content">Contenu détaillé *:</label>
              <textarea
                id="content"
                name="content"
                value={newConference.content}
                onChange={handleChange}
                required
                disabled={submitting}
                rows="6"
                placeholder="Contenu HTML accepté"
              />
            </div>
            <div>
              <label htmlFor="duration">Durée:</label>
              <input
                type="text"
                id="duration"
                name="duration"
                value={newConference.duration}
                onChange={handleChange}
                disabled={submitting}
                placeholder="Ex: 2 heures"
              />
            </div>
            <div>
              <label htmlFor="location">Lieu:</label>
              <input
                type="text"
                id="location"
                name="location"
                value={newConference.location}
                onChange={handleChange}
                disabled={submitting}
                placeholder="Ex: Salle de conférence A, Paris"
              />
            </div>
            <div>
              <label htmlFor="mainColor">Couleur principale:</label>
              <input
                type="color"
                id="mainColor"
                name="mainColor"
                value={newConference.design.mainColor}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="secondColor">Couleur secondaire:</label>
              <input
                type="color"
                id="secondColor"
                name="secondColor"
                value={newConference.design.secondColor}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Création en cours...' : 'Créer la conférence'}
            </button>
          </form>
        </section>

        <section>
          <h3>Conférences existantes ({conferences.length})</h3>
          {conferences.length === 0 ? (
            <p>Aucune conférence trouvée. Créez-en une ci-dessus !</p>
          ) : (
            <div className="admin-conference-list">
              {conferences.map((conference) => (
                <div key={conference.id} className="admin-conference-item">
                  <div>
                    <h4>{conference.title}</h4>
                    <p>{conference.date}</p>
                    <p className="conference-description">{conference.description}</p>
                  </div>
                  <div>
                    <button 
                      onClick={() => handleEdit(conference)}
                      className="promote-btn"
                      style={{ marginRight: '0.5rem' }}
                    >
                      Modifier
                    </button>
                    <button 
                      onClick={() => handleDelete(conference.id)}
                      className="delete-btn"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Admin;
