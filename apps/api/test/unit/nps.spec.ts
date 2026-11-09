import { calculateNps } from '@esushrut/shared';

describe('NPS (Net Promoter Score) Calculation', () => {
  it('should return 0 when scores array is empty', () => {
    const res = calculateNps([]);
    expect(res.npsScore).toBe(0);
    expect(res.totalResponses).toBe(0);
    expect(res.promoters).toBe(0);
  });

  it('should calculate +100 when all scores are 9 or 10 (Promoters)', () => {
    const res = calculateNps([9, 10, 9, 10, 10]);
    expect(res.promoters).toBe(5);
    expect(res.passives).toBe(0);
    expect(res.detractors).toBe(0);
    expect(res.npsScore).toBe(100);
  });

  it('should calculate -100 when all scores are 0 to 6 (Detractors)', () => {
    const res = calculateNps([0, 2, 4, 6, 5]);
    expect(res.promoters).toBe(0);
    expect(res.passives).toBe(0);
    expect(res.detractors).toBe(5);
    expect(res.npsScore).toBe(-100);
  });

  it('should correctly calculate mixed scores: 50% Promoters, 30% Passives, 20% Detractors -> +30 NPS', () => {
    // 5 promoters (9,10), 3 passives (7,8), 2 detractors (0-6) -> (5 - 2) / 10 = +30%
    const scores = [10, 9, 9, 10, 9, 8, 7, 8, 3, 4];
    const res = calculateNps(scores);
    expect(res.promoters).toBe(5);
    expect(res.passives).toBe(3);
    expect(res.detractors).toBe(2);
    expect(res.npsScore).toBe(30);
  });
});
