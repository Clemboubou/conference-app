import React from 'react';
import ConferenceCard from './ConferenceCard.jsx';

const ConferenceList = ({ conferences }) => {
  return (
    <div className="conference-list">
      {conferences && conferences.map((conference) => (
        <ConferenceCard key={conference.id} conference={conference} />
      ))}
    </div>
  );
};

export default ConferenceList;
