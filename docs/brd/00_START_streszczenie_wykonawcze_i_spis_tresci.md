# PIGEON-FLY — Wymagania Biznesowe (BRD), Wersja 1.0 (Retrofit & Pełny Standard Apps4Craft)
## Cyfrowy Notes Mistrza · Aplikacja Hybrydowa Offline-First z Opcjonalną Chmurą Supabase

> **Status:** Wersja zaktualizowana w trybie Retrofit (18.10.2026). Zsynchronizowano ze 100 zaimplementowanymi modułami (Z-001 do Z-100), 94 zestawami testowymi (652 testy zaliczone, 100%), 0 błędami TypeScript oraz rejestrem 114 decyzji projektowych + DEC-RETRO-01..08.  
> **Właściciel projektu:** Łukasz (`lkarwowski494`)  
> **Autorzy:** Lead Business Analyst, Product Discovery Architect & Kierownik Badań Dziedzinowych Apps4Craft Studio  
> **Repozytorium:** `https://github.com/lkarwowski494/pigeon-fly`  
> **Standard:** Pełna parzystość inżynieryjna z projektami `organizer`, `trening` oraz `Oczko`.

---

## 1. Jak czytać zaktualizowany pakiet dokumentacji BRD

Pakiet specyfikacji wymagań biznesowych dla aplikacji **Pigeon-Fly** stanowi Pojedyncze Źródło Prawdy (Single Source of Truth) dla projektantów UI, inżynierów testów PBT i programistów:

| Tom / Plik | Rozdziały | Zawartość i Kluczowe Tematy |
| :--- | :--- | :--- |
| **`00_START`** (ten plik) | — | Streszczenie wykonawcze, status procedury Retrofit, 7 filarów rzemiosła, model monetyzacji, statystyki i progi wydania. |
| **`00b_DEC`** | — | **Rejestr Decyzji Projektowych (DEC-01 do DEC-114 oraz DEC-RETRO-01 do DEC-RETRO-08)**: każdy dylemat produktowy z opcjami A/B, kompromisami i wiążącymi rozstrzygnięciami Właściciela. |
| **`00c_ERRATA`** | — | Rejestr sprzeczności i errata, w tym koegzystencja trybu offline z chmurą, polityka prywatności "Data Not Collected" oraz strategie rozwiązywania konfliktów. |
| **`A1_Wizja_Persony`** | 1–3 | Tożsamość marki Apps4Craft, 8 Zasad Produktu (`ZP-01…08`), katalog person (`P1…P6`), sytuacje polowe (`SYT-01…15`) i specyfikacja Field Mode. |
| **`A2_Rynek_Przychody`** | 4–6.1 | Globalna analiza rynku, dekonstrukcja recenzji 1★/2★ konkurencji (MyPigeons, Benzing), 5 filarów przewagi, ekonomia chmury Supabase i model subskrypcyjny (0,99 € / 4,99 € / 14,99–19,99 €). |
| **`A3_Tabela_Zakresu`** | 6.2 | Kompletna macierz 100 zaimplementowanych modułów (**Z-001 do Z-100**) ze 100 generatorami urzędowymi A4 PDF i integracją UI. |
| **`A4_KPI_Marketing`** | 13, 15 | Metryki sukcesu, zero telemetrii, organiczny marketing w sekcjach PZHGP oraz ASO na 35 języków. |
| **`B1_Notes_Stada`** | 7.1 | Wymagania funkcjonalne kartoteki stada, cech fenotypowych i wyszukiwarki przodków (**BR-STADO-001 do 038**). |
| **`B2_Rodowody_PDF`** | 7.2 | Wymagania drzew genealogicznych, inbredu Wrighta 5 pokoleń, generatora PDF A4 oraz portalu weryfikacji online (**BR-ROD-001 do 034**). |
| **`B3_Skaner_QR`** | 7.3 | Wymagania mikronaklejek QR, błyskawicznego skanowania w lufce aparatem i timestampingu przylotów (**BR-SKAN-001 do 025**). |
| **`B4_Loty_Kalkulator`** | 7.4 | Wymagania rejestru lotów, geodezyjnego kalkulatora $m/min$ Vincenty WGS-84, wektora wiatru i katalogu protokołów (**BR-LOT-001 do 050**). |
| **`B5_Zdrowie_Pierzenie`** | 7.5 | Wymagania 10 lotek skrzydła (ARI), 12-miesięcznego kalendarza weterynaryjnego, fotoperiodu, diety i e-księgi PIW (**BR-ZDR-001 do 055**). |
| **`B6_Telemetria_Zegarek`** | 7.6 | Wymagania miniaturowych modułów IoT/GPS, map wektorowych offline oraz Apple Watch Companion (**BR-TEL-001 do 038**). |
| **`B7_Rozplod_Cele`** | 7.7 | Wymagania cyklu lęgowego, wirtualnej matrycy cel (Nest Box Matrix 2D), owoskopii D+5, okna obrączkowania D+6..8 i transferu D+24 (**BR-ROZP-001 do 045**). |
| **`C1_Reguly_Dziedzinowe`** | 8 | Zbiór reguł dziedzinowych (**RD-01 do RD-50+**) z dowodami matematycznymi, równaniami geodezyjnymi, biochemią lipidową i wektorami testowymi. |
| **`C2_Zrodla_Badacz`** | 8.P | Rygor 5 szczebli hierarchii źródeł merytorycznych, certyfikacja regulaminów FCI/PZHGP oraz rejestr decyzji badawczych. |
| **`D1_Wymagania_NFR`** | 9–10 | Wymagania niefunkcjonalne: OFF, I18N, DOST, WYG, WYD, DANE, BEZP, INT, ZEG, TEST oraz zgodność z Apple Review Guidelines. |
| **`D2_Architektura_SQLite_Supabase`** | 11–12 | Schemat lokalnej bazy SQLite 3 WAL, kolejka zdarzeń `pending_ops`, opcjonalny mostek PostgreSQL Supabase z RLS i bezstratny backup JSON/CSV. |
| **`D3_Rejestr_Ryzyk`** | 14, 16 | Katalog ryzyk polowych i chmurowych z macierzą prawdopodobieństwa i planem mitygacji. |
| **`D4_Strategia_Testow`** | 17 | 9 warstw jakości: testy jednostkowe, PBT, a11y, testy integralności SQLite, resilience i Maestro E2E. |

