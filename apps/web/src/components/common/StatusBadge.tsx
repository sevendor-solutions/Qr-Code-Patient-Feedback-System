import React from 'react';
import { ComplaintStatus } from '@esushrut/shared';

interface StatusBadgeProps {
  status: ComplaintStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let badgeClass = 'badge-open';
  let label = status;

  switch (status) {
    case ComplaintStatus.OPEN:
      badgeClass = 'badge-open';
      label = 'OPEN';
      break;
    case ComplaintStatus.IN_PROGRESS:
      badgeClass = 'badge-in-progress';
      label = 'IN PROGRESS';
      break;
    case ComplaintStatus.RESOLVED:
      badgeClass = 'badge-resolved';
      label = 'RESOLVED';
      break;
    case ComplaintStatus.ESCALATED:
      badgeClass = 'badge-escalated';
      label = 'ESCALATED';
      break;
    case ComplaintStatus.CLOSED:
      badgeClass = 'badge-closed';
      label = 'CLOSED';
      break;
  }

  return (
    <span
      className={`badge ${badgeClass} px-2 py-1`}
      style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px' }}
    >
      {label}
    </span>
  );
};
