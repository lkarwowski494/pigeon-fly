/**
 * PIGEON-FLY — Core Domain Types and Interfaces
 * Offline-first field data structures with Supabase synchronization schema alignment.
 */

export type Sex = 'cock' | 'hen' | 'unknown';

export type PigeonStatus = 'racing' | 'breeding' | 'retired' | 'sold' | 'lost' | 'deceased';

export type LoftRole = 'owner' | 'member' | 'viewer';

export type RaceCategory = 'short' | 'middle' | 'long' | 'marathon' | 'young_birds';

export type FeatherStatus = 'intact' | 'dropped' | 'regrowing' | 'full';

export type HealthEventType = 'vaccine' | 'deworming' | 'antibiotic' | 'supplement' | 'treatment';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Loft {
  id: string;
  name: string;
  ownerId: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoftMember {
  id: string;
  loftId: string;
  userId: string;
  role: LoftRole;
  createdAt: string;
}

export interface Pigeon {
  id: string;
  loftId: string;
  ringNumber: string;
  countryCode: string;
  year: number;
  sex: Sex;
  plumageColor: string;
  eyeSign?: string;
  status: PigeonStatus;
  fatherId?: string | null;
  motherId?: string | null;
  photoUrl?: string;
  eyePhotoUrl?: string;
  wingPhotoUrl?: string;
  qrCodeUuid: string;
  notes?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Race {
  id: string;
  loftId: string;
  name: string;
  releaseName: string;
  releaseLat: number;
  releaseLon: number;
  releaseTime: string; // ISO 8601
  category: RaceCategory;
  isTraining: boolean;
  neutralStartTime?: string; // HH:mm:ss
  neutralEndTime?: string; // HH:mm:ss
  isLiveBroadcast: boolean;
  broadcastSlug?: string;
  status: 'open' | 'closed' | 'archived';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Arrival {
  id: string;
  raceId: string;
  pigeonId: string;
  arrivalTime: string; // ISO 8601
  distanceMeters: number;
  velocityMPerMin: number;
  scanType: 'qr' | 'manual' | 'nfc';
  isManualOverride: boolean;
  overrideReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pairing {
  id: string;
  loftId: string;
  cockId: string;
  henId: string;
  pairedDate: string; // YYYY-MM-DD
  nestBox?: string;
  inbreedingCoefficientF: number;
  egg1Date?: string;
  egg2Date?: string;
  owoscopyDate?: string;
  ringDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthLog {
  id: string;
  loftId: string;
  pigeonId?: string; // null for flock-level treatment
  eventType: HealthEventType;
  date: string; // YYYY-MM-DD
  productName: string;
  batchNumber?: string;
  withdrawalDays: number;
  nextDueDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MoultLog {
  id: string;
  pigeonId: string;
  checkDate: string; // YYYY-MM-DD
  primaryFeatherNumber: number; // 1 to 10
  status: FeatherStatus;
  lengthPct: number; // 0 to 100
  createdAt: string;
  updatedAt: string;
}

export interface LostPigeonReport {
  id: string;
  qrCodeUuid: string;
  ringNumber: string;
  finderName?: string;
  finderPhone: string;
  finderEmail?: string;
  latitude?: number;
  longitude?: number;
  addressHint?: string;
  finderNotes?: string;
  photoUrl?: string;
  isResolved: boolean;
  reportedAt: string;
}

export interface PedigreeNode {
  pigeon: Pigeon;
  father?: PedigreeNode | null;
  mother?: PedigreeNode | null;
  generation: number;
}

export interface SpeedCalculationResult {
  distanceMeters: number;
  flightDurationSeconds: number;
  neutralizedSeconds: number;
  netFlightDurationSeconds: number;
  velocityMPerMin: number;
  velocityKmH: number;
}
