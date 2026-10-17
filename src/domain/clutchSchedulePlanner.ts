/**
 * PIGEON-FLY — Clutch Schedule Planner & Nest Box Card Generator (Z-073 / DEC-87)
 * Biological timeline engine: Pairing -> Egg 1 -> Egg 2 (+40-44h) -> Candling (D5) -> Hatch (D18)
 * -> Banding Window (D6-D8, FCI 8.0mm ring) -> Crop Milk & Grain -> Weaning (D24).
 */

import { EggStatus } from './breeding';

export type ClutchPlannerStage =
  | 'PAIRING'
  | 'EGG1_WAIT'
  | 'EGG2_WAIT'
  | 'INCUBATING'
  | 'CANDLING_DUE'
  | 'HATCHING_DUE'
  | 'CROP_MILK_FEEDING'
  | 'BANDING_WINDOW_ACTIVE'
  | 'BANDING_OVERDUE'
  | 'REARING_GRAIN'
  | 'WEANING_READY'
  | 'COMPLETED';

export type BandingUrgencyState = 'NOT_DUE' | 'CRITICAL_WINDOW' | 'OVERDUE' | 'COMPLETED';

export interface ClutchScheduleInput {
  clutchId: string;
  loftId?: string;
  nestBox: string; // np. "Cela A-04"
  roundNumber: number; // 1, 2, 3
  cockRingNumber: string;
  henRingNumber: string;
  cockNameOrPedigree?: string;
  henNameOrPedigree?: string;
  pairedDate: string; // YYYY-MM-DD
  egg1Date?: string; // YYYY-MM-DD
  egg2Date?: string; // YYYY-MM-DD
  egg1Status?: EggStatus;
  egg2Status?: EggStatus;
  hatchDate?: string; // YYYY-MM-DD
  chick1RingNumber?: string;
  chick2RingNumber?: string;
  chick1Banded?: boolean;
  chick2Banded?: boolean;
  weanedDate?: string; // YYYY-MM-DD
  notes?: string;
}

export interface MilestoneScheduleItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  relativeDay: number; // e.g. D0 (pair), D9 (egg1), D11 (egg2), D16 (candling D5), D29 (hatch D18), etc.
  status: 'completed' | 'current' | 'upcoming' | 'missed';
  description: string;
  urgencyLevel: 'info' | 'warning' | 'critical' | 'success';
}

export interface ClutchSchedulePlan {
  clutchId: string;
  nestBox: string;
  roundNumber: number;
  cockRingNumber: string;
  henRingNumber: string;
  currentStage: ClutchPlannerStage;
  stageLabel: string;
  progressPct: number; // 0 - 100%
  incubationDay?: number; // 1 - 18 if incubating
  chickAgeDays?: number; // 0 - 24+ if hatched
  bandingState: BandingUrgencyState;
  daysRemainingInBandingWindow: number;
  alerts: string[];
  milestones: {
    pairedDate: string;
    expectedEgg1Date: string;
    actualEgg1Date?: string;
    expectedEgg2Date: string;
    actualEgg2Date?: string;
    candlingDate: string;
    expectedHatchDate: string;
    actualHatchDate?: string;
    bandingStartDate: string;
    bandingEndDate: string;
    grainTransitionDate: string;
    weaningDate: string;
    actualWeanedDate?: string;
  };
  timeline: MilestoneScheduleItem[];
  chick1RingNumber?: string;
  chick2RingNumber?: string;
  chick1Banded: boolean;
  chick2Banded: boolean;
  notes?: string;
}

const parseDateOnly = (dStr: string): Date => {
  const parts = dStr.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0, 0);
};

const formatDateOnly = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const diffInDays = (d1: Date, d2: Date): number => {
  const ms1 = d1.getTime();
  const ms2 = d2.getTime();
  return Math.round((ms1 - ms2) / (1000 * 60 * 60 * 24));
};

/**
 * Calculates biological clutch schedule milestones, current stage, and banding urgency alerts.
 */
