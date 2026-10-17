import {
  EmergencyCabinReleaseProtocol,
  validateEmergencyCabinProtocol,
  assessWelfareRisk,
  generateEmergencyCabinReleaseHtml,
} from '../src/domain/emergencyCabinReleaseProtocol';

describe('EmergencyCabinReleaseProtocol Domain (Z-096 / DEC-110)', () => {
  const sampleProtocol: EmergencyCabinReleaseProtocol = {
    id: 'emer-2026-001',
    protocolNumber: 'AWARIA-2026/0284/01',
    raceName: 'Bruksela Narodowy 2026',
    branchName: 'Oddział 0284 Gostyń',
    plannedReleaseLocation: 'Bruksela Atomium',
    plannedReleaseDate: '2026-06-20',
    incidentDate: '2026-06-19',
    incidentTime: '23:45',
    incidentType: 'ventilation_failure',
    severity: 'critical',
    incidentLocationName: 'A2 km 142 MOP Sosna kierunek Świecko',
    incidentGpsCoordinates: '52°18\'44.2"N 17°22\'11.8"E',
    cabinTemperatureCelsius: 36,
    cabinHumidityPercent: 82,
    birdsCountInCabin: 2400,
    convoyer1Name: 'Marek Wiśniewski',
    convoyer1Phone: '+48 601 234 567',
    convoyer2Name: 'Tomasz Nowak',
    convoyer2Phone: '+48 602 345 678',
    actionTaken: 'emergency_release_in_transit',
    emergencyReleaseTime: '00:15',
    authorizedByOfficerName: 'Jan Kowalski',
    authorizedByOfficerRole: 'Wiceprezes ds. Lotów Oddziału',
    authorizationMethod: 'phone',
    authorizationTimestamp: '00:05',
    incidentDescription:
      'Gwałtowna awaria alternatora agregatu wentylacyjnego. Temperatura w kabinie skoczyła z 24°C do 36°C w 20 minut przy braku nawiewu. Otwarto żaluzje boczne ręcznie.',
    birdConditionSummary:
      'Ptaki ziały intensywnie, zasinienie woskówki u części ptaków w górnych sekcjach. Po zrzucie awaryjnym wszystkie ptaki natychmiast wzbiły się w powietrze, brak strat śmiertelnych w klatkach.',
    lossCount: 0,
    policeOrRoadServiceNotified: true,
    policeReportNumber: 'KPP-SZAM-9812/26',
    notes: 'Koszowanie uznano za unieważnione ze względów siły wyższej i ochrony życia stada.',
  };

  test('validates valid emergency release protocol with full details and release time', () => {
    const val = validateEmergencyCabinProtocol(sampleProtocol);
    expect(val.isValid).toBe(true);
    expect(val.errors).toHaveLength(0);
  });

  test('requires emergencyReleaseTime when actionTaken is emergency_release_in_transit', () => {
    const missingTime: EmergencyCabinReleaseProtocol = {
      ...sampleProtocol,
      emergencyReleaseTime: undefined,
    };
    const val = validateEmergencyCabinProtocol(missingTime);
    expect(val.isValid).toBe(false);
    expect(
      val.errors.some((e) => e.includes('wymagana jest dokładna godzina otwarcia zaworów/krat zrzutowych'))
    ).toBe(true);
  });

  test('rejects protocol missing location, convoyer contact, or officer authorization', () => {
    const invalid: EmergencyCabinReleaseProtocol = {
      ...sampleProtocol,
      incidentLocationName: '',
      convoyer1Phone: '',
      authorizedByOfficerName: '',
    };
    const val = validateEmergencyCabinProtocol(invalid);
    expect(val.isValid).toBe(false);
    expect(val.errors).toHaveLength(3);
  });

  test('assessWelfareRisk marks critical risk when temperature >= 35C and ventilation failure occurs', () => {
    const assessment = assessWelfareRisk({
      cabinTemperatureCelsius: 36,
      cabinHumidityPercent: 82,
      incidentType: 'ventilation_failure',
      actionTaken: 'emergency_release_in_transit',
    });

    expect(assessment.atRisk).toBe(true);
    expect(assessment.riskLevel).toBe('critical');
    expect(assessment.riskScore).toBeGreaterThanOrEqual(70);
    expect(assessment.summary).toContain('KRYTYCZNE ZAGROŻENIE ŻYCIA STADA');
  });

  test('assessWelfareRisk marks safe status under normal parameters', () => {
    const assessment = assessWelfareRisk({
      cabinTemperatureCelsius: 22,
      cabinHumidityPercent: 55,
      incidentType: 'vehicle_breakdown',
      actionTaken: 'temporary_holding_with_repair',
    });

    expect(assessment.atRisk).toBe(false);
    expect(assessment.riskLevel).toBe('safe');
    expect(assessment.riskScore).toBeLessThan(40);
  });

  test('generates complete A4 HTML with warning banner, welfare metrics, and committee signatures', () => {
    const html = generateEmergencyCabinReleaseHtml(sampleProtocol);
    expect(html).toContain('PROTOKÓŁ ZDARZENIA NADZWYCZAJNEGO W TRANSPORCIE GOŁĘBI POCZTOWYCH');
    expect(html).toContain('AWARIA-2026/0284/01');
    expect(html).toContain('Bruksela Narodowy 2026');
    expect(html).toContain('MOP Sosna');
    expect(html).toContain('36°C');
    expect(html).toContain('Marek Wiśniewski');
    expect(html).toContain('Jan Kowalski');
    expect(html).toContain('KPP-SZAM-9812/26');
  });
});
