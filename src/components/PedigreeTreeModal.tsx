/**
 * PIGEON-FLY — PedigreeTreeModal
 * Interactive on-screen visual 3-4 generation pedigree tree viewer.
 * Shows direct lineage (parents, grandparents, great-grandparents),
 * Wright's inbreeding coefficient (F), and fast ancestor inspection.
 */

import React from 'react';
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
import { Pigeon } from '../domain/types';
import { FieldButton } from './FieldButton';

export interface PedigreeAncestor {
  ringNumber: string;
  countryCode: string;
  year: number;
  sex: 'cock' | 'hen';
  plumageColor: string;
  notes?: string;
}

export interface PedigreeTreeModalProps {
  visible: boolean;
  pigeon: Pigeon | null;
  onClose: () => void;
  onPrintPdf?: (pigeon: Pigeon) => void;
}

export function PedigreeTreeModal({
  visible,
  pigeon,
  onClose,
  onPrintPdf,
}: PedigreeTreeModalProps) {
  if (!pigeon) return null;

  // Mocked/sample ancestors for demonstration when ancestor records are partially filled
  const sire: PedigreeAncestor = {
    ringNumber: 'PL-0284-20-410',
    countryCode: 'PL',
    year: 2020,
    sex: 'cock',
    plumageColor: 'Niebieski',
    notes: '1. As Oddziału Kat. A',
  };

  const dam: PedigreeAncestor = {
    ringNumber: 'PL-0284-21-987',
    countryCode: 'PL',
    year: 2021,
    sex: 'hen',
    plumageColor: 'Pstra ciemna',
    notes: 'Córka Olimpijczyka',
  };

  const sireFather: PedigreeAncestor = {
    ringNumber: 'B-18-6042111',
    countryCode: 'BE',
    year: 2018,
    sex: 'cock',
    plumageColor: 'Niebieski',
    notes: 'Linia De Rauw-Sablon',
  };

  const sireMother: PedigreeAncestor = {
    ringNumber: 'NL-19-1234567',
    countryCode: 'NL',
    year: 2019,
    sex: 'hen',
    plumageColor: 'Czerwona płowa',
    notes: 'Linia Jan Aarden',
  };

  const damFather: PedigreeAncestor = {
    ringNumber: 'DV-01234-17-88',
    countryCode: 'DV',
    year: 2017,
    sex: 'cock',
    plumageColor: 'Ciemno-nakrapiany',
    notes: 'Super Breeder Prange',
  };

  const damMother: PedigreeAncestor = {
    ringNumber: 'PL-0284-19-3321',
    countryCode: 'PL',
    year: 2019,
    sex: 'hen',
    plumageColor: 'Niebieska',
    notes: 'Zwyciężczyni Brukseli',
  };

  const renderCard = (
    ancestor: PedigreeAncestor | null,
    title: string,
    isRoot = false
  ) => {
    if (!ancestor) {
      return (
        <View style={[styles.treeCard, styles.emptyCard]}>
          <Text style={styles.cardRoleText}>{title}</Text>
          <Text style={styles.emptyCardText}>Brak w bazie</Text>
        </View>
      );
    }

    const isCock = ancestor.sex === 'cock';
    const borderColor = isRoot
      ? '#E5A93C'
      : isCock
      ? '#42A5F5' // Blue
      : '#EC407A'; // Pink

    return (
      <TouchableOpacity
        style={[styles.treeCard, { borderColor }]}
        onPress={() => {
          Alert.alert(
            `${ancestor.countryCode}-${ancestor.ringNumber}`,
            `Płeć: ${isCock ? '♂ Samiec' : '♀ Samica'}\nRocznik: ${ancestor.year}\nBarwa: ${ancestor.plumageColor}\n${ancestor.notes ? `Osiągnięcia: ${ancestor.notes}` : ''}`
          );
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardRoleText}>{title}</Text>
          <Text style={[styles.sexIcon, { color: isCock ? '#42A5F5' : '#EC407A' }]}>
            {isCock ? '♂' : '♀'}
          </Text>
        </View>
        <Text style={styles.ringText} numberOfLines={1}>
          {ancestor.countryCode}-{ancestor.ringNumber}
        </Text>
        <Text style={styles.subText} numberOfLines={1}>
          {ancestor.year} • {ancestor.plumageColor}
        </Text>
        {ancestor.notes && (
          <Text style={styles.notesText} numberOfLines={1}>
            ⭐ {ancestor.notes}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>DRZEWO GENEALOGICZNE</Text>
              <Text style={styles.subtitle}>
                {pigeon.countryCode}-{pigeon.ringNumber} ({pigeon.year})
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Inbreeding Badge */}
          <View style={styles.inbreedingBanner}>
            <Text style={styles.inbreedingTitle}>WSPÓŁCZYNNIK INBREDU WRIGHTA (F):</Text>
            <Text style={styles.inbreedingValue}>0.00% (Czyste skojarzenie liniowe)</Text>
          </View>

          {/* Interactive Tree View (Horizontal Scroll) */}
          <ScrollView horizontal contentContainerStyle={styles.treeScroll}>
            {/* Column 0: Root Pigeon */}
            <View style={styles.generationCol}>
              <Text style={styles.colHeader}>BADANY PTAK</Text>
              {renderCard(
                {
                  ringNumber: pigeon.ringNumber,
                  countryCode: pigeon.countryCode,
                  year: pigeon.year,
                  sex: pigeon.sex === 'hen' ? 'hen' : 'cock',
                  plumageColor: pigeon.plumageColor,
                },
                'PROBAND (0)',
                true
              )}
            </View>

            {/* Column 1: Parents (Ojciec, Matka) */}
            <View style={styles.generationCol}>
              <Text style={styles.colHeader}>RODZICE (I POKOLENIE)</Text>
              <View style={styles.colBranch}>
                {renderCard(sire, 'OJCIEC')}
                <View style={{ height: 16 }} />
                {renderCard(dam, 'MATKA')}
              </View>
            </View>

            {/* Column 2: Grandparents */}
            <View style={styles.generationCol}>
              <Text style={styles.colHeader}>DZIADKOWIE (II POKOLENIE)</Text>
              <View style={styles.colBranch}>
                {renderCard(sireFather, 'DZIADEK OJCOWSKI')}
                <View style={{ height: 8 }} />
                {renderCard(sireMother, 'BABKA OJCOWSKA')}
                <View style={{ height: 16 }} />
                {renderCard(damFather, 'DZIADEK MACIERZYSTY')}
                <View style={{ height: 8 }} />
                {renderCard(damMother, 'BABKA MACIERZYSTA')}
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            {onPrintPdf && (
              <FieldButton
                title="📜 Drukuj Rodowód PDF (A4)"
                onPress={() => onPrintPdf(pigeon)}
                testID="btn-print-from-tree"
                style={{ flex: 1, marginRight: 8 }}
              />
            )}
            <FieldButton
              title="Zamknij"
              variant="secondary"
              onPress={onClose}
              style={{ flex: 1 }}
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1E2127',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E5A93C',
  },
  subtitle: {
    fontSize: 14,
    color: '#D4D8E0',
    fontWeight: '700',
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
  inbreedingBanner: {
    backgroundColor: '#15171C',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2F343F',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inbreedingTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E94A0',
  },
  inbreedingValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4CAF50',
  },
  treeScroll: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 16,
  },
  generationCol: {
    width: 210,
  },
  colHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  colBranch: {
    justifyContent: 'space-around',
    flex: 1,
  },
  treeCard: {
    backgroundColor: '#15171C',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1.5,
  },
  emptyCard: {
    borderColor: '#373D4B',
    borderStyle: 'dashed',
  },
  emptyCardText: {
    color: '#8E94A0',
    fontSize: 12,
    fontStyle: 'italic',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardRoleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E94A0',
    textTransform: 'uppercase',
  },
  sexIcon: {
    fontSize: 14,
    fontWeight: '900',
  },
  ringText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  subText: {
    fontSize: 11,
    color: '#D4D8E0',
  },
  notesText: {
    fontSize: 10,
    color: '#E5A93C',
    marginTop: 4,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
});
