/**
 * PIGEON-FLY — Inter-Team & Section Championship Engine (Z-082 / DEC-96)
 * Multi-team scoring, Travelling Trophy (Puchar Przechodni), Yearling Derby, and Super-Cup rankings.
 * Complies with PZHGP Section & Branch team competition regulations.
 */

export type ChampionshipType =
  | 'travelling_trophy' // Puchar Przechodni (całe stado dorosłe, seria np. 10/7 lub 7/5)
  | 'yearling_derby' // Mistrzostwo Gołębi Rocznych (tylko ptaki 1-roczne z poprzedniego roku)
  | 'inter_team_supercup'; // Super-Puchar Międzyzespołowy (klasyfikacja ligowa)

export interface TeamRules {
  seriesBasketedCount: number; // np. 10 ptaków typowanych
  seriesCountingCount: number; // np. 7 ptaków zdobywających punkty
  minDistanceKm: number;
  yearlingOnly: boolean;
}

export interface FancierTeam {
  id: string;
  teamName: string; // np. "Gostyń Mistrzowie — Karwowski"
  breederName: string;
  pzhgpNumber: string;
  sectionName: string;
}

export interface TeamPigeonArrival {
  pigeonRing: string;
  isYearling?: boolean;
  distanceKm: number;
  positionInConcourse: number;
  totalBasketed: number;
  fciCoefficient: number;
  racePoints: number;
}

export interface TeamRaceRecord {
  raceId: string;
  raceName: string;
  raceDate: string;
  distanceKm: number;
  teamId: string;
  arrivals: TeamPigeonArrival[];
}

export interface TeamStandingRecord {
  rank: number;
  teamId: string;
  teamName: string;
  breederName: string;
  sectionName: string;
  totalPoints: number;
  totalPrizes: number;
  totalConcourseKm: number;
  sumCoefficient: number;
  racesCount: number;
}

export interface InterTeamSeasonSummary {
  championshipType: ChampionshipType;
  championshipTitle: string;
  seasonYear: number;
  rules: TeamRules;
  standings: TeamStandingRecord[];
  leaderTeam: TeamStandingRecord | null;
  totalTeamsCount: number;
}

/**
 * Calculates season standings for Section / Branch team competitions.
 */
export function calculateInterTeamSeasonStandings(
  teams: FancierTeam[],
  races: TeamRaceRecord[],
  rules: TeamRules,
  championshipType: ChampionshipType = 'travelling_trophy',
  seasonYear: number = new Date().getFullYear()
): InterTeamSeasonSummary {
  const standingsMap: Record<
    string,
    {
      team: FancierTeam;
      totalPoints: number;
      totalPrizes: number;
      totalKkm: number;
      sumCoeff: number;
      racesCount: number;
    }
  > = {};

  teams.forEach((t) => {
    standingsMap[t.id] = {
      team: t,
      totalPoints: 0,
      totalPrizes: 0,
      totalKkm: 0,
      sumCoeff: 0,
      racesCount: 0,
    };
  });

  // Group races by team
  const racesByTeam: Record<string, TeamRaceRecord[]> = {};
  races.forEach((r) => {
    if (!racesByTeam[r.teamId]) racesByTeam[r.teamId] = [];
    racesByTeam[r.teamId].push(r);
  });

  Object.keys(standingsMap).forEach((teamId) => {
    const teamRaces = racesByTeam[teamId] || [];
    const entry = standingsMap[teamId];

    teamRaces.forEach((r) => {
      if (r.distanceKm < rules.minDistanceKm) return;

      // Filter by yearling if required
      let validArrivals = r.arrivals;
      if (rules.yearlingOnly) {
        validArrivals = validArrivals.filter((a) => a.isYearling);
      }

      // Sort arrivals by points DESC, then position ASC
      validArrivals.sort((a, b) => b.racePoints - a.racePoints || a.positionInConcourse - b.positionInConcourse);

      // Take top N counting pigeons
      const counting = validArrivals.slice(0, rules.seriesCountingCount);

      if (counting.length > 0) {
        entry.racesCount += 1;
        counting.forEach((p) => {
          entry.totalPoints += p.racePoints;
          entry.totalPrizes += 1;
          entry.totalKkm += p.distanceKm;
          entry.sumCoeff += p.fciCoefficient;
        });
      }
    });
  });

  // Convert to array and sort according to PZHGP tie-breakers:
  // 1. Total Points DESC
  // 2. Total Prizes DESC
  // 3. Total KKM DESC
  // 4. Lowest Sum Coeff ASC
  const sorted = Object.values(standingsMap)
    .sort((a, b) => {
      if (Math.abs(b.totalPoints - a.totalPoints) > 0.01) {
        return b.totalPoints - a.totalPoints;
      }
      if (b.totalPrizes !== a.totalPrizes) {
        return b.totalPrizes - a.totalPrizes;
      }
      if (Math.abs(b.totalKkm - a.totalKkm) > 0.01) {
        return b.totalKkm - a.totalKkm;
      }
      return a.sumCoeff - b.sumCoeff;
    })
    .map((item, idx) => ({
      rank: idx + 1,
      teamId: item.team.id,
      teamName: item.team.teamName,
      breederName: item.team.breederName,
      sectionName: item.team.sectionName,
      totalPoints: Math.round(item.totalPoints * 100) / 100,
      totalPrizes: item.totalPrizes,
      totalConcourseKm: Math.round(item.totalKkm * 10) / 10,
      sumCoefficient: Math.round(item.sumCoeff * 1000) / 1000,
      racesCount: item.racesCount,
    }));

  let title = 'Puchar Przechodni Sekcji i Oddziału (Seria Typowana)';
  if (championshipType === 'yearling_derby') {
    title = 'Mistrzostwo Gołębi Rocznych (Derby Roczniaków PZHGP)';
  } else if (championshipType === 'inter_team_supercup') {
    title = 'Super-Puchar Ligi Międzyzespołowej PZHGP';
  }

  return {
    championshipType,
    championshipTitle: title,
    seasonYear,
    rules,
    standings: sorted,
    leaderTeam: sorted.length > 0 ? sorted[0] : null,
    totalTeamsCount: sorted.length,
  };
}

