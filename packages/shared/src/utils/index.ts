import { NpsSummary } from '../types';

/**
 * Masks mobile number to comply with privacy rules: e.g. "9876543210" -> "98XXXXXX10"
 */
export function maskMobile(mobile: string | null | undefined): string {
  if (!mobile || mobile.length < 10) return 'XXXXXXXXXX';
  const clean = mobile.replace(/\D/g, '');
  if (clean.length !== 10) return mobile;
  return `${clean.slice(0, 2)}XXXXXX${clean.slice(8)}`;
}

/**
 * Generates human readable formatted ticket id: FB-YYYY-NNNNNN
 */
export function formatTicketId(year: number, sequenceNumber: number): string {
  const padded = String(sequenceNumber).padStart(6, '0');
  return `FB-${year}-${padded}`;
}

/**
 * Calculates NPS (Net Promoter Score):
 * Promoters (9-10), Passives (7-8), Detractors (0-6)
 * NPS = %Promoters - %Detractors (range -100 to +100)
 */
export function calculateNps(scores: number[]): NpsSummary {
  if (!scores || scores.length === 0) {
    return { promoters: 0, passives: 0, detractors: 0, totalResponses: 0, npsScore: 0 };
  }

  let promoters = 0;
  let passives = 0;
  let detractors = 0;

  for (const s of scores) {
    if (s >= 9) promoters++;
    else if (s >= 7) passives++;
    else detractors++;
  }

  const total = scores.length;
  const nps = Math.round(((promoters - detractors) / total) * 100);

  return {
    promoters,
    passives,
    detractors,
    totalResponses: total,
    npsScore: nps,
  };
}

/**
 * Basic XSS sanitizer: strips script tags, HTML angle brackets, and javascript pseudo-protocols
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .trim();
}

/**
 * Generates an HMAC-SHA256 digest hex token for QR validation
 */
export function createQrSignature(
  hospitalId: string,
  departmentId: string,
  locationId: string | null | undefined,
  secret: string,
): string {
  // Simple deterministic signature helper using standard crypto
  // We'll export the node crypto implementation in API and shared standard verification
  const crypto = require('crypto');
  const data = `${hospitalId}:${departmentId}:${locationId || 'default'}`;
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Verifies HMAC token for QR validation
 */
export function verifyQrSignature(
  hospitalId: string,
  departmentId: string,
  locationId: string | null | undefined,
  token: string,
  secret: string,
): boolean {
  try {
    const crypto = require('crypto');
    const expected = createQrSignature(hospitalId, departmentId, locationId, secret);
    const expectedBuf = Buffer.from(expected, 'hex');
    const tokenBuf = Buffer.from(token, 'hex');
    if (expectedBuf.length !== tokenBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, tokenBuf);
  } catch {
    return false;
  }
}
