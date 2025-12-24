import React from 'react';

const Timeline = ({ stops, etas, runningStatus }) => {
  const formatDuration = (seconds) => {
    if (seconds === null || seconds === undefined) {
      return 'N/A';
    }
    const minutes = Math.round(seconds / 60);
    if (minutes < 1) return 'Arriving now';
    if (minutes === 1) return '1 min';
    return `${minutes} mins`;
  };

  const getEtaForStop = (stopId) => {
    if (!etas) return null;
    return etas.find(eta => eta.stopId === stopId);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Route Timeline</h2>
      <div style={{ padding: '10px 0', backgroundColor: '#f7f7f7', textAlign: 'center', marginBottom: '15px', borderRadius: '5px' }}>
        <strong>Bus Status:</strong> {runningStatus}
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {stops.map((stop, index) => {
          const etaData = getEtaForStop(stop._id);
          const duration = etaData ? formatDuration(etaData.duration) : 'Calculating...';
          const isLast = index === stops.length - 1;

          return (
            <li key={stop._id} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: isLast ? 0 : '20px' }}>
              <div style={{ marginRight: '15px', textAlign: 'center' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#007bff',
                  border: '2px solid white',
                  boxShadow: '0 0 0 2px #007bff',
                }}></div>
                {!isLast && (
                  <div style={{
                    width: '2px',
                    height: '40px',
                    backgroundColor: '#007bff',
                    margin: '4px auto 0',
                  }}></div>
                )}
              </div>
              <div>
                <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>{stop.stopName}</p>
                <p style={{ margin: 0, color: '#555' }}>
                  Arrival in: <span style={{ fontWeight: 'bold' }}>{duration}</span>
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Timeline;