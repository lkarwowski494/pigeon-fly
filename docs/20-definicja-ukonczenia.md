# 20. Definicja Ukończenia Funkcjonalności (DoD) — PIGEON-FLY 🕊️⏱️

> **Zasada Jakościowa (ZAS-QA-PF-01):**  
> *„Każda nowa funkcja, zmiana logiki domenowej lub modyfikacja interfejsu w projekcie PIGEON-FLY bezwzględnie musi otrzymać lub zaktualizować zestaw testów automatycznych w standardzie i rygorze repozytoriów organizer i Oczko.”*

Funkcjonalność (nowa albo zmodyfikowana) w projekcie **PIGEON-FLY** uznawana jest za zakończoną (`Done`) wyłącznie wtedy, gdy spełnia pełny zakres rygorystycznych kryteriów ze wszystkich dotyczących jej warstw jakościowych. Pominięcie którejkolwiek warstwy wymaga jawnego, udokumentowanego uzasadnienia w rejestrze decyzji (`docs/decyzje_biezace.md`).

---

## 🧪 Matryca Warstw Jakościowych (Testing Rigor Matrix)

| # | Warstwa | Zakres weryfikacji | Standard & Narzędzia | Lokalizacja w projekcie |
|---|---|---|---|---|
| **1** | **Czysta Logika Domenowa** | Deterministyczne obliczenia: wzory geodezyjne (Haversine, Vincenty), prędkość w metrach na minutę ($m/min$), neutralizacja nocna w maratonach, współczynnik inbredu Wrighta ($F$), wektor znosu wiatru, wskaźniki odżywcze mieszanek paszowych. | **100% pokrycia linii**, 0 zależności od frameworków UI | `src/core/**/__tests__/*.test.ts` (lub testy Swift XCTest) |
| **2** | **Interfejs & Field Mode (UI)** | Każdy ekran, widok lufki, karta ptaka, generator rodowodu i ranking przylotów renderuje się stabilnie; obszary dotykowe w Field Mode $\ge 56 \times 56\,\text{pt}$; czytelność w ostrym słońcu. | React Test Renderer / View Inspector, symulacje dotknięć | `src/components/**/__tests__/*.test.tsx`, `src/screens/**/__tests__/*.test.tsx` |
| **3** | **Persystencja SQLite & Transakcyjność** | Schemat DDL SQLite: tabele ptaków, rodowodów, lotów, konstatowań, szczepień i dawek karmy. Transakcyjne zapisywanie przylotów z dokładnością do milisekundy, brak częściowych zapisów, rollback przy błędzie. | Baza SQLite WAL, weryfikacja schematu i migracji | `src/core/__tests__/database-persistence.test.ts` |
| **4** | **Niezmienniki (Property-Based / PBT)** | Weryfikacja niezmienników matematycznych na tysiącach generowanych danych: symetria odległości geodezyjnej ($dist(A, B) = dist(B, A)$), monotoniczność czasu przelotu, ograniczenie inbredu ($0 \le F \le 1$), niezmienniki sumy ziaren ($100\%$). | `fast-check` ($\ge 100$ prób losowych per test) | `src/core/__tests__/property-based.test.ts` |
| **5** | **Testy Różnicowe (Cross-Validation)** | Porównanie wyników kalkulatorów prędkości i inbredu z niezależnym korpusem referencyjnym w Pythonie (weryfikacja formuł FCI, PZHGP i genetyki Wrighta). | Skrypt referencyjny Python ↔ korpus JSON | `src/core/__tests__/domain-corpus.test.ts` |
| **6** | **Dostępność i Ergofizyka (Apple HIG & Field Mode)** | Minimalny obszar dotykowy kontrolek $\ge 56 \times 56\,\text{pt}$ w trybie polowym, pełna semantyka VoiceOver dla hodowców starszej daty z wadami wzroku, kontrast WCAG AAA, `isIdleTimerDisabled = true`. | Apple Human Interface Guidelines, WCAG 2.2 AAA | `src/components/__tests__/a11y-field-mode.test.tsx` |
| **7** | **Strażnicy Architektury & Bezpieczeństwa** | 100% sparametryzowanych zapytań SQL (`?`), ochrona przed SQL Injection, czystość warstwy domenowej (brak wycieków UI do logiki), zabezpieczenie przed modyfikacją cudzych repozytoriów. | Statyczna analiza kodu i testy-strażnicy | `src/core/__tests__/architecture-guards.test.ts` |
| **8** | **Budżety Wydajnościowe CPU** | Czas rekurencyjnego budowania drzewa genealogicznego do 5 pokoleń $< 30\,\text{ms}$, przeliczenie rankingu dla 200 ptaków $< 20\,\text{ms}$, skanowanie krawędzi QR $< 15\,\text{ms}$. | Performance Timer (`performance.now()`), rygor $O(N)$ | `src/core/__tests__/perf-budget.test.ts` |
| **9** | **Odporność & Wstrzykiwanie Błędów** | Pełna odporność na nagłe rozładowanie telefonu podczas lotu, uszkodzone pliki backupu, niekompletne dane geolokalizacyjne GPS, zafałszowane pakiety BLE/IoT. | Fault Injection, fuzzing danych wejściowych | `src/core/__tests__/resilience.test.ts` |
| **10** | **Współbieżność & Apple Watch Companion** | Błyskawiczna synchronizacja timestampu z zegarka Apple Watch na telefon, kolejka offline, eliminacja zjawiska Clock Skew, ochrona przed duplikatami konstatowań ($\le 2\,\text{s}$). | Symulacja asynchronicznych wyścigów | `src/core/__tests__/watch-concurrency.test.ts` |

---

## 🚦 Automatyczne Bramki Jakościowe (Quality Gates)

Każda zmiana w kodzie przed publikacją wydania musi pomyślnie przejść następujące bramki:

1. **Statyczna kontrola typów:** `0` błędów, `0` ostrzeżeń typowania.
2. **Pokrycie linii kodu:** **Bezwzględne 100.00% pokrycia linii** w modułach domenowych, kalkulatorach i logice biznesowej.
3. **Pakiety testów wieloperspektywicznych:** PBT, testy wydajnościowe, a11y w Field Mode, odporność i odporność na wyścigi.
4. **Ciągła Integracja GitHub Actions (CI):** Zielony status pipeline'u w GitHub Actions na publicznym repozytorium.

---

## 🛡️ Inwarianty Bezwzględne Produktu

- **Inwariant 100% Offline-First:** Aplikacja działa bezbłędnie w sercu lasu, metalowym gołębniku i piwnicy bez zasięgu GSM i Wi-Fi.
- **Inwariant Zero Telemetrii (Data Not Collected):** Żadne prywatne dane hodowli, współrzędne gołębnika ani historia lotów nie są wysyłane na serwery zewnętrzne.
- **Inwariant Suwerenności Danych (Darmowy Backup):** Eksport i import bazy SQLite oraz pliku JSON jest zawsze w 100% darmowy.
- **Inwariant Bezpieczeństwa Repozytoriów Referencyjnych:** Repozytoria `trening` oraz `Oczko` są bezwzględnie **READ-ONLY**.
