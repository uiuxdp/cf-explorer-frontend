export function HospitalCard({ hospital, severity, borderColor }) {
    console.log(hospital,"hospitalaa");
  return (
    <div 
      className="hospital-card" 
      style={{ 
        border: `2px solid ${borderColor}`,
        borderRadius: '8px',
        padding: '16px',
        margin: '8px 0',
        backgroundColor: '#fff'
      }}
    >
      <h3>{hospital?.name}</h3>
      <p><strong>Location:</strong> {hospital?.location}</p>
      <p><strong>Available Specialists:</strong></p>
      <ul>
        {hospital?.specialists?.map(spec => (
          <li key={spec?.department}>
            {spec?.department}: {spec?.doctors?.join(', ')} ({spec?.availability})
          </li>
        ))}
      </ul>
      <div className="contact-info">
        {hospital?.contact?.emergency && (
          <p className="emergency-contact">
            Emergency: {hospital?.contact.emergency}
          </p>
        )}
        <p>Reception: {hospital?.contact.reception}</p>
        <p>Appointments: {hospital?.contact.appointment}</p>
      </div>
      {severity >= 8 && hospital?.emergency && (
        <div className="emergency-alert">
          🚨 Emergency Services Available - Call 911 Immediately 🚨
        </div>
      )}
    </div>
  );
} 