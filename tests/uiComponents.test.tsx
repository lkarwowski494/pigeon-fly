/**
 * Tests for Field UI Components (FieldButton, PigeonCard, ArrivalCard, FeatherGauge)
 */

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { FieldButton } from '../src/components/FieldButton';
import { PigeonCard } from '../src/components/PigeonCard';
import { ArrivalCard } from '../src/components/ArrivalCard';
import { FeatherGauge } from '../src/components/FeatherGauge';
import { Pigeon } from '../src/domain/types';

import { TouchableOpacity } from 'react-native';

describe('UI Components — FieldButton', () => {
  test('renders button with title and handles press', async () => {
    const onPress = jest.fn();
    let component: any;

    act(() => {
      component = renderer.create(
        <FieldButton title="Zapisz" onPress={onPress} testID="btn-test" />
      );
    });

    const root = component.root;
    const button = root.findByType(TouchableOpacity);

    await act(async () => {
      button.props.onPress();
    });

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('does not trigger onPress when disabled', async () => {
    const onPress = jest.fn();
    let component: any;

    act(() => {
      component = renderer.create(
        <FieldButton title="Zapisz" onPress={onPress} disabled={true} testID="btn-disabled" />
      );
    });

    const root = component.root;
    const button = root.findByType(TouchableOpacity);

    expect(button.props.disabled).toBe(true);
    await act(async () => {
      button.props.onPress?.();
    });

    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('UI Components — PigeonCard', () => {
  test('renders pigeon ring number, country code, and cock sex symbol', () => {
    const pigeon: Pigeon = {
      id: 'p-01',
      loftId: 'l-01',
      ringNumber: 'PL-0284-23-1402',
      countryCode: 'PL',
      year: 2023,
      sex: 'cock',
      plumageColor: 'Niebieski',
      status: 'racing',
      qrCodeUuid: 'uuid-1',
      isDeleted: false,
      createdAt: '',
      updatedAt: '',
    };

    let component: any;
    act(() => {
      component = renderer.create(
        <PigeonCard pigeon={pigeon} onPress={jest.fn()} testID="card-pigeon" />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('PL-0284-23-1402');
    expect(tree).toContain('2023');
    expect(tree).toContain('♂');
    expect(tree).toContain('Lotowy');
  });
});

describe('UI Components — ArrivalCard', () => {
  test('renders arrival position, pigeon ring, and velocity in m/min', () => {
    const arrival = {
      id: 'arr-1',
      raceId: 'r-1',
      pigeonId: 'p-1',
      arrivalTime: '2026-06-01T10:45:00Z',
      distanceMeters: 345000,
      velocityMPerMin: 1254.341,
      scanType: 'qr' as const,
      isManualOverride: false,
      createdAt: '',
      updatedAt: '',
      ringNumber: 'PL-0284-23-1402',
      countryCode: 'PL',
      year: 2023,
      sex: 'cock',
      plumageColor: 'Niebieski',
    };

    let component: any;
    act(() => {
      component = renderer.create(
        <ArrivalCard arrival={arrival} position={1} testID="card-arrival" />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('1254.3');
    expect(tree).toContain('m/min');
    expect(tree).toContain('PL-0284-23-1402');
  });
});

describe('UI Components — FeatherGauge', () => {
  test('renders 10 primary flight feather indicators', () => {
    const feathers = Array.from({ length: 10 }, (_, i) => ({
      featherNumber: i + 1,
      status: 'intact' as const,
      lengthPct: 100,
    }));

    let component: any;
    act(() => {
      component = renderer.create(<FeatherGauge feathers={feathers} testID="feather-gauge" />);
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('10 Lotek Pierwszorzędowych');
    for (let i = 1; i <= 10; i++) {
      expect(tree).toContain(String(i));
    }
  });
});

describe('UI Components — ClutchCard', () => {
  const { ClutchCard } = require('../src/components/ClutchCard');

  test('renders nest box, parents, and egg badges', () => {
    const clutch = {
      id: 'c-01',
      loftId: 'l-01',
      roundNumber: 1,
      nestBox: 'Cela A-04',
      cockId: 'p-01',
      henId: 'p-02',
      pairedDate: '2026-03-01',
      egg1Date: '2026-03-10',
      egg2Date: '2026-03-12',
      egg1Status: 'fertile',
      egg2Status: 'fertile',
      chick1Banded: false,
      chick2Banded: false,
      createdAt: '',
      updatedAt: '',
      cockRingNumber: 'PL-0284-23-1402',
      henRingNumber: 'PL-0284-22-9854',
    };

    let component: any;
    act(() => {
      component = renderer.create(<ClutchCard clutch={clutch} onPress={jest.fn()} testID="clutch-card" />);
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('Cela A-04');
    expect(tree).toContain('LĘG');
    expect(tree).toContain('PL-0284-23-1402');
    expect(tree).toContain('PL-0284-22-9854');
    expect(tree).toContain('Zalężone');
  });
});

describe('UI Components — Interactive Modals', () => {
  const { AddTreatmentModal } = require('../src/components/AddTreatmentModal');
  const { ClockArrivalModal } = require('../src/components/ClockArrivalModal');
  const { AddFeedingLogModal } = require('../src/components/AddFeedingLogModal');

  test('FeatherGauge triggers onPressFeather on feather tap', () => {
    const onPressFeather = jest.fn();
    const feathers = [{ featherNumber: 1, status: 'full' as const, lengthPct: 100 }];
    let component: any;

    act(() => {
      component = renderer.create(
        <FeatherGauge feathers={feathers} onPressFeather={onPressFeather} testID="gauge-test" />
      );
    });

    const root = component.root;
    const touchable = root.findByType(TouchableOpacity);
    act(() => {
      touchable.props.onPress();
    });

    expect(onPressFeather).toHaveBeenCalledWith(1);
  });

  test('AddTreatmentModal renders title and handles close', () => {
    const onClose = jest.fn();
    let component: any;

    act(() => {
      component = renderer.create(
        <AddTreatmentModal visible={true} onClose={onClose} onSave={jest.fn()} />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('NOWY ZABIEG / LEK');
    expect(tree).toContain('Szczepienie');
  });

  test('ClockArrivalModal renders title, speed calculation, and handles close', () => {
    const onClose = jest.fn();
    let component: any;

    act(() => {
      component = renderer.create(
        <ClockArrivalModal
          visible={true}
          onClose={onClose}
          raceDistanceMeters={300000}
          releaseTimeIso="2026-06-01T06:00:00Z"
          onClockArrival={jest.fn()}
        />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('ODBICIE PRZYLOTU GOŁĘBIA');
    expect(tree).toContain('PRĘDKOŚĆ');
    expect(tree).toContain('300.0');
    expect(tree).toContain('km');

    act(() => {
      component.unmount();
    });
  });

  test('AddFeedingLogModal renders title and phase chips', () => {
    const onClose = jest.fn();
    let component: any;

    act(() => {
      component = renderer.create(
        <AddFeedingLogModal visible={true} onClose={onClose} onSave={jest.fn()} />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('DZIENNIK ŻYWIENIA I SUPLEMENTACJI');
    expect(tree).toContain('Loty (Wdowieństwo)');
  });

  test('NewRaceModal renders title, presets, and distance', () => {
    const { NewRaceModal } = require('../src/components/NewRaceModal');
    const onClose = jest.fn();
    let component: any;

    act(() => {
      component = renderer.create(
        <NewRaceModal visible={true} onClose={onClose} onSaveRace={jest.fn()} />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('NOWY LOT / TRENING');
    expect(tree).toContain('Magdeburg (Niemcy)');
    expect(tree).toContain('345.2');
  });

  test('ClutchLifecycleModal renders clutch details, milestones, and saves changes', () => {
    const { ClutchLifecycleModal } = require('../src/components/ClutchLifecycleModal');
    const onSave = jest.fn();
    const onClose = jest.fn();
    const clutch = {
      id: 'c-01',
      loftId: 'l-01',
      roundNumber: 1,
      nestBox: 'Cela A-04',
      cockId: 'p-01',
      henId: 'p-02',
      pairedDate: '2026-03-01',
      egg1Date: '2026-03-10',
      egg2Date: '2026-03-12',
      egg1Status: 'fertile' as const,
      egg2Status: 'fertile' as const,
      chick1Banded: false,
      chick2Banded: false,
      createdAt: '',
      updatedAt: '',
      cockRingNumber: 'PL-0284-23-1402',
      henRingNumber: 'PL-0284-22-9854',
    };

    let component: any;
    act(() => {
      component = renderer.create(
        <ClutchLifecycleModal
          visible={true}
          clutch={clutch}
          onClose={onClose}
          onSave={onSave}
        />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('Cela A-04');
    expect(tree).toContain('HARMONOGRAM BIOLOGICZNY');
    expect(tree).toContain('OWOSKOPIA');
    expect(tree).toContain('WYL\u0118G');
  });

  test('PigeonDetailModal renders pigeon info, QR micro-sticker, and status selector', () => {
    const { PigeonDetailModal } = require('../src/components/PigeonDetailModal');
    const onClose = jest.fn();
    const onPrintPedigree = jest.fn();
    const onUpdateStatus = jest.fn();

    const pigeon = {
      id: 'p-01',
      loftId: 'l-01',
      ringNumber: 'PL-0284-23-1402',
      countryCode: 'PL',
      year: 2023,
      sex: 'cock' as const,
      plumageColor: 'Niebieski nakrapiany',
      status: 'racing' as const,
      qrCodeUuid: 'uuid-12345',
      isDeleted: false,
      createdAt: '',
      updatedAt: '',
    };

    let component: any;
    act(() => {
      component = renderer.create(
        <PigeonDetailModal
          visible={true}
          pigeon={pigeon}
          onClose={onClose}
          onPrintPedigree={onPrintPedigree}
          onUpdateStatus={onUpdateStatus}
        />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('PL-0284-23-1402');
    expect(tree).toContain('MIKRONAKLEJKA QR');
    expect(tree).toContain('RODOW\u00d3D 4-POKOLENIOWY');
    expect(tree).toContain('PIGEONFLY:V1');
  });

  test('PedigreeTreeModal renders pedigree columns, ancestors, and inbreeding coefficient', () => {
    const { PedigreeTreeModal } = require('../src/components/PedigreeTreeModal');
    const onClose = jest.fn();

    const pigeon = {
      id: 'p-01',
      loftId: 'l-01',
      ringNumber: 'PL-0284-23-1402',
      countryCode: 'PL',
      year: 2023,
      sex: 'cock' as const,
      plumageColor: 'Niebieski nakrapiany',
      status: 'racing' as const,
      qrCodeUuid: 'uuid-12345',
      isDeleted: false,
      createdAt: '',
      updatedAt: '',
    };

    let component: any;
    act(() => {
      component = renderer.create(
        <PedigreeTreeModal
          visible={true}
          pigeon={pigeon}
          onClose={onClose}
          onPrintPdf={jest.fn()}
        />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('DRZEWO GENEALOGICZNE');
    expect(tree).toContain('WSP\u00d3\u0141CZYNNIK INBREDU WRIGHTA');
    expect(tree).toContain('RODZICE (I POKOLENIE)');
    expect(tree).toContain('OJCIEC');
    expect(tree).toContain('MATKA');
    expect(tree).toContain('DZIADEK OJCOWSKI');
  });

  test('TelemetryTrackModal renders track efficiency and points', () => {
    const { TelemetryTrackModal } = require('../src/components/TelemetryTrackModal');
    const onClose = jest.fn();

    let component: any;
    act(() => {
      component = renderer.create(<TelemetryTrackModal visible={true} onClose={onClose} />);
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('TELEMETRIA');
    expect(tree).toContain('EFEKTYWNO\u015aCI');
    expect(tree).toContain('DANE Z LOGERA');
  });

  test('RaceWeatherModal renders aerodynamics, bearing, and wind presets', () => {
    const { RaceWeatherModal } = require('../src/components/RaceWeatherModal');
    const onClose = jest.fn();

    let component: any;
    act(() => {
      component = renderer.create(
        <RaceWeatherModal visible={true} onClose={onClose} distanceMeters={300000} />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('AERODYNAMIKA I WIATR');
    expect(tree).toContain('KIERUNEK WIATRU');
    expect(tree).toContain('Zach\u00f3d (W)');
  });

  test('AppraisalModal renders conformation criteria and FCI standard score', () => {
    const { AppraisalModal } = require('../src/components/AppraisalModal');
    const onClose = jest.fn();

    const pigeon = {
      id: 'p-01',
      loftId: 'l-01',
      ringNumber: 'PL-0284-23-1402',
      countryCode: 'PL',
      year: 2023,
      sex: 'cock' as const,
      plumageColor: 'Niebieski',
      status: 'racing' as const,
      qrCodeUuid: 'uuid-1',
      isDeleted: false,
      createdAt: '',
      updatedAt: '',
    };

    let component: any;
    act(() => {
      component = renderer.create(
        <AppraisalModal visible={true} pigeon={pigeon} onClose={onClose} />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('OCENA BUDOWY');
    expect(tree).toContain('PUNKTY STANDARD FCI');
    expect(tree).toContain('WIDE\u0141KI MIEDNICOWE');
    expect(tree).toContain('ZNAK OKA');
  });

  test('BasketingSessionModal renders basket pool and series designation', () => {
    const { BasketingSessionModal } = require('../src/components/BasketingSessionModal');
    const onClose = jest.fn();

    let component: any;
    act(() => {
      component = renderer.create(
        <BasketingSessionModal
          visible={true}
          onClose={onClose}
          raceName="Magdeburg"
          onSaveBasket={jest.fn()}
        />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('KOSZOWANIE');
    expect(tree).toContain('W koszu');
    expect(tree).toContain('PL-0284-23-1402');
    expect(tree).toContain('Seria (T)');
  });

  test('PigeonPhotoGalleryModal renders tabs for Sylwetka, Oko Makro and Skrzydlo', () => {
    const { PigeonPhotoGalleryModal } = require('../src/components/PigeonPhotoGalleryModal');
    const onClose = jest.fn();
    const pigeon: Pigeon = {
      id: 'p-01',
      loftId: 'l-01',
      ringNumber: 'PL-0284-23-1402',
      countryCode: 'PL',
      year: 2023,
      sex: 'cock',
      plumageColor: 'Niebieski',
      status: 'racing',
      qrCodeUuid: 'uuid-1',
      isDeleted: false,
      createdAt: '',
      updatedAt: '',
    };

    let component: any;
    act(() => {
      component = renderer.create(
        <PigeonPhotoGalleryModal visible={true} pigeon={pigeon} onClose={onClose} />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('GALERIA MAKRO');
    expect(tree).toContain('Sylwetka');
    expect(tree).toContain('Oko Makro');
    expect(tree).toContain('Skrzyd\u0142o');
  });

  test('PerformanceChartModal renders velocity chart and form index', () => {
    const { PerformanceChartModal } = require('../src/components/PerformanceChartModal');
    const onClose = jest.fn();
    const pigeon: Pigeon = {
      id: 'p-01',
      loftId: 'l-01',
      ringNumber: 'PL-0284-23-1402',
      countryCode: 'PL',
      year: 2023,
      sex: 'cock',
      plumageColor: 'Niebieski',
      status: 'racing',
      qrCodeUuid: 'uuid-1',
      isDeleted: false,
      createdAt: '',
      updatedAt: '',
    };

    let component: any;
    act(() => {
      component = renderer.create(
        <PerformanceChartModal visible={true} pigeon={pigeon} onClose={onClose} />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('WYKRES FORMY');
    expect(tree).toContain('INDEKS FORMY');
    expect(tree).toContain('PR\u0118DKO\u015aCI LOT\u00d3W');
    expect(tree).toContain('REKOMENDACJA TAKTYCZNA');
  });

  test('LiveDerbyModal renders live section leaderboard and broadcast link', () => {
    const { LiveDerbyModal } = require('../src/components/LiveDerbyModal');
    const onClose = jest.fn();

    let component: any;
    act(() => {
      component = renderer.create(
        <LiveDerbyModal visible={true} onClose={onClose} />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('TRANSMISJA NA \u017bYWO');
    expect(tree).toContain('KOD TRANSMISJI');
    expect(tree).toContain('DERBY');
    expect(tree).toContain('OSTATNI PRZYLOT NA \u017bYWO');
  });

  test('PigeonCard displays auxiliary ring and clip band color when present', () => {
    const pigeonWithAux: Pigeon = {
      id: 'p-aux',
      loftId: 'l-01',
      ringNumber: 'PL-0284-23-9999',
      countryCode: 'PL',
      year: 2023,
      sex: 'hen',
      plumageColor: 'Pstra',
      auxiliaryRingNumber: 'GUM-42',
      clipBandColor: 'yellow',
      photoUrl: 'https://example.com/pigeon.jpg',
      status: 'racing',
      qrCodeUuid: 'uuid-aux',
      isDeleted: false,
      createdAt: '',
      updatedAt: '',
    };

    let component: any;
    act(() => {
      component = renderer.create(
        <PigeonCard pigeon={pigeonWithAux} onPress={jest.fn()} />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('GUM-42');
    expect(tree).toContain('📷');
  });

  test('NestBoxMatrixModal renders 2D breeding loft grid and summary stats', () => {
    const { NestBoxMatrixModal } = require('../src/components/NestBoxMatrixModal');
    const onClose = jest.fn();

    let component: any;
    act(() => {
      component = renderer.create(
        <NestBoxMatrixModal visible={true} onClose={onClose} />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('WIRTUALNY ZARZ\u0104DCA CEL');
    expect(tree).toContain('SCHEMAT KLATKOWY');
    expect(tree).toContain('Zaj\u0119te cele');
  });

  test('FeedCalculatorModal renders 20-grain mixer, macro gauges, and suitability verdict', () => {
    const { FeedCalculatorModal } = require('../src/components/FeedCalculatorModal');
    const onClose = jest.fn();

    let component: any;
    act(() => {
      component = renderer.create(
        <FeedCalculatorModal visible={true} onClose={onClose} />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('LABORATORIUM PASZOWE');
    expect(tree).toContain('BILANS BIOCHEMICZNY');
    expect(tree).toContain('Bia\u0142ko');
    expect(tree).toContain('T\u0142uszcz');
    expect(tree).toContain('SZABLONY MISTRZOWSKICH');
  });

  test('LostPigeonReportModal renders emergency rescue portal, finder details, and report form', () => {
    const { LostPigeonReportModal } = require('../src/components/LostPigeonReportModal');
    const onClose = jest.fn();

    let component: any;
    act(() => {
      component = renderer.create(
        <LostPigeonReportModal visible={true} onClose={onClose} />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('PORTAL RATUNKOWY SOS');
    expect(tree).toContain('ZAGUBIONE I ODNALEZIONE PTAKI');
    expect(tree).toContain('PL-0284-23-1402');
    expect(tree).toContain('Karolina');
  });

  test('PhotoperiodModal renders 24h cycle, preset systems, and blind alarms', () => {
    const { PhotoperiodModal } = require('../src/components/PhotoperiodModal');
    const onClose = jest.fn();

    let component: any;
    act(() => {
      component = renderer.create(
        <PhotoperiodModal visible={true} onClose={onClose} />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('CHRONOBIOLOGIA STADA');
    expect(tree).toContain('FOTOPERIOD I AUTOMATYKA ROLET');
    expect(tree).toContain('Ciemnia (Verdunkelung)');
    expect(tree).toContain('Do\u015bwietlanie (Belichtung)');
    expect(tree).toContain('24-GODZINNY CYKL');
  });

  test('CompartmentsModal renders loft sections, density summary, and stocking capacity', () => {
    const { CompartmentsModal } = require('../src/components/CompartmentsModal');
    const onClose = jest.fn();
    const demoPigeons: Pigeon[] = [
      {
        id: 'p-01',
        loftId: 'l-01',
        ringNumber: 'PL-0284-23-1402',
        countryCode: 'PL',
        year: 2023,
        sex: 'cock',
        plumageColor: 'Niebieski',
        status: 'racing',
        qrCodeUuid: 'uuid-1',
        isDeleted: false,
        createdAt: '',
        updatedAt: '',
      },
    ];

    let component: any;
    act(() => {
      component = renderer.create(
        <CompartmentsModal visible={true} onClose={onClose} pigeons={demoPigeons} />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('ZARZĄDZANIE PRZESTRZENIĄ GOŁĘBNIKA');
    expect(tree).toContain('PRZEDZIAŁY I SEKCJE STADA');
    expect(tree).toContain('SEKTORY FIZYCZNE GOŁĘBNIKA');
    expect(tree).toContain('Wdowców');
    expect(tree).toContain('OPTYMALNE');
  });

  test('DrinkerLabModal renders pH buffering, isotonic rehydration osmolarity, and Carbo-Lipid shift', () => {
    const { DrinkerLabModal } = require('../src/components/DrinkerLabModal');
    const onClose = jest.fn();

    let component: any;
    act(() => {
      component = renderer.create(
        <DrinkerLabModal visible={true} onClose={onClose} />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('LABORATORIUM BIOCHEMICZNE');
    expect(tree).toContain('POIDŁO, pH I REHYDRATACJA');
    expect(tree).toContain('WYNIKOWE pH POIDŁA');
    expect(tree).toContain('Ocet Jabłkowy');
  });

  test('ConcourseSheetModal renders official concourse list, 20% limit, and Olympic categories', () => {
    const { ConcourseSheetModal } = require('../src/components/ConcourseSheetModal');
    const onClose = jest.fn();
    const demoArrivals = [
      {
        id: 'arr-1',
        raceId: 'race-01',
        pigeonId: 'p-01',
        arrivalTime: '2026-06-01T12:00:00Z',
        distanceMeters: 345000,
        velocityMPerMin: 1340.5,
        scanType: 'qr' as const,
        isManualOverride: false,
        createdAt: '',
        updatedAt: '',
        ringNumber: 'PL-0284-23-1402',
        countryCode: 'PL',
        year: 2023,
        sex: 'cock' as const,
        plumageColor: 'Niebieski',
      },
    ];

    let component: any;
    act(() => {
      component = renderer.create(
        <ConcourseSheetModal
          visible={true}
          onClose={onClose}
          raceName="Lot Magdeburg"
          releaseLocation="Magdeburg"
          distanceKm={345}
          totalBasketed={100}
          arrivals={demoArrivals}
        />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('OFICJALNA LISTA KONKURSOWA FCI');
    expect(tree).toContain('Magdeburg');
    expect(tree).toContain('Baza Konkursowa');
    expect(tree).toContain('PL-0284-23-1402');
    expect(tree).toContain('KONKURS');
  });

  test('TandemModal renders loft sharing, members list, invite tab, and audit log', () => {
    const { TandemModal } = require('../src/components/TandemModal');
    const onClose = jest.fn();

    let component: any;
    act(() => {
      component = renderer.create(
        <TandemModal
          visible={true}
          onClose={onClose}
          loftName="Gołębnik Mistrza"
        />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('Tandem & Współdzielenie');
    expect(tree).toContain('Gołębnik Mistrza');
    expect(tree).toContain('Główny Hodowca');
    expect(tree).toContain('Wspólnik / Partner');
    expect(tree).toContain('Janusz Hodowca');
    expect(tree).toContain('Marek Partner');
    expect(tree).toContain('Zaproś Wspólnika');
  });

  test('VeterinaryLabModal renders YPDS triage, symptoms checklist, coproscopy, and 12M calendar', () => {
    const { VeterinaryLabModal } = require('../src/components/VeterinaryLabModal');
    const onClose = jest.fn();

    let component: any;
    act(() => {
      component = renderer.create(
        <VeterinaryLabModal
          visible={true}
          onClose={onClose}
          selectedPigeonRing="PL-0284-24-9102"
        />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('Gabinet Weterynaryjny & Triage');
    expect(tree).toContain('PL-0284-24-9102');
    expect(tree).toContain('Triage YPDS');
    expect(tree).toContain('Koproskopia');
    expect(tree).toContain('Kalendarz 12M');
    expect(tree).toContain('Wole lejące');
  });

  test('SquadsModal renders squad tabs, roster metrics, and assigned pigeons', () => {
    const { SquadsModal } = require('../src/components/SquadsModal');
    const onClose = jest.fn();
    const demoPigeons = [
      {
        id: 'p-01',
        loftId: 'loft-01',
        ringNumber: 'PL-0284-23-1402',
        countryCode: 'PL',
        year: 2023,
        sex: 'cock',
        plumageColor: 'Niebieski',
        status: 'racing',
        isDeleted: false,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'p-02',
        loftId: 'loft-01',
        ringNumber: 'PL-0284-22-9854',
        countryCode: 'PL',
        year: 2022,
        sex: 'hen',
        plumageColor: 'Płowa',
        status: 'racing',
        isDeleted: false,
        createdAt: '',
        updatedAt: '',
      },
    ];

    let component: any;
    act(() => {
      component = renderer.create(
        <SquadsModal
          visible={true}
          onClose={onClose}
          pigeons={demoPigeons as any}
        />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('Drużyny Lotowe & Składy');
    expect(tree).toContain('Drużyna A');
    expect(tree).toContain('Drużyna B');
    expect(tree).toContain('Drużyna C');
    expect(tree).toContain('Drużyna Młodych');
    expect(tree).toContain('Skład');
    expect(tree).toContain('Gotowość');
  });

  test('AntidopingModal renders calculator, FCI registry tabs, and detox protocol', () => {
    const { AntidopingModal } = require('../src/components/AntidopingModal');
    const onClose = jest.fn();

    let component: any;
    act(() => {
      component = renderer.create(
        <AntidopingModal
          visible={true}
          onClose={onClose}
        />
      );
    });

    const tree = JSON.stringify(component.toJSON());
    expect(tree).toContain('TARCZA ANTYDOPINGOWA FCI');
    expect(tree).toContain('Kalkulator Karencji');
    expect(tree).toContain('Wykaz FCI');
    expect(tree).toContain('NAJWCZEŚNIEJSZA DATA KOSZOWANIA');
    expect(tree).toContain('PROTOKÓŁ DETOKSU & OSŁONY');
  });
});









