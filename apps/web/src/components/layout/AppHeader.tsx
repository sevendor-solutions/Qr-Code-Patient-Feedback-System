import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FaUser,
  FaUpload,
  FaSearch,
  FaBell,
  FaCog,
  FaPowerOff,
  FaHospitalSymbol,
} from 'react-icons/fa';

export const AppHeader: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="es-header d-flex justify-content-between align-items-center">
      <div className="d-flex align-items-center">
        <FaHospitalSymbol className="text-white me-2" size={28} />
        <span className="es-brand-title text-white">eSushrut</span>
        <span className="es-brand-badge">G5</span>
        <span className="text-white-50 ms-3 d-none d-md-inline" style={{ fontSize: '0.85rem' }}>
          | Hospital Management Information System (C-DAC)
        </span>
      </div>

      <div className="d-flex align-items-center">
        <span className="text-white fw-bold me-2" style={{ fontSize: '0.9rem' }}>
          Welcome : <span className="text-warning">{user?.fullName || 'Guest / Administrator'}</span>
          {user?.role && (
            <span className="badge bg-light text-primary ms-2" style={{ fontSize: '0.75rem' }}>
              {user.role}
            </span>
          )}
        </span>

        <button className="es-header-btn" title="User Profile" aria-label="User Profile">
          <FaUser />
        </button>
        <button className="es-header-btn" title="Quick Upload" aria-label="Upload">
          <FaUpload />
        </button>
        <button className="es-header-btn" title="Global Search" aria-label="Search">
          <FaSearch />
        </button>
        <button className="es-header-btn" title="Notifications" aria-label="Notifications">
          <FaBell />
        </button>
        <button className="es-header-btn" title="Settings" aria-label="Settings">
          <FaCog />
        </button>
        {user && (
          <button
            className="es-header-btn logout"
            title="Logout"
            aria-label="Logout"
            onClick={logout}
          >
            <FaPowerOff />
          </button>
        )}
      </div>
    </header>
  );
};
