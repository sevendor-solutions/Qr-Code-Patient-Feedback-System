import React, { useState, useEffect } from 'react';

export const AppFooter: React.FC = () => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      setTimeStr(now.toLocaleDateString('en-IN', options));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <footer className="es-footer">
      <div className="d-flex align-items-center">
        <span
          className="badge bg-warning text-dark fw-bold me-2 px-2 py-1"
          style={{ letterSpacing: '1px' }}
        >
          C-DAC
        </span>
        <span className="fw-semibold">eSushrut G5 - Hospital Management System</span>
      </div>

      <div className="text-center fw-normal opacity-90 d-none d-md-block">
        © Centre For Development Of Advanced Computing
      </div>

      <div className="text-end fw-bold" style={{ color: '#C6E85A', fontFamily: 'monospace' }}>
        {timeStr}
      </div>
    </footer>
  );
};
