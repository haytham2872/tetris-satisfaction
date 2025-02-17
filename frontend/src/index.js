import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import ClientApp from './ClientApp';
import AdminApp from './AdminApp';

const root = ReactDOM.createRoot(document.getElementById('root'));
const isAdmin = String(process.env.REACT_APP_MODE).trim().toLowerCase() === 'admin';

root.render(
  <React.StrictMode>
    {isAdmin ? <AdminApp /> : <ClientApp />}
  </React.StrictMode>
);