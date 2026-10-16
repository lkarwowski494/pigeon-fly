import { fileURLToPath } from 'node:url';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const files = [];

const walk = (d) => {
  if (!existsSync(d)) return;
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) {
      if (f !== 'node_modules' && f !== '.expo' && f !== 'scratch' && f !== 'docs' && f !== '.git') {
        walk(p);
      }
    } else if (/\.(ts|tsx)$/.test(f) && !/i18n(\.en|\.pl)?\.ts$/.test(f) && !/\.test\.(ts|tsx)$/.test(f)) {
      files.push(p);
    }
  }
};

['src', 'app'].forEach((d) => walk(join(root, d)));

const unq = (s) => s.replace(/\\'/g, "'").replace(/\\\\/g, '\\');
const used = new Map();

for (const f of files) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) {
    used.set(unq(m[1]), f);
  }
}

const dictPath = join(root, 'src/lib/i18n.en.ts');
if (!existsSync(dictPath)) {
  console.log(`Brak słownika EN: ${dictPath}`);
  process.exit(used.size > 0 ? 1 : 0);
}

const dictSrc = readFileSync(dictPath, 'utf8');
const params = (k) => [...k.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

const dict = Object.fromEntries(
  [...dictSrc.matchAll(/'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)'/g)].map((m) => [
    unq(m[1]),
    unq(m[2]),
  ])
);

const keys = new Set(Object.keys(dict));
const missing = [...used.keys()].filter((k) => !keys.has(k));
const badParams = Object.keys(dict).filter((k) => params(k) !== params(dict[k]));

console.log(`i18n: ${used.size} tekstów w kodzie, ${keys.size} w słowniku EN`);
if (missing.length) {
  console.log('BRAK tłumaczenia w słowniku EN:\n' + missing.map((k) => `  '${k}' (${used.get(k).replace(root, '')})`).join('\n'));
}
if (badParams.length) {
  console.log('Różne parametry {…} w PL i EN:\n' + badParams.map((k) => '  ' + k).join('\n'));
}

if (missing.length || badParams.length) {
  process.exit(1);
} else {
  console.log('check-i18n: OK — wszystkie teksty z kodu mają poprawne tłumaczenie EN.');
}
