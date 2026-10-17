/**
 * Test Suite: Parasitological Coproscopy Laboratory (Z-306, BR-ZDR-008)
 * Quantitative McMaster Chamber (OPG) and Microscopic High Power Field (HPF)
 */

import {
  classifyCoccidiaOpg,
  evaluateCoproscopy,
  CoproscopyInput,
} from '../src/domain/health';

describe('Parasitological Coproscopy Laboratory (Z-306)', () => {
  describe('classifyCoccidiaOpg (McMaster chamber thresholds)', () => {
    it('correctly classifies negative sample (0 OPG)', () => {
      const result = classifyCoccidiaOpg(0);
      expect(result.level).toBe('negative');
      expect(result.isChemicalNeeded).toBe(false);
      expect(result.thresholdLabel).toContain('Wynik ujemny');
    });

    it('correctly classifies subclinical infestation (<1000 OPG)', () => {
      const result = classifyCoccidiaOpg(650);
      expect(result.level).toBe('mild');
      expect(result.isChemicalNeeded).toBe(false);
      expect(result.thresholdLabel).toContain('Poziom subkliniczny');
      expect(result.thresholdLabel).toContain('Tylko terapia naturalna');
    });

    it('correctly classifies moderate infestation (1000 - 4999 OPG)', () => {
      const result = classifyCoccidiaOpg(2400);
      expect(result.level).toBe('moderate');
      expect(result.isChemicalNeeded).toBe(true);
      expect(result.thresholdLabel).toContain('Poziom umiarkowany');
      expect(result.thresholdLabel).toContain('kuracja celowana');
    });

    it('correctly classifies heavy / acute coccidiosis (>=5000 OPG)', () => {
      const result = classifyCoccidiaOpg(8500);
      expect(result.level).toBe('heavy');
      expect(result.isChemicalNeeded).toBe(true);
      expect(result.thresholdLabel).toContain('Poziom masowy');
      expect(result.thresholdLabel).toContain('wypalenie rusztów');
    });
  });

  describe('evaluateCoproscopy (holistic flock parasite assessment)', () => {
    it('reports clean flock when all parasites negative', () => {
      const input: CoproscopyInput = {
        coccidia: 'negative',
        coccidiaOpg: 0,
        nematodesPresent: false,
        nematodeHpf: 0,
        capillariaPresent: false,
        trichomonas: 'negative',
      };
      const evalResult = evaluateCoproscopy(input);
      expect(evalResult.overallHealthStatus).toBe('clean');
      expect(evalResult.requiresChemicalMedication).toBe(false);
      expect(evalResult.requiresLoftDisinfection).toBe(false);
      expect(evalResult.recommendations.length).toBe(0);
      expect(evalResult.summary).toContain('stado wolne od inwazji pasożytów');
    });

    it('prescribes strictly natural prevention for subclinical coccidia without chemical coccidiostats', () => {
      const input: CoproscopyInput = {
        coccidiaOpg: 750,
        nematodesPresent: false,
        capillariaPresent: false,
        trichomonas: 'negative',
      };
      const evalResult = evaluateCoproscopy(input);
      expect(evalResult.overallHealthStatus).toBe('mild_infestation');
      expect(evalResult.requiresChemicalMedication).toBe(false);
      expect(evalResult.requiresLoftDisinfection).toBe(false);
      expect(evalResult.recommendations.length).toBe(1);
      expect(evalResult.recommendations[0].isChemical).toBe(false);
      expect(evalResult.recommendations[0].protocol).toContain('Tylko naturalna terapia');
      expect(evalResult.recommendations[0].protocol).toContain('octem jabłkowym');
    });

    it('demands chemical toltrazuril and gas-torch loft disinfection for heavy coccidiosis', () => {
      const input: CoproscopyInput = {
        coccidiaOpg: 6200,
        nematodesPresent: false,
        capillariaPresent: false,
        trichomonas: 'negative',
      };
      const evalResult = evaluateCoproscopy(input);
      expect(evalResult.overallHealthStatus).toBe('treatment_required');
      expect(evalResult.requiresChemicalMedication).toBe(true);
      expect(evalResult.requiresLoftDisinfection).toBe(true);
      const coccRec = evalResult.recommendations.find((r) => r.target.includes('Kokcydioza'));
      expect(coccRec).toBeDefined();
      expect(coccRec?.isChemical).toBe(true);
      expect(coccRec?.protocol).toContain('Baycox 2.5%');
      expect(coccRec?.protocol).toContain('palnikiem gazowym');
    });

    it('mandates deworming repeated at 14 days when nematode HPF > 0', () => {
      const input: CoproscopyInput = {
        coccidiaOpg: 0,
        nematodeHpf: 3,
        capillariaPresent: false,
        trichomonas: 'negative',
      };
      const evalResult = evaluateCoproscopy(input);
      expect(evalResult.overallHealthStatus).toBe('treatment_required');
      expect(evalResult.requiresChemicalMedication).toBe(true);
      expect(evalResult.requiresLoftDisinfection).toBe(true);
      const nemRec = evalResult.recommendations.find((r) => r.target.includes('Glistnica'));
      expect(nemRec).toBeDefined();
      expect(nemRec?.isChemical).toBe(true);
      expect(nemRec?.protocol).toContain('lewamizolu lub fenbendazolu');
      expect(nemRec?.protocol).toContain('powtórka po 14 dniach');
    });

    it('handles multi-parasite infestation combining coccidia, nematodes, capillaria, and trichomonas', () => {
      const input: CoproscopyInput = {
        coccidiaOpg: 3000,
        nematodesPresent: true,
        capillariaPresent: true,
        trichomonas: 'severe',
      };
      const evalResult = evaluateCoproscopy(input);
      expect(evalResult.overallHealthStatus).toBe('treatment_required');
      expect(evalResult.requiresChemicalMedication).toBe(true);
      expect(evalResult.requiresLoftDisinfection).toBe(true);
      expect(evalResult.recommendations.length).toBe(4);
      expect(evalResult.summary).toContain('Wykryto patogeny wymagające interwencji leczniczej');
    });
  });
});
