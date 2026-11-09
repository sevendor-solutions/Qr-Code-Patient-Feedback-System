import React from 'react';

interface NpsScaleProps {
  value: number;
  onChange: (val: number) => void;
}

export const NpsScale: React.FC<NpsScaleProps> = ({ value, onChange }) => {
  return (
    <div className="my-3">
      <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.8rem', color: '#6B7280' }}>
        <span>0 = Not Likely</span>
        <span>5 = Neutral</span>
        <span>10 = Extremely Likely</span>
      </div>

      <div className="d-flex flex-wrap gap-1 justify-content-between" role="radiogroup" aria-label="NPS Score 0 to 10">
        {Array.from({ length: 11 }, (_, i) => i).map((score) => {
          const isSelected = value === score;
          let activeColor = '#EF4444'; // Detractor (0-6)
          if (score >= 9) activeColor = '#10B981'; // Promoter (9-10)
          else if (score >= 7) activeColor = '#F59E0B'; // Passive (7-8)

          return (
            <button
              key={score}
              type="button"
              className="btn flex-grow-1 p-0 d-flex align-items-center justify-content-center border"
              style={{
                minWidth: '32px',
                height: '42px',
                borderRadius: '6px',
                fontWeight: isSelected ? 800 : 600,
                fontSize: '0.95rem',
                backgroundColor: isSelected ? activeColor : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : '#374151',
                borderColor: isSelected ? activeColor : '#D1D5DB',
                transition: 'all 0.15s ease',
              }}
              onClick={() => onChange(score)}
              aria-checked={isSelected}
              aria-label={`Score ${score}`}
            >
              {score}
            </button>
          );
        })}
      </div>

      <div className="d-flex justify-content-between mt-1 text-muted" style={{ fontSize: '0.75rem' }}>
        <span className="text-danger fw-semibold">0-6 Detractors</span>
        <span className="text-warning fw-semibold">7-8 Passives</span>
        <span className="text-success fw-semibold">9-10 Promoters</span>
      </div>
    </div>
  );
};
