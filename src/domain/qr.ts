/**
 * PIGEON-FLY — QR Code Engine & Micro-sticker Identifier
 * Payload formatting, parsing, and Lost & Found web URL generator.
 */

export interface ParsedQRPayload {
  isValid: boolean;
  version: number;
  qrCodeUuid: string;
  ringNumber?: string;
  rawPayload: string;
}

const QR_PREFIX = 'PIGEONFLY';
const CURRENT_VERSION = 1;

/**
 * Encodes pigeon identification into compact QR payload for micro-stickers.
 * Format: PIGEONFLY:V1:{qrCodeUuid}:{ringNumber}
 */
export function generateQRPayload(qrCodeUuid: string, ringNumber: string): string {
  const cleanRing = ringNumber.trim().replace(/\s+/g, '-');
  return `${QR_PREFIX}:V${CURRENT_VERSION}:${qrCodeUuid}:${cleanRing}`;
}

/**
 * Parses raw barcode/QR scanned string.
 * Supports both direct PIGEONFLY protocol strings and public web URLs (e.g. https://pigeonfly.app/find/...).
 */
export function parseQRPayload(raw: string): ParsedQRPayload {
  if (!raw || typeof raw !== 'string') {
    return { isValid: false, version: 0, qrCodeUuid: '', rawPayload: raw || '' };
  }

  const trimmed = raw.trim();

  // 1. Direct protocol match: PIGEONFLY:V1:{uuid}:{ring}
  if (trimmed.startsWith(`${QR_PREFIX}:`)) {
    const parts = trimmed.split(':');
    if (parts.length >= 3) {
      const versionStr = parts[1].replace(/^V/i, '');
      const version = parseInt(versionStr, 10) || 1;
      const qrCodeUuid = parts[2];
      const ringNumber = parts[3] ? parts[3].trim() : undefined;

      return {
        isValid: Boolean(qrCodeUuid && qrCodeUuid.length >= 10),
        version,
        qrCodeUuid,
        ringNumber,
        rawPayload: trimmed,
      };
    }
  }

  // 2. Web URL match: https://pigeonfly.app/find/{uuid} or https://pigeonfly.app/pedigree/{uuid}
  const urlMatch = trimmed.match(/\/find\/([0-9a-fA-F-]+)/i) || trimmed.match(/\/pedigree\/([0-9a-fA-F-]+)/i);
  if (urlMatch && urlMatch[1]) {
    return {
      isValid: true,
      version: 1,
      qrCodeUuid: urlMatch[1],
      rawPayload: trimmed,
    };
  }

  // 3. Raw UUID fallback
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (uuidRegex.test(trimmed)) {
    return {
      isValid: true,
      version: 1,
      qrCodeUuid: trimmed,
      rawPayload: trimmed,
    };
  }

  return {
    isValid: false,
    version: 0,
    qrCodeUuid: '',
    rawPayload: trimmed,
  };
}

/**
 * Generates public URL for lost pigeon finder report.
 */
export function getLostPigeonFinderUrl(qrCodeUuid: string): string {
  return `https://pigeonfly.app/find/${encodeURIComponent(qrCodeUuid)}`;
}

/**
 * Generates public URL for anti-counterfeit pedigree verification.
 */
export function getPedigreeVerificationUrl(qrCodeUuid: string): string {
  return `https://pigeonfly.app/pedigree/${encodeURIComponent(qrCodeUuid)}`;
}
