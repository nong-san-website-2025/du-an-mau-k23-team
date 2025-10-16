// src/features/cart/components/SimpleHeader.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/SimpleHeader.css';

const SimpleHeader = ({ title }) => {
  return (
    <header className="simple-header">
      <div className="header-content">
        <Link to="/" className="logo-link">
          <img src="/defaultLogo.png" alt="Logo" className="logo" />
        </Link>
        <span className="header-title">{title}</span>
      </div>
    </header>
  );
};

export default SimpleHeader;
