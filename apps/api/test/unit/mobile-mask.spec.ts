import { maskMobile } from '@esushrut/shared';

describe('Mobile Number Masking Utility', () => {
  it('should mask 10-digit mobile number keeping first 2 and last 2 digits visible', () => {
    expect(maskMobile('9876543210')).toBe('98XXXXXX10');
    expect(maskMobile('9811223344')).toBe('98XXXXXX44');
    expect(maskMobile('7890123456')).toBe('78XXXXXX56');
  });

  it('should handle formatted or string input with non-digits', () => {
    expect(maskMobile('98-765-43210')).toBe('98XXXXXX10');
  });

  it('should handle null, undefined, or invalid lengths gracefully', () => {
    expect(maskMobile(null)).toBe('XXXXXXXXXX');
    expect(maskMobile(undefined)).toBe('XXXXXXXXXX');
    expect(maskMobile('123')).toBe('XXXXXXXXXX');
  });
});