/**
 * Generates official A4 Inter-Team Championship Standings HTML.
 */
export function generateInterTeamStandingsHtml(
  summary: InterTeamSeasonSummary,
  meta?: {
    branchName?: string;
    sectionName?: string;
  }
): string {
  const branch = meta?.branchName || 'Oddział 0284 Gostyń PZHGP';
  const section = meta?.sectionName || 'Wszystkie Sekcje Oddziału';

  const rowsHtml = summary.standings
    .map((s) => {
      let medal = `${s.rank}.`;
      if (s.rank === 1) medal = '🥇 1.';
      else if (s.rank === 2) medal = '🥈 2.';
      else if (s.rank === 3) medal = '🥉 3.';

      return `
      <tr style="${s.rank === 1 ? 'background: #fefce8; font-weight: bold;' : ''}">
        <td style="text-align: center; font-size: 9.5pt;">${medal}</td>
        <td>
          <div style="font-weight: 800; color: #0f172a;">${s.teamName}</div>
          <div style="font-size: 7.5pt; color: #64748b;">${s.breederName} • ${s.sectionName}</div>
        </td>
        <td style="text-align: right; font-size: 10pt; font-weight: 900; color: #1e3a8a;">${s.totalPoints.toFixed(2)}</td>
        <td style="text-align: center; font-weight: 700;">${s.totalPrizes}</td>
        <td style="text-align: right;">${s.totalConcourseKm.toFixed(1)} km</td>
        <td style="text-align: right; color: #047857; font-weight: 700;">${s.sumCoefficient.toFixed(3)}</td>
        <td style="text-align: center;">${s.racesCount}</td>
      </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <title>${summary.championshipTitle} — Sezon ${summary.seasonYear}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.35;
      font-size: 9pt;
      margin: 0;
      padding: 0;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title { font-size: 14pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
    .subtitle { font-size: 9pt; color: #475569; margin-top: 2px; }
    .meta { font-size: 8.5pt; text-align: right; color: #334155; }
    .leader-box {
      border: 1.5px solid #ca8a04;
      background: #fefce8;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .leader-title { font-size: 12pt; font-weight: 900; color: #854d0e; }
    .leader-meta { font-size: 8.5pt; color: #713f12; margin-top: 2px; }
    .leader-pts { font-size: 16pt; font-weight: 900; color: #a16207; text-align: right; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
      font-size: 8.5pt;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 5px 6px;
      vertical-align: middle;
    }
    th {
      background: #f1f5f9;
      font-weight: 700;
      text-align: left;
      font-size: 7.5pt;
      text-transform: uppercase;
      color: #334155;
    }
    .sign-box {
      margin-top: 25px;
      display: flex;
      justify-content: space-between;
    }
    .sign-line {
      width: 180px;
      border-top: 1px dashed #94a3b8;
      text-align: center;
      font-size: 7.5pt;
      padding-top: 4px;
      color: #475569;
    }
    .footer {
      margin-top: 16px;
      border-top: 1px solid #e2e8f0;
      padding-top: 4px;
      font-size: 7.5pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">${summary.championshipTitle}</div>
      <div class="subtitle">Oficjalna Tabela Punktacji Współzawodnictwa Zespołowego PZHGP (Z-082)</div>
    </div>
    <div class="meta">
      <div><strong>${branch}</strong></div>
      <div>${section}</div>
      <div>Sezon: <strong>${summary.seasonYear}</strong></div>
    </div>
  </div>

  ${
    summary.leaderTeam
      ? `
  <div class="leader-box">
    <div>
      <div class="leader-title">🏆 ZWYCIĘZCA & LIDER KLASYFIKACJI: ${summary.leaderTeam.teamName}</div>
      <div class="leader-meta">Hodowca: ${summary.leaderTeam.breederName} • ${summary.leaderTeam.sectionName} • Konkursy: ${summary.leaderTeam.totalPrizes} • KKM: ${summary.leaderTeam.totalConcourseKm.toFixed(1)} km</div>
    </div>
    <div>
      <div class="leader-pts">${summary.leaderTeam.totalPoints.toFixed(2)} pkt</div>
      <div style="font-size: 7.5pt; color: #854d0e; text-align: right;">Coeff: ${summary.leaderTeam.sumCoefficient.toFixed(3)}</div>
    </div>
  </div>
  `
      : ''
  }

  <table>
    <thead>
      <tr>
        <th style="width: 32px; text-align: center;">M-ce</th>
        <th>Zespół / Hodowca</th>
        <th style="text-align: right;">Punkty Razem</th>
        <th style="text-align: center;">Konkursy</th>
        <th style="text-align: right;">Łącznie KKM</th>
        <th style="text-align: right;">Coeff FCI</th>
        <th style="text-align: center;">Loty</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="sign-box">
    <div class="sign-line">Przewodniczący Komisji Obliczeniowej</div>
    <div class="sign-line">Wiceprezes ds. Lotowych</div>
    <div class="sign-line">Prezes Zarządu Oddziału</div>
  </div>

  <div class="footer">
    <div>PIGEON-FLY v0.1.0 • Moduł Punktacji Zespołowej i Pucharu Przechodniego Z-082</div>
    <div>Wygenerowano: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL')}</div>
  </div>
</body>
</html>`;
}
