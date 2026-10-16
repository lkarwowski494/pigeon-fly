import {
  formatVelocity,
  formatDistance,
  formatWeight,
  formatTemperature,
} from '../src/domain/units';

describe('Unit System & Metric/Imperial Conversion', () => {
  describe('Velocity formatting', () => {
    it('formats metric velocity in m/min with 2 decimals', () => {
      const res = formatVelocity(1282.367, 'metric');
      expect(res.value).toBe(1282.37);
      expect(res.unit).toBe('m/min');
      expect(res.formatted).toBe('1282.37 m/min');
    });

    it('converts m/min to imperial yards per minute (ypm)', () => {
      // 1000 m/min * 1.0936133 = 1093.6 ypm
      const res = formatVelocity(1000, 'imperial');
      expect(res.value).toBe(1093.6);
      expect(res.unit).toBe('ypm');
      expect(res.formatted).toBe('1093.6 ypm');
    });
  });

  describe('Distance formatting', () => {
    it('formats meters to km in metric', () => {
      const res = formatDistance(520300, 'metric');
      expect(res.value).toBe(520.3);
      expect(res.unit).toBe('km');
      expect(res.formatted).toBe('520.30 km');
    });

    it('converts meters to miles in imperial', () => {
      // 160934.4 m = 100 miles
      const res = formatDistance(160934.4, 'imperial');
      expect(res.value).toBe(100);
      expect(res.unit).toBe('mi');
      expect(res.formatted).toBe('100.00 mi');
    });
  });

  describe('Weight formatting', () => {
    it('formats weight in grams in metric', () => {
      const res = formatWeight(32, 'metric');
      expect(res.value).toBe(32);
      expect(res.unit).toBe('g');
      expect(res.formatted).toBe('32 g');
    });

    it('converts grams to ounces in imperial', () => {
      // 28.35 g ~ 1 oz
      const res = formatWeight(28.35, 'imperial');
      expect(res.value).toBe(1);
      expect(res.unit).toBe('oz');
      expect(res.formatted).toBe('1.0 oz');
    });
  });

  describe('Temperature formatting', () => {
    it('formats Celsius in metric', () => {
      const res = formatTemperature(38.5, 'metric');
      expect(res.value).toBe(38.5);
      expect(res.unit).toBe('°C');
      expect(res.formatted).toBe('38.5 °C');
    });

    it('converts Celsius to Fahrenheit in imperial', () => {
      // 0°C = 32°F, 20°C = 68°F
      const res0 = formatTemperature(0, 'imperial');
      expect(res0.value).toBe(32);
      expect(res0.formatted).toBe('32.0 °F');

      const res20 = formatTemperature(20, 'imperial');
      expect(res20.value).toBe(68);
      expect(res20.formatted).toBe('68.0 °F');
    });
  });
});
