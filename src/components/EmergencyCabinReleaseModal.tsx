/**
 * PIGEON-FLY — Modal Protokołu Awarii Kabiny i Wypuszczenia Awaryjnego (EmergencyCabinReleaseModal)
 * Procedura kryzysowa na trasie konwoju: awaria wentylacji, mikroklimat kabiny, autoryzacja wypuszczenia.
 * Ergonomia Field Mode (touch targets >= 48-56 pt) oraz eksport urzędowy A4 AirPrint/PDF.
 */

import React, { useState, useMemo } from 'react';
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
import { FieldButton } from './FieldButton';
import {
  EmergencyCabinReleaseProtocol,
  CabinIncidentType,
  EmergencyActionTaken,
  IncidentSeverity,
  INCIDENT_TYPE_LABELS,
  ACTION_TAKEN_LABELS,
  assessWelfareRisk,
  validateEmergencyCabinProtocol,
  generateEmergencyCabinReleaseHtml,
} from '../domain/emergencyCabinReleaseProtocol';
import { PdfService } from '../services/pdfService';

interface EmergencyCabinReleaseModalProps {
  visible: boolean;
  onClose: () => void;
  defaultRaceName?: string;
  defaultBranchName?: string;
}

export const EmergencyCabinReleaseModal: React.FC<EmergencyCabinReleaseModalProps> = ({
  visible,
  onClose,
  defaultRaceName = 'Bruksela Narodowy 2026',
  defaultBranchName = 'Oddział 0284 Gostyń',
}) => {
  const todayIso = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  // Form State
  const [protocolNumber, setProtocolNumber] = useState<string>('AWARIA-2026/0284/01');
  const [raceName, setRaceName] = useState<string>(defaultRaceName);
  const [branchName, setBranchName] = useState<string>(defaultBranchName);
  const [plannedReleaseLocation, setPlannedReleaseLocation] = useState<string>('Bruksela Atomium');
  const [plannedReleaseDate, setPlannedReleaseDate] = useState<string>(todayIso);
  const [incidentDate, setIncidentDate] = useState<string>(todayIso);
  const [incidentTime, setIncidentTime] = useState<string>(nowTime);

  // Incident parameters
  const [incidentType, setIncidentType] = useState<CabinIncidentType>('ventilation_failure');
  const [severity, setSeverity] = useState<IncidentSeverity>('critical');
  const [incidentLocationName, setIncidentLocationName] = useState<string>(
    'A2 km 142 MOP Sosna kierunek Świecko'
  );
  const [incidentGpsCoordinates, setIncidentGpsCoordinates] = useState<string>(
    '52°18\'44.2"N 17°22\'11.8"E'
  );
  const [birdsCountInCabin, setBirdsCountInCabin] = useState<string>('2400');
  const [lossCount, setLossCount] = useState<string>('0');

  // Microclimate & Convoy State
  const [cabinTemperatureCelsius, setCabinTemperatureCelsius] = useState<string>('36');
  const [cabinHumidityPercent, setCabinHumidityPercent] = useState<string>('82');
  const [convoyer1Name, setConvoyer1Name] = useState<string>('Marek Wiśniewski');
  const [convoyer1Phone, setConvoyer1Phone] = useState<string>('+48 601 234 567');
  const [convoyer2Name, setConvoyer2Name] = useState<string>('Tomasz Nowak');
  const [convoyer2Phone, setConvoyer2Phone] = useState<string>('+48 602 345 678');
  const [birdConditionSummary, setBirdConditionSummary] = useState<string>(
    'Ptaki ziały intensywnie, zasinienie woskówki u części ptaków w górnych sekcjach. Po zrzucie awaryjnym wszystkie ptaki wzbiły się w powietrze, brak strat śmiertelnych.'
  );

  // Crisis Decision & Authorization
  const [actionTaken, setActionTaken] = useState<EmergencyActionTaken>(
    'emergency_release_in_transit'
  );
  const [emergencyReleaseTime, setEmergencyReleaseTime] = useState<string>(nowTime);
  const [authorizedByOfficerName, setAuthorizedByOfficerName] = useState<string>('Jan Kowalski');
  const [authorizedByOfficerRole, setAuthorizedByOfficerRole] = useState<string>(
    'Wiceprezes ds. Lotów Oddziału'
  );
  const [authorizationMethod, setAuthorizationMethod] = useState<'phone' | 'radio' | 'in_person'>(
    'phone'
  );
  const [authorizationTimestamp, setAuthorizationTimestamp] = useState<string>(nowTime);
  const [incidentDescription, setIncidentDescription] = useState<string>(
    'Gwałtowna awaria alternatora agregatu wentylacyjnego. Temperatura w kabinie wzrosła do 36°C w 20 minut przy braku nawiewu. Otwarto żaluzje boczne ręcznie.'
  );
  const [policeOrRoadServiceNotified, setPoliceOrRoadServiceNotified] = useState<boolean>(true);
  const [policeReportNumber, setPoliceReportNumber] = useState<string>('KPP-SZAM-9812/26');
  const [notes, setNotes] = useState<string>(
    'Koszowanie uznano za unieważnione ze względów siły wyższej i ochrony życia stada.'
  );

  // Active Tab
  const [activeTab, setActiveTab] = useState<'incident' | 'welfare' | 'decision'>('incident');

  // Build Protocol Object
  const currentProtocol: EmergencyCabinReleaseProtocol = useMemo(
    () => ({
      id: `emer-${incidentDate}-${protocolNumber}`,
      protocolNumber,
      raceName,
      branchName,
      plannedReleaseLocation,
      plannedReleaseDate,
      incidentDate,
      incidentTime,
      incidentType,
      severity,
      incidentLocationName,
      incidentGpsCoordinates,
      cabinTemperatureCelsius: parseFloat(cabinTemperatureCelsius) || 20,
      cabinHumidityPercent: parseFloat(cabinHumidityPercent) || 50,
      birdsCountInCabin: parseInt(birdsCountInCabin, 10) || 0,
      convoyer1Name,
      convoyer1Phone,
      convoyer2Name,
      convoyer2Phone,
      actionTaken,
      emergencyReleaseTime:
        actionTaken === 'emergency_release_in_transit' ? emergencyReleaseTime : undefined,
      authorizedByOfficerName,
      authorizedByOfficerRole,
      authorizationMethod,
      authorizationTimestamp,
      incidentDescription,
      birdConditionSummary,
      lossCount: parseInt(lossCount, 10) || 0,
      policeOrRoadServiceNotified,
      policeReportNumber: policeOrRoadServiceNotified ? policeReportNumber : undefined,
      notes,
    }),
    [
      protocolNumber,
      raceName,
      branchName,
      plannedReleaseLocation,
      plannedReleaseDate,
      incidentDate,
      incidentTime,
      incidentType,
      severity,
      incidentLocationName,
      incidentGpsCoordinates,
      cabinTemperatureCelsius,
      cabinHumidityPercent,
      birdsCountInCabin,
      convoyer1Name,
      convoyer1Phone,
      convoyer2Name,
      convoyer2Phone,
      actionTaken,
      emergencyReleaseTime,
      authorizedByOfficerName,
      authorizedByOfficerRole,
      authorizationMethod,
      authorizationTimestamp,
      incidentDescription,
      birdConditionSummary,
      lossCount,
      policeOrRoadServiceNotified,
      policeReportNumber,
      notes,
    ]
  );

  const welfare = useMemo(() => assessWelfareRisk(currentProtocol), [currentProtocol]);
  const validation = useMemo(() => validateEmergencyCabinProtocol(currentProtocol), [currentProtocol]);

  const handlePrint = async () => {
    if (!validation.isValid) {
      Alert.alert('Błędy formalne', validation.errors.join('\n'));
      return;
    }
    try {
      const html = generateEmergencyCabinReleaseHtml(currentProtocol);
      await PdfService.printHtml(html);
    } catch (e: any) {
      Alert.alert('Błąd drukowania', e?.message || 'Nie udało się wydrukować protokołu.');
    }
  };

  const handleShare = async () => {
    if (!validation.isValid) {
      Alert.alert('Błędy formalne', validation.errors.join('\n'));
      return;
    }
    try {
      const html = generateEmergencyCabinReleaseHtml(currentProtocol);
      await PdfService.shareHtmlAsPdf(
        html,
        `Protokol-Awarii-Kabiny-${currentProtocol.protocolNumber.replace(/[^a-zA-Z0-9]/g, '_')}`
      );
    } catch (e: any) {
      Alert.alert('Błąd eksportu', e?.message || 'Nie udało się wyeksportować pliku PDF.');
    }
  };

  const handleSave = () => {
    if (!validation.isValid) {
      Alert.alert('Błędy formalne', validation.errors.join('\n'));
      return;
    }
    Alert.alert(
      'Zatwierdzono Protokół Awarii',
      `Zdarzenie kryzysowe ${currentProtocol.protocolNumber} zostało zarejestrowane. Podjęto działanie: ${ACTION_TAKEN_LABELS[currentProtocol.actionTaken]}.`
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>AWARIA KABINY & WYPUSZCZENIE AWARYJNE</Text>
            <Text style={styles.headerSubtitle}>
              Procedura kryzysowa w transporcie i ochrona stada (Z-096)
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            testID="btn-close-emergency-modal"
          >
            <Text style={styles.closeButtonText}>✕ Zamknij</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Welfare Alert Banner */}
          <View
            style={[
              styles.welfareAlertBox,
              welfare.riskLevel === 'critical'
                ? styles.welfareBoxCritical
                : welfare.riskLevel === 'warning'
                ? styles.welfareBoxWarning
                : styles.welfareBoxSafe,
            ]}
          >
            <Text style={styles.welfareAlertTitle}>
              {welfare.riskLevel === 'critical'
                ? '🚨 KRYTYCZNE ZAGROŻENIE ŻYCIA STADA'
                : welfare.riskLevel === 'warning'
                ? '⚠️ OSTRZEŻENIE DOBROSTANOWE'
                : '✓ PARAMETRY MIKROKLIMATU W NORMIE'}
            </Text>
            <Text style={styles.welfareAlertText}>{welfare.summary}</Text>
            <Text style={styles.welfareAlertSub}>
              Indeks Zagrożenia: {welfare.riskScore}/100 • Temp: {currentProtocol.cabinTemperatureCelsius}°C • Wilg: {currentProtocol.cabinHumidityPercent}%
            </Text>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'incident' && styles.tabActive]}
              onPress={() => setActiveTab('incident')}
              testID="tab-incident-info"
            >
              <Text style={[styles.tabText, activeTab === 'incident' && styles.tabTextActive]}>
                1. Incydent & Miejsce
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'welfare' && styles.tabActive]}
              onPress={() => setActiveTab('welfare')}
              testID="tab-incident-welfare"
            >
              <Text style={[styles.tabText, activeTab === 'welfare' && styles.tabTextActive]}>
                2. Mikroklimat & Konwój
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'decision' && styles.tabActive]}
              onPress={() => setActiveTab('decision')}
              testID="tab-incident-decision"
            >
              <Text style={[styles.tabText, activeTab === 'decision' && styles.tabTextActive]}>
                3. Decyzja & Druk
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: INCIDENT & LOCATION */}
          {activeTab === 'incident' && (
            <View>
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>IDENTYFIKACJA LOTU I PROTOKOŁU</Text>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Nr Ewidencyjny Protokołu:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={protocolNumber}
                      onChangeText={setProtocolNumber}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 0.8 }]}>
                    <Text style={styles.inputLabel}>Data Incydentu:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={incidentDate}
                      onChangeText={setIncidentDate}
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Nazwa Lotu:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={raceName}
                      onChangeText={setRaceName}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 0.8 }]}>
                    <Text style={styles.inputLabel}>Godzina Wystąpienia:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={incidentTime}
                      onChangeText={setIncidentTime}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Rodzaj Awarii / Zdarzenia Losowego:</Text>
                <View style={styles.typeSelectorCol}>
                  {(
                    [
                      'ventilation_failure',
                      'vehicle_breakdown',
                      'traffic_blockade',
                      'extreme_weather',
                      'watering_system_defect',
                    ] as CabinIncidentType[]
                  ).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.incidentTypeItem,
                        incidentType === t && styles.incidentTypeItemActive,
                      ]}
                      onPress={() => setIncidentType(t)}
                    >
                      <Text
                        style={[
                          styles.incidentTypeItemText,
                          incidentType === t && styles.incidentTypeItemTextActive,
                        ]}
                      >
                        {INCIDENT_TYPE_LABELS[t]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>LOKALIZACJA ZDARZENIA NA TRASIE</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Miejsce Awarii / Postoju:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={incidentLocationName}
                    onChangeText={setIncidentLocationName}
                    placeholder="np. A2 km 142 MOP Sosna"
                    placeholderTextColor="#64748B"
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Współrzędne GPS:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={incidentGpsCoordinates}
                      onChangeText={setIncidentGpsCoordinates}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 0.8 }]}>
                    <Text style={styles.inputLabel}>Liczba ptaków:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={birdsCountInCabin}
                      onChangeText={setBirdsCountInCabin}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>Powiadomiono Policję / Służby Drogowe:</Text>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      policeOrRoadServiceNotified && styles.toggleBtnActive,
                    ]}
                    onPress={() =>
                      setPoliceOrRoadServiceNotified(!policeOrRoadServiceNotified)
                    }
                  >
                    <Text
                      style={[
                        styles.toggleBtnText,
                        policeOrRoadServiceNotified && styles.toggleBtnTextActive,
                      ]}
                    >
                      {policeOrRoadServiceNotified ? 'TAK' : 'NIE'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {policeOrRoadServiceNotified && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Nr Notatki Policyjnej / Zgłoszenia:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={policeReportNumber}
                      onChangeText={setPoliceReportNumber}
                      placeholder="np. KPP-SZAM-9812/26"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                )}
              </View>
            </View>
          )}

          {/* TAB 2: WELFARE & CONVOY */}
          {activeTab === 'welfare' && (
            <View>
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>PARAMETRY MIKROKLIMATU W KABINIE</Text>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Temperatura (°C):</Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        parseFloat(cabinTemperatureCelsius) >= 30 && {
                          borderColor: '#ef4444',
                          color: '#f87171',
                        },
                      ]}
                      value={cabinTemperatureCelsius}
                      onChangeText={setCabinTemperatureCelsius}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Wilgotność Względna (%):</Text>
                    <TextInput
                      style={styles.textInput}
                      value={cabinHumidityPercent}
                      onChangeText={setCabinHumidityPercent}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Stan Kliniczny Stada i Reakcja Behawioralna:</Text>
                  <TextInput
                    style={[styles.textInput, { minHeight: 70, textAlignVertical: 'top' }]}
                    value={birdConditionSummary}
                    onChangeText={setBirdConditionSummary}
                    multiline
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Liczba Strat / Padnięć (szt.):</Text>
                  <TextInput
                    style={styles.textInput}
                    value={lossCount}
                    onChangeText={setLossCount}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>OBSADA KONWOJU I DANE KONTAKTOWE</Text>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Główny Konwojent:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={convoyer1Name}
                      onChangeText={setConvoyer1Name}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Telefon:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={convoyer1Phone}
                      onChangeText={setConvoyer1Phone}
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Drugi Konwojent / Kierowca:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={convoyer2Name}
                      onChangeText={setConvoyer2Name}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Telefon:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={convoyer2Phone}
                      onChangeText={setConvoyer2Phone}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* TAB 3: DECISION & PRINT */}
          {activeTab === 'decision' && (
            <View>
              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>PODJĘTA DECYZJA KRYZYSOWA</Text>

                <View style={styles.decisionSelectorCol}>
                  {(
                    [
                      'emergency_release_in_transit',
                      'return_to_base_with_birds',
                      'divert_to_alternate_release_point',
                      'temporary_holding_with_repair',
                    ] as EmergencyActionTaken[]
                  ).map((act) => (
                    <TouchableOpacity
                      key={act}
                      style={[
                        styles.decisionItem,
                        actionTaken === act && styles.decisionItemActive,
                      ]}
                      onPress={() => setActionTaken(act)}
                    >
                      <Text
                        style={[
                          styles.decisionItemTitle,
                          actionTaken === act && styles.decisionItemTitleActive,
                        ]}
                      >
                        {act === 'emergency_release_in_transit'
                          ? '🚨 Wypuszczenie Awaryjne (Ratowanie Życia Stada)'
                          : act === 'return_to_base_with_birds'
                          ? '↩ Zawrócenie Kabiny do Oddziału'
                          : act === 'divert_to_alternate_release_point'
                          ? '📍 Zjazd na Alternatywne Miejsce Startu'
                          : '🛠 Postój w Cieniu, Wietrzenie i Naprawa'}
                      </Text>
                      <Text style={styles.decisionItemSub}>{ACTION_TAKEN_LABELS[act]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {actionTaken === 'emergency_release_in_transit' && (
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: '#f87171' }]}>
                      Dokładna Godzina Wypuszczenia Awaryjnego (Zrzutu):
                    </Text>
                    <TextInput
                      style={[styles.textInput, { borderColor: '#ef4444' }]}
                      value={emergencyReleaseTime}
                      onChangeText={setEmergencyReleaseTime}
                      placeholder="HH:mm"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                )}
              </View>

              <View style={styles.card}>
                <Text style={styles.cardSectionTitle}>AUTORYZACJA ZARZĄDU ODDZIAŁU</Text>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Osoba Autoryzująca z Zarządu:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={authorizedByOfficerName}
                      onChangeText={setAuthorizedByOfficerName}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 0.8 }]}>
                    <Text style={styles.inputLabel}>Funkcja:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={authorizedByOfficerRole}
                      onChangeText={setAuthorizedByOfficerRole}
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Sposób Kontaktu:</Text>
                    <View style={styles.methodSelectorRow}>
                      {(['phone', 'radio', 'in_person'] as const).map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={[
                            styles.methodBtn,
                            authorizationMethod === m && styles.methodBtnActive,
                          ]}
                          onPress={() => setAuthorizationMethod(m)}
                        >
                          <Text
                            style={[
                              styles.methodBtnText,
                              authorizationMethod === m && styles.methodBtnTextActive,
                            ]}
                          >
                            {m === 'phone' ? '📞 Tel' : m === 'radio' ? '📻 Radio' : '👤 Osob.'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={[styles.inputGroup, { flex: 0.8 }]}>
                    <Text style={styles.inputLabel}>Godzina Zgody:</Text>
                    <TextInput
                      style={styles.textInput}
                      value={authorizationTimestamp}
                      onChangeText={setAuthorizationTimestamp}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Szczegółowy Opis Przebiegu Zdarzenia:</Text>
                  <TextInput
                    style={[styles.textInput, { minHeight: 60, textAlignVertical: 'top' }]}
                    value={incidentDescription}
                    onChangeText={setIncidentDescription}
                    multiline
                  />
                </View>
              </View>

              {/* Action Save Button */}
              <FieldButton
                title="🛡️ Zatwierdź Protokół Działań Kryzysowych"
                onPress={handleSave}
                style={styles.saveButton}
                testID="btn-save-emergency-protocol"
              />

              {/* Export Buttons */}
              <View style={styles.exportRow}>
                <FieldButton
                  title="🖨️ AirPrint Protokół"
                  variant="secondary"
                  onPress={handlePrint}
                  style={{ flex: 1, marginRight: 8 }}
                  testID="btn-print-emergency-protocol"
                />
                <FieldButton
                  title="📤 Udostępnij PDF (PZHGP)"
                  variant="secondary"
                  onPress={handleShare}
                  style={{ flex: 1 }}
                  testID="btn-share-emergency-protocol"
                />
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121417',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2F343F',
    backgroundColor: '#1A1D24',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ef4444',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#8E94A0',
    marginTop: 2,
  },
  closeButton: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#2F343F',
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  welfareAlertBox: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1.5,
  },
  welfareBoxCritical: {
    backgroundColor: '#450a0a',
    borderColor: '#dc2626',
  },
  welfareBoxWarning: {
    backgroundColor: '#451a03',
    borderColor: '#d97706',
  },
  welfareBoxSafe: {
    backgroundColor: '#052e16',
    borderColor: '#16a34a',
  },
  welfareAlertTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  welfareAlertText: {
    fontSize: 11,
    color: '#F8FAFC',
    marginTop: 4,
    lineHeight: 16,
  },
  welfareAlertSub: {
    fontSize: 10,
    color: '#CBD5E1',
    marginTop: 6,
    fontWeight: 'bold',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#1A1D24',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
  },
  tab: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#ef4444',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E94A0',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#1E2127',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2F343F',
    marginBottom: 14,
  },
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E5A93C',
    letterSpacing: 0.5,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#121417',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    color: '#FFFFFF',
    paddingHorizontal: 10,
    minHeight: 48,
    fontSize: 13,
  },
  typeSelectorCol: {
    marginTop: 4,
  },
  incidentTypeItem: {
    minHeight: 48,
    backgroundColor: '#121417',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  incidentTypeItemActive: {
    borderColor: '#f87171',
    backgroundColor: '#7f1d1d',
  },
  incidentTypeItemText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  incidentTypeItemTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    flex: 1,
  },
  toggleBtn: {
    minHeight: 48,
    minWidth: 64,
    backgroundColor: '#121417',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#047857',
    borderColor: '#34d399',
  },
  toggleBtnText: {
    color: '#94A3B8',
    fontWeight: 'bold',
    fontSize: 12,
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  decisionSelectorCol: {
    marginTop: 4,
    marginBottom: 10,
  },
  decisionItem: {
    minHeight: 56,
    backgroundColor: '#121417',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F343F',
    justifyContent: 'center',
    padding: 10,
    marginBottom: 8,
  },
  decisionItemActive: {
    borderColor: '#f87171',
    backgroundColor: '#7f1d1d',
  },
  decisionItemTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  decisionItemTitleActive: {
    color: '#FFFFFF',
  },
  decisionItemSub: {
    fontSize: 10,
    color: '#CBD5E1',
    marginTop: 2,
  },
  methodSelectorRow: {
    flexDirection: 'row',
  },
  methodBtn: {
    flex: 1,
    minHeight: 48,
    backgroundColor: '#121417',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  methodBtnActive: {
    backgroundColor: '#0369a1',
    borderColor: '#38bdf8',
  },
  methodBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  methodBtnTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#b91c1c',
    marginBottom: 12,
  },
  exportRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
});
