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
      <NavLink
        to="/feedback?h=960cc5db-728e-4bf8-840f-cb2c17431772&d=f0ce19ee-83dd-45b3-b54c-2c8336b3d7e5&loc=09c7e400-5200-49ed-85c6-6e8979f20753&t=29c3f5aac9942713c4f37276b8b5d534527f9cc4bf3adb9e36ac253d5ba92c9e"
        target="_blank"
        className="es-sub-item ms-auto bg-warning text-dark fw-bold rounded px-2 py-1 text-decoration-none"
        style={{ fontSize: '0.8rem' }}
      >
        📱 Patient Mobile QR View
      </NavLink>
    </div>
  );
};
