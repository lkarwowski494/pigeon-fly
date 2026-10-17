/**
 * PIGEON-FLY — FCI Standard Exhibition Judging Engine (Z-054, BR-APP-004)
 * Official judging scorecard calculation according to FCI Standard Regulations:
 * - 5 official criteria (20 pts each): Head & Eye, Bone/Sternum/Vent, Back & Loin, Musculature, Wing & Feathering
 * - Normalized FCI scoring scale: 90.00 to 95.00 points
 * - Official exhibition prize classification (Gold, Silver, Bronze Medal, Olympiad Class)
 * - Official show cage card (Karta Klatkowa) HTML generation for PDF printing.
 */

export interface FciJudgingCategoryScore {
  score: number; // 17.00 - 20.00 (z krokiem 0.25 pkt)
  subcriterionNotes: string[];
}

export interface FciStandardAppraisalInput {
  pigeonId: string;
  ringNumber: string;
  year: number;
  sex: 'cock' | 'hen';
  color: string;
  categoryStandard: 'standard_sport_cock' | 'standard_sport_hen' | 'standard_wyczyn' | 'standard_junior';
  judgeName: string;
  judgeLicenseNumber?: string;
  exhibitionName: string; // np. "68. Ogólnopolska Wystawa Gołębi Pocztowych Sosnowiec"
  cageNumber?: string; // np. "Klatka 142"

  headAndEye: FciJudgingCategoryScore;
  boneAndSternum: FciJudgingCategoryScore;
  backAndLoin: FciJudgingCategoryScore;
  musculatureAndBalance: FciJudgingCategoryScore;
  wingAndPlumage: FciJudgingCategoryScore;

  disqualifyingFlaws?: string[];
  generalJudgeRemarks?: string;
}

export type FciMedalAward =
  | 'gold_olympic_champion' // >= 93.50 pkt
  | 'silver_master_class' // 92.50 - 93.49 pkt
  | 'bronze_competition_class' // 91.50 - 92.49 pkt
  | 'conforming_standard' // 90.00 - 91.49 pkt
  | 'disqualified_unclassified'; // < 90.00 pkt

export interface FciStandardJudgingResult {
  pigeonId: string;
  ringNumber: string;
  totalScore: number; // np. 92.75 pkt
  award: FciMedalAward;
  awardTitle: string;
  awardBadgeColor: string;
  isEligibleForNationalTeam: boolean; // >= 92.50 pkt do Reprezentacji Polski na Olimpiadę
  scoresBreakdown: {
    headAndEye: number;
    boneAndSternum: number;
    backAndLoin: number;
    musculatureAndBalance: number;
    wingAndPlumage: number;
  };
  strengths: string[];
  flawsIdentified: string[];
  judgeSummary: string;
}

/**
 * Calculates official FCI Standard points and exhibition medal ranking.
 */
export function calculateFciStandardAppraisal(
  input: FciStandardAppraisalInput
): FciStandardJudgingResult {
  const clamp20 = (val: number) => Math.max(16.0, Math.min(20.0, Math.round(val * 4) / 4));

  const c1 = clamp20(input.headAndEye.score);
  const c2 = clamp20(input.boneAndSternum.score);
  const c3 = clamp20(input.backAndLoin.score);
  const c4 = clamp20(input.musculatureAndBalance.score);
  const c5 = clamp20(input.wingAndPlumage.score);

  const rawTotal = c1 + c2 + c3 + c4 + c5;
  const totalScore = Number(rawTotal.toFixed(2));

  const strengths: string[] = [];
  const flaws: string[] = [];

  if (c1 >= 19.0) strengths.push('Wybitny wyraz głowy, żywe oko o głębokiej pigmentacji tęczówki.');
  if (c2 >= 19.0) strengths.push('Mocny, prosty mostek bez wgnieceń; widełki miednicowe zwarte jak stal.');
  if (c3 >= 19.0) strengths.push('Szerokie, mocne plecy przechodzące płynnie w zwarty ogon na jedno pióro.');
  if (c4 >= 19.0) strengths.push('Sprężyste, drgające umięśnienie piersiowe dające uczucie lekkości w ręce.');
  if (c5 >= 19.0) strengths.push('Aksamitne, jedwabiste upierzenie bogate w puder; prawidłowa wentylacja 4 ostatnich lotek.');

  if (c1 < 18.0) flaws.push('Słabsza ekspresja oka lub zbyt szerokie woskówki.');
  if (c2 < 18.0) flaws.push('Lekkie rozwarcie widełek lub zbyt płytki mostek.');
  if (c3 < 18.0) flaws.push('Nieco luźny ogon lub osłabienie w lędźwiach.');
  if (c4 < 18.0) flaws.push('Zbyt ciężkie, sztywne mięśnie piersiowe.');
  if (c5 < 18.0) flaws.push('Szorstkie upierzenie lub niepełny uskok lotek.');

  if (input.disqualifyingFlaws && input.disqualifyingFlaws.length > 0) {
    flaws.push(...input.disqualifyingFlaws);
  }

  let award: FciMedalAward = 'conforming_standard';
  let awardTitle = 'Ocena Dobra (Zgodny ze Standardem FCI)';
  let awardBadgeColor = '#3B82F6';
  let isEligible = false;

  if (input.disqualifyingFlaws && input.disqualifyingFlaws.length > 0) {
    award = 'disqualified_unclassified';
    awardTitle = 'Nieklasyfikowany (Wady Dyskwalifikujące)';
    awardBadgeColor = '#EF4444';
  } else if (totalScore >= 93.50) {
    award = 'gold_olympic_champion';
    awardTitle = '🥇 Złoty Medal Standard (Klasa Olimpijska)';
    awardBadgeColor = '#EAB308';
    isEligible = true;
  } else if (totalScore >= 92.50) {
    award = 'silver_master_class';
    awardTitle = '🥈 Srebrny Medal Standard (Klasa Mistrzowska)';
    awardBadgeColor = '#94A3B8';
    isEligible = true;
  } else if (totalScore >= 91.50) {
    award = 'bronze_competition_class';
    awardTitle = '🥉 Brązowy Medal Standard (Klasa Konkursowa)';
    awardBadgeColor = '#B45309';
  } else if (totalScore >= 90.00) {
    award = 'conforming_standard';
    awardTitle = 'Ocena Dobra (Wzorzec Standard)';
    awardBadgeColor = '#3B82F6';
  } else {
    award = 'disqualified_unclassified';
    awardTitle = 'Ocena Poniżej Wzorca (< 90.00 pkt)';
    awardBadgeColor = '#EF4444';
  }

  const judgeSummary = `Gołąb ${input.ringNumber} uzyskał oficjalną ocenę ${totalScore.toFixed(2)} pkt na wystawie ${input.exhibitionName}. ${awardTitle}. Sędzia: ${input.judgeName}.`;

  return {
    pigeonId: input.pigeonId,
    ringNumber: input.ringNumber,
    totalScore,
    award,
    awardTitle,
    awardBadgeColor,
    isEligibleForNationalTeam: isEligible,
    scoresBreakdown: {
      headAndEye: c1,
      boneAndSternum: c2,
      backAndLoin: c3,
      musculatureAndBalance: c4,
      wingAndPlumage: c5,
    },
    strengths,
    flawsIdentified: flaws,
    judgeSummary,
  };
}

