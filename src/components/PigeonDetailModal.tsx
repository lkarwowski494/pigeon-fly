/**
 * PIGEON-FLY — PigeonDetailModal
 * Comprehensive individual pigeon card with vector QR micro-sticker preview,
 * status lifecycle updates, and direct 4-generation pedigree PDF export.
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Pigeon, PigeonStatus } from '../domain/types';
import { generateQRPayload } from '../domain/qr';
import { QrCodeSvg } from './QrCodeSvg';
import { FieldButton } from './FieldButton';

export interface PigeonDetailModalProps {
  visible: boolean;
  pigeon: Pigeon | null;
  onClose: () => void;
  onPrintPedigree: (pigeon: Pigeon, mode: 'print' | 'share') => void;
  onUpdateStatus?: (pigeonId: string, newStatus: PigeonStatus) => void;
}

export function PigeonDetailModal({
  visible,
  pigeon,
  onClose,
  onPrintPedigree,
  onUpdateStatus,
}: PigeonDetailModalProps) {
  if (!pigeon) return null;

  const [currentStatus, setCurrentStatus] = useState<PigeonStatus>(pigeon.status);

  useEffect(() => {
    if (pigeon) {
      setCurrentStatus(pigeon.status);
    }
  }, [pigeon]);

  const qrPayload = generateQRPayload(pigeon.qrCodeUuid, pigeon.ringNumber);

  const handleStatusSelect = (st: PigeonStatus) => {
    setCurrentStatus(st);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (onUpdateStatus) {
      onUpdateStatus(pigeon.id, st);
    }
  };

  const statusOptions: { key: PigeonStatus; label: string; icon: string }[] = [
    { key: 'racing', label: 'Lotowy', icon: '⏱️' },
    { key: 'breeding', label: 'Rozpłodowy', icon: '🥚' },
    { key: 'retired', label: 'Wycofany', icon: '🌾' },
    { key: 'sold', label: 'Sprzedany', icon: '🤝' },
    { key: 'deceased', label: 'Zszedł', icon: '🪶' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={styles.ringContainer}>
                <View style={styles.countryBadge}>
                  <Text style={styles.countryText}>{pigeon.countryCode}</Text>
                </View>
                <Text style={styles.ringNumber}>{pigeon.ringNumber}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Sub-header info */}
            <View style={styles.subInfoRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {pigeon.sex === 'cock' ? '♂ SAMIEC' : pigeon.sex === 'hen' ? '♀ SAMICA' : 'PŁEĆ NIEZNANA'}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#2A303C' }]}>
                <Text style={[styles.badgeText, { color: '#F0F2F5' }]}>ROCZNIK {pigeon.year}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#2A303C' }]}>
                <Text style={[styles.badgeText, { color: '#E5A93C' }]}>{pigeon.plumageColor}</Text>
              </View>
            </View>

            {/* Status Selector */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>PRZEZNACZENIE / STATUS PTAKA</Text>
              <View style={styles.statusRow}>
                {statusOptions.map((opt) => {
                  const isActive = currentStatus === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => handleStatusSelect(opt.key)}
                      style={[styles.statusPill, isActive && styles.activeStatusPill]}
                    >
                      <Text style={[styles.statusPillText, isActive && styles.activeStatusPillText]}>
                        {opt.icon} {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* QR Micro-Sticker */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>MIKRONAKLEJKA QR NA OBRĄCZKĘ</Text>
              <Text style={styles.qrDesc}>
                Wektorowy kod QR z unikalnym identyfikatorem ptaka do szybkiego odczytu przez kamerę w locie lub lufce.
              </Text>
              <View style={styles.qrWrapper}>
                <View style={styles.qrWhiteBox}>
                  <QrCodeSvg value={qrPayload} size={150} />
                </View>
              </View>
              <Text style={styles.qrPayloadText}>{qrPayload}</Text>
            </View>

            {/* Pedigree Actions */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>RODOWÓD 4-POKOLENIOWY (FCI / PZHGP)</Text>
              <Text style={styles.pedigreeDesc}>
                Generuj profesjonalny dokument A4 PDF z drzewem genealogicznym, inbredem Wrighta i zabezpieczeniem kryptograficznym.
              </Text>
              <View style={styles.actionButtonsCol}>
                <FieldButton
                  title="📜 Drukuj Rodowód A4 PDF"
                  onPress={() => onPrintPedigree(pigeon, 'print')}
                  testID="btn-print-pedigree-modal"
                  style={{ marginBottom: 10 }}
                />
                <FieldButton
                  title="📤 Udostępnij Rodowód PDF"
                  onPress={() => onPrintPedigree(pigeon, 'share')}
                  variant="secondary"
                  testID="btn-share-pedigree-modal"
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1E2127',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ringContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryBadge: {
    backgroundColor: '#E5A93C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  countryText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 14,
  },
  ringNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  closeBtn: {
    padding: 8,
  },
  closeText: {
    fontSize: 22,
    color: '#8E94A0',
    fontWeight: '800',
  },
  subInfoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  badge: {
    backgroundColor: 'rgba(229, 169, 60, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E5A93C',
  },
  sectionCard: {
    backgroundColor: '#15171C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
    padding: 14,
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPill: {
    backgroundColor: '#222630',
    borderWidth: 1,
    borderColor: '#373D4B',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  activeStatusPill: {
    backgroundColor: 'rgba(229, 169, 60, 0.2)',
    borderColor: '#E5A93C',
  },
  statusPillText: {
    fontSize: 13,
    color: '#8E94A0',
    fontWeight: '600',
  },
  activeStatusPillText: {
    color: '#E5A93C',
    fontWeight: '700',
  },
  qrDesc: {
    fontSize: 13,
    color: '#8E94A0',
    lineHeight: 18,
    marginBottom: 12,
  },
  qrWrapper: {
    alignItems: 'center',
    marginVertical: 6,
  },
  qrWhiteBox: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
  },
  qrPayloadText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#8E94A0',
    fontFamily: 'monospace',
    marginTop: 8,
  },
  pedigreeDesc: {
    fontSize: 13,
    color: '#8E94A0',
    lineHeight: 18,
    marginBottom: 12,
  },
  actionButtonsCol: {
    marginTop: 4,
  },
});
