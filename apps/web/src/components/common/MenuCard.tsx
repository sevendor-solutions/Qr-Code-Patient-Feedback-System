import React from 'react';

interface MenuCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export const MenuCard: React.FC<MenuCardProps> = ({ title, icon, children }) => {
  return (
    <div className="es-card h-100">
      <div className="es-card-header">
        <span className="text-primary fs-5 d-flex align-items-center">{icon}</span>
        <h3 className="es-card-title">{title}</h3>
      </div>
      <div className="p-0">{children}</div>
    </div>
  );
};
