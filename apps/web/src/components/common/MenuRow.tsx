import React from 'react';
import { Link } from 'react-router-dom';
import { FaChevronRight } from 'react-icons/fa';

interface MenuRowProps {
  title: string;
  to: string;
  badge?: string | number;
  badgeBg?: string;
  description?: string;
}

export const MenuRow: React.FC<MenuRowProps> = ({
  title,
  to,
  badge,
  badgeBg = 'primary',
  description,
}) => {
  return (
    <Link to={to} className="es-menu-row">
      <div>
        <div className="d-flex align-items-center">
          <span>{title}</span>
          {badge !== undefined && (
            <span className={`badge bg-${badgeBg} ms-2 rounded-pill`} style={{ fontSize: '0.75rem' }}>
              {badge}
            </span>
          )}
        </div>
        {description && (
          <small className="text-muted fw-normal d-block" style={{ fontSize: '0.8rem' }}>
            {description}
          </small>
        )}
      </div>
      <FaChevronRight className="opacity-50" size={12} />
    </Link>
  );
};
