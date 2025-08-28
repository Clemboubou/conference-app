import React, { useState, useEffect } from 'react';
import Header from '../components/Header.jsx';
import ConferenceList from '../components/ConferenceList.jsx';
import { conferenceAPI } from '../api';

const Home = () => {
  const [conferences, setConferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

    loadConferences();
  }, []);

  if (loading) {
    return (
      <div className="home">
        <Header />
        <main>
          <div className="loading">Chargement des conférences...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home">
        <Header />
        <main>
          <div className="error">{error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="home">
      <Header />
      <main>
        <h2>Conférences disponibles</h2>
        <ConferenceList conferences={conferences} />
      </main>
    </div>
  );
};

export default Home;
