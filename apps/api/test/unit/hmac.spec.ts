import { createQrSignature, verifyQrSignature } from '@esushrut/shared';

describe('HMAC QR Signature Verification', () => {
  const secret = 'esushrut-cdac-secure-hmac-sha256-key-salt';
  const hospitalId = '960cc5db-728e-4bf8-840f-cb2c17431772';
  const departmentId = 'd86c7104-a55e-4007-85b4-d55ad5fb3ba6';
  const locationId = 'loc-room-104';

  it('should generate a valid 64-character hex signature', () => {
    const token = createQrSignature(hospitalId, departmentId, locationId, secret);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBe(64);
  });

  it('should verify a valid signature successfully', () => {
    const token = createQrSignature(hospitalId, departmentId, locationId, secret);
    const isValid = verifyQrSignature(hospitalId, departmentId, locationId, token, secret);
    expect(isValid).toBe(true);
  });

  it('should reject tampered or modified token', () => {
    const token = createQrSignature(hospitalId, departmentId, locationId, secret);
    const tampered = token.slice(0, -2) + 'aa';
    const isValid = verifyQrSignature(hospitalId, departmentId, locationId, tampered, secret);
    expect(isValid).toBe(false);
  });

  it('should reject if hospitalId or departmentId is modified', () => {
    const token = createQrSignature(hospitalId, departmentId, locationId, secret);
    const fakeDeptId = 'd86c7104-a55e-4007-85b4-d55ad5fb9999';
    const isValid = verifyQrSignature(hospitalId, fakeDeptId, locationId, token, secret);
    expect(isValid).toBe(false);
  });

  it('should handle optional locationId correctly', () => {
    const token = createQrSignature(hospitalId, departmentId, undefined, secret);
    expect(verifyQrSignature(hospitalId, departmentId, undefined, token, secret)).toBe(true);
    expect(verifyQrSignature(hospitalId, departmentId, 'some-loc', token, secret)).toBe(false);
  });
});
