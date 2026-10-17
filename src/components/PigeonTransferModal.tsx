/**
 * PIGEON-FLY — E-Księga Wywozu i Umowy Przekazania Modal (Z-065)
 * Ewidencja zbycia ptaków, przekazanie Kart Tożsamości PZHGP/FCI i urzędowa umowa transferu.
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
import {
  evaluateTransferContract,
  PigeonTransferContract,
  TransferredPigeonItem,
  TransferType,
  DEFAULT_TRANSFER_TYPES,
} from '../domain/pigeonTransfer';
import { PdfService } from '../services/pdfService';

interface PigeonTransferModalProps {
  visible: boolean;
  onClose: () => void;
}

const INITIAL_DEMO_TRANSFER_PIGEONS: TransferredPigeonItem[] = [
  {
    id: 'tp-1',
    ringNumber: 'PL-0284-26-101',
    year: 2026,
    sex: 'cock',
    plumageColor: 'Niebieski nakrapiany',
    hasIdentityCard: true,
    hasPedigree: true,
    hasElectronicChip: true,
    pricePln: 350,
  },
  {
    id: 'tp-2',
    ringNumber: 'PL-0284-26-102',
    year: 2026,
    sex: 'hen',
    plumageColor: 'Ciemna płowa',
    hasIdentityCard: true,
    hasPedigree: true,
    hasElectronicChip: false,
    pricePln: 400,
  },
];

export const PigeonTransferModal: React.FC<PigeonTransferModalProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'pigeons' | 'parties' | 'contract'>('pigeons');

  const [contract, setContract] = useState<PigeonTransferContract>({
    contractNumber: `PZHGP-TR-${new Date().getFullYear()}-008`,
    transferDate: new Date().toISOString().slice(0, 10),
    transferPlace: 'Piaseczno',
    transferType: 'SALE',
    seller: {
      name: 'Hodowca Pigeon-Fly',
      loftName: 'Gołębnik Mistrza',
      pzhgpBranch: '0284 Warszawa-Mokotów',
      pzhgpSection: 'Sekcja 2 Piaseczno',
      address: 'ul. Lotników 44, 05-500 Piaseczno',
      phone: '+48 600 000 000',
    },
    buyer: {
      name: 'Marek Nowak',
      loftName: 'Lotnik Podlasia',
      pzhgpBranch: '012 Białystok',
      pzhgpSection: 'Sekcja 1',
      address: 'ul. Lipowa 5, 15-001 Białystok',
      phone: '+48 601 987 654',
    },
    pigeons: INITIAL_DEMO_TRANSFER_PIGEONS,
    quarantineClauseAccepted: true,
    totalAgreedPricePln: 750,
    paymentMethod: 'CASH',
  });

  const evaluation = evaluateTransferContract(contract);

  const togglePigeonCard = (pigeonId: string) => {
    setContract((prev) => ({
      ...prev,
      pigeons: prev.pigeons.map((p) =>
        p.id === pigeonId ? { ...p, hasIdentityCard: !p.hasIdentityCard } : p
      ),
    }));
  };

  const togglePigeonPedigree = (pigeonId: string) => {
    setContract((prev) => ({
      ...prev,
      pigeons: prev.pigeons.map((p) =>
        p.id === pigeonId ? { ...p, hasPedigree: !p.hasPedigree } : p
      ),
    }));
  };

  const handleExportPdf = async (mode: 'print' | 'share') => {
    try {
      await PdfService.exportPigeonTransferAgreement(contract, evaluation, mode);
    } catch (e: any) {
      Alert.alert('Błąd eksportu', e?.message || 'Nie udało się wyeksportować umowy transferu.');
    }
  };

  const statusColor = evaluation.isValid ? '#4CAF50' : evaluation.statusVerdict === 'INCOMPLETE_DOCUMENTS' ? '#E5A93C' : '#E53935';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>🤝 E-Księga Wywozu i Umowy Przekazania (Z-065)</Text>
              <Text style={styles.subTitle}>Transfer Kart Tożsamości PZHGP/FCI i protokoły zbycia stada</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="btn-close-transfer-modal">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Status Bar */}
          <View style={[styles.statusBar, { borderColor: statusColor }]}>
            <View style={styles.statusCol}>
              <Text style={styles.statusHeaderLabel}>STATUS UMOWY</Text>
              <Text style={[styles.statusHeaderVal, { color: statusColor }]}>
                {evaluation.isValid ? '✓ GOTOWA DO PODPISU' : evaluation.statusVerdict === 'INCOMPLETE_DOCUMENTS' ? '⚠️ BRAK KART' : '✗ BRAK DANYCH'}
              </Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.statusCol}>
              <Text style={styles.statusHeaderLabel}>KARTY TOŻSAMOŚCI</Text>
              <Text style={styles.statusHeaderVal}>
                {evaluation.identityCardsDeliveredCount} / {evaluation.totalPigeonsCount} szt.
              </Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.statusCol}>
              <Text style={styles.statusHeaderLabel}>WARTOŚĆ RAZEM</Text>
              <Text style={[styles.statusHeaderVal, { color: '#E5A93C' }]}>
                {evaluation.totalValuePln.toFixed(0)} PLN
              </Text>
            </View>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'pigeons' && styles.tabBtnActive]}
              onPress={() => setActiveTab('pigeons')}
            >
              <Text style={[styles.tabText, activeTab === 'pigeons' && styles.tabTextActive]}>
                🕊️ Ptaki ({contract.pigeons.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'parties' && styles.tabBtnActive]}
              onPress={() => setActiveTab('parties')}
            >
              <Text style={[styles.tabText, activeTab === 'parties' && styles.tabTextActive]}>
                👥 Strony & Warunki
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'contract' && styles.tabBtnActive]}
              onPress={() => setActiveTab('contract')}
            >
              <Text style={[styles.tabText, activeTab === 'contract' && styles.tabTextActive]}>
                📜 Umowa A4
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {activeTab === 'pigeons' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>WYKAZ PRZEKAZYWANYCH GOŁĘBI I DOKUMENTÓW</Text>
                </View>

                {contract.pigeons.map((p, idx) => (
                  <View key={p.id} style={styles.pigeonCard}>
                    <View style={styles.pigeonCardHeader}>
                      <Text style={styles.pigeonRing}>{p.ringNumber}</Text>
                      <Text style={styles.pigeonPrice}>{p.pricePln ? `${p.pricePln} PLN` : 'Darowizna'}</Text>
                    </View>
                    <Text style={styles.pigeonSub}>
                      Płeć: {p.sex === 'cock' ? '1.0 Samiec' : p.sex === 'hen' ? '0.1 Samica' : 'Młody'} • Barwa: {p.plumageColor} • Rok: {p.year}
                    </Text>

                    <View style={styles.togglesRow}>
                      <TouchableOpacity
                        style={[styles.badgeToggle, p.hasIdentityCard && styles.badgeToggleActive]}
                        onPress={() => togglePigeonCard(p.id)}
                      >
                        <Text style={[styles.badgeToggleText, p.hasIdentityCard && styles.badgeToggleTextActive]}>
                          {p.hasIdentityCard ? '✓ Karta Własności' : '✗ Brak Karty'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.badgeToggle, p.hasPedigree && styles.badgeToggleActive]}
                        onPress={() => togglePigeonPedigree(p.id)}
                      >
                        <Text style={[styles.badgeToggleText, p.hasPedigree && styles.badgeToggleTextActive]}>
                          {p.hasPedigree ? '✓ Rodowód A4' : '✗ Brak Rodowodu'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {evaluation.warnings.length > 0 && (
                  <View style={styles.warningsCard}>
                    <Text style={styles.warningsTitle}>UWAGI FORMALNO-PRAWNE:</Text>
                    {evaluation.warnings.map((w, i) => (
                      <Text key={i} style={styles.warningItem}>• {w}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            {activeTab === 'parties' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>RODZAJ TRANSFERU I WARUNKI PŁATNOŚCI</Text>
                </View>

                <View style={styles.optionsRow}>
                  {DEFAULT_TRANSFER_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.type}
                      style={[styles.optBtn, contract.transferType === t.type && styles.optBtnActive]}
                      onPress={() => setContract((p) => ({ ...p, transferType: t.type }))}
                    >
                      <Text style={[styles.optText, contract.transferType === t.type && styles.optTextActive]}>
                        {t.label.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={[styles.sectionHeader, { marginTop: 14 }]}>
                  <Text style={styles.sectionTitle}>DANE NABYWCY / PRZYJMUJĄCEGO</Text>
                </View>

                <View style={styles.inputCard}>
                  <Text style={styles.inputLabel}>Imię i nazwisko nabywcy:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={contract.buyer.name}
                    onChangeText={(txt) => setContract((p) => ({ ...p, buyer: { ...p.buyer, name: txt } }))}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Nazwa gołębnika i Oddział PZHGP:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={`${contract.buyer.loftName} (${contract.buyer.pzhgpBranch})`}
                    onChangeText={(txt) => setContract((p) => ({ ...p, buyer: { ...p.buyer, loftName: txt } }))}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Adres i telefon nabywcy:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={`${contract.buyer.address}, tel: ${contract.buyer.phone}`}
                    onChangeText={(txt) => setContract((p) => ({ ...p, buyer: { ...p.buyer, address: txt } }))}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Uzgodniona kwota łączna (PLN):</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={String(contract.totalAgreedPricePln)}
                    onChangeText={(txt) => setContract((p) => ({ ...p, totalAgreedPricePln: parseFloat(txt) || 0 }))}
                  />
                </View>
              </View>
            )}

            {activeTab === 'contract' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>PODGLĄD UMOWY I EKSPORT AIRPRINT / PDF</Text>
                </View>

                <View style={styles.previewBox}>
                  <Text style={styles.previewTitle}>{evaluation.transferTypeLabel}</Text>
                  <Text style={styles.previewSub}>Numer: {contract.contractNumber} • Data: {contract.transferDate}</Text>
                  <View style={styles.dividerH} />
                  <Text style={styles.previewRow}>• Zbywca: {contract.seller.name} ({contract.seller.pzhgpBranch})</Text>
                  <Text style={styles.previewRow}>• Nabywca: {contract.buyer.name} ({contract.buyer.pzhgpBranch})</Text>
                  <Text style={styles.previewRow}>• Przekazane ptaki: {evaluation.totalPigeonsCount} sztuk</Text>
                  <Text style={styles.previewRow}>• Wydane Karty Tożsamości PZHGP: {evaluation.identityCardsDeliveredCount} / {evaluation.totalPigeonsCount}</Text>
                  <Text style={styles.previewRow}>• Wartość: {evaluation.totalValuePln.toFixed(2)} PLN</Text>
                  <Text style={styles.previewRow}>• Obowiązek kwarantanny 14 dni: TAK</Text>
                </View>

                <TouchableOpacity
                  style={[styles.exportBtn, { backgroundColor: '#2E7D32' }]}
                  onPress={() => handleExportPdf('print')}
                  testID="btn-print-transfer-contract"
                >
                  <Text style={styles.exportBtnText}>🖨️ Drukuj Umowę A4 (AirPrint)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.exportBtn, { backgroundColor: '#1E2127', borderWidth: 1, borderColor: '#374151', marginTop: 10 }]}
                  onPress={() => handleExportPdf('share')}
                  testID="btn-share-transfer-contract"
                >
                  <Text style={[styles.exportBtnText, { color: '#E5E7EB' }]}>📤 Udostępnij PDF (Kupujący / PZHGP)</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Footer Bar */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeModalBtn} onPress={onClose}>
              <Text style={styles.closeModalBtnText}>Zamknij</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#121417',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '94%',
    minHeight: '80%',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  subTitle: {
    color: '#8E94A0',
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1E2127',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  statusBar: {
    flexDirection: 'row',
    backgroundColor: '#1E2127',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  statusCol: {
    flex: 1,
    alignItems: 'center',
  },
  dividerVertical: {
    width: 1,
    backgroundColor: '#2F343F',
  },
  statusHeaderLabel: {
    color: '#8E94A0',
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statusHeaderVal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1E2127',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#E5A93C',
  },
  tabText: {
    color: '#8E94A0',
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#121417',
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#E5A93C',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pigeonCard: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  pigeonCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pigeonRing: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  pigeonPrice: {
    color: '#E5A93C',
    fontSize: 13,
    fontWeight: '800',
  },
  pigeonSub: {
    color: '#8E94A0',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 8,
  },
  togglesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badgeToggle: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#121417',
    borderWidth: 1,
    borderColor: '#374151',
  },
  badgeToggleActive: {
    backgroundColor: '#1B2E20',
    borderColor: '#2E7D32',
  },
  badgeToggleText: {
    color: '#8E94A0',
    fontSize: 11,
    fontWeight: '600',
  },
  badgeToggleTextActive: {
    color: '#81C784',
    fontWeight: '700',
  },
  warningsCard: {
    backgroundColor: '#3E1E1E',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E53935',
  },
  warningsTitle: {
    color: '#FF8A80',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  warningItem: {
    color: '#FFCDD2',
    fontSize: 11,
    marginBottom: 2,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  optBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#1E2127',
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
  },
  optBtnActive: {
    backgroundColor: '#E5A93C',
    borderColor: '#E5A93C',
  },
  optText: {
    color: '#8E94A0',
    fontSize: 11,
    fontWeight: '600',
  },
  optTextActive: {
    color: '#121417',
    fontWeight: '800',
  },
  inputCard: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 12,
  },
  inputLabel: {
    color: '#8E94A0',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#121417',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  previewBox: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 16,
  },
  previewTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  previewSub: {
    color: '#E5A93C',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  dividerH: {
    height: 1,
    backgroundColor: '#2F343F',
    marginVertical: 10,
  },
  previewRow: {
    color: '#D1D5DB',
    fontSize: 11,
    marginBottom: 4,
  },
  exportBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2F343F',
  },
  closeModalBtn: {
    backgroundColor: '#1E2127',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  closeModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
