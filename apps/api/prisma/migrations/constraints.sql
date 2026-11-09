ALTER TABLE feedback_ratings DROP CONSTRAINT IF EXISTS check_rating_range;
ALTER TABLE feedback_ratings ADD CONSTRAINT check_rating_range CHECK (rating >= 1 AND rating <= 5);

ALTER TABLE feedbacks DROP CONSTRAINT IF EXISTS check_nps_range;
ALTER TABLE feedbacks ADD CONSTRAINT check_nps_range CHECK ("npsScore" >= 0 AND "npsScore" <= 10);

ALTER TABLE feedbacks DROP CONSTRAINT IF EXISTS check_emoji_range;
ALTER TABLE feedbacks ADD CONSTRAINT check_emoji_range CHECK ("overallEmoji" >= 1 AND "overallEmoji" <= 5);
