/**
 * PIGEON-FLY — TandemModal (BR-STADO-009, Z-057)
 * Multi-Breeder Loft Sharing & Team Management.
 * Manages co-owners, partners, assistants, guest observers,
 * invitation tokens, and real-time team audit logs.
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  TandemMember,
  TandemInvite,
  TandemAuditLogEntry,
  TandemRole,
  getTandemRoleMeta,
  createDefaultTandem,
  createTandemInvite,
  acceptTandemInvite,
  updateTandemMemberRole,
  removeTandemMember,
  createAuditLogEntry,
  filterAuditLogs,
  canPerformAction,
} from '../domain/tandem';
import { FieldButton } from './FieldButton';

export interface TandemModalProps {
  visible: boolean;
  onClose: () => void;
  currentUserId?: string;
  loftId?: string;
  loftName?: string;
  initialMembers?: TandemMember[];
  initialInvites?: TandemInvite[];
  initialAuditLogs?: TandemAuditLogEntry[];
}

export function TandemModal({
  visible,
  onClose,
  currentUserId = 'user-janusz',
  loftId = 'loft-01',
  loftName = 'Gołębnik Mistrza — Kat. A/B',
  initialMembers,
  initialInvites,
  initialAuditLogs,
}: TandemModalProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'invite' | 'audit'>('members');

  // Default initial data
  const [members, setMembers] = useState<TandemMember[]>(() => {
    if (initialMembers && initialMembers.length > 0) return initialMembers;
    const defaults = createDefaultTandem({
      loftId,
      ownerId: currentUserId,
      ownerName: 'Janusz Hodowca',
      ownerEmail: 'janusz@pigeonfly.pl',
      pzhgpSection: '0284 Rawicz',
    });
    // Add a demo partner
    defaults.push({
      id: 'member-marek',
      loftId,
      userId: 'user-marek',
      name: 'Marek Partner',
      email: 'marek.pigeon@onet.pl',
      phone: '+48 602 112 233',
      role: 'loft_partner',
      pzhgpSection: '0284 Rawicz',
      joinedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      status: 'active',
    });
    return defaults;
  });

  const [invites, setInvites] = useState<TandemInvite[]>(() => initialInvites || []);

  const [auditLogs, setAuditLogs] = useState<TandemAuditLogEntry[]>(() => {
    if (initialAuditLogs && initialAuditLogs.length > 0) return initialAuditLogs;
    return [
      createAuditLogEntry({
        loftId,
        user: { userId: currentUserId, userName: 'Janusz Hodowca', userRole: 'senior_breeder' },
        action: 'manage_members',
        targetType: 'tandem',
        targetDescription: 'Dodano wspólnika: Marek Partner (Wspólnik / Partner)',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      }),
      createAuditLogEntry({
        loftId,
        user: { userId: 'user-marek', userName: 'Marek Partner', userRole: 'loft_partner' },
        action: 'basket_birds',
        targetType: 'race',
        targetDescription: 'Skoszowano 42 gołębie na lot konkursowy Magdeburg (DE)',
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      }),
      createAuditLogEntry({
        loftId,
        user: { userId: 'user-marek', userName: 'Marek Partner', userRole: 'loft_partner' },
        action: 'register_arrival',
        targetType: 'arrival',
        targetDescription: 'Zarejestrowano przylot PL-0284-22-1044 (1348.5 m/min)',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      }),
    ];
  });

  // New Invite form states
  const [inviteRole, setInviteRole] = useState<TandemRole>('loft_partner');
  const [inviteEmail, setInviteEmail] = useState('');
  const [generatedInvite, setGeneratedInvite] = useState<TandemInvite | null>(null);
  const [auditSearch, setAuditSearch] = useState('');

  const currentUser = members.find((m) => m.userId === currentUserId);
  const isSenior = currentUser?.role === 'senior_breeder';

  const handleTabChange = (tab: 'members' | 'invite' | 'audit') => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setActiveTab(tab);
  };

  const handleCreateInvite = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const newInvite = createTandemInvite({
      loftId,
      loftName,
      role: inviteRole,
      createdByUserId: currentUserId,
      createdByUserName: currentUser?.name || 'Główny Hodowca',
      invitedEmail: inviteEmail.trim() || undefined,
      expiresInHours: 168,
    });

    setInvites([newInvite, ...invites]);
    setGeneratedInvite(newInvite);

    // Audit log
    const auditEntry = createAuditLogEntry({
      loftId,
      user: {
        userId: currentUserId,
        userName: currentUser?.name || 'Główny Hodowca',
        userRole: currentUser?.role || 'senior_breeder',
      },
      action: 'manage_members',
      targetType: 'tandem',
      targetDescription: `Wygenerowano zaproszenie dla roli: ${getTandemRoleMeta(inviteRole).label} (Token: ${newInvite.token})`,
    });
    setAuditLogs([auditEntry, ...auditLogs]);

    Alert.alert(
      'Kod Zaproszenia Wygenerowany!',
      `Token: ${newInvite.token}\n\nPrzekaż ten kod wspólnikowi, aby połączył się z Twoim gołębnikiem.`
    );
  };

  const handleUpdateRole = (targetMember: TandemMember) => {
    if (!isSenior) {
      Alert.alert('Brak uprawnień', 'Tylko Główny Hodowca może modyfikować uprawnienia członków tandemu.');
      return;
    }

    const availableRoles: TandemRole[] = [
      'senior_breeder',
      'loft_partner',
      'loft_assistant',
      'guest_observer',
    ];

    const options = availableRoles
      .filter((r) => r !== targetMember.role)
      .map((r) => ({
        text: `Zmień na: ${getTandemRoleMeta(r).label}`,
        onPress: () => {
          try {
            const updated = updateTandemMemberRole({
              members,
              targetMemberId: targetMember.id,
              newRole: r,
            });
            setMembers(updated);

            const auditEntry = createAuditLogEntry({
              loftId,
              user: {
                userId: currentUserId,
                userName: currentUser?.name || 'Janusz',
                userRole: 'senior_breeder',
              },
              action: 'manage_members',
              targetType: 'tandem',
              targetDescription: `Zmieniono rolę użytkownika ${targetMember.name} na: ${getTandemRoleMeta(r).label}`,
            });
            setAuditLogs([auditEntry, ...auditLogs]);

            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {}
          } catch (err: any) {
            Alert.alert('Błąd', err.message);
          }
        },
      }));

    Alert.alert(
      `Uprawnienia: ${targetMember.name}`,
      `Aktualna rola: ${getTandemRoleMeta(targetMember.role).label}\nWybierz nową rolę:`,
      [...options, { text: 'Anuluj', style: 'cancel' }]
    );
  };

  const handleRemoveMember = (targetMember: TandemMember) => {
    if (!isSenior) {
      Alert.alert('Brak uprawnień', 'Tylko Główny Hodowca może usuwać członków tandemu.');
      return;
    }

    Alert.alert(
      'Usunięcie Wspólnika',
      `Czy na pewno chcesz usunąć użytkownika ${targetMember.name} z tandemu? Utraci on dostęp do bazy gołębnika.`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: () => {
            try {
              const updated = removeTandemMember({
                members,
                targetMemberId: targetMember.id,
              });
              setMembers(updated);

              const auditEntry = createAuditLogEntry({
                loftId,
                user: {
                  userId: currentUserId,
                  userName: currentUser?.name || 'Janusz',
                  userRole: 'senior_breeder',
                },
                action: 'manage_members',
                targetType: 'tandem',
                targetDescription: `Usunięto użytkownika ${targetMember.name} z tandemu.`,
              });
              setAuditLogs([auditEntry, ...auditLogs]);

              try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              } catch {}
            } catch (err: any) {
              Alert.alert('Błąd', err.message);
            }
          },
        },
      ]
    );
  };

  const filteredLogs = filterAuditLogs(auditLogs, {
    searchQuery: auditSearch.trim() || undefined,
  });

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.screenTag}>Z-057 • BR-STADO-009</Text>
            <Text style={styles.title}>Tandem & Współdzielenie</Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityLabel="Zamknij okno tandemu"
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Loft Banner */}
        <View style={styles.loftBanner}>
          <Text style={styles.loftBannerName}>{loftName}</Text>
          <Text style={styles.loftBannerSub}>
            Aktywnych hodowców: {members.length} • Twój status:{' '}
            <Text style={{ color: '#E5A93C', fontWeight: '800' }}>
              {currentUser ? getTandemRoleMeta(currentUser.role).label : 'Użytkownik'}
            </Text>
          </Text>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'members' && styles.tabBtnActive]}
            onPress={() => handleTabChange('members')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'members' && styles.tabBtnTextActive]}>
              👥 Partnerzy ({members.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'invite' && styles.tabBtnActive]}
            onPress={() => handleTabChange('invite')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'invite' && styles.tabBtnTextActive]}>
              🎟️ Zaproś Wspólnika
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'audit' && styles.tabBtnActive]}
            onPress={() => handleTabChange('audit')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'audit' && styles.tabBtnTextActive]}>
              📜 Dziennik ({auditLogs.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          {/* TAB 1: MEMBERS */}
          {activeTab === 'members' && (
            <View>
              <Text style={styles.sectionHeader}>CZŁONKOWIE GOŁĘBNIKA I UPRAWNIENIA</Text>
              {members.map((m) => {
                const meta = getTandemRoleMeta(m.role);
                const isMe = m.userId === currentUserId;

                return (
                  <View key={m.id} style={styles.memberCard}>
                    <View style={styles.memberHeader}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.memberName}>{m.name}</Text>
                          {isMe && <Text style={styles.meBadge}>(Ty)</Text>}
                        </View>
                        <Text style={styles.memberEmail}>{m.email}</Text>
                        {m.phone && <Text style={styles.memberMeta}>📞 {m.phone}</Text>}
                        {m.pzhgpSection && (
                          <Text style={styles.memberMeta}>🇵🇱 Oddział: {m.pzhgpSection}</Text>
                        )}
                      </View>

                      <View
                        style={[
                          styles.roleBadge,
                          { backgroundColor: meta.badgeBg, borderColor: meta.badgeColor },
                        ]}
                      >
                        <Text style={[styles.roleBadgeText, { color: meta.badgeColor }]}>
                          {meta.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.roleDesc}>{meta.description}</Text>

                    {/* Permissions tags */}
                    <View style={styles.permissionsRow}>
                      <Text
                        style={[
                          styles.permTag,
                          canPerformAction(m.role, 'edit_pigeon') && styles.permTagActive,
                        ]}
                      >
                        {canPerformAction(m.role, 'edit_pigeon') ? '✓ Edycja ptaków' : '✗ Brak edycji'}
                      </Text>
                      <Text
                        style={[
                          styles.permTag,
                          canPerformAction(m.role, 'register_arrival') && styles.permTagActive,
                        ]}
                      >
                        {canPerformAction(m.role, 'register_arrival') ? '✓ Rejestracja przylotów' : '✗ Bez przylotów'}
                      </Text>
                      <Text
                        style={[
                          styles.permTag,
                          canPerformAction(m.role, 'manage_members') && styles.permTagActive,
                        ]}
                      >
                        {canPerformAction(m.role, 'manage_members') ? '✓ Zarządzanie zespołem' : '✗ Brak upr. adm'}
                      </Text>
                    </View>

                    {/* Senior actions on members */}
                    {isSenior && !isMe && (
                      <View style={styles.memberActionBtns}>
                        <TouchableOpacity
                          style={styles.memberEditBtn}
                          onPress={() => handleUpdateRole(m)}
                        >
                          <Text style={styles.memberEditBtnText}>⚙️ Zmień uprawnienia</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.memberRemoveBtn}
                          onPress={() => handleRemoveMember(m)}
                        >
                          <Text style={styles.memberRemoveBtnText}>🗑️ Usuń</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}

              {isSenior && (
                <FieldButton
                  title="➕ Wygeneruj Zaproszenie dla Wspólnika"
                  variant="primary"
                  onPress={() => setActiveTab('invite')}
                  style={{ marginTop: 12 }}
                />
              )}
            </View>
          )}

          {/* TAB 2: INVITE */}
          {activeTab === 'invite' && (
            <View>
              <Text style={styles.sectionHeader}>WYGENERUJ ZAPROSZENIE DO TANDEMU</Text>
              <Text style={styles.guideText}>
                Wspólnik lub pomocnik po zainstalowaniu Pigeon-Fly wpisze ten unikalny kod, aby natychmiast połączyć swój telefon z Twoją bazą gołębnika.
              </Text>

              <Text style={styles.inputLabel}>Wybierz rolę zapraszanego hodowcy:</Text>
              <View style={styles.roleSelector}>
                {(['loft_partner', 'loft_assistant', 'guest_observer'] as TandemRole[]).map(
                  (role) => {
                    const meta = getTandemRoleMeta(role);
                    const isSelected = inviteRole === role;
                    return (
                      <TouchableOpacity
                        key={role}
                        style={[styles.roleSelectBtn, isSelected && styles.roleSelectBtnActive]}
                        onPress={() => setInviteRole(role)}
                      >
                        <Text
                          style={[
                            styles.roleSelectTitle,
                            isSelected && styles.roleSelectTitleActive,
                          ]}
                        >
                          {meta.label}
                        </Text>
                        <Text style={styles.roleSelectDesc}>{meta.description}</Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>

              <Text style={styles.inputLabel}>Adres e-mail zapraszanego (opcjonalnie):</Text>
              <TextInput
                style={styles.textInput}
                placeholder="np. marek.wspolnik@onet.pl"
                placeholderTextColor="#717684"
                value={inviteEmail}
                onChangeText={setInviteEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <FieldButton
                title="🎟️ Wygeneruj Unikalny Kod Zaproszenia"
                variant="primary"
                onPress={handleCreateInvite}
                style={{ marginTop: 8 }}
              />

              {generatedInvite && (
                <View style={styles.inviteGeneratedBox}>
                  <Text style={styles.inviteGenHeader}>TOKEN DO PODZIELENIA SIĘ:</Text>
                  <Text style={styles.tokenDisplay}>{generatedInvite.token}</Text>
                  <Text style={styles.tokenHint}>
                    Ważny do:{' '}
                    {new Date(generatedInvite.expiresAt).toLocaleDateString('pl-PL', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <FieldButton
                    title="📋 Kopiuj Kod do Schowka"
                    variant="secondary"
                    onPress={() => {
                      Alert.alert('Skopiowano!', `Kod: ${generatedInvite.token} jest gotowy do wysłania.`);
                    }}
                    style={{ marginTop: 10 }}
                  />
                </View>
              )}

              {/* List of active invites */}
              {invites.length > 0 && (
                <View style={{ marginTop: 24 }}>
                  <Text style={styles.sectionHeader}>AKTYWNE KODY ZAPROSZEŃ</Text>
                  {invites.map((inv) => (
                    <View key={inv.id} style={styles.inviteItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inviteTokenText}>{inv.token}</Text>
                        <Text style={styles.inviteMetaText}>
                          Rola: {getTandemRoleMeta(inv.role).label} •{' '}
                          {inv.isUsed ? 'Wykorzystany' : 'Oczekuje'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.inviteStatusBadge,
                          inv.isUsed ? styles.badgeUsed : styles.badgePending,
                        ]}
                      >
                        <Text style={styles.inviteStatusText}>
                          {inv.isUsed ? 'Zużyty' : 'Aktywny'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* TAB 3: AUDIT LOG */}
          {activeTab === 'audit' && (
            <View>
              <Text style={styles.sectionHeader}>DZIENNIK AUDYTU OPERACJI W TANDEMIE</Text>
              <Text style={styles.guideText}>
                Niezmienny rejestr zdarzeń w gołębniku. Każda zmiana statusu ptaka, koszowanie lub rejestracja przylotu jest trwale przypisana do hodowcy.
              </Text>

              <TextInput
                style={[styles.textInput, { marginBottom: 14 }]}
                placeholder="🔍 Szukaj zdarzenia (hodowca, numer ptaka, lot)..."
                placeholderTextColor="#717684"
                value={auditSearch}
                onChangeText={setAuditSearch}
              />

              {filteredLogs.length === 0 ? (
                <Text style={styles.emptyText}>Brak wpisów spełniających kryteria.</Text>
              ) : (
                filteredLogs.map((log) => {
                  const dateStr = new Date(log.timestamp).toLocaleString('pl-PL', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <View key={log.id} style={styles.auditCard}>
                      <View style={styles.auditHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.auditUser}>{log.userName}</Text>
                          <Text style={styles.auditRoleBadge}>
                            [{getTandemRoleMeta(log.userRole).label}]
                          </Text>
                        </View>
                        <Text style={styles.auditTime}>{dateStr}</Text>
                      </View>
                      <Text style={styles.auditDesc}>{log.targetDescription}</Text>
                      <View style={styles.auditFooter}>
                        <Text style={styles.auditTag}>Moduł: {log.targetType.toUpperCase()}</Text>
                        <Text style={styles.auditAction}>Akcja: {log.action}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121417',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
  },
  screenTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E2127',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loftBanner: {
    backgroundColor: '#1A212D',
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2B394E',
  },
  loftBannerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  loftBannerSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#2A303C',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E94A0',
  },
  tabBtnTextActive: {
    color: '#E5A93C',
    fontWeight: '800',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 10,
  },
  guideText: {
    fontSize: 13,
    color: '#A0A6B2',
    lineHeight: 18,
    marginBottom: 14,
  },
  memberCard: {
    backgroundColor: '#1E2127',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 12,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  meBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34D399',
  },
  memberEmail: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  memberMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  roleDesc: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 8,
    lineHeight: 16,
  },
  permissionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2B323F',
    paddingTop: 8,
  },
  permTag: {
    fontSize: 11,
    color: '#64748B',
    backgroundColor: '#15171B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  permTagActive: {
    color: '#34D399',
    backgroundColor: '#132E22',
  },
  memberActionBtns: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  memberEditBtn: {
    flex: 1,
    backgroundColor: '#262D3D',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  memberEditBtnText: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '700',
  },
  memberRemoveBtn: {
    backgroundColor: '#371B1D',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  memberRemoveBtnText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4D8E0',
    marginTop: 10,
    marginBottom: 6,
  },
  roleSelector: {
    gap: 8,
    marginBottom: 12,
  },
  roleSelectBtn: {
    backgroundColor: '#1E2127',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  roleSelectBtnActive: {
    borderColor: '#E5A93C',
    backgroundColor: '#2A2417',
  },
  roleSelectTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#A0A6B2',
  },
  roleSelectTitleActive: {
    color: '#E5A93C',
  },
  roleSelectDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  textInput: {
    backgroundColor: '#15171B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2F343F',
    color: '#FFFFFF',
    fontSize: 15,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
  },
  inviteGeneratedBox: {
    backgroundColor: '#1F2430',
    borderWidth: 2,
    borderColor: '#E5A93C',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  inviteGenHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 1,
  },
  tokenDisplay: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'monospace',
    marginVertical: 8,
    letterSpacing: 1,
  },
  tokenHint: {
    fontSize: 12,
    color: '#94A3B8',
  },
  inviteItem: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  inviteTokenText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  inviteMetaText: {
    fontSize: 11,
    color: '#8E94A0',
    marginTop: 2,
  },
  inviteStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgePending: {
    backgroundColor: '#1B3B22',
  },
  badgeUsed: {
    backgroundColor: '#374151',
  },
  inviteStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#81C784',
  },
  auditCard: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  auditUser: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  auditRoleBadge: {
    fontSize: 11,
    color: '#E5A93C',
    fontWeight: '700',
  },
  auditTime: {
    fontSize: 11,
    color: '#64748B',
  },
  auditDesc: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 18,
    marginVertical: 4,
  },
  auditFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#2B323F',
    paddingTop: 4,
  },
  auditTag: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  auditAction: {
    fontSize: 10,
    color: '#64748B',
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 14,
  },
});
