/**
 * PIGEON-FLY — Lost & Found Portal & Recovery Engine (BR-SKAN-008)
 * Manages emergency rescue reports for exhausted or drifted pigeons found by the public.
 * Enforces breeder privacy (masked loft coordinates), calculates drift distance from home loft,
 * and formats instant SOS notifications with click-to-call links.
 */

import { Coordinates } from './types';
import { calculateGeodesicDistanceMeters } from './racing';

export interface LostBirdRescueReport {
  id: string;
  pigeonId: string;
  ringNumber: string;
  qrCodeUuid: string;
  reportedAtIso: string;
  finderName?: string;
  finderPhone: string;
  finderEmail?: string;
  finderAddressHint?: string;
  finderNotes?: string;
  finderCoordinates?: Coordinates;
  loftCoordinates?: Coordinates;
  driftDistanceKm?: number;
  isResolved: boolean;
  resolvedAtIso?: string;
}

export interface BreederPrivacyMaskedProfile {
  ringNumber: string;
  loftName: string;
  contactPhone: string;
  pigeonPlumageColor: string;
  emergencyInstructions: string;
}

/**
 * Creates an emergency recovery report when a lost bird is scanned and reported.
 */
export function createRescueReport(params: {
  id?: string;
  pigeonId: string;
  ringNumber: string;
  qrCodeUuid: string;
  finderPhone: string;
  finderName?: string;
  finderEmail?: string;
  finderAddressHint?: string;
  finderNotes?: string;
  finderCoordinates?: Coordinates;
  loftCoordinates?: Coordinates;
  driftDistanceKm?: number;
  reportedAt?: Date;
}): LostBirdRescueReport {
  const reportedAtIso = (params.reportedAt || new Date()).toISOString();
  let driftDistanceKm: number | undefined = params.driftDistanceKm;

  if (params.loftCoordinates && params.finderCoordinates) {
    const meters = calculateGeodesicDistanceMeters(
      params.loftCoordinates,
      params.finderCoordinates
    );
    driftDistanceKm = parseFloat((meters / 1000).toFixed(1));
  }

  return {
    id: params.id || `sos-${Date.now()}`,
    pigeonId: params.pigeonId,
    ringNumber: params.ringNumber,
    qrCodeUuid: params.qrCodeUuid,
    reportedAtIso,
    finderName: params.finderName?.trim(),
    finderPhone: params.finderPhone.trim(),
    finderEmail: params.finderEmail?.trim(),
    finderAddressHint: params.finderAddressHint?.trim(),
    finderNotes: params.finderNotes?.trim(),
    finderCoordinates: params.finderCoordinates,
    loftCoordinates: params.loftCoordinates,
    driftDistanceKm,
    isResolved: false,
  };
}

/**
 * Generates privacy-safe public view for the finder who scanned the QR sticker.
 * Never exposes the breeder's private home address or exact loft GPS coordinates.
 */
export function maskBreederProfileForFinder(
  loftName: string,
  pigeonRing: string,
  plumage: string,
  breederPhone: string
): BreederPrivacyMaskedProfile {
  return {
    ringNumber: pigeonRing,
    loftName,
    contactPhone: breederPhone,
    pigeonPlumageColor: plumage,
    emergencyInstructions:
      'Prosimy napoić ptaka czystą letnią wodą (można dodać odrobinę cukru lub miodu) i podać pszenicę lub ryż. Nie zmuszać do lotu — ptak odpoczywa po wyczerpaniu.',
  };
}

/**
 * Formats high-priority push notification and SMS message for the owner.
 */
export function formatSosAlertNotification(report: LostBirdRescueReport): {
  title: string;
  body: string;
  callPhone: string;
} {
  const distanceText = report.driftDistanceKm !== undefined ? ` (~${report.driftDistanceKm} km od gołębnika)` : '';
  const locationText = report.finderAddressHint ? ` w lokalizacji: ${report.finderAddressHint}` : '';

  return {
    title: `🚨 ALARM SOS: Twój gołąb ${report.ringNumber} został odnaleziony!`,
    body: `Znalazca${report.finderName ? ` (${report.finderName})` : ''} zgłosił ptaka${locationText}${distanceText}. Tel: ${report.finderPhone}.`,
    callPhone: report.finderPhone,
  };
}

/**
 * Resolves a rescue report when the bird is safely picked up or returned home.
 */
export function resolveRescueReport(
  report: LostBirdRescueReport,
  resolvedAt: Date = new Date()
): LostBirdRescueReport {
  return {
    ...report,
    isResolved: true,
    resolvedAtIso: resolvedAt.toISOString(),
  };
}
