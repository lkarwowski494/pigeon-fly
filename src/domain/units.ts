/**
 * Pigeon-Fly — Konwerter Jednostek Metric / Imperial (Złoty Standard Portfolio)
 * Zgodność z rynkiem globalnym (Europa, Wielka Brytania, USA, Azja):
 * - Prędkość: m/min (kontynent) vs ypm / yards per minute (UK / USA)
 * - Dystans: metry / kilometry vs jardy / mile
 * - Waga karmy / ptaka: gramy (g) vs uncje (oz)
 * - Temperatura: Celsjusz (°C) vs Fahrenheit (°F)
 */

export type UnitSystem = 'metric' | 'imperial';

export interface FormattedSpeed {
  value: number;
  unit: string;
  formatted: string;
}

export interface FormattedDistance {
  value: number;
  unit: string;
  formatted: string;
}

/**
 * Konwertuje prędkość w m/min na system metryczny lub imperialny (ypm).
 * 1 metr = 1.0936133 jardów.
 */
export function formatVelocity(velocityMPerMin: number, system: UnitSystem = 'metric'): FormattedSpeed {
  if (system === 'imperial') {
    const ypm = velocityMPerMin * 1.0936133;
    return {
      value: Math.round(ypm * 10) / 10,
      unit: 'ypm',
      formatted: `${ypm.toFixed(1)} ypm`,
    };
  }

  return {
    value: Math.round(velocityMPerMin * 100) / 100,
    unit: 'm/min',
    formatted: `${velocityMPerMin.toFixed(2)} m/min`,
  };
}

/**
 * Konwertuje dystans w metrach na km lub mile.
 */
export function formatDistance(distanceMeters: number, system: UnitSystem = 'metric'): FormattedDistance {
  if (system === 'imperial') {
    const miles = distanceMeters / 1609.344;
    return {
      value: Math.round(miles * 100) / 100,
      unit: 'mi',
      formatted: `${miles.toFixed(2)} mi`,
    };
  }

  const km = distanceMeters / 1000;
  return {
    value: Math.round(km * 100) / 100,
    unit: 'km',
    formatted: `${km.toFixed(2)} km`,
  };
}

/**
 * Konwertuje wagę w gramach na g lub oz.
 */
export function formatWeight(grams: number, system: UnitSystem = 'metric'): { value: number; unit: string; formatted: string } {
  if (system === 'imperial') {
    const oz = grams / 28.349523;
    return {
      value: Math.round(oz * 10) / 10,
      unit: 'oz',
      formatted: `${oz.toFixed(1)} oz`,
    };
  }

  return {
    value: Math.round(grams),
    unit: 'g',
    formatted: `${Math.round(grams)} g`,
  };
}

/**
 * Konwertuje temperaturę w °C na °C lub °F.
 */
export function formatTemperature(celsius: number, system: UnitSystem = 'metric'): { value: number; unit: string; formatted: string } {
  if (system === 'imperial') {
    const fahr = (celsius * 9) / 5 + 32;
    return {
      value: Math.round(fahr * 10) / 10,
      unit: '°F',
      formatted: `${fahr.toFixed(1)} °F`,
    };
  }

  return {
    value: Math.round(celsius * 10) / 10,
    unit: '°C',
    formatted: `${celsius.toFixed(1)} °C`,
  };
}
