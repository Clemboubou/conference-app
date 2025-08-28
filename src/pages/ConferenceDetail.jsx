import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { conferenceAPI } from '../api';

const ConferenceDetail = () => {
  const { id } = useParams();
  const [conference, setConference] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadConference = async () => {
      try {
        setLoading(true);
        const data = await conferenceAPI.getById(id);
        setConference(data);
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement de la conférence');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadConference();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="conference-detail">
        <Header />
        <main>
          <div className="loading">Chargement de la conférence...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="conference-detail">
        <Header />
        <main>
          <div className="error">{error}</div>
        </main>
      </div>
    );
  }

  if (!conference) {
    return (
      <div className="conference-detail">
        <Header />
        <main>
          <div className="error">Conférence non trouvée</div>
        </main>
      </div>
    );
  }

  // Appliquer les couleurs de la conférence si disponibles
  const conferenceStyle = conference.design ? {
    '--conference-main': conference.design.mainColor,
    '--conference-second': conference.design.secondColor,
  } : {};

  return (
    <div className="conference-detail" style={conferenceStyle}>
      <Header />
      <main>
        <div className="conference-detail-header" style={{
          background: conference.design 
            ? `linear-gradient(135deg, ${conference.design.mainColor}, ${conference.design.secondColor})`
            : undefined
        }}>
          <h2>{conference.title}</h2>
          {conference.date && <p className="conference-date-large">{conference.date}</p>}
        </div>
        
        <div className="conference-detail-content">
          {conference.img && (
            <img src={conference.img} alt={conference.title} className="conference-detail-image" />
          )}
          
          <div className="conference-description-full">
            <p>{conference.description}</p>
          </div>

          {conference.content && (
            <div className="conference-content-section">
              <h3>Contenu détaillé</h3>
              <div dangerouslySetInnerHTML={{ __html: conference.content }} />
            </div>
          )}

          <div className="conference-meta-detail">
            {conference.duration && (
              <div className="meta-item">
                <strong>Durée:</strong> {conference.duration}
              </div>
            )}
            
            {conference.osMap && (
              <div className="meta-item">
                <strong>Lieu:</strong>
                <div className="address">
                  {conference.osMap.addressl1 && <div>{conference.osMap.addressl1}</div>}
                  {conference.osMap.addressl2 && <div>{conference.osMap.addressl2}</div>}
                  {conference.osMap.postalCode && conference.osMap.city && (
                    <div>{conference.osMap.postalCode} {conference.osMap.city}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {conference.speakers && conference.speakers.length > 0 && (
            <div className="conference-speakers">
              <h3>Intervenants</h3>
              <div className="speakers-grid">
                {conference.speakers.map((speaker, index) => (
                  <div key={index} className="speaker-item">
                    <div className="speaker-name">
                      {speaker.firstname} {speaker.lastname}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {conference.stakeholders && conference.stakeholders.length > 0 && (
            <div className="conference-stakeholders">
              <h3>Parties prenantes</h3>
              <div className="stakeholders-grid">
                {conference.stakeholders.map((stakeholder, index) => (
                  <div key={index} className="stakeholder-item">
                    {stakeholder.img && (
                      <img src={stakeholder.img} alt={`${stakeholder.firstname} ${stakeholder.lastname}`} className="stakeholder-image" />
                    )}
                    <div className="stakeholder-info">
                      <div className="stakeholder-name">
                        {stakeholder.firstname} {stakeholder.lastname}
                      </div>
                      {stakeholder.job && (
                        <div className="stakeholder-job">{stakeholder.job}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ConferenceDetail;
