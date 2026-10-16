# Rozdział 17: Wielowarstwowa Strategia Testów i Rygor Jakości (D4)
## Pigeon-Fly · Standard Jakości Inżynierskiej i 9 Warstw Weryfikacji

---

### 1. Filozofia Jakości: Testy Przed Kodem (TDD)
Zgodnie z zasadami studia Apps4Brew, żaden moduł domenowy, kalkulator ani ekran interfejsu nie może zostać wdrożony do bazy kodu bez uprzedniego przygotowania zestawu testów automatycznych. Błędy wykryte w testach polowych otrzymują test odtwarzający (Regression Guard) weryfikowany przed wdrożeniem poprawki.

---

### 2. Dziewięć Warstw Rygoru Jakościowego (Testing Matrix)

```
                       9 WARSTW JAKOŚCI PIGEON-FLY
 ┌────────────────────────────────────────────────────────────────────────┐
 │ 1. CZYSTA LOGIKA DOMENOWA (100% Line Coverage, Pure Swift / TS)        │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 2. NIEZMIENNIKI MATEMATYCZNE I PBT (Property-Based fast-check)        │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 3. TESTY RÓŻNICOWE (Cross-Validation z Korpusem Python 3.14)          │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 4. PERSYSTENCJA SQLITE I TRANSAKCYJNOŚĆ (Zero Partial Writes)          │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 5. ERGOFIZYKA FIELD MODE I APPLE HIG (Wymiary dotyku >= 56 pt)         │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 6. DOSTĘPNOŚĆ I SENIORZY (VoiceOver & Dynamic Type)                   │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 7. BUDŻETY WYDAJNOŚCIOWE CPU I PAMIĘCI (Microsecond Benchmarks)        │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 8. WSTRZYKIWANIE BŁĘDÓW I ODPORNOŚĆ (Fault Injection & Crash Recovery) │
 ├────────────────────────────────────────────────────────────────────────┤
 │ 9. TESTY SCENARIUSZOWE MAESTRO E2E (Pełne Przepływy Użytkownika)       │
 └────────────────────────────────────────────────────────────────────────┘
```

---

### 3. Szczegółowy Zakres Poszczególnych Warstw

#### Warstwa 1: Czysta Logika Domenowa (100% Pokrycia Linii)
- Wszystkie pliki kalkulatorów prędkości, wzorów geodezyjnych Vincenty'ego/Haversine'a, współczynnika inbredu Wrighta, bilansu białkowo-tłuszczowego i indeksu skrzydła ARI muszą posiadać **bezwzględne 100,00% pokrycia linii**.
- Weryfikacja wartości brzegowych: zerowy dystans, lot trwający 0 sekund (ochrona przed dzieleniem przez zero), brak rodziców, brak wspólnych przodków ($F=0$).

#### Warstwa 2: Testy Oparte na Właściwościach (Property-Based Testing / PBT)
- Wykorzystanie bibliotek generowania danych losowych (`fast-check` / SwiftCheck) przy minimum 1 000 iteracji per test:
  1. *Niezmiennik Symetrii Geodezyjnej:* $dist(A, B) = dist(B, A)$ dla dowolnych par współrzędnych na kuli ziemskiej.
  2. *Niezmiennik Monotoniczności Prędkości:* Jeśli dystans rośnie przy stałym czasie, prędkość musi rosnąć monotonicznie.
  3. *Niezmiennik Zakresu Inbredu:* Dla dowolnego wygenerowanego losowo drzewa genealogicznego współczynnik Wrighta musi mieścić się w przedziale $0,0 \le F \le 1,0$.
  4. *Niezmiennik Sumy Mieszanki Paszowej:* Suma udziałów ziaren musi być równa dokładnie $100,0\%$.