export function planClutchSchedule(
  input: ClutchScheduleInput,
  nowDate: Date = new Date()
): ClutchSchedulePlan {
  const today = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 12, 0, 0, 0);
  const pairDate = parseDateOnly(input.pairedDate);

  // Expected Egg 1: 9 days after pairing (biological average: 8-10 days)
  const expEgg1Date = new Date(pairDate);
  expEgg1Date.setDate(expEgg1Date.getDate() + 9);

  // Egg 1 reference
  const egg1Ref = input.egg1Date ? parseDateOnly(input.egg1Date) : expEgg1Date;

  // Expected Egg 2: ~40-44h after Egg 1 (2 calendar days)
  const expEgg2Date = new Date(egg1Ref);
  expEgg2Date.setDate(expEgg2Date.getDate() + 2);

  // Egg 2 reference for incubation
  const egg2Ref = input.egg2Date ? parseDateOnly(input.egg2Date) : expEgg2Date;

  // Candling (Owoskopia): Day 5 of active incubation (effective from Egg 2)
  const candlingDate = new Date(egg2Ref);
  candlingDate.setDate(candlingDate.getDate() + 5);

  // Expected Hatching (Wylęg): Day 18 of incubation from Egg 2
  const expHatchDate = new Date(egg2Ref);
  expHatchDate.setDate(expHatchDate.getDate() + 18);

  // Hatch reference
  const hatchRef = input.hatchDate ? parseDateOnly(input.hatchDate) : expHatchDate;

  // Banding window: Day 6 to Day 8 after hatching (FCI 8.0mm ring)
  const bandingStartDate = new Date(hatchRef);
  bandingStartDate.setDate(bandingStartDate.getDate() + 6);

  const bandingEndDate = new Date(hatchRef);
  bandingEndDate.setDate(bandingEndDate.getDate() + 8);

  // Grain transition: Day 6 to Day 10 (parents mix grain into crop milk)
  const grainTransitionDate = new Date(hatchRef);
  grainTransitionDate.setDate(grainTransitionDate.getDate() + 6);

  // Weaning (Odsadzenie): Day 24 after hatching
  const weaningDate = new Date(hatchRef);
  weaningDate.setDate(weaningDate.getDate() + 24);

  const alerts: string[] = [];
  let currentStage: ClutchPlannerStage = 'PAIRING';
  let stageLabel = 'Parowanie';
  let progressPct = 5;
  let bandingState: BandingUrgencyState = 'NOT_DUE';
  let daysRemainingInBandingWindow = 0;
  let incubationDay: number | undefined;
  let chickAgeDays: number | undefined;

  const bothBanded =
    Boolean(input.chick1Banded && (input.chick2Banded || input.egg2Status === 'broken' || input.egg2Status === 'infertile'));

  if (input.weanedDate) {
    currentStage = 'COMPLETED';
    stageLabel = 'Cykl lęgowy zakończony (młódki odsadzone)';
    progressPct = 100;
    bandingState = 'COMPLETED';
  } else if (input.hatchDate) {
    const hatchDateObj = parseDateOnly(input.hatchDate);
    chickAgeDays = diffInDays(today, hatchDateObj);

    if (chickAgeDays >= 24) {
      currentStage = 'WEANING_READY';
      stageLabel = `Gotowość do odsadzenia (${chickAgeDays}. dzień życia)`;
      progressPct = 95;
      alerts.push('Młódki osiągnęły 24. dzień życia — czas przenieść je do przedziału młodzieży!');
    } else if (chickAgeDays >= 6 && chickAgeDays <= 8) {
      const needsBanding = !input.chick1Banded || (!input.chick2Banded && input.egg2Status !== 'infertile' && input.egg2Status !== 'broken');
      daysRemainingInBandingWindow = Math.max(0, 8 - chickAgeDays);

      if (needsBanding) {
        currentStage = 'BANDING_WINDOW_ACTIVE';
        stageLabel = `KRYTYCZNE OKNO OBRĄCZKOWANIA (${chickAgeDays}. dzień życia)`;
        bandingState = 'CRITICAL_WINDOW';
        alerts.push(
          `KRYTYCZNE OKNO OBRĄCZKOWANIA: ${chickAgeDays}. dzień po wylęgu! Zostało ${daysRemainingInBandingWindow} dni na założenie obrączek rodowych 8.0 mm (później staw skokowy zgrubieje).`
        );
      } else {
        currentStage = 'REARING_GRAIN';
        stageLabel = `Odchów piskląt — zaobrączkowane (${chickAgeDays}. dzień życia)`;
        bandingState = 'COMPLETED';
      }
      progressPct = Math.round(55 + (chickAgeDays / 24) * 35);
    } else if (chickAgeDays > 8) {
      const needsBanding = !input.chick1Banded || (!input.chick2Banded && input.egg2Status !== 'infertile' && input.egg2Status !== 'broken');
      if (needsBanding) {
        currentStage = 'BANDING_OVERDUE';
        stageLabel = `ALARM: Spóźnione obrączkowanie (${chickAgeDays}. dzień życia)`;
        bandingState = 'OVERDUE';
        alerts.push(
          `ALARM: Pisklęta mają ${chickAgeDays} dni! Standardowa obrączka 8.0 mm może być trudna lub niemożliwa do wsunięcia bez wazeliny.`
        );
      } else {
        currentStage = 'REARING_GRAIN';
        stageLabel = `Odchów na ziarnie (${chickAgeDays}. dzień życia)`;
        bandingState = 'COMPLETED';
      }
      progressPct = Math.min(92, Math.round(55 + (chickAgeDays / 24) * 35));
    } else {
      // Days 0 to 5 post hatch
      currentStage = 'CROP_MILK_FEEDING';
      stageLabel = `Karmienie mleczkiem wola (${chickAgeDays}. dzień życia)`;
      progressPct = Math.round(50 + (chickAgeDays / 24) * 20);
      bandingState = 'NOT_DUE';
      daysRemainingInBandingWindow = 6 - chickAgeDays;
    }
  } else if (input.egg2Date || input.egg1Date) {
    const incStart = input.egg2Date ? parseDateOnly(input.egg2Date) : parseDateOnly(input.egg1Date!);
    incubationDay = diffInDays(today, incStart);

    if (incubationDay >= 17) {
      currentStage = 'HATCHING_DUE';
      stageLabel = `Termin wylęgu (${incubationDay}. dzień inkubacji)`;
      progressPct = 50;
      alerts.push('17-18. dzień inkubacji: spodziewane nakłuwanie skorupki (klucie). Sprawdź wilgotność w celi.');
    } else if (incubationDay >= 5 && incubationDay <= 7) {
      const candled =
        (input.egg1Status === 'fertile' || input.egg1Status === 'infertile') &&
        (input.egg2Status === 'fertile' || input.egg2Status === 'infertile');

      if (!candled) {
        currentStage = 'CANDLING_DUE';
        stageLabel = `Termin owoskopii (${incubationDay}. dzień inkubacji)`;
        alerts.push('5. dzień inkubacji: Czas na owoskopię! Prześwietl jajka, aby sprawdzić pajączek naczyniowy.');
      } else {
        currentStage = 'INCUBATING';
        stageLabel = `Wysiadywanie po owoskopii (${incubationDay}. dzień inkubacji)`;
      }
      progressPct = Math.round(15 + (incubationDay / 18) * 35);
    } else {
      currentStage = 'INCUBATING';
      stageLabel = `Wysiadywanie (${Math.max(1, incubationDay)}. dzień inkubacji)`;
      progressPct = Math.round(15 + Math.min(18, Math.max(1, incubationDay)) * 1.8);
    }
  } else {
    // Awaiting eggs
    const daysSincePair = diffInDays(today, pairDate);
    if (daysSincePair >= 7) {
      currentStage = 'EGG1_WAIT';
      stageLabel = `Oczekiwanie na 1. jajo (${daysSincePair}. dzień od sparowania)`;
      alerts.push('Para zbliża się do terminu zniesienia 1. jaja (zwykle 8-10 dni po parowaniu). Podaj grit i minerały.');
    } else {
      currentStage = 'PAIRING';
      stageLabel = `Parowanie (${Math.max(0, daysSincePair)}. dzień)`;
    }
    progressPct = Math.min(15, Math.max(5, Math.round((daysSincePair / 9) * 15)));
  }

  // Build timeline items
  const timeline: MilestoneScheduleItem[] = [
    {
      id: 'm-pair',
      title: 'Parowanie',
      date: formatDateOnly(pairDate),
      relativeDay: 0,
      status: diffInDays(today, pairDate) >= 0 ? 'completed' : 'upcoming',
      description: `♂ ${input.cockRingNumber} x ♀ ${input.henRingNumber}`,
      urgencyLevel: 'info',
    },
    {
      id: 'm-egg1',
      title: '1. Jajo (Złożenie)',
      date: input.egg1Date || formatDateOnly(expEgg1Date),
      relativeDay: 9,
      status: input.egg1Date
        ? 'completed'
        : diffInDays(today, expEgg1Date) > 2
        ? 'missed'
        : diffInDays(today, expEgg1Date) >= 0
        ? 'current'
        : 'upcoming',
      description: input.egg1Date ? `Zniesione: ${input.egg1Date}` : 'Oczekiwane (+9 dni po sparowaniu)',
      urgencyLevel: input.egg1Date ? 'success' : 'info',
    },
    {
      id: 'm-egg2',
      title: '2. Jajo (+40-44h)',
      date: input.egg2Date || formatDateOnly(expEgg2Date),
      relativeDay: 11,
      status: input.egg2Date
        ? 'completed'
        : diffInDays(today, expEgg2Date) > 2
        ? 'missed'
        : diffInDays(today, expEgg2Date) >= 0
        ? 'current'
        : 'upcoming',
      description: input.egg2Date
        ? `Zniesione: ${input.egg2Date} (początek inkubacji)`
        : 'Oczekiwane ~44h po pierwszym jaju',
      urgencyLevel: input.egg2Date ? 'success' : 'info',
    },
    {
      id: 'm-candling',
      title: 'Owoskopia (D5 Inkubacji)',
      date: formatDateOnly(candlingDate),
      relativeDay: 16,
      status:
        input.egg1Status === 'fertile' || input.egg1Status === 'infertile'
          ? 'completed'
          : diffInDays(today, candlingDate) > 2
          ? 'missed'
          : diffInDays(today, candlingDate) >= 0
          ? 'current'
          : 'upcoming',
      description: 'Prześwietlenie jaj — kontrola naczyń krwionośnych (pajączek)',
      urgencyLevel: currentStage === 'CANDLING_DUE' ? 'warning' : 'info',
    },
    {
      id: 'm-hatch',
      title: 'Wylęg (D18 Inkubacji)',
      date: input.hatchDate || formatDateOnly(expHatchDate),
      relativeDay: 29,
      status: input.hatchDate
        ? 'completed'
        : diffInDays(today, expHatchDate) > 2
        ? 'missed'
        : diffInDays(today, expHatchDate) >= 0
        ? 'current'
        : 'upcoming',
      description: input.hatchDate ? `Wylęgnięte: ${input.hatchDate}` : '18 dni od złożenia 2. jaja',
      urgencyLevel: input.hatchDate ? 'success' : 'info',
    },
    {
      id: 'm-banding',
      title: 'Obrączkowanie (D6-D8 życia)',
      date: `${formatDateOnly(bandingStartDate)} do ${formatDateOnly(bandingEndDate)}`,
      relativeDay: 35,
      status: bothBanded
        ? 'completed'
        : bandingState === 'OVERDUE'
        ? 'missed'
        : bandingState === 'CRITICAL_WINDOW'
        ? 'current'
        : 'upcoming',
      description: bothBanded
        ? `Zaobrączkowane (${input.chick1RingNumber || '1'} & ${input.chick2RingNumber || '2'})`
        : 'Krytyczne okno na obrączki rodowe 8.0 mm',
      urgencyLevel: bandingState === 'CRITICAL_WINDOW' ? 'critical' : bothBanded ? 'success' : 'warning',
    },
    {
      id: 'm-weaning',
      title: 'Odsadzenie (D24 życia)',
      date: input.weanedDate || formatDateOnly(weaningDate),
      relativeDay: 53,
      status: input.weanedDate
        ? 'completed'
        : currentStage === 'WEANING_READY'
        ? 'current'
        : 'upcoming',
      description: 'Przeniesienie do gołębnika młodzieży',
      urgencyLevel: currentStage === 'WEANING_READY' ? 'warning' : 'info',
    },
  ];

  return {
    clutchId: input.clutchId,
    nestBox: input.nestBox,
    roundNumber: input.roundNumber,
    cockRingNumber: input.cockRingNumber,
    henRingNumber: input.henRingNumber,
    currentStage,
    stageLabel,
    progressPct,
    incubationDay,
    chickAgeDays,
    bandingState,
    daysRemainingInBandingWindow,
    alerts,
    milestones: {
      pairedDate: formatDateOnly(pairDate),
      expectedEgg1Date: formatDateOnly(expEgg1Date),
      actualEgg1Date: input.egg1Date,
      expectedEgg2Date: formatDateOnly(expEgg2Date),
      actualEgg2Date: input.egg2Date,
      candlingDate: formatDateOnly(candlingDate),
      expectedHatchDate: formatDateOnly(expHatchDate),
      actualHatchDate: input.hatchDate,
      bandingStartDate: formatDateOnly(bandingStartDate),
      bandingEndDate: formatDateOnly(bandingEndDate),
      grainTransitionDate: formatDateOnly(grainTransitionDate),
      weaningDate: formatDateOnly(weaningDate),
      actualWeanedDate: input.weanedDate,
    },
    timeline,
    chick1RingNumber: input.chick1RingNumber,
    chick2RingNumber: input.chick2RingNumber,
    chick1Banded: Boolean(input.chick1Banded),
    chick2Banded: Boolean(input.chick2Banded),
    notes: input.notes,
  };
}

