/**
 * Unit tests for Inter-Team Championship Domain Engine (Z-082 / DEC-96)
 */

import {
  calculateInterTeamSeasonStandings,
  generateInterTeamStandingsHtml,
  FancierTeam,
  TeamRaceRecord,
  TeamRules,
} from '../src/domain/interTeamChampionship';

describe('InterTeamChampionship Domain (Z-082)', () => {
  const sampleTeams: FancierTeam[] = [
    {
      id: 'team-1',
      teamName: 'Team Gostyń Asy',
      breederName: 'Łukasz Karwowski',
      pzhgpNumber: '0284-1420',
      sectionName: 'Sekcja 1 Gostyń',
    },
    {
      id: 'team-2',
      teamName: 'Team Szybkie Skrzydła',
      breederName: 'Jan Kowalski',
      pzhgpNumber: '0284-3312',
      sectionName: 'Sekcja 2 Piaski',
    },
    {
      id: 'team-3',
      teamName: 'Team Poniec Mistrz',
      breederName: 'Piotr Nowak',
      pzhgpNumber: '0284-5501',
      sectionName: 'Sekcja 3 Poniec',
    },
  ];

  const sampleRules: TeamRules = {
    seriesBasketedCount: 7,
    seriesCountingCount: 3, // Top 3 counting pigeons per race
    minDistanceKm: 100,
    yearlingOnly: false,
  };

  const sampleRaces: TeamRaceRecord[] = [
    {
      raceId: 'r-1',
      raceName: 'Świebodzin I',
      raceDate: '2026-05-10',
      distanceKm: 165.0,
      teamId: 'team-1',
      arrivals: [
        { pigeonRing: 'PL-1', distanceKm: 165.0, positionInConcourse: 1, totalBasketed: 2000, fciCoefficient: 0.5, racePoints: 40.0 },
        { pigeonRing: 'PL-2', distanceKm: 165.0, positionInConcourse: 3, totalBasketed: 2000, fciCoefficient: 1.5, racePoints: 39.5 },
        { pigeonRing: 'PL-3', distanceKm: 165.0, positionInConcourse: 8, totalBasketed: 2000, fciCoefficient: 4.0, racePoints: 38.8 },
        { pigeonRing: 'PL-4', distanceKm: 165.0, positionInConcourse: 25, totalBasketed: 2000, fciCoefficient: 12.5, racePoints: 35.0 }, // 4th pigeon ignored (series limit 3)
      ],
    },
    {
      raceId: 'r-1',
      raceName: 'Świebodzin I',
      raceDate: '2026-05-10',
      distanceKm: 165.0,
      teamId: 'team-2',
      arrivals: [
        { pigeonRing: 'DV-1', distanceKm: 165.0, positionInConcourse: 2, totalBasketed: 2000, fciCoefficient: 1.0, racePoints: 39.8 },
        { pigeonRing: 'DV-2', distanceKm: 165.0, positionInConcourse: 5, totalBasketed: 2000, fciCoefficient: 2.5, racePoints: 39.2 },
        { pigeonRing: 'DV-3', distanceKm: 165.0, positionInConcourse: 12, totalBasketed: 2000, fciCoefficient: 6.0, racePoints: 38.0 },
      ],
    },
    {
      raceId: 'r-2',
      raceName: 'Magdeburg',
      raceDate: '2026-05-24',
      distanceKm: 345.0,
      teamId: 'team-1',
      arrivals: [
        { pigeonRing: 'PL-1', distanceKm: 345.0, positionInConcourse: 2, totalBasketed: 1800, fciCoefficient: 1.111, racePoints: 59.8 },
        { pigeonRing: 'PL-3', distanceKm: 345.0, positionInConcourse: 6, totalBasketed: 1800, fciCoefficient: 3.333, racePoints: 59.1 },
      ],
    },
  ];

  test('calculateInterTeamSeasonStandings aggregates points and enforces series count limit', () => {
    const summary = calculateInterTeamSeasonStandings(sampleTeams, sampleRaces, sampleRules);

    expect(summary.totalTeamsCount).toBe(3);
    expect(summary.leaderTeam).not.toBeNull();
    expect(summary.leaderTeam?.teamId).toBe('team-1');

    // Team 1: Race 1 (40.0 + 39.5 + 38.8 = 118.3) + Race 2 (59.8 + 59.1 = 118.9) = 237.2 pts
    expect(summary.leaderTeam?.totalPoints).toBe(237.2);
    expect(summary.leaderTeam?.totalPrizes).toBe(5); // 3 from r1, 2 from r2
  });

  test('calculateInterTeamSeasonStandings filters only yearlings when yearlingOnly is true', () => {
    const yearlingRaces: TeamRaceRecord[] = [
      {
        raceId: 'r-y',
        raceName: 'Lot Roczniaków',
        raceDate: '2026-05-17',
        distanceKm: 220.0,
        teamId: 'team-1',
        arrivals: [
          { pigeonRing: 'PL-Old', isYearling: false, distanceKm: 220.0, positionInConcourse: 1, totalBasketed: 1000, fciCoefficient: 1.0, racePoints: 40.0 },
          { pigeonRing: 'PL-Y1', isYearling: true, distanceKm: 220.0, positionInConcourse: 4, totalBasketed: 1000, fciCoefficient: 4.0, racePoints: 39.0 },
        ],
      },
    ];

    const yearlingSummary = calculateInterTeamSeasonStandings(
      sampleTeams,
      yearlingRaces,
      { ...sampleRules, yearlingOnly: true },
      'yearling_derby'
    );

    const team1Standing = yearlingSummary.standings.find((s) => s.teamId === 'team-1');
    expect(team1Standing?.totalPrizes).toBe(1); // Only PL-Y1
    expect(team1Standing?.totalPoints).toBe(39.0);
    expect(yearlingSummary.championshipTitle).toContain('Mistrzostwo Gołębi Rocznych');
  });

  test('generateInterTeamStandingsHtml produces valid printable HTML', () => {
    const summary = calculateInterTeamSeasonStandings(sampleTeams, sampleRaces, sampleRules);
    const html = generateInterTeamStandingsHtml(summary, {
      branchName: 'Oddział 0284 Gostyń',
      sectionName: 'Sekcja Gostyń',
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Puchar Przechodni Sekcji i Oddziału');
    expect(html).toContain('Team Gostyń Asy');
    expect(html).toContain('Łukasz Karwowski');
    expect(html).toContain('237.20 pkt');
  });
});