---

## 2. Podsumowanie Stanu Architektury po Procedurze Retrofit

Aplikacja **Pigeon-Fly** zrealizowała pełną parzystość ze standardem Apps4Craft w oparciu o zatwierdzone decyzje:
- **`DEC-RETRO-01: Opcja B`** — Architektura Hybrydowa Offline-First (100% lokalny rdzeń SQLite WAL, chmura Supabase wyłącznie dla funkcji sieciowych PRO).
- **`DEC-RETRO-02: Opcja A`** — Zamrożenie zakresu na 100 modułach (Z-001 do Z-100) i koncentracja na rzemieślniczej doskonałości.
- **`DEC-RETRO-03: Opcja B`** — Modularne fixtury testowe JSON zasilające testy regresyjne i PBT.
- **`DEC-RETRO-04: Opcja A`** — Związkowy Katalog Urzędowy PZHGP/FCI (`OfficialProtocolsHubModal`) z wyszukiwarką błyskawiczną i odciążeniem ekranu lotów.
- **`DEC-RETRO-05: Opcja A`** — Ekstrakcja wspólnych stylów modali do `modalTheme.ts`.
- **`DEC-RETRO-06: Opcja A`** — Globalna migracja na `react-native-safe-area-context`.
- **`DEC-RETRO-07: Opcja B`** — Procedura dociągania: najpierw kanon dokumentacji i fixtury, potem refaktoryzacja kodu.
- **`DEC-RETRO-08: Opcja A`** — Pełna kanoniczna synchronizacja BRD.

---

## 3. Statystyka Liczbowa Zsynchronizowanego Pakietu BRD

| Parametr / Element Specyfikacji | Wartość Liczbowa |
| :--- | :--- |
| **Liczba Zrealizowanych Modułów Domenowych** | **100 modułów (Z-001 do Z-100)** |
| **Liczba Zestawów Testów Automatycznych** | **94 zestawy testowe (100% zaliczone)** |
| **Liczba Testów Jednostkowych i Integracyjnych** | **652 testy passing (0 błędów)** |
| **Błędy Kompilacji TypeScript (`tsc --noEmit`)** | **0 błędów** |
| **Symetria Słowników Lokalizacyjnych (`check-i18n`)**| **100% zgodności kluczy** |
| **Kluczowe Decyzje Projektowe (DEC)** | **114 decyzji PZHGP/FCI + 8 decyzji RETRO-01..08** |
| **Generatory Urzędowych Dokumentów A4 PDF** | **100 dedykowanych formularzy i certyfikatów** |
| **Liczba Obsługiwanych Języków od Dnia 1** | **35 języków** |

---

## 4. Co Blokuje Wydanie (Release Blockers — Tylko Stan Faktyczny)

1. **Testy na Fizycznym Urządzeniu iOS w Terenie:** Weryfikacja działania skanera QR aparatu oraz druku AirPrint w warunkach polowych gołębnika.
2. **Przygotowanie Certyfikatów EAS Build / TestFlight:** Wygenerowanie produkcyjnych profili provisioningowych Apple Developer przed wysyłką do recenzji App Store.
3. **Natywny Target watchOS:** Skompilowanie dedykowanego rozszerzenia zegarkowego w projekcie Xcode.
