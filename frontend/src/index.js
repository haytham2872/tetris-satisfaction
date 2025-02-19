import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import ClientApp from './ClientApp';
import AdminApp from './AdminApp';

const root = ReactDOM.createRoot(document.getElementById('root'));
const isAdmin = String(process.env.REACT_APP_MODE).trim().toLowerCase() === 'admin';

root.render(
  <React.StrictMode>
    {isAdmin ? (
      <AdminApp />
    ) : (
      <BrowserRouter>
        <Routes>
          <Route path="/:formId" element={<ClientApp />} />
          <Route path="/" element={<ClientApp />} />
        </Routes>
      </BrowserRouter>
    )}
  </React.StrictMode>
);