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
      <div className="ms-auto d-flex gap-1 flex-shrink-0">
        <NavLink
          to="/feedback?type=OPD"
          target="_blank"
          className="es-sub-item bg-success text-white fw-bold rounded px-2 py-1 text-decoration-none"
          style={{ fontSize: '0.78rem' }}
          title="Open Outpatient Feedback Form (10 Questions)"
        >
          📱 OPD QR View (10 Qs)
        </NavLink>
        <NavLink
          to="/feedback?type=IPD"
          target="_blank"
          className="es-sub-item bg-warning text-dark fw-bold rounded px-2 py-1 text-decoration-none"
          style={{ fontSize: '0.78rem' }}
          title="Open Inpatient Ward Feedback Form (20 Questions)"
        >
          📱 IPD QR View (20 Qs)
        </NavLink>
      </div>
    </div>
  );
};
