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
