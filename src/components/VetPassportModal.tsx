/**
 * PIGEON-FLY — E-Paszport Weterynaryjny i Świadectwo Zdrowia TRACES-NT Modal (Z-063)
 * Moduł urzędowej certyfikacji zdrowia stada na loty zagraniczne i międzyokręgowe:
 * - Rygor badania klinicznego 48h (odliczanie ważności)
 * - Weryfikacja stref zagrożenia HPAI/ND
 * - Druk dwujęzycznego urzędowego certyfikatu A4 PDF
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
  TracesConsignmentInfo,
  validateConsignmentForTraces,
} from '../domain/vetPassportTraces';
import { PdfService } from '../services/pdfService';

interface VetPassportModalProps {
  visible: boolean;
  onClose: () => void;
}

export const VetPassportModal: React.FC<VetPassportModalProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'consignment' | 'clinical' | 'certificate'>('consignment');

  const [consignment, setConsignment] = useState<TracesConsignmentInfo>({
    certificateId: `PL-TRACES-${new Date().getFullYear()}-00491`,
    wniNumber: 'PL 14120099',
    breederName: 'Hodowca Pigeon-Fly',
    breederPhone: '+48 600 000 000',
    loftAddress: 'ul. Lotników 44, 05-500 Piaseczno',
    departureCountry: 'PL',
    destinationCountry: 'DE',
    releaseLocationName: 'Magdeburg',
    releaseCoordinates: {
      latitude: 52.1205,
      longitude: 11.6276,
    },
    raceDistanceKm: 580,
    transporterName: 'Kabina PZHGP Oddział 0284',
    transporterLicenseNumber: 'PL-1412-T2-088',
    vehicleRegistrationNumber: 'WI 4492A',
    pigeonsCount: 120,
    ringNumbersSample: ['PL-0284-23-1402', 'PL-0284-22-9854', 'DV-01234-24-512'],
    departureTimestamp: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(), // za 12h
    clinicalExamTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6h temu
    examiningVetName: 'Lek. wet. Janusz Ptasiński',
    examiningVetLicenseNumber: 'WET-WAW-9912',
    isInHpaiZone: false,
    hasClinicalSymptoms: false,
    pmvVaccineValid: true,
    pmvVaccineBatchNumber: 'LOT-PMV-2026-04',
    pmvVaccinationDate: '2026-02-15',
  });

  const validation = validateConsignmentForTraces(consignment);

  const handleExportPdf = async (mode: 'print' | 'share') => {
    try {
      await PdfService.exportTracesHealthCertificate(consignment, validation, mode);
    } catch (e: any) {
      Alert.alert('Błąd eksportu', e?.message || 'Nie udało się wyeksportować świadectwa TRACES.');
    }
  };

  const statusColor = validation.isValid ? '#4CAF50' : '#E53935';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>🇪🇺 E-Paszport i Świadectwo TRACES-NT (Z-063)</Text>
              <Text style={styles.subTitle}>Unijny paszport zdrowia i rygor badania klinicznego 48h</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="btn-close-vet-passport-modal">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Validation Status Banner */}
          <View style={[styles.statusBanner, { borderColor: statusColor }]}>
            <View style={styles.statusCol}>
              <Text style={styles.statusHeaderLabel}>STATUS URZĘDOWY</Text>
              <Text style={[styles.statusHeaderVal, { color: statusColor }]}>
                {validation.isValid ? '✓ ZEZWOLONO NA WYJAZD' : '✗ ZAKAZ WYJAZDU'}
              </Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.statusCol}>
              <Text style={styles.statusHeaderLabel}>WAŻNOŚĆ BADANIA 48H</Text>
              <Text style={[styles.statusHeaderVal, { color: validation.examExpired ? '#E53935' : '#E5A93C' }]}>
                {validation.hoursUntilExamExpiry} godz.
              </Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.statusCol}>
              <Text style={styles.statusHeaderLabel}>LICZBA PTAKÓW</Text>
              <Text style={styles.statusHeaderVal}>{consignment.pigeonsCount} szt.</Text>
            </View>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'consignment' && styles.tabBtnActive]}
              onPress={() => setActiveTab('consignment')}
            >
              <Text style={[styles.tabText, activeTab === 'consignment' && styles.tabTextActive]}>
                🚚 Przesyłka & Trasa
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'clinical' && styles.tabBtnActive]}
              onPress={() => setActiveTab('clinical')}
            >
              <Text style={[styles.tabText, activeTab === 'clinical' && styles.tabTextActive]}>
                🩺 Badanie 48h
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'certificate' && styles.tabBtnActive]}
              onPress={() => setActiveTab('certificate')}
            >
              <Text style={[styles.tabText, activeTab === 'certificate' && styles.tabTextActive]}>
                📜 Certyfikat A4
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {activeTab === 'consignment' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>I. IDENTYFIKACJA STADA I LOKALIZACJA WYPUSZCZENIA</Text>
                </View>

                <View style={styles.inputCard}>
                  <Text style={styles.inputLabel}>Weterynaryjny Numer Identyfikacyjny (WNI):</Text>
                  <TextInput
                    style={styles.textInput}
                    value={consignment.wniNumber}
                    onChangeText={(txt) => setConsignment((p) => ({ ...p, wniNumber: txt }))}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Miejsce wypuszczenia i Kraj docelowy:</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={[styles.textInput, { flex: 2 }]}
                      value={consignment.releaseLocationName}
                      onChangeText={(txt) => setConsignment((p) => ({ ...p, releaseLocationName: txt }))}
                      placeholder="Miejscowość"
                      placeholderTextColor="#6B7280"
                    />
                    <TextInput
                      style={[styles.textInput, { flex: 1 }]}
                      value={consignment.destinationCountry}
                      onChangeText={(txt) => setConsignment((p) => ({ ...p, destinationCountry: txt.toUpperCase() }))}
                      placeholder="DE"
                      placeholderTextColor="#6B7280"
                      maxLength={3}
                    />
                  </View>

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Dystans lotu (km):</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={String(consignment.raceDistanceKm)}
                    onChangeText={(txt) => setConsignment((p) => ({ ...p, raceDistanceKm: parseFloat(txt) || 0 }))}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Liczba koszowanych gołębi (szt.):</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={String(consignment.pigeonsCount)}
                    onChangeText={(txt) => setConsignment((p) => ({ ...p, pigeonsCount: parseInt(txt, 10) || 0 }))}
                  />
                </View>

                <View style={[styles.sectionHeader, { marginTop: 12 }]}>
                  <Text style={styles.sectionTitle}>II. PRZEWOŹNIK I ZEZWOLENIE TRANSPORTOWE</Text>
                </View>

                <View style={styles.inputCard}>
                  <Text style={styles.inputLabel}>Nazwa przewoźnika:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={consignment.transporterName}
                    onChangeText={(txt) => setConsignment((p) => ({ ...p, transporterName: txt }))}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Numer rejestracyjny pojazdu / kabiny:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={consignment.vehicleRegistrationNumber}
                    onChangeText={(txt) => setConsignment((p) => ({ ...p, vehicleRegistrationNumber: txt }))}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Nr licencji przewoźnika (Transport zwierząt Typ 2):</Text>
                  <TextInput
                    style={styles.textInput}
                    value={consignment.transporterLicenseNumber}
                    onChangeText={(txt) => setConsignment((p) => ({ ...p, transporterLicenseNumber: txt }))}
                    placeholder="np. PL-1412-T2-088"
                    placeholderTextColor="#6B7280"
                  />
                </View>
              </View>
            )}

            {activeTab === 'clinical' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>BADANIE KLINICZNE PRZED WYJAZDEM (MAX 48H)</Text>
                </View>

                <View style={styles.inputCard}>
                  <Text style={styles.inputLabel}>Lekarz weterynarii badający stado:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={consignment.examiningVetName}
                    onChangeText={(txt) => setConsignment((p) => ({ ...p, examiningVetName: txt }))}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Nr Prawa Wykonywania Zawodu:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={consignment.examiningVetLicenseNumber}
                    onChangeText={(txt) => setConsignment((p) => ({ ...p, examiningVetLicenseNumber: txt }))}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Data i godzina badania klinicznego:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={consignment.clinicalExamTimestamp.replace('T', ' ').slice(0, 16)}
                    editable={false}
                  />
                  <Text style={styles.hintText}>
                    Zgodnie z art. 124 AHL badanie musi odbyć się w ciągu 48 godzin przed przekroczeniem granicy.
                  </Text>
                </View>

                <View style={[styles.sectionHeader, { marginTop: 12 }]}>
                  <Text style={styles.sectionTitle}>KRYTERIA BEZPIECZEŃSTWA EPIZOOTYCZNEGO</Text>
                </View>

                <TouchableOpacity
                  style={[styles.toggleCard, !consignment.isInHpaiZone && styles.toggleCardActive]}
                  onPress={() => setConsignment((p) => ({ ...p, isInHpaiZone: !p.isInHpaiZone }))}
                >
                  <Text style={styles.toggleIcon}>{!consignment.isInHpaiZone ? '🛡️' : '⚠️'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleTitle}>
                      {consignment.isInHpaiZone ? 'Gołębnik w strefie HPAI (3/10 km)' : 'Brak ognisk HPAI w promieniu 10 km'}
                    </Text>
                    <Text style={styles.toggleSub}>
                      {consignment.isInHpaiZone ? 'Bezwzględny zakaz wywozu ptaków' : 'Teren wolny od ptasiej grypy'}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggleCard, consignment.pmvVaccineValid && styles.toggleCardActive]}
                  onPress={() => setConsignment((p) => ({ ...p, pmvVaccineValid: !p.pmvVaccineValid }))}
                >
                  <Text style={styles.toggleIcon}>{consignment.pmvVaccineValid ? '💉' : '❌'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleTitle}>
                      {consignment.pmvVaccineValid ? 'Urzędowe szczepienie PMV-1 ważne' : 'Brak ważnego szczepienia PMV-1'}
                    </Text>
                    <Text style={styles.toggleSub}>
                      Seria: {consignment.pmvVaccineBatchNumber} (zaszczepiono: {consignment.pmvVaccinationDate})
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggleCard, !consignment.hasClinicalSymptoms && styles.toggleCardActive]}
                  onPress={() => setConsignment((p) => ({ ...p, hasClinicalSymptoms: !p.hasClinicalSymptoms }))}
                >
                  <Text style={styles.toggleIcon}>{!consignment.hasClinicalSymptoms ? '🕊️' : '🚨'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleTitle}>
                      {consignment.hasClinicalSymptoms ? 'Stwierdzono objawy chorobowe!' : 'Brak klinicznych objawów chorób'}
                    </Text>
                    <Text style={styles.toggleSub}>
                      {consignment.hasClinicalSymptoms ? 'Wstrzymać wysyłkę natychmiast' : 'Stado w pełni zdrowe i zdatne do lotu'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {validation.violations.length > 0 && (
                  <View style={styles.violationsBox}>
                    <Text style={styles.violationsTitle}>UWAGI I PRZESZKODY PRAWNE:</Text>
                    {validation.violations.map((v, i) => (
                      <Text key={i} style={styles.violationText}>• {v}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            {activeTab === 'certificate' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>CERTYFIKAT TRACES-NT I EKSPORT PDF</Text>
                </View>

                <View style={styles.previewBox}>
                  <Text style={styles.previewTitle}>ŚWIADECTWO ZDROWIA (AHL / TRACES-NT)</Text>
                  <Text style={styles.previewSub}>Numer: {consignment.certificateId}</Text>
                  <View style={styles.dividerH} />
                  <Text style={styles.previewRow}>• Posiadacz stada: {consignment.breederName}</Text>
                  <Text style={styles.previewRow}>• Gołębnik: {consignment.loftAddress} (WNI: {consignment.wniNumber})</Text>
                  <Text style={styles.previewRow}>• Trasa: Polska → {consignment.releaseLocationName} ({consignment.destinationCountry})</Text>
                  <Text style={styles.previewRow}>• Przewoźnik: {consignment.transporterName} ({consignment.vehicleRegistrationNumber})</Text>
                  <Text style={styles.previewRow}>• Lekarz wet.: {consignment.examiningVetName} ({consignment.examiningVetLicenseNumber})</Text>
                  <Text style={styles.previewRow}>• Ważność badania: {validation.hoursUntilExamExpiry} godz. pozostało</Text>
                </View>

                <TouchableOpacity
                  style={[styles.exportBtn, { backgroundColor: validation.isValid ? '#2E7D32' : '#757575' }]}
                  onPress={() => handleExportPdf('print')}
                  disabled={!validation.isValid}
                  testID="btn-print-traces-certificate"
                >
                  <Text style={styles.exportBtnText}>🖨️ Drukuj Świadectwo Zdrowia A4 (AirPrint)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.exportBtn, { backgroundColor: '#1E2127', borderWidth: 1, borderColor: '#374151', marginTop: 10 }]}
                  onPress={() => handleExportPdf('share')}
                  disabled={!validation.isValid}
                  testID="btn-share-traces-certificate"
                >
                  <Text style={[styles.exportBtnText, { color: '#E5E7EB' }]}>📤 Udostępnij PDF (TRACES-NT / Straż Graniczna)</Text>
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
  statusBanner: {
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
    fontSize: 13,
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
    backgroundColor: '#003399',
  },
  tabText: {
    color: '#8E94A0',
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FFFFFF',
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
  hintText: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 4,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2127',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
    gap: 12,
  },
  toggleCardActive: {
    borderColor: '#3B414F',
    backgroundColor: '#1A231F',
  },
  toggleIcon: {
    fontSize: 20,
  },
  toggleTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  toggleSub: {
    color: '#8E94A0',
    fontSize: 11,
    marginTop: 2,
  },
  violationsBox: {
    backgroundColor: '#3E1E1E',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E53935',
  },
  violationsTitle: {
    color: '#FF8A80',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  violationText: {
    color: '#FFCDD2',
    fontSize: 11,
    marginBottom: 2,
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
