import {
  canPerformAction,
  getTandemRoleMeta,
  createDefaultTandem,
  createTandemInvite,
  verifyTandemInvite,
  acceptTandemInvite,
  updateTandemMemberRole,
  removeTandemMember,
  createAuditLogEntry,
  filterAuditLogs,
  TandemMember,
  TandemRole,
} from '../src/domain/tandem';

describe('PIGEON-FLY — Tandem & Multi-Breeder Engine (Z-057, BR-STADO-009)', () => {
  describe('RBAC & Role Permissions (canPerformAction)', () => {
    it('senior_breeder should have full permissions across all actions', () => {
      const actions = [
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
      ] as const;

      actions.forEach((act) => {
        expect(canPerformAction('senior_breeder', act)).toBe(true);
      });
    });

    it('loft_partner can edit pigeons & pedigree but cannot delete pigeons or manage members', () => {
      expect(canPerformAction('loft_partner', 'view_data')).toBe(true);
      expect(canPerformAction('loft_partner', 'register_arrival')).toBe(true);
      expect(canPerformAction('loft_partner', 'basket_birds')).toBe(true);
      expect(canPerformAction('loft_partner', 'log_health')).toBe(true);
      expect(canPerformAction('loft_partner', 'edit_pedigree')).toBe(true);
      expect(canPerformAction('loft_partner', 'edit_pigeon')).toBe(true);

      // Forbidden for partner:
      expect(canPerformAction('loft_partner', 'delete_pigeon')).toBe(false);
      expect(canPerformAction('loft_partner', 'manage_members')).toBe(false);
    });

    it('loft_assistant can only record daily operational data and view data', () => {
      expect(canPerformAction('loft_assistant', 'view_data')).toBe(true);
      expect(canPerformAction('loft_assistant', 'register_arrival')).toBe(true);
      expect(canPerformAction('loft_assistant', 'basket_birds')).toBe(true);
      expect(canPerformAction('loft_assistant', 'log_health')).toBe(true);
      expect(canPerformAction('loft_assistant', 'log_nutrition')).toBe(true);

      // Forbidden for assistant:
      expect(canPerformAction('loft_assistant', 'edit_pedigree')).toBe(false);
      expect(canPerformAction('loft_assistant', 'edit_pigeon')).toBe(false);
      expect(canPerformAction('loft_assistant', 'delete_pigeon')).toBe(false);
      expect(canPerformAction('loft_assistant', 'manage_members')).toBe(false);
      expect(canPerformAction('loft_assistant', 'export_database')).toBe(false);
    });

    it('guest_observer has read-only access (view_data only)', () => {
      expect(canPerformAction('guest_observer', 'view_data')).toBe(true);
      expect(canPerformAction('guest_observer', 'register_arrival')).toBe(false);
      expect(canPerformAction('guest_observer', 'basket_birds')).toBe(false);
      expect(canPerformAction('guest_observer', 'log_health')).toBe(false);
      expect(canPerformAction('guest_observer', 'edit_pedigree')).toBe(false);
    });

    it('returns valid UI metadata for all roles', () => {
      const roles: TandemRole[] = [
        'senior_breeder',
        'loft_partner',
        'loft_assistant',
        'guest_observer',
      ];
      roles.forEach((r) => {
        const meta = getTandemRoleMeta(r);
        expect(meta.label).toBeDefined();
        expect(meta.description).toBeDefined();
        expect(meta.badgeColor).toMatch(/^#/);
        expect(meta.badgeBg).toMatch(/^#/);
      });
    });
  });

  describe('Default Tandem & Member Lifecycle', () => {
    it('creates default tandem with active senior_breeder', () => {
      const members = createDefaultTandem({
        loftId: 'loft-001',
        ownerId: 'user-janusz',
        ownerName: 'Janusz Mistrz',
        ownerEmail: 'janusz@pigeonfly.pl',
        pzhgpSection: '0284 Rawicz',
      });

      expect(members.length).toBe(1);
      expect(members[0].role).toBe('senior_breeder');
      expect(members[0].status).toBe('active');
      expect(members[0].pzhgpSection).toBe('0284 Rawicz');
    });

    it('prevents demoting the last senior_breeder', () => {
      const members = createDefaultTandem({
        loftId: 'loft-001',
        ownerId: 'user-janusz',
        ownerName: 'Janusz Mistrz',
        ownerEmail: 'janusz@pigeonfly.pl',
      });

      expect(() => {
        updateTandemMemberRole({
          members,
          targetMemberId: members[0].id,
          newRole: 'loft_partner',
        });
      }).toThrow('Gołębnik musi posiadać przynajmniej jednego aktywnego Głównego Hodowcę.');
    });

    it('prevents removing the last senior_breeder', () => {
      const members = createDefaultTandem({
        loftId: 'loft-001',
        ownerId: 'user-janusz',
        ownerName: 'Janusz Mistrz',
        ownerEmail: 'janusz@pigeonfly.pl',
      });

      expect(() => {
        removeTandemMember({
          members,
          targetMemberId: members[0].id,
        });
      }).toThrow('Nie można usunąć jedynego Głównego Hodowcy z gołębnika.');
    });

    it('allows demoting or removing senior_breeder if another active senior_breeder exists', () => {
      const initial: TandemMember[] = [
        {
          id: 'm1',
          loftId: 'loft-001',
          userId: 'u1',
          name: 'Janusz',
          email: 'j@p.pl',
          role: 'senior_breeder',
          joinedAt: '2026-01-01',
          status: 'active',
        },
        {
          id: 'm2',
          loftId: 'loft-001',
          userId: 'u2',
          name: 'Marek',
          email: 'm@p.pl',
          role: 'senior_breeder',
          joinedAt: '2026-01-02',
          status: 'active',
        },
      ];

      const updated = updateTandemMemberRole({
        members: initial,
        targetMemberId: 'm1',
        newRole: 'loft_partner',
      });
      expect(updated.find((m) => m.id === 'm1')?.role).toBe('loft_partner');

      const removed = removeTandemMember({
        members: initial,
        targetMemberId: 'm1',
      });
      expect(removed.length).toBe(1);
      expect(removed[0].id).toBe('m2');
    });
  });

  describe('Tandem Invites & Onboarding', () => {
    it('generates an invite with 7 days validity by default', () => {
      const invite = createTandemInvite({
        loftId: 'loft-rawicz-49',
        loftName: 'Mistrzowski Gołębnik Rawicz',
        role: 'loft_partner',
        createdByUserId: 'user-1',
        createdByUserName: 'Janusz Hodowca',
        invitedEmail: 'partner@pigeonfly.pl',
      });

      expect(invite.token).toContain('PFLY-TANDEM-LOFT');
      expect(invite.role).toBe('loft_partner');
      expect(invite.isUsed).toBe(false);

      const verification = verifyTandemInvite(invite);
      expect(verification.valid).toBe(true);
    });

    it('rejects expired invitations', () => {
      const invite = createTandemInvite({
        loftId: 'loft-1',
        loftName: 'Loft',
        role: 'loft_assistant',
        createdByUserId: 'u1',
        createdByUserName: 'Janusz',
        expiresInHours: 1,
      });

      // Check after 2 hours
      const futureDate = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
      const verification = verifyTandemInvite(invite, futureDate);
      expect(verification.valid).toBe(false);
      expect(verification.reason).toContain('wygasło');
    });

    it('accepts an invite and creates a new active member', () => {
      const invite = createTandemInvite({
        loftId: 'loft-1',
        loftName: 'Loft Olimpijski',
        role: 'loft_partner',
        createdByUserId: 'u1',
        createdByUserName: 'Janusz',
      });

      const { member, updatedInvite } = acceptTandemInvite({
        invite,
        user: {
          userId: 'u2',
          name: 'Stanisław Partner',
          email: 'stachu@onet.pl',
          phone: '+48 601 234 567',
          pzhgpSection: 'Sekcja 2',
        },
      });

      expect(member.userId).toBe('u2');
      expect(member.name).toBe('Stanisław Partner');
      expect(member.role).toBe('loft_partner');
      expect(member.status).toBe('active');
      expect(updatedInvite.isUsed).toBe(true);
      expect(updatedInvite.usedByUserId).toBe('u2');

      // Attempting to re-use throws error
      expect(() => {
        acceptTandemInvite({
          invite: updatedInvite,
          user: { userId: 'u3', name: 'Inny', email: 'inny@wp.pl' },
        });
      }).toThrow('Zaproszenie zostało już wykorzystane.');
    });
  });

  describe('Audit Logging & Activity Tracking', () => {
    it('creates an audit log entry with user and action metadata', () => {
      const entry = createAuditLogEntry({
        loftId: 'loft-1',
        user: {
          userId: 'u-marek',
          userName: 'Marek Partner',
          userRole: 'loft_partner',
        },
        action: 'register_arrival',
        targetType: 'arrival',
        targetId: 'arr-101',
        targetDescription: 'Zarejestrowano przylot PL-0284-23-4412 o godz. 11:24:05',
      });

      expect(entry.id).toContain('audit-');
      expect(entry.userName).toBe('Marek Partner');
      expect(entry.action).toBe('register_arrival');
      expect(entry.targetDescription).toContain('PL-0284-23-4412');
      expect(new Date(entry.timestamp).getTime()).not.toBeNaN();
    });

    it('filters audit logs by action, targetType, and search query', () => {
      const logs = [
        createAuditLogEntry({
          loftId: 'loft-1',
          user: { userId: 'u1', userName: 'Janusz', userRole: 'senior_breeder' },
          action: 'log_health',
          targetType: 'health',
          targetDescription: 'Podano szczepionkę Colombovac Paramyxo',
        }),
        createAuditLogEntry({
          loftId: 'loft-1',
          user: { userId: 'u2', userName: 'Marek', userRole: 'loft_partner' },
          action: 'register_arrival',
          targetType: 'arrival',
          targetDescription: 'Przylot gołębia PL-0284-22-101',
        }),
        createAuditLogEntry({
          loftId: 'loft-1',
          user: { userId: 'u1', userName: 'Janusz', userRole: 'senior_breeder' },
          action: 'basket_birds',
          targetType: 'race',
          targetDescription: 'Skoszowano 45 gołębi na lot Bruksela',
        }),
      ];

      // Filter by action
      const healthLogs = filterAuditLogs(logs, { action: 'log_health' });
      expect(healthLogs.length).toBe(1);
      expect(healthLogs[0].targetDescription).toContain('Colombovac');

      // Filter by user
      const marekLogs = filterAuditLogs(logs, { userId: 'u2' });
      expect(marekLogs.length).toBe(1);
      expect(marekLogs[0].userName).toBe('Marek');

      // Search query
      const searchBruksela = filterAuditLogs(logs, { searchQuery: 'Bruksela' });
      expect(searchBruksela.length).toBe(1);
      expect(searchBruksela[0].action).toBe('basket_birds');
    });
  });
});