#### Warstwa 3: Testy Różnicowe (Cross-Validation z Korpusem Pythona)
- Zestawienie niezależnego skryptu referencyjnego napisanego w języku Python 3.14 (`scripts/gen-domain-corpus.py`), który wylicza tysiące wzorcowych wyników odległości i prędkości zgodnie z oficjalnymi publikacjami geodezyjnymi.
- Testy automatyczne weryfikują zgodność implementacji w Swift/TS z dokładnością do $10^{-6}$.

#### Warstwa 4: Persystencja SQLite i Transakcyjność
- Testy awaryjnego odcięcia zasilania w trakcie zapisu przylotu: weryfikacja, że baza SQLite WAL nie ulega uszkodzeniu i zachowuje spójność relacyjną (Zero Partial Writes).
- Testy migracji schematu bazy danych z wersji $N$ do $N+1$ z automatycznym testem rollbacku.

#### Warstwa 5: Ergofizyka Field Mode i Apple HIG
- Statyczna inspekcja widoków SwiftUI pod kątem minimalnego rozmiaru obszaru dotyku:
  - W trybie standardowym: `frame.width >= 44 && frame.height >= 44`,
  - W trybie Field Mode: `frame.width >= 56 && frame.height >= 56`.
- Weryfikacja obecności przycisku „Anuluj / Zamknij” w lewym górnym rogu każdego modalu (`tests/close-button-guard.test.ts`).

#### Warstwa 6: Dostępność i Wsparcie Seniorów (VoiceOver & Dynamic Type)
- Testy automatyczne sprawdzające, czy każdy kafelek ptaka, przycisk rejestracji przylotu i wynik prędkości posiada poprawne atrybuty `accessibilityLabel` i `accessibilityHint`.
- Symulacja renderowania interfejsu przy maksymalnym powiększeniu fontu (Accessibility XXL): brak obcięć tekstu i nachodzących na siebie elementów.

#### Warstwa 7: Rygor Budżetów Wydajnościowych CPU
- Wyznaczenie twardych limitów czasu wykonania:
  - Przeliczenie formuły Vincenty'ego: $< 1\,\text{ms}$,
  - Rekonstrukcja drzewa genealogicznego 5 pokoleń (62 ptaki): $< 25\,\text{ms}$,
  - Wyliczenie rankingu dla 200 ptaków w gołębniku: $< 15\,\text{ms}$,
  - Generowanie wektorowego dokumentu PDF A4: $< 450\,\text{ms}$.

#### Warstwa 8: Wstrzykiwanie Błędów (Fault Injection & Resilience)
- Testy odpornościowe:
  - Próba zaimportowania sfałszowanego lub uszkodzonego pliku JSON/SQLite,
  - Próba zeskanowania kodu QR o niepoprawnej sumie kontrolnej CRC16,
  - Próba rejestracji przylotu ptaka, który nie był zakoszowany na dany lot,
  - Odporność na brak sygnału GPS w trakcie trwania lotu.

#### Warstwa 9: Scenariusze Automatyczne E2E (Maestro)
- Zestaw automatycznych scenariuszy end-to-end w narzędziu Maestro na symulatorze iPhone'a:
  1. *Scenariusz Pełnego Lotu:* Utworzenie lotu $\rightarrow$ Koszowanie 5 ptaków $\rightarrow$ Symulacja przylotów przez kod QR $\rightarrow$ Generowanie tabeli wyników $\rightarrow$ Weryfikacja wyliczonej prędkości $m/min$.
  2. *Scenariusz Lęgowy:* Dodanie samca i samicy $\rightarrow$ Rejestracja jaj $\rightarrow$ Wyklucie $\rightarrow$ Obrączkowanie pisklęcia kodem QR $\rightarrow$ Wygenerowanie rodowodu PDF A4.
  3. *Scenariusz Kopiowania Danych:* Utworzenie stada 20 ptaków $\rightarrow$ Eksport backupu do pliku $\rightarrow$ Wyczyszczenie danych $\rightarrow$ Przywrócenie z pliku $\rightarrow$ Weryfikacja zgodności 1:1.
