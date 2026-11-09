import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';

interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  readOnly?: boolean;
  size?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  readOnly = false,
  size = 28,
}) => {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="d-inline-flex align-items-center gap-1" role="radiogroup" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const ratingVal = star;
        const isFilled = (hover || value) >= ratingVal;

        return (
          <button
            key={star}
            type="button"
            className="btn btn-link p-1 text-decoration-none border-0"
            style={{
              cursor: readOnly ? 'default' : 'pointer',
              color: isFilled ? 'var(--gold-star)' : '#D1D5DB',
              transition: 'transform 0.1s ease',
            }}
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(ratingVal)}
            onMouseEnter={() => !readOnly && setHover(ratingVal)}
            onMouseLeave={() => !readOnly && setHover(null)}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            <FaStar size={size} />
          </button>
        );
      })}
    </div>
  );
};