/**
 * Filter clutches that need immediate banding attention (D6-D8 window active or overdue).
 */
export function filterUrgentBandingSchedules(plans: ClutchSchedulePlan[]): ClutchSchedulePlan[] {
  return plans.filter(
    (p) => p.bandingState === 'CRITICAL_WINDOW' || p.bandingState === 'OVERDUE'
  );
}

/**
 * Generates ready-to-print HTML for standard Nest Box Front Cards (A4 format).
 * Each page holds up to 2 large cards or 4 compact cards.
 */
export function generateNestBoxFrontCardHtml(
  plan: ClutchSchedulePlan,
  metadata?: {
    loftName?: string;
    breederName?: string;
    seasonYear?: number;
  }
): string {
  const loft = metadata?.loftName || 'Gołębnik Lotowy i Rozpłodowy';
  const breeder = metadata?.breederName || 'Hodowca Pigeon-Fly';
  const year = metadata?.seasonYear || new Date().getFullYear();

  const m = plan.milestones;

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <title>Karta Celi Lęgowej - ${plan.nestBox}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background: #fdfdfd;
      color: #1a1a1a;
      -webkit-print-color-adjust: exact;
    }
    .card-container {
      border: 3px solid #1e293b;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .box-badge {
      font-size: 26px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    .round-tag {
      display: inline-block;
      background: #0284c7;
      color: #ffffff;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      margin-left: 10px;
    }
    .loft-info {
      text-align: right;
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
    }
    .parents-grid {
      display: flex;
      gap: 12px;
      margin-bottom: 14px;
    }
    .parent-box {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px;
      background: #f8fafc;
    }
    .parent-label {
      font-size: 11px;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .parent-ring {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    .milestones-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 12px;
    }
    .milestones-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
    }
    .milestones-table td {
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      font-weight: 500;
    }
    .highlight-cell {
      background: #fef08a;
      font-weight: 800 !important;
      color: #854d0e;
    }
    .chicks-section {
      border: 2px dashed #94a3b8;
      border-radius: 8px;
      padding: 10px;
      background: #f8fafc;
      margin-bottom: 12px;
    }
    .chicks-title {
      font-size: 12px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .chick-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
    }
    .chick-row:last-child {
      border-bottom: none;
    }
    .chick-ring-num {
      font-weight: 800;
      font-size: 15px;
      color: #0369a1;
    }
    .qr-stub {
      font-family: monospace;
      font-size: 10px;
      color: #64748b;
      text-align: right;
    }
    .notes-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px;
      min-height: 48px;
      font-size: 11px;
      color: #475569;
      background: #ffffff;
    }
    .notes-label {
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="card-container">
    <table class="header-table">
      <tr>
        <td>
          <span class="box-badge">${plan.nestBox}</span>
          <span class="round-tag">LĘG ${plan.roundNumber} / ${year}</span>
        </td>
        <td class="loft-info">
          <strong>${loft}</strong><br />
          ${breeder} &bull; PZHGP ${year}
        </td>
      </tr>
    </table>

    <div class="parents-grid">
      <div class="parent-box">
        <div class="parent-label">♂ OJCIEC (SAM BR.)</div>
        <div class="parent-ring">${plan.cockRingNumber}</div>
      </div>
      <div class="parent-box">
        <div class="parent-label">♀ MATKA (SAMICA)</div>
        <div class="parent-ring">${plan.henRingNumber}</div>
      </div>
    </div>

    <table class="milestones-table">
      <thead>
        <tr>
          <th>Etap biologiczny</th>
          <th>Termin planowany</th>
          <th>Wykonanie / Data</th>
          <th>Uwagi biologiczne</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Parowanie</strong></td>
          <td>${m.pairedDate}</td>
          <td>${m.pairedDate}</td>
          <td>Zestawienie pary w celi</td>
        </tr>
        <tr>
          <td><strong>Jajo I</strong></td>
          <td>${m.expectedEgg1Date}</td>
          <td>${m.actualEgg1Date || '&mdash;'}</td>
          <td>8-10 dni po sparowaniu</td>
        </tr>
        <tr>
          <td><strong>Jajo II</strong></td>
          <td>${m.expectedEgg2Date}</td>
          <td>${m.actualEgg2Date || '&mdash;'}</td>
          <td>+40-44h po pierwszym jaju</td>
        </tr>
        <tr>
          <td><strong>Owoskopia (D5)</strong></td>
          <td>${m.candlingDate}</td>
          <td>${m.actualEgg2Date ? 'Zalężone' : '&mdash;'}</td>
          <td>Prześwietlenie latarką (pajączek)</td>
        </tr>
        <tr>
          <td><strong>Wylęg (D18)</strong></td>
          <td>${m.expectedHatchDate}</td>
          <td>${m.actualHatchDate || '&mdash;'}</td>
          <td>18. dzień inkubacji</td>
        </tr>
        <tr class="highlight-cell">
          <td><strong>Obrączkowanie (D6-D8)</strong></td>
          <td>${m.bandingStartDate} do ${m.bandingEndDate}</td>
          <td>${plan.chick1Banded ? 'Zaobrączkowano' : 'CZEKA'}</td>
          <td>Standard FCI 8.0 mm (krytyczne okno!)</td>
        </tr>
        <tr>
          <td><strong>Odsadzenie (D24)</strong></td>
          <td>${m.weaningDate}</td>
          <td>${m.actualWeanedDate || '&mdash;'}</td>
          <td>Przeniesienie do przedziału młodzieży</td>
        </tr>
      </tbody>
    </table>

    <div class="chicks-section">
      <div class="chicks-title">Pobrane obrączki rodowe (Młódki)</div>
      <div class="chick-row">
        <span>Pisklę 1:</span>
        <span class="chick-ring-num">${plan.chick1RingNumber || '[ ................................ ]'}</span>
        <span>${plan.chick1Banded ? '&#9989; Zaobrączkowany' : '&#9744; Niezaobrączkowany'}</span>
      </div>
      <div class="chick-row">
        <span>Pisklę 2:</span>
        <span class="chick-ring-num">${plan.chick2RingNumber || '[ ................................ ]'}</span>
        <span>${plan.chick2Banded ? '&#9989; Zaobrączkowany' : '&#9744; Niezaobrączkowany'}</span>
      </div>
    </div>

    <div class="notes-box">
      <div class="notes-label">Karta obserwacji weterynaryjnej / Uwagi hodowcy</div>
      <div>${plan.notes || 'Stan ściółki: czysta &bull; Konsystencja odchodów: prawidłowa &bull; Wole: wypełnione mleczkiem'}</div>
    </div>

    <div class="qr-stub" style="margin-top: 8px;">
      Pigeon-Fly Mobile Loft &bull; ID: ${plan.clutchId} &bull; Wygenerowano: ${new Date().toISOString().slice(0, 10)}
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generates combined printable HTML sheet for all clutches.
 */
export function generateNestBoxCardsSheetHtml(
  plans: ClutchSchedulePlan[],
  metadata?: {
    loftName?: string;
    breederName?: string;
    seasonYear?: number;
  }
): string {
  const cardsHtml = plans
    .map((p) => generateNestBoxFrontCardHtml(p, metadata))
    .map((fullHtml) => {
      // extract inside body
      const match = fullHtml.match(/<body>([\s\S]*?)<\/body>/);
      return match ? match[1] : fullHtml;
    })
    .join('\n<div style="page-break-after: always;"></div>\n');

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <title>Zbiorcze Karty Cel Lęgowych (${plans.length} cel)</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #1a1a1a;
      -webkit-print-color-adjust: exact;
    }
    .card-container {
      border: 2px solid #1e293b;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 16px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .header-table { width: 100%; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 10px; }
    .box-badge { font-size: 22px; font-weight: 900; color: #0f172a; }
    .round-tag { display: inline-block; background: #0284c7; color: #ffffff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-left: 8px; }
    .loft-info { text-align: right; font-size: 11px; color: #64748b; font-weight: 600; }
    .parents-grid { display: flex; gap: 10px; margin-bottom: 10px; }
    .parent-box { flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; background: #f8fafc; }
    .parent-label { font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; }
    .parent-ring { font-size: 15px; font-weight: 900; color: #0f172a; }
    .milestones-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11px; }
    .milestones-table th { background: #f1f5f9; color: #334155; font-weight: 700; text-align: left; padding: 5px 6px; border: 1px solid #cbd5e1; }
    .milestones-table td { padding: 4px 6px; border: 1px solid #cbd5e1; }
    .highlight-cell { background: #fef08a; font-weight: 800 !important; color: #854d0e; }
    .chicks-section { border: 1px dashed #94a3b8; border-radius: 6px; padding: 8px; background: #f8fafc; margin-bottom: 8px; font-size: 11px; }
    .chicks-title { font-size: 11px; font-weight: 800; color: #0f172a; margin-bottom: 4px; text-transform: uppercase; }
    .chick-row { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; border-bottom: 1px solid #e2e8f0; }
    .chick-row:last-child { border-bottom: none; }
    .chick-ring-num { font-weight: 800; font-size: 13px; color: #0369a1; }
    .notes-box { border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px; min-height: 36px; font-size: 10px; color: #475569; }
    .notes-label { font-weight: 700; font-size: 9px; text-transform: uppercase; color: #94a3b8; margin-bottom: 2px; }
    .qr-stub { font-family: monospace; font-size: 9px; color: #64748b; text-align: right; }
  </style>
</head>
<body>
  ${cardsHtml}
</body>
</html>
  `.trim();
}
