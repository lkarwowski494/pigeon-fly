import {
  planClutchSchedule,
  filterUrgentBandingSchedules,
  generateNestBoxFrontCardHtml,
  generateNestBoxCardsSheetHtml,
  ClutchScheduleInput,
} from '../src/domain/clutchSchedulePlanner';

describe('ClutchSchedulePlanner Domain (Z-073)', () => {
  const basePairing: ClutchScheduleInput = {
    clutchId: 'clutch-test-1',
    nestBox: 'Cela A-04',
    roundNumber: 1,
    cockRingNumber: 'PL-0284-23-1402',
    henRingNumber: 'PL-0284-22-9854',
    pairedDate: '2026-03-01',
  };

  test('calculates correct biological milestones from pairing date', () => {
    const plan = planClutchSchedule(basePairing, new Date('2026-03-02'));

    expect(plan.milestones.pairedDate).toBe('2026-03-01');
    expect(plan.milestones.expectedEgg1Date).toBe('2026-03-10'); // +9d
    expect(plan.milestones.expectedEgg2Date).toBe('2026-03-12'); // +2d
    expect(plan.milestones.candlingDate).toBe('2026-03-17'); // +5d from egg 2
    expect(plan.milestones.expectedHatchDate).toBe('2026-03-30'); // +18d from egg 2
    expect(plan.milestones.bandingStartDate).toBe('2026-04-05'); // +6d from hatch
    expect(plan.milestones.bandingEndDate).toBe('2026-04-07'); // +8d from hatch
    expect(plan.milestones.grainTransitionDate).toBe('2026-04-05'); // +6d
    expect(plan.milestones.weaningDate).toBe('2026-04-23'); // +24d from hatch

    expect(plan.currentStage).toBe('PAIRING');
    expect(plan.bandingState).toBe('NOT_DUE');
    expect(plan.timeline.length).toBe(7);
  });

  test('detects EGG1_WAIT stage when 7+ days after pairing', () => {
    const plan = planClutchSchedule(basePairing, new Date('2026-03-08'));
    expect(plan.currentStage).toBe('EGG1_WAIT');
    expect(plan.alerts.length).toBeGreaterThan(0);
    expect(plan.alerts[0]).toContain('zbliża się do terminu zniesienia 1. jaja');
  });

  test('evaluates incubation and owoskopia (candling) on Day 5 of incubation', () => {
    const incubatingClutch: ClutchScheduleInput = {
      ...basePairing,
      egg1Date: '2026-03-10',
      egg2Date: '2026-03-12',
      egg1Status: 'laid',
      egg2Status: 'laid',
    };

    const plan = planClutchSchedule(incubatingClutch, new Date('2026-03-17')); // Day 5 from egg2
    expect(plan.currentStage).toBe('CANDLING_DUE');
    expect(plan.incubationDay).toBe(5);
    expect(plan.alerts.some((a) => a.includes('owoskopię'))).toBe(true);
  });

  test('evaluates hatching due stage on Day 17 of incubation', () => {
    const nearHatchClutch: ClutchScheduleInput = {
      ...basePairing,
      egg1Date: '2026-03-10',
      egg2Date: '2026-03-12',
      egg1Status: 'fertile',
      egg2Status: 'fertile',
    };

    const plan = planClutchSchedule(nearHatchClutch, new Date('2026-03-29')); // Day 17
    expect(plan.currentStage).toBe('HATCHING_DUE');
    expect(plan.incubationDay).toBe(17);
    expect(plan.alerts.some((a) => a.includes('spodziewane nakłuwanie'))).toBe(true);
  });

  test('evaluates crop milk phase for squabs aged 1-5 days', () => {
    const cropMilkClutch: ClutchScheduleInput = {
      ...basePairing,
      egg1Date: '2026-03-10',
      egg2Date: '2026-03-12',
      hatchDate: '2026-03-30',
      chick1Banded: false,
      chick2Banded: false,
    };

    const plan = planClutchSchedule(cropMilkClutch, new Date('2026-04-02')); // Day 3
    expect(plan.currentStage).toBe('CROP_MILK_FEEDING');
    expect(plan.chickAgeDays).toBe(3);
    expect(plan.bandingState).toBe('NOT_DUE');
    expect(plan.daysRemainingInBandingWindow).toBe(3); // 6 - 3 = 3 days until D6
  });

  test('triggers CRITICAL_WINDOW banding alert during days 6-8 if chicks not banded', () => {
    const bandingClutch: ClutchScheduleInput = {
      ...basePairing,
      egg1Date: '2026-03-10',
      egg2Date: '2026-03-12',
      hatchDate: '2026-03-30',
      chick1Banded: false,
      chick2Banded: false,
    };

    const planDay7 = planClutchSchedule(bandingClutch, new Date('2026-04-06')); // Day 7
    expect(planDay7.currentStage).toBe('BANDING_WINDOW_ACTIVE');
    expect(planDay7.bandingState).toBe('CRITICAL_WINDOW');
    expect(planDay7.daysRemainingInBandingWindow).toBe(1); // 8 - 7 = 1 day left
    expect(planDay7.alerts.some((a) => a.includes('KRYTYCZNE OKNO OBRĄCZKOWANIA'))).toBe(true);
    expect(planDay7.alerts.some((a) => a.includes('8.0 mm'))).toBe(true);
  });

  test('marks banding completed if chicks are banded during days 6-8', () => {
    const bandedClutch: ClutchScheduleInput = {
      ...basePairing,
      egg1Date: '2026-03-10',
      egg2Date: '2026-03-12',
      hatchDate: '2026-03-30',
      chick1RingNumber: 'PL-0284-26-101',
      chick2RingNumber: 'PL-0284-26-102',
      chick1Banded: true,
      chick2Banded: true,
    };

    const planDay7 = planClutchSchedule(bandedClutch, new Date('2026-04-06')); // Day 7
    expect(planDay7.currentStage).toBe('REARING_GRAIN');
    expect(planDay7.bandingState).toBe('COMPLETED');
    expect(planDay7.alerts.length).toBe(0);
  });

  test('triggers OVERDUE alert if chicks > 8 days old and still not banded', () => {
    const lateClutch: ClutchScheduleInput = {
      ...basePairing,
      egg1Date: '2026-03-10',
      egg2Date: '2026-03-12',
      hatchDate: '2026-03-30',
      chick1Banded: false,
      chick2Banded: false,
    };

    const planDay10 = planClutchSchedule(lateClutch, new Date('2026-04-09')); // Day 10
    expect(planDay10.currentStage).toBe('BANDING_OVERDUE');
    expect(planDay10.bandingState).toBe('OVERDUE');
    expect(planDay10.alerts.some((a) => a.includes('Spóźnione') || a.includes('wazeliny'))).toBe(true);
  });

  test('evaluates WEANING_READY stage on Day 24+ after hatch', () => {
    const readyClutch: ClutchScheduleInput = {
      ...basePairing,
      egg1Date: '2026-03-10',
      egg2Date: '2026-03-12',
      hatchDate: '2026-03-30',
      chick1Banded: true,
      chick2Banded: true,
    };

    const planDay25 = planClutchSchedule(readyClutch, new Date('2026-04-24')); // Day 25
    expect(planDay25.currentStage).toBe('WEANING_READY');
    expect(planDay25.alerts.some((a) => a.includes('przenieść je do przedziału młodzieży'))).toBe(true);
  });

  test('evaluates COMPLETED stage when weanedDate is filled', () => {
    const completedClutch: ClutchScheduleInput = {
      ...basePairing,
      egg1Date: '2026-03-10',
      egg2Date: '2026-03-12',
      hatchDate: '2026-03-30',
      chick1Banded: true,
      chick2Banded: true,
      weanedDate: '2026-04-23',
    };

    const plan = planClutchSchedule(completedClutch, new Date('2026-04-25'));
    expect(plan.currentStage).toBe('COMPLETED');
    expect(plan.progressPct).toBe(100);
    expect(plan.bandingState).toBe('COMPLETED');
  });

  test('filterUrgentBandingSchedules correctly identifies urgent and overdue clutches', () => {
    const plan1 = planClutchSchedule(
      {
        ...basePairing,
        clutchId: 'c-1',
        nestBox: 'Cela 1',
        hatchDate: '2026-03-30',
        chick1Banded: false,
      },
      new Date('2026-04-06') // Day 7 -> CRITICAL
    );

    const plan2 = planClutchSchedule(
      {
        ...basePairing,
        clutchId: 'c-2',
        nestBox: 'Cela 2',
        hatchDate: '2026-03-30',
        chick1Banded: true,
        chick2Banded: true,
      },
      new Date('2026-04-06') // Day 7 -> COMPLETED
    );

    const plan3 = planClutchSchedule(
      {
        ...basePairing,
        clutchId: 'c-3',
        nestBox: 'Cela 3',
        hatchDate: '2026-03-25',
        chick1Banded: false,
      },
      new Date('2026-04-06') // Day 12 -> OVERDUE
    );

    const urgent = filterUrgentBandingSchedules([plan1, plan2, plan3]);
    expect(urgent.length).toBe(2);
    expect(urgent.map((u) => u.clutchId)).toEqual(['c-1', 'c-3']);
  });

  test('generateNestBoxFrontCardHtml returns valid HTML with parents, dates, and box label', () => {
    const plan = planClutchSchedule(
      {
        ...basePairing,
        chick1RingNumber: 'PL-0284-26-101',
        chick2RingNumber: 'PL-0284-26-102',
        chick1Banded: true,
        chick2Banded: true,
      },
      new Date('2026-03-05')
    );

    const html = generateNestBoxFrontCardHtml(plan, {
      loftName: 'Gołębnik Olimpijski',
      breederName: 'Jan Kowalski',
      seasonYear: 2026,
    });

    expect(html).toContain('Cela A-04');
    expect(html).toContain('Gołębnik Olimpijski');
    expect(html).toContain('Jan Kowalski');
    expect(html).toContain('PL-0284-23-1402'); // cock
    expect(html).toContain('PL-0284-22-9854'); // hen
    expect(html).toContain('PL-0284-26-101'); // chick 1
    expect(html).toContain('Standard FCI 8.0 mm');
  });

  test('generateNestBoxCardsSheetHtml combines multiple cards with page breaks', () => {
    const planA = planClutchSchedule({ ...basePairing, clutchId: 'cA', nestBox: 'Cela A-01' });
    const planB = planClutchSchedule({ ...basePairing, clutchId: 'cB', nestBox: 'Cela A-02' });

    const sheetHtml = generateNestBoxCardsSheetHtml([planA, planB], {
      loftName: 'Mistrzowski Gołębnik',
      breederName: 'Kamil Nowak',
      seasonYear: 2026,
    });

    expect(sheetHtml).toContain('Cela A-01');
    expect(sheetHtml).toContain('Cela A-02');
    expect(sheetHtml).toContain('page-break-after: always;');
  });
});
