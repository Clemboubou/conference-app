import React from 'react';
import { Link } from 'react-router-dom';

const ConferenceCard = ({ conference }) => {
  return (
    <div className="conference-card">
      {conference.img && (
        <img src={conference.img} alt={conference.title} className="conference-image" />
      )}
      <div className="conference-content">
        <h3>{conference.title}</h3>
        <p className="conference-description">{conference.description}</p>
        <div className="conference-meta">
          <span className="conference-date">{conference.date}</span>
          {conference.duration && (
            <span className="conference-duration">Durée: {conference.duration}</span>
          )}
        </div>
        <Link to={`/conference/${conference.id}`} className="conference-link">
          Voir les détails
        </Link>
      </div>
    </div>
  );
};

export default ConferenceCard;
