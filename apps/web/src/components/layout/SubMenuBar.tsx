import React from 'react';
import { NavLink } from 'react-router-dom';

export const SubMenuBar: React.FC = () => {
  return (
    <div className="es-sub-nav d-flex align-items-center">
      <NavLink
        to="/admin"
        end
        className={({ isActive }) => `es-sub-item ${isActive ? 'active' : ''}`}
      >
        Feedback Overview
      </NavLink>
      <NavLink
        to="/admin/services/qr-generate"
        className={({ isActive }) => `es-sub-item ${isActive ? 'active' : ''}`}
      >
        Generate QR Code
      </NavLink>
      <NavLink
        to="/admin/services/bulk-print"
        className={({ isActive }) => `es-sub-item ${isActive ? 'active' : ''}`}
      >
        Bulk QR Print (A4)
      </NavLink>
      <NavLink
        to="/admin/services/feedback-list"
        className={({ isActive }) => `es-sub-item ${isActive ? 'active' : ''}`}
      >
        Feedback Listing
      </NavLink>
      <NavLink
        to="/admin/services/complaints"
        className={({ isActive }) => `es-sub-item ${isActive ? 'active' : ''}`}
      >
        Query & Complaint Management
      </NavLink>
      <NavLink
        to="/admin/setup"
        className={({ isActive }) => `es-sub-item ${isActive ? 'active' : ''}`}
      >
        Setup Masters
      </NavLink>
      <NavLink
        to="/admin/reports"
        className={({ isActive }) => `es-sub-item ${isActive ? 'active' : ''}`}
      >
        Reports & Analytics
      </NavLink>
      <div className="ms-auto d-flex flex-shrink-0">
        <NavLink
          to="/feedback"
          target="_blank"
          className="es-sub-item bg-warning text-dark fw-bold rounded px-3 py-1 text-decoration-none shadow-sm"
          style={{ fontSize: '0.82rem' }}
          title="Open Patient Mobile QR View (Choose OPD or IPD)"
        >
          📱 Patient Mobile QR View
        </NavLink>
      </div>
    </div>
  );
};
