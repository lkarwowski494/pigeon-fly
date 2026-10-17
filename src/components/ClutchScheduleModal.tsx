/**
 * PIGEON-FLY — Clutch Schedule & Nest Box Card Modal (Z-073 / DEC-87)
 * Field Mode ergonomic interface (>= 48-56pt touch targets), dark theme (#121417).
 * Biological milestones timeline, critical banding alert (D6-D8), and A4 card generator.
 */

import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  planClutchSchedule,
  generateNestBoxFrontCardHtml,
  generateNestBoxCardsSheetHtml,
  filterUrgentBandingSchedules,
  ClutchScheduleInput,
  ClutchSchedulePlan,
} from '../domain/clutchSchedulePlanner';
import { PdfService } from '../services/pdfService';
import { FieldButton } from './FieldButton';

interface ClutchScheduleModalProps {
  visible: boolean;
  clutches: ClutchScheduleInput[];
  onClose: () => void;
  onUpdateClutch?: (updated: ClutchScheduleInput) => void;
}

export const ClutchScheduleModal: React.FC<ClutchScheduleModalProps> = ({
  visible,
  clutches,
  onClose,
  onUpdateClutch,
}) => {
  const [selectedClutchId, setSelectedClutchId] = useState<string>(
    clutches[0]?.clutchId || ''
  );

  const plans = useMemo(() => {
    return clutches.map((c) => planClutchSchedule(c, new Date()));
  }, [clutches]);

  const activePlan = useMemo(() => {
    return (
      plans.find((p) => p.clutchId === selectedClutchId) ||
      plans[0] ||
      null
    );
  }, [plans, selectedClutchId]);

  const urgentPlans = useMemo(() => {
    return filterUrgentBandingSchedules(plans);
  }, [plans]);

  const handlePrintCard = async () => {
    if (!activePlan) return;
    try {
      const html = generateNestBoxFrontCardHtml(activePlan, {
        loftName: 'Gołębnik Mistrza Pigeon-Fly',
        breederName: 'Hodowca Pigeon-Fly',
        seasonYear: 2026,
      });
      await PdfService.printHtml(html);
    } catch (err: any) {
      Alert.alert('Błąd drukowania', err?.message || 'Nie udało się wydrukować karty.');
    }
  };

  const handleShareCard = async () => {
    if (!activePlan) return;
    try {
      const html = generateNestBoxFrontCardHtml(activePlan, {
        loftName: 'Gołębnik Mistrza Pigeon-Fly',
        breederName: 'Hodowca Pigeon-Fly',
        seasonYear: 2026,
      });
      await PdfService.shareHtmlAsPdf(
        html,
        `Karta_Celi_${activePlan.nestBox.replace(/\s+/g, '_')}.pdf`
      );
    } catch (err: any) {
      Alert.alert('Błąd eksportu', err?.message || 'Nie udało się wyeksportować pliku PDF.');
    }
  };

  const handlePrintAllCards = async () => {
    if (plans.length === 0) {
      Alert.alert('Brak cel', 'Brak zarejestrowanych par lęgowych do wydruku.');
      return;
    }
    try {
      const html = generateNestBoxCardsSheetHtml(plans, {
        loftName: 'Gołębnik Mistrza Pigeon-Fly',
        breederName: 'Hodowca Pigeon-Fly',
        seasonYear: 2026,
      });
      await PdfService.printHtml(html);
    } catch (err: any) {
      Alert.alert('Błąd drukowania', err?.message || 'Nie udało się wydrukować kart zbiorczych.');
    }
  };

  const handleQuickMarkBanded = () => {
    if (!activePlan || !onUpdateClutch) return;
    const currentInput = clutches.find((c) => c.clutchId === activePlan.clutchId);
    if (!currentInput) return;

    const updated: ClutchScheduleInput = {
      ...currentInput,
      chick1Banded: true,
      chick2Banded: true,
      chick1RingNumber: currentInput.chick1RingNumber || `PL-0284-26-${Math.floor(100 + Math.random() * 900)}`,
      chick2RingNumber: currentInput.chick2RingNumber || `PL-0284-26-${Math.floor(100 + Math.random() * 900)}`,
    };

    onUpdateClutch(updated);
    Alert.alert(
      'Zaobrączkowano!',
      `Pomyślnie oznaczono zaobrączkowanie piskląt w celi ${activePlan.nestBox}.`
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>📅 Harmonogram i Karty Cel</Text>
              <Text style={styles.subtitle}>
                Biologia lęgów &bull; Okno obrączkowania D6-D8 &bull; Karty A4 (Z-073)
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Zamknij"
              testID="btn-close-schedule-modal"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Urgent Banding Banner if any */}
          {urgentPlans.length > 0 && (
            <View style={styles.urgentBanner}>
              <Text style={styles.urgentBannerIcon}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.urgentBannerTitle}>
                  ALARM OBRĄCZKOWANIA ({urgentPlans.length} cel wymaga uwagi)
                </Text>
                <Text style={styles.urgentBannerText}>
                  {urgentPlans
                    .map((p) => `${p.nestBox}: D${p.chickAgeDays} (zostało ${p.daysRemainingInBandingWindow}d)`)
                    .join(' | ')}
                </Text>
              </View>
            </View>
          )}

          {/* Nest Box Picker Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.boxTabsContainer}
            contentContainerStyle={styles.boxTabsContent}
          >
            {plans.map((p) => {
              const isSelected = p.clutchId === activePlan?.clutchId;
              const isUrgent = p.bandingState === 'CRITICAL_WINDOW' || p.bandingState === 'OVERDUE';
              return (
                <TouchableOpacity
                  key={p.clutchId}
                  style={[
                    styles.boxTab,
                    isSelected && styles.boxTabSelected,
                    isUrgent && styles.boxTabUrgent,
                  ]}
                  onPress={() => setSelectedClutchId(p.clutchId)}
                  testID={`tab-clutch-${p.clutchId}`}
                >
                  <Text
                    style={[
                      styles.boxTabText,
                      isSelected && styles.boxTabTextSelected,
                      isUrgent && styles.boxTabTextUrgent,
                    ]}
                  >
                    {p.nestBox}
                  </Text>
                  <Text style={styles.boxTabSubText}>Lęg {p.roundNumber}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {activePlan ? (
            <ScrollView style={styles.scrollContent}>
              {/* Clutch Card Summary */}
              <View style={styles.cardHeaderBox}>
                <View style={styles.pairRow}>
                  <View style={styles.parentPill}>
                    <Text style={styles.parentRole}>♂ OJCIEC</Text>
                    <Text style={styles.parentRing}>{activePlan.cockRingNumber}</Text>
                  </View>
                  <Text style={styles.crossSign}>✕</Text>
                  <View style={styles.parentPill}>
                    <Text style={styles.parentRole}>♀ MATKA</Text>
                    <Text style={styles.parentRing}>{activePlan.henRingNumber}</Text>
                  </View>
                </View>

                {/* Stage Badge & Progress */}
                <View style={styles.stageSection}>
                  <View style={styles.stageRow}>
                    <Text style={styles.stageLabelText}>ETAP BIOLOGICZNY:</Text>
                    <View
                      style={[
                        styles.stageBadge,
                        activePlan.bandingState === 'CRITICAL_WINDOW'
                          ? styles.badgeCritical
                          : activePlan.currentStage === 'COMPLETED'
                          ? styles.badgeSuccess
                          : styles.badgeNormal,
                      ]}
                    >
                      <Text style={styles.stageBadgeText}>{activePlan.stageLabel}</Text>
                    </View>
                  </View>

                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${Math.max(5, Math.min(100, activePlan.progressPct))}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressPctText}>
                    Postęp cyklu lęgowego: {activePlan.progressPct}%
                  </Text>
                </View>

                {/* Alerts if any */}
                {activePlan.alerts.map((alertText, idx) => (
                  <View key={idx} style={styles.alertCard}>
                    <Text style={styles.alertIcon}>🚨</Text>
                    <Text style={styles.alertText}>{alertText}</Text>
                  </View>
                ))}
              </View>

              {/* Banding Action Box if in window */}
              {(activePlan.bandingState === 'CRITICAL_WINDOW' ||
                activePlan.bandingState === 'OVERDUE') && (
                <View style={styles.bandingActionCard}>
                  <Text style={styles.bandingActionTitle}>
                    KRYTYCZNY TERMIN OBRĄCZKOWANIA (8.0 mm)
                  </Text>
                  <Text style={styles.bandingActionDesc}>
                    Pisklęta są w {activePlan.chickAgeDays}. dniu życia. Po 8. dniu staw skokowy
                    zgrubieje i założenie standardowej obrączki FCI będzie niemożliwe!
                  </Text>
                  <TouchableOpacity
                    style={styles.quickBandButton}
                    onPress={handleQuickMarkBanded}
                    testID="btn-mark-banded"
                  >
                    <Text style={styles.quickBandButtonText}>
                      ✓ Oznacz zaobrączkowanie piskląt
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Timeline Items */}
              <Text style={styles.timelineSectionTitle}>
                HARMONOGRAM BIOLOGICZNY (OD SPAROWANIA DO ODSADZENIA)
              </Text>

              <View style={styles.timelineList}>
                {activePlan.timeline.map((item, index) => {
                  const isDone = item.status === 'completed';
                  const isCurr = item.status === 'current';
                  const isMiss = item.status === 'missed';
                  return (
                    <View key={item.id} style={styles.timelineItemRow}>
                      <View style={styles.timelineIndicatorCol}>
                        <View
                          style={[
                            styles.timelineDot,
                            isDone && styles.dotDone,
                            isCurr && styles.dotCurr,
                            isMiss && styles.dotMiss,
                          ]}
                        >
                          <Text style={styles.dotText}>
                            {isDone ? '✓' : isCurr ? '●' : String(index + 1)}
                          </Text>
                        </View>
                        {index < activePlan.timeline.length - 1 && (
                          <View
                            style={[
                              styles.timelineLine,
                              isDone && styles.lineDone,
                            ]}
                          />
                        )}
                      </View>

                      <View style={styles.timelineContentBox}>
                        <View style={styles.timelineTitleRow}>
                          <Text style={styles.timelineItemTitle}>{item.title}</Text>
                          <Text style={styles.timelineItemDate}>{item.date}</Text>
                        </View>
                        <Text style={styles.timelineItemDesc}>{item.description}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsContainer}>
                <FieldButton
                  title="🖨️ Drukuj Kartę Celi (AirPrint / PDF)"
                  onPress={handlePrintCard}
                  style={{ marginBottom: 10, minHeight: 48 }}
                  testID="btn-print-active-card"
                />

                <FieldButton
                  title="📤 Udostępnij Kartę PDF"
                  variant="secondary"
                  onPress={handleShareCard}
                  style={{ marginBottom: 10, minHeight: 48 }}
                  testID="btn-share-active-card"
                />

                <FieldButton
                  title={`📑 Drukuj Karty Wszystkich Cel (${plans.length} par)`}
                  variant="secondary"
                  onPress={handlePrintAllCards}
                  style={{ marginBottom: 20, minHeight: 48 }}
                  testID="btn-print-all-cards"
                />
              </View>
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Brak zarejestrowanych par lęgowych.</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121417',
  },
  container: {
    flex: 1,
    backgroundColor: '#121417',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F3F4F6',
  },
  subtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#D1D5DB',
    fontWeight: 'bold',
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  urgentBannerIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  urgentBannerTitle: {
    color: '#EF4444',
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  urgentBannerText: {
    color: '#FCA5A5',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  boxTabsContainer: {
    maxHeight: 56,
    marginBottom: 12,
  },
  boxTabsContent: {
    gap: 8,
  },
  boxTab: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
    alignItems: 'center',
    minWidth: 90,
  },
  boxTabSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#3B82F6',
  },
  boxTabUrgent: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  boxTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  boxTabTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  boxTabTextUrgent: {
    color: '#F87171',
  },
  boxTabSubText: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  scrollContent: {
    flex: 1,
  },
  cardHeaderBox: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 14,
  },
  pairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  parentPill: {
    flex: 1,
    backgroundColor: '#121417',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  parentRole: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  parentRing: {
    fontSize: 14,
    fontWeight: '800',
    color: '#60A5FA',
    marginTop: 2,
  },
  crossSign: {
    fontSize: 16,
    color: '#6B7280',
    marginHorizontal: 8,
    fontWeight: '700',
  },
  stageSection: {
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2F343F',
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stageLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeNormal: {
    backgroundColor: '#374151',
  },
  badgeCritical: {
    backgroundColor: '#DC2626',
  },
  badgeSuccess: {
    backgroundColor: '#059669',
  },
  stageBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#121417',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#E5A93C',
    borderRadius: 4,
  },
  progressPctText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'right',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderWidth: 1,
    borderColor: '#EAB308',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
  },
  alertIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  alertText: {
    flex: 1,
    fontSize: 11,
    color: '#FEF08A',
    fontWeight: '600',
  },
  bandingActionCard: {
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    borderWidth: 1.5,
    borderColor: '#DC2626',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  bandingActionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EF4444',
    textTransform: 'uppercase',
  },
  bandingActionDesc: {
    fontSize: 11,
    color: '#FCA5A5',
    marginVertical: 6,
    lineHeight: 16,
  },
  quickBandButton: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  quickBandButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  timelineSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  timelineList: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 14,
  },
  timelineItemRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timelineIndicatorCol: {
    alignItems: 'center',
    width: 28,
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: '#059669',
  },
  dotCurr: {
    backgroundColor: '#2563EB',
    borderWidth: 2,
    borderColor: '#60A5FA',
  },
  dotMiss: {
    backgroundColor: '#DC2626',
  },
  dotText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#374151',
    marginVertical: 4,
    minHeight: 24,
  },
  lineDone: {
    backgroundColor: '#059669',
  },
  timelineContentBox: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 12,
  },
  timelineTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  timelineItemDate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  timelineItemDesc: {
    fontSize: 11,
    color: '#8E94A0',
    marginTop: 2,
  },
  actionsContainer: {
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});
