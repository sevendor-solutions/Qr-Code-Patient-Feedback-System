import React from 'react';
import { useTranslation } from 'react-i18next';

interface EmojiScaleProps {
  value: number;
  onChange: (val: number) => void;
}

export const EmojiScale: React.FC<EmojiScaleProps> = ({ value, onChange }) => {
  const { t } = useTranslation();

  const options = [
    { score: 1, emoji: '😠', color: '#EF4444', label: t('emojis.1') },
    { score: 2, emoji: '🙁', color: '#F97316', label: t('emojis.2') },
    { score: 3, emoji: '😐', color: '#EAB308', label: t('emojis.3') },
    { score: 4, emoji: '🙂', color: '#3B82F6', label: t('emojis.4') },
    { score: 5, emoji: '😃', color: '#10B981', label: t('emojis.5') },
  ];

  return (
    <div className="d-flex justify-content-between align-items-center gap-2 my-2" role="radiogroup" aria-label="Overall experience emoji scale">
      {options.map((opt) => {
        const isSelected = value === opt.score;
        return (
          <button
            key={opt.score}
            type="button"
            className="btn d-flex flex-column align-items-center justify-content-center p-2 flex-grow-1 border"
            style={{
              backgroundColor: isSelected ? `${opt.color}15` : '#FFFFFF',
              borderColor: isSelected ? opt.color : '#E5E7EB',
              borderWidth: isSelected ? '2px' : '1px',
              borderRadius: '8px',
              minHeight: '80px',
              transition: 'all 0.15s ease',
              transform: isSelected ? 'scale(1.05)' : 'none',
            }}
            onClick={() => onChange(opt.score)}
            aria-checked={isSelected}
            aria-label={`${opt.score} - ${opt.label}`}
          >
            <span style={{ fontSize: '2rem', lineHeight: 1 }}>{opt.emoji}</span>
            <span
              className="mt-1 text-center"
              style={{
                fontSize: '0.75rem',
                fontWeight: isSelected ? 800 : 600,
                color: isSelected ? opt.color : '#4B5563',
              }}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
