import React from 'react';
import { NavLink } from 'react-router-dom';

export const MainNav: React.FC = () => {
  return (
    <nav className="es-main-nav">
      <NavLink
        to="/admin"
        className={({ isActive }) => `es-nav-item ${isActive ? 'active' : ''}`}
      >
        Feedback & Grievances
      </NavLink>
      <span className="es-nav-item opacity-75" style={{ cursor: 'not-allowed' }}>
        OPD
      </span>
      <span className="es-nav-item opacity-75" style={{ cursor: 'not-allowed' }}>
        IPD
      </span>
      <span className="es-nav-item opacity-75" style={{ cursor: 'not-allowed' }}>
        Emergency
      </span>
      <span className="es-nav-item opacity-75" style={{ cursor: 'not-allowed' }}>
        Pharmacy
      </span>
      <span className="es-nav-item opacity-75" style={{ cursor: 'not-allowed' }}>
        Diagnostics
      </span>
      <span className="es-nav-item opacity-75" style={{ cursor: 'not-allowed' }}>
        Billing
      </span>
      <NavLink
        to="/admin/reports"
        className={({ isActive }) => `es-nav-item ${isActive ? 'active' : ''}`}
      >
        Executive Reports
      </NavLink>
      <NavLink
        to="/feedback?h=960cc5db-728e-4bf8-840f-cb2c17431772&d=f0ce19ee-83dd-45b3-b54c-2c8336b3d7e5&t=87a09bb565b8a9ebbc0c1e573a0407333d82f7a7c7ba55b4922b48bbbc212551"
        target="_blank"
        className="es-nav-item ms-auto bg-warning text-dark fw-bold"
      >
        📱 Patient Mobile QR View
      </NavLink>
    </nav>
  );
};
