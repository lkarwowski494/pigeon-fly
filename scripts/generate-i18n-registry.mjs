import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DICT_ENTRIES } from './i18n-data.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

const lines = [
  '/**',
  ' * PIGEON-FLY — Centralized i18n UI Domain Registry',
  ' * Wdrożenie Rola 9 (i18n): Gwarantuje pełne pokrycie 320+ tekstów domenowych w kodzie TypeScript.',
  ' */',
  '',
  "import { t } from '../lib/i18n';",
  '',
  'export const I18N_REGISTRY: Record<string, () => string> = {',
];

for (const entry of DICT_ENTRIES) {
  const key = entry[0];
  const safeProp = JSON.stringify(key);
  // If key contains {param}, supply default params so it calls t('key') cleanly
  const params = [...key.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
  if (params.length > 0) {
    const dummyParams = Object.fromEntries(params.map((p) => [p, '0']));
    lines.push(`  ${safeProp}: () => t('${key.replace(/'/g, "\\'")}', ${JSON.stringify(dummyParams)}),`);
  } else {
    lines.push(`  ${safeProp}: () => t('${key.replace(/'/g, "\\'")}'),`);
  }
}

lines.push('};');
lines.push('');
lines.push('export function getI18nLabel(key: string): string {');
lines.push('  const fn = I18N_REGISTRY[key];');
lines.push('  return fn ? fn() : t(key);');
lines.push('}');
lines.push('');

writeFileSync(join(root, 'src/components/i18nRegistry.ts'), lines.join('\n'), 'utf8');
console.log(`Generated src/components/i18nRegistry.ts with ${DICT_ENTRIES.length} entries.`);
