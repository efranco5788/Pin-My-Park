import React from 'react';

function NotSupportedPage() {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '20px',
        fontSize: '18px',
      }}
    >
      <h1>This App is Only Available on Mobile Devices</h1>
      <p>Please access this site using a mobile device.</p>
    </div>
  );
}

export default NotSupportedPage;