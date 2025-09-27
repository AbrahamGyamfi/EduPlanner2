import React from 'react';

const DebugInfo = () => {
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      right: '10px', 
      background: '#000', 
      color: '#fff', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div>Environment: {process.env.NODE_ENV}</div>
      <div>API URL: {process.env.REACT_APP_API_BASE_URL || 'Not set'}</div>
      <div>Build: {new Date().toISOString()}</div>
      <div>Router: {window.location.pathname}</div>
    </div>
  );
};

export default DebugInfo;