/**
 * PIGEON-FLY — Tandem & Multi-Breeder Loft Sharing Engine (BR-STADO-009, Z-057)
 * Role-Based Access Control (RBAC), multi-user synchronization,
 * invitation tokens, and immutable audit logs for shared loft management.
 */

export type TandemRole =
  | 'senior_breeder' // Główny Hodowca (Pełne uprawnienia, zarządzanie zespołem)
  | 'loft_partner' // Wspólnik / Ko-właściciel (Loty, lęgi, koszowanie, bez usuwania stada)
  | 'loft_assistant' // Asystent Gołębnika (Rejestracja przylotów, pojenie, karmienie, szczepienia)
  | 'guest_observer'; // Obserwator / Weterynarz (Tylko odczyt: karty zdrowia, wyniki, rodowody)

export type TandemAction =
  | 'view_data'
  | 'register_arrival'
  | 'basket_birds'
  | 'log_health'
  | 'log_nutrition'
  | 'edit_pedigree'
  | 'edit_pigeon'
  | 'delete_pigeon'
  | 'manage_members'
  | 'export_database';

export interface TandemMember {
  id: string;
  loftId: string;
  userId: string;
  name: string;
  email: string;
  role: TandemRole;
  phone?: string;
  pzhgpSection?: string; // np. 0284 Rawicz
  joinedAt: string; // ISO 8601
  status: 'active' | 'suspended';
}

export interface TandemInvite {
  id: string;
  loftId: string;
  loftName: string;
  role: TandemRole;
  token: string;
  invitedEmail?: string;
  createdByUserId: string;
  createdByUserName: string;
  createdAt: string; // ISO 8601
  expiresAt: string; // ISO 8601
  isUsed: boolean;
  usedAt?: string;
  usedByUserId?: string;
}

export interface TandemAuditLogEntry {
  id: string;
  loftId: string;
  userId: string;
  userName: string;
  userRole: TandemRole;
  action: TandemAction;
  targetType: 'pigeon' | 'race' | 'arrival' | 'health' | 'nutrition' | 'tandem' | 'backup';
  targetId?: string;
  targetDescription: string;
  timestamp: string; // ISO 8601
}

/**
 * Role-based permission matrix.
 */
const ROLE_PERMISSIONS: Record<TandemRole, Set<TandemAction>> = {
  senior_breeder: new Set([
    'view_data',
    'register_arrival',
    'basket_birds',
    'log_health',
    'log_nutrition',
    'edit_pedigree',
    'edit_pigeon',
    'delete_pigeon',
    'manage_members',
    'export_database',
  ]),
  loft_partner: new Set([
    'view_data',
    'register_arrival',
    'basket_birds',
    'log_health',
    'log_nutrition',
    'edit_pedigree',
    'edit_pigeon',
    'export_database',
  ]),
  loft_assistant: new Set([
    'view_data',
    'register_arrival',
    'basket_birds',
    'log_health',
    'log_nutrition',
  ]),
  guest_observer: new Set(['view_data']),
};

/**
 * Checks whether a tandem role is authorized to perform a specific action.
 */
export function canPerformAction(role: TandemRole, action: TandemAction): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.has(action) : false;
}

/**
 * Returns user-facing label and styling metadata for tandem roles.
 */
export function getTandemRoleMeta(role: TandemRole): {
  label: string;
  description: string;
  badgeColor: string;
  badgeBg: string;
} {
  switch (role) {
    case 'senior_breeder':
      return {
        label: 'Główny Hodowca',
        description: 'Pełna kontrola nad gołębnikiem, zespołem i licencją',
        badgeColor: '#E5A93C',
        badgeBg: '#382B14',
      };
    case 'loft_partner':
      return {
        label: 'Wspólnik / Partner',
        description: 'Zarządzanie lotami, lęgami, koszowaniem i rodowodami',
        badgeColor: '#60A5FA',
        badgeBg: '#1E293B',
      };
    case 'loft_assistant':
      return {
        label: 'Asystent Gołębnika',
        description: 'Rejestracja przylotów, koszowanie, pojenie i szczepienia',
        badgeColor: '#34D399',
        badgeBg: '#132E22',
      };
    case 'guest_observer':
      return {
        label: 'Obserwator / Weterynarz',
        description: 'Wgląd w karty zdrowia, wyniki lotowe i rodowody (tylko odczyt)',
        badgeColor: '#A78BFA',
        badgeBg: '#2E1E47',
      };
  }
}

/**
 * Creates an initial owner tandem member.
 */
export function createDefaultTandem(params: {
  loftId: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  pzhgpSection?: string;
}): TandemMember[] {
  return [
    {
      id: `member-${params.ownerId}`,
      loftId: params.loftId,
      userId: params.ownerId,
      name: params.ownerName,
      email: params.ownerEmail,
      role: 'senior_breeder',
      pzhgpSection: params.pzhgpSection,
      joinedAt: new Date().toISOString(),
      status: 'active',
    },
  ];
}

/**
 * Generates a secure invitation token for onboarding a tandem partner.
 */
export function createTandemInvite(params: {
  loftId: string;
  loftName: string;
  role: TandemRole;
  createdByUserId: string;
  createdByUserName: string;
  invitedEmail?: string;
  expiresInHours?: number;
}): TandemInvite {
  const {
    loftId,
    loftName,
    role,
    createdByUserId,
    createdByUserName,
    invitedEmail,
    expiresInHours = 168, // 7 dni domyślnie
  } = params;

  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + expiresInHours * 3600 * 1000);

  // Unikalny token o formacie: PFLY-TANDEM-XXXXXX-XXXX
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  const token = `PFLY-TANDEM-${loftId.substring(0, 4).toUpperCase()}-${randomSuffix}`;

  return {
    id: `inv-${Date.now()}-${randomSuffix}`,
    loftId,
    loftName,
    role,
    token,
    invitedEmail,
    createdByUserId,
    createdByUserName,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    isUsed: false,
  };
}

/**
 * Validates an invite token.
 */
export function verifyTandemInvite(
  invite: TandemInvite,
  nowIso: string = new Date().toISOString()
): { valid: boolean; reason?: string } {
  if (invite.isUsed) {
    return { valid: false, reason: 'Zaproszenie zostało już wykorzystane.' };
  }

  const now = new Date(nowIso).getTime();
  const expiry = new Date(invite.expiresAt).getTime();

  if (now > expiry) {
    return { valid: false, reason: 'Zaproszenie wygasło. Poproś o wygenerowanie nowego kodu.' };
  }

  return { valid: true };
}

/**
 * Accepts an invitation and adds the user as a TandemMember.
 */
export function acceptTandemInvite(params: {
  invite: TandemInvite;
  user: {
    userId: string;
    name: string;
    email: string;
    phone?: string;
    pzhgpSection?: string;
  };
  nowIso?: string;
}): { member: TandemMember; updatedInvite: TandemInvite } {
  const { invite, user, nowIso = new Date().toISOString() } = params;

  const verification = verifyTandemInvite(invite, nowIso);
  if (!verification.valid) {
    throw new Error(verification.reason || 'Nieprawidłowe zaproszenie');
  }

  const updatedInvite: TandemInvite = {
    ...invite,
    isUsed: true,
    usedAt: nowIso,
    usedByUserId: user.userId,
  };

  const member: TandemMember = {
    id: `member-${user.userId}-${Date.now().toString(36)}`,
    loftId: invite.loftId,
    userId: user.userId,
    name: user.name,
    email: user.email,
    role: invite.role,
    phone: user.phone,
    pzhgpSection: user.pzhgpSection,
    joinedAt: nowIso,
    status: 'active',
  };

  return { member, updatedInvite };
}

/**
 * Safeguard for updating member role: ensuring at least one senior_breeder remains.
 */
export function updateTandemMemberRole(params: {
  members: TandemMember[];
  targetMemberId: string;
  newRole: TandemRole;
}): TandemMember[] {
  const { members, targetMemberId, newRole } = params;

  const target = members.find((m) => m.id === targetMemberId);
  if (!target) {
    throw new Error('Nie znaleziono członka tandemu o podanym ID.');
  }

  if (target.role === 'senior_breeder' && newRole !== 'senior_breeder') {
    const seniorCount = members.filter(
      (m) => m.role === 'senior_breeder' && m.status === 'active'
    ).length;
    if (seniorCount <= 1) {
      throw new Error('Gołębnik musi posiadać przynajmniej jednego aktywnego Głównego Hodowcę.');
    }
  }

  return members.map((m) => (m.id === targetMemberId ? { ...m, role: newRole } : m));
}

/**
 * Safeguard for removing a tandem member: ensuring at least one senior_breeder remains.
 */
export function removeTandemMember(params: {
  members: TandemMember[];
  targetMemberId: string;
}): TandemMember[] {
  const { members, targetMemberId } = params;

  const target = members.find((m) => m.id === targetMemberId);
  if (!target) {
    throw new Error('Nie znaleziono członka tandemu do usunięcia.');
  }

  if (target.role === 'senior_breeder') {
    const seniorCount = members.filter(
      (m) => m.role === 'senior_breeder' && m.status === 'active'
    ).length;
    if (seniorCount <= 1) {
      throw new Error('Nie można usunąć jedynego Głównego Hodowcy z gołębnika.');
    }
  }

  return members.filter((m) => m.id !== targetMemberId);
}

/**
 * Creates an immutable audit log entry.
 */
export function createAuditLogEntry(params: {
  loftId: string;
  user: {
    userId: string;
    userName: string;
    userRole: TandemRole;
  };
  action: TandemAction;
  targetType: 'pigeon' | 'race' | 'arrival' | 'health' | 'nutrition' | 'tandem' | 'backup';
  targetId?: string;
  targetDescription: string;
  timestamp?: string;
}): TandemAuditLogEntry {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    loftId: params.loftId,
    userId: params.user.userId,
    userName: params.user.userName,
    userRole: params.user.userRole,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    targetDescription: params.targetDescription,
    timestamp: params.timestamp || new Date().toISOString(),
  };
}

/**
 * Filters audit logs by query, action, or target type.
 */
export function filterAuditLogs(
  logs: TandemAuditLogEntry[],
  filters?: {
    action?: TandemAction;
    targetType?: string;
    userId?: string;
    searchQuery?: string;
  }
): TandemAuditLogEntry[] {
  if (!filters) return logs;

  return logs.filter((log) => {
    if (filters.action && log.action !== filters.action) return false;
    if (filters.targetType && log.targetType !== filters.targetType) return false;
    if (filters.userId && log.userId !== filters.userId) return false;
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const match =
        log.userName.toLowerCase().includes(q) ||
        log.targetDescription.toLowerCase().includes(q) ||
        (log.targetId && log.targetId.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });
}
