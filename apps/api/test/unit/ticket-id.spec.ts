import { formatTicketId } from '@esushrut/shared';

describe('Ticket ID Generation Utility', () => {
  it('should format ticket id with padded 6-digit sequence', () => {
    expect(formatTicketId(2026, 1)).toBe('FB-2026-000001');
    expect(formatTicketId(2026, 42)).toBe('FB-2026-000042');
    expect(formatTicketId(2026, 9999)).toBe('FB-2026-009999');
    expect(formatTicketId(2026, 123456)).toBe('FB-2026-123456');
  });

  it('should match the standard regex ^FB-\\d{4}-\\d{6}$', () => {
    const ticket = formatTicketId(2026, 105);
    const regex = /^FB-\d{4}-\d{6}$/;
    expect(regex.test(ticket)).toBe(true);
  });
});