/**
 * Generates official FCI exhibition cage card HTML.
 */
export function generateFciShowCardHtml(
  input: FciStandardAppraisalInput,
  result: FciStandardJudgingResult
): string {
  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <title>Karta Oceny FCI Standard - ${input.ringNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 20px; color: #1e293b; }
    .card { border: 2px solid #0f172a; border-radius: 8px; padding: 16px; max-width: 650px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #cbd5e1; padding-bottom: 10px; margin-bottom: 12px; }
    .title { font-size: 16px; font-weight: bold; text-transform: uppercase; margin: 0; }
    .subtitle { font-size: 11px; color: #64748b; margin-top: 4px; }
    .info-grid { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px; }
    .score-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    .score-table th, .score-table td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 12px; }
    .score-table th { background-color: #f1f5f9; text-align: left; }
    .total-row { font-weight: bold; font-size: 14px; background-color: #f8fafc; }
    .badge-box { text-align: center; padding: 8px; background-color: #f1f5f9; border-radius: 6px; font-weight: bold; margin-bottom: 12px; }
    .signatures { display: flex; justify-content: space-between; margin-top: 20px; font-size: 11px; color: #475569; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 class="title">Oficjalna Karta Oceny Standard FCI</h1>
      <div class="subtitle">${input.exhibitionName} • ${input.cageNumber || 'Klatka Konkursowa'}</div>
    </div>

    <div class="info-grid">
      <div><strong>Obrączka:</strong> ${input.ringNumber}</div>
      <div><strong>Płeć:</strong> ${input.sex === 'cock' ? 'Samiec (1.0)' : 'Samica (0.1)'}</div>
      <div><strong>Rocznik:</strong> ${input.year}</div>
      <div><strong>Barwa:</strong> ${input.color}</div>
    </div>

    <table class="score-table">
      <thead>
        <tr>
          <th>Kryterium Oceny Standard FCI</th>
          <th style="width: 80px; text-align: center;">Max</th>
          <th style="width: 80px; text-align: center;">Ocena</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1. Wrażenie ogólne, budowa głowy i oko</td>
          <td style="text-align: center;">20.00</td>
          <td style="text-align: center; font-weight: bold;">${result.scoresBreakdown.headAndEye.toFixed(2)}</td>
        </tr>
        <tr>
          <td>2. Kościec, mostek i widełki miednicowe</td>
          <td style="text-align: center;">20.00</td>
          <td style="text-align: center; font-weight: bold;">${result.scoresBreakdown.boneAndSternum.toFixed(2)}</td>
        </tr>
        <tr>
          <td>3. Plecy, lędźwie i ogon na jedno pióro</td>
          <td style="text-align: center;">20.00</td>
          <td style="text-align: center; font-weight: bold;">${result.scoresBreakdown.backAndLoin.toFixed(2)}</td>
        </tr>
        <tr>
          <td>4. Umięśnienie piersiowe i harmonia</td>
          <td style="text-align: center;">20.00</td>
          <td style="text-align: center; font-weight: bold;">${result.scoresBreakdown.musculatureAndBalance.toFixed(2)}</td>
        </tr>
        <tr>
          <td>5. Skrzydło, uskok lotek i upierzenie</td>
          <td style="text-align: center;">20.00</td>
          <td style="text-align: center; font-weight: bold;">${result.scoresBreakdown.wingAndPlumage.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td>ŁĄCZNA NOTA SĘDZIOWSKA (Skala 90.00 - 95.00 pkt)</td>
          <td style="text-align: center;">100.00</td>
          <td style="text-align: center; color: #1e40af; font-size: 16px;">${result.totalScore.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="badge-box">
      ${result.awardTitle} ${result.isEligibleForNationalTeam ? '• KWALIFIKACJA DO REPREZENTACJI POLSKI FCI' : ''}
    </div>

    <div class="signatures">
      <div>Podpis Wystawcy: .......................................</div>
      <div>Sędzia FCI: ${input.judgeName} ${input.judgeLicenseNumber ? `(Lic. ${input.judgeLicenseNumber})` : ''}</div>
    </div>
  </div>
</body>
</html>`;
}
