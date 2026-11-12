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
    <header className="es-header d-flex flex-wrap justify-content-between align-items-center gap-2">
      <div className="d-flex align-items-center flex-wrap">
        <div
          className="d-inline-flex align-items-center justify-content-center bg-warning text-dark rounded-circle me-2 shadow-sm"
          style={{ width: '32px', height: '32px', fontSize: '16px', fontWeight: '900' }}
        >
          H
        </div>
        <span className="es-brand-title text-white">DHH KATAKA</span>
        <span className="es-brand-badge">ODISHA</span>
        <span className="text-white-50 ms-2 d-none d-sm-inline" style={{ fontSize: '0.8rem' }}>
          | District Head Hospital (ଜିଲ୍ଲା ମୁଖ୍ୟ ଚିକିତ୍ସାଳୟ, କଟକ)
        </span>
      </div>

      <div className="d-flex align-items-center flex-wrap gap-1 ms-auto">
        <span className="text-white fw-bold me-2 d-none d-md-inline" style={{ fontSize: '0.85rem' }}>
          Welcome: <span className="text-warning">{user?.fullName || 'Administrator'}</span>
          {user?.role && (
            <span className="badge bg-light text-primary ms-2" style={{ fontSize: '0.72rem' }}>
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
