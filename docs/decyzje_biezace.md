# Pigeon-Fly — Rejestr Bieżący Decyzji i Stanu Projektu
**Data aktualizacji:** 17.10.2026 (Przyjęcie 10 Zasad Uniwersalnych i Odkrycie Ról z Biblioteki na Dysku)  
**Właściciel:** Łukasz (`lkarwowski494`)  
**Status projektu:** Faza wdrożeniowa — 42 zestawy testowe, 312 testów zaliczonych (100%), 0 błędów TypeScript i i18n

---

## 0. Zasady Uniwersalne (Nadrzędne — Każdy Czat, Każda Dziedzina)

1. **Decyzje należą do mnie:** Przy każdej zmianie, naprawie lub wyborze co najmniej dwie realne opcje z kompromisem i rekomendacją. Jeśli naprawdę jest tylko jedna — powiedz wprost dlaczego.
2. **Dowód zamiast deklaracji:** „Zrobione” = wynik testu, pomiar, zrzut albo przeczytane źródło z miejscem. Przy wątpliwości uruchom/sprawdź na żywo.
3. **Nie zgaduj:** Liczby i twierdzenia bez potwierdzenia oznacz jako otwarte pytanie. Raporty innych modeli i streszczenia wyszukiwarki to opinia — kluczowe tezy sprawdź u źródła. Rachunek z moich danych to nie twierdzenie merytoryczne.
4. **Fakty o projekcie:** Przed podaniem faktu o projekcie (ceny, limity, decyzje) sprawdź zapis decyzji, nie pamięć.
5. **Realność problemu:** Oceń realność problemu przed naprawą (realny / brzegowy / teoretyczny); utrata danych, prywatność i bezpieczeństwo — zawsze priorytet.
6. **Bieżący zapis:** Decyzje zapisuj od razu z datą; dokument roboczy krótki (stan bieżący), historia w archiwum.
7. **Wyjątki nazwane:** Wyjątki od zasad dozwolone, ale nazwane i zapisane; ryzykowną część zastąp tańszą kontrolą, nie żadną.
8. **Środowisko i polityki:** Ograniczenia środowiska i polityki usług sprawdź na starcie projektu.
9. **Szacowanie czasu:** Szacuj czas pracy jako czas agenta; osobno: na co się czeka i co wymaga mojego czasu.
10. **Biblioteka zasad i ról:** Na starcie projektu: przeczytaj „Biblioteka zasad i ról” na moim Dysku, zaproponuj pasujące moduły i role (odkrycie ról). Gdy trzeci raz powtarza się podobne zlecenie lub błąd — zaproponuj nową rolę/zasadę do biblioteki. Jeśli czat nie ma dostępu do Dysku — poproś mnie o wklejenie modułu.

---

## 1. Przyjęte Moduły i Role z Biblioteki na Dysku (17.10.2026)
*Źródło bazowe:* Plik `Biblioteka zasad i ról` na Dysku Google (ID: `1a9PD_1dVpY5Ct3XTkJPQoB-3iqPwVD__wbL7Fe-xOUw`, stan: 11–12.10.2026).

* **Obowiązujące moduły:**
  1. *Moduł: aplikacje (oprogramowanie):* TDD, testy przed kodem, potwierdzenie błędu na kodzie sprzed poprawki, testy na wycinkach prawdziwych danych (pliki CSV, formaty obrączek), lokalna baza SQLite WAL + Supabase PostgreSQL 16, RLS, Realtime, narzędzia 0 zł poza opłatą Apple, limity planów sprawdzane z zapasem 20–30%.
  2. *Moduł: research i treści merytoryczne:* 5 szczebli hierarchii źródeł (regulaminy FCI/PZHGP, wzory geodezyjne Vincenty WGS-84, biochemia żywienia Weende, medycyna ptaków PIW), daty i fakty sprawdzane w dniu pracy, rachunek z danych użytkownika nie wymaga źródeł.
  3. *Trzy zasady ogólne z modułu gier:* Jedno źródło prawdy z generatorami, „udokumentowane” ≠ „zweryfikowane”, warianty i archiwa jawnie oznaczone obok kanonu.
* **Aktywne role w projekcie Pigeon-Fly:**
  * **Koordynator / Integrator (sesja główna):** Prowadzenie stanu, jedyny commit i push po przejściu bramek (`npm run verify`).
  * **Analityk produktu:** Specyfikowanie funkcji i przepływów z min. 2 realnymi opcjami do decyzji Łukasza.
  * **Badacz merytoryczny:** Sprawdzanie regulaminów FCI/PZHGP, wzorów geodezyjnych, inbredu Wrighta i wykazów antydopingowych.
  * **Programista:** Implementacja TypeScript / React Native zgodnie ze zatwierdzoną specyfikacją, test najpierw, minimalny zakres.
  * **Tłumacz:** Dbanie o terminologię branżową (język polski, żargon hodowlany, weryfikacja `scripts/check-i18n.mjs`).
  * **Tester E2E / Audytor jakości:** Kontrola kryteriów DoD, ergonomia Field Mode ($\ge 56\text{ pt}$), ochrona prywatności i bezpieczeństwa danych.
  * **Sekretarz dokumentacji:** Zwięzły zapis decyzji z datą w rejestrze, aktualizacja dokumentacji technicznej.

---

## 2. Kluczowe Rozstrzygnięcia Decyzyjne (DEC-01 do DEC-56)

* **DEC-01 (Zakres MVP): Opcja B+ (Hybrydowa z Supabase — Zatwierdzona)**
  * *Rozstrzygnięcie:* Notes stada, rodowody PDF A4, inbred Wrighta, skaner QR, kalkulator $m/min$ (Vincenty), karta 10 lotek (ARI), szczepienia PMV-1, Field Mode, Apple Watch oraz Supabase (sync delta, weryfikacja online rodowodów QR, sieć Lost & Found).
* **DEC-02 (Architektura Bazy Danych): Opcja C (Hybrydowy Offline-First z Supabase)**
  * *Rozstrzygnięcie:* Lokalne SQLite 3 WAL jako natychmiastowy cel zapisu w terenie + asynchroniczna replikacja do PostgreSQL 16 w Supabase po wykryciu sieci.
* **DEC-03 (Obliczenia Geodezyjne): Opcja B (Równania Vincenty'ego WGS-84)**
  * *Rozstrzygnięcie:* Dokładność geodezyjna do $1\text{ mm}$ z fallbackiem Haversine'a.
* **DEC-04 (Format Kodu QR): Opcja B (Kompaktowy format PF1 z korekcją Level H)**
  * *Rozstrzygnięcie:* Odporność na zabrudzenie i uszkodzenie mikronaklejki do 30% powierzchni.
* **DEC-06 (Granice Free Tier): Opcja B (Limit do 10 ptaków w darmowym rdzeniu)**
  * *Rozstrzygnięcie:* Nielimitowany czasowo darmowy rdzeń dla 10 gołębi; pełna wersja Pro dla większych stad z chmurą Supabase.
* **DEC-07 (Cennik i Monetyzacja): Opcja A (1,99 EUR / 6,99 EUR / 19,99 EUR Lifetime)**
  * *Rozstrzygnięcie:* Zakup dożywotni Lifetime z aktywnym Family Sharing i chmurą.
* **DEC-08 (Kopia Zapasowa): Opcja A (Zawsze 100% Darmowa Kopia SQLite i JSON)**
  * *Rozstrzygnięcie:* Suwerenność danych hodowcy — darmowy eksport i import bazy SQLite/JSON niezależnie od chmury.
* **DEC-31 (Wybór Bazy Chmurowej): Opcja C (Supabase)**
  * *Rozstrzygnięcie:* Supabase PostgreSQL 16 z RLS, Realtime WebSockets, Storage i Edge Functions.
* **DEC-32 (Strategia Uwierzytelniania): Opcja B (Zero-Friction: Anonimowy Start $\rightarrow$ Apple Sign-In)**
  * *Rozstrzygnięcie:* Brak wymuszonego logowania na starcie; łączenie z Apple ID przy przejściu na Pro/Tandem.
* **DEC-34 (Tandem Hodowlany): Opcja A (Współdzielenie gołębnika z rolami RLS)**
  * *Rozstrzygnięcie:* Role `OWNER`, `MEMBER`, `VIEWER` dla spółek hodowlanych.
* **DEC-35 (Transmisje na Żywo): Opcja A (Supabase Realtime Live Broadcast)**
  * *Rozstrzygnięcie:* Transmisja przylotów z lotu na żywo przez WebSockets pod prywatnym linkiem.
* **DEC-36 (Weryfikacja Rodowodów): Opcja A (Cyfrowy Paszport pod Kodem QR)**
  * *Rozstrzygnięcie:* SHA-256 + portal `pigeonfly.app/pedigree/[ID]` chroniący przed fałszerstwami.
* **DEC-37 (Sieć Pomocy Zagubionym): Opcja A (Portal Lost & Found z Push APNs)**
  * *Rozstrzygnięcie:* Znalazca zgłasza ptaka na stronie webowej; właściciel dostaje alert push w 3 sekundy.
* **DEC-51 (Biologiczny Silnik Cyklu Lęgowego): Opcja A (Automatyczny Chronometraż Lęgów)**
  * *Rozstrzygnięcie:* 1. jajo (+9 dni), 2. jajo (+44h / 2 dni), owoskopia 5. dzień, wylęg 18. dzień, okno obrączkowania 6.–8. dzień, odsadzenie 24. dzień. Podmiana na jajka gipsowe.
* **DEC-52 (4-Fazowy Silnik Żywieniowy): Opcja A (Tygodniowy Kalendarz Poidła i Karmnika)**
  * *Rozstrzygnięcie:* 4 fazy roczne z precyzyjną 7-dniową rotacją karmy oraz suplementacją poidła i karmnika.
* **DEC-53 (Fotoperiod — Zaciemnianie i Doświetlanie): Opcja A (Moduł Verdunkelung & Belichtung)**
  * *Rozstrzygnięcie:* 14h ciemności (18:00–08:00) od 15.03 do 21.06 oraz doświetlanie do 16h od 22.06 do września.
* **DEC-54 (12-Miesięczny Kalendarz Weterynaryjny i E-Księga Leczenia): Opcja A (Urzędowy Rejestr PIW)**
  * *Rozstrzygnięcie:* Badania koproskopowe, szczepienia PMV-1/ospa, kuracja rzęsistka, e-księga leków z automatycznym kalkulatorem karencji i eksportem PDF dla PIW.
* **DEC-55 (Wirtualna Matryca Cel Lęgowych): Opcja A (Nest Box Matrix)**
  * *Rozstrzygnięcie:* Graficzna mapa przedziału rozpłodowego z kolorystycznymi statusami cel.
* **DEC-56 (Przyjęcie Zasad Uniwersalnych i Biblioteki Ról): Opcja A (17.10.2026 — Zatwierdzona przez Łukasza)**
  * *Rozstrzygnięcie:* Przyjęcie 10 Zasad Uniwersalnych jako nadrzędnego protokołu; aktywacja modułów `aplikacje`, `research` i 3 reguł ogólnych; powołanie 7 ról roboczych. Przy każdej zmianie/naprawie bezwzględny wymóg min. 2 realnych opcji z kompromisami do decyzji właściciela.
* **DEC-57 (Model Spalania Energii w Locie i Regeneracji Powrotowej — RD-15, RD-16, Z-047, Z-284): Opcja 1 (17.10.2026 — Zatwierdzona przez Łukasza)**
  * *Rozstrzygnięcie:* Implementacja `src/domain/flightEnergetics.ts` symulującego spalanie kwasów tłuszczowych (39.0 kJ/g), glikogenu (17.5 kJ/g), katabolizmu białek mięśni piersiowych (17.0 kJ/g) przy deficycie energetycznym, utraty wody/odwodnienia ze współczynnikiem termicznym oraz 2-fazowego protokołu regeneracji (Faza 1: izotonik 300 mOsm/L, Faza 2: Sedochol + aminokwasy BCAA + karma Depurative). Integracja w `app/(tabs)/kalkulator.tsx` (Sekcja 3). Pokrycie testami 100% (6/6 passing w `tests/flightEnergetics.test.ts`).
* **DEC-58 (Generator Kart Lęgowych Celi PDF z Kodem QR — Z-270): Opcja 1 (17.10.2026 — Zatwierdzona przez Łukasza)**
  * *Rozstrzygnięcie:* Implementacja funkcji `mapNestBoxToCardItem` w `src/domain/nestBoxMatrix.ts` łączącej pozycję celi z chronometrażem lęgowym (jaja, owoskopia, wylęg, okno obrączkowania 6–8 dni, odsadzenie) i mikrokodem QR (`PIGEONFLY:NESTBOX:...`). Integracja akcji drukowania AirPrint oraz udostępniania PDF pojedynczej celi i zbiorczego arkusza A4 dla całego przedziału lęgowego w `src/components/NestBoxMatrixModal.tsx`. Pokrycie testami 100% (4/4 passing w `tests/nestBoxCards.test.ts`, łącznie 37 zestawów i 277 testów).
* **DEC-59 (Triage YPDS Adeno-Coli RD-27 oraz Koproskopia Ilościowa McMaster OPG / HPF — Z-305, Z-306, BR-ZDR-008): Opcja 1 (17.10.2026 — Zatwierdzona przez Łukasza)**
  * *Rozstrzygnięcie:* Implementacja triage klinicznego Zespołu Choroby Młodych (YPDS / Adeno-Coli) w `src/domain/health.ts` (zakazy koszowania, twardego ziarna, 5-etapowy protokół ratunkowy RD-27, automatyczne przenoszenie do Izolatki z 14-dniową karencją, generator raportu ratunkowego PDF dla lekarza weterynarii `exportYpdsReport` w `src/services/pdfService.ts`). Rozbudowa modułu koproskopii o ilościową komorę McMastera (OPG: <1000 profilaktyka naturalna octem/oregano bez chemii, 1000–5000 kuracja celowana, &ge;5000 Baycox 2.5% + wypalenie rusztów palnikiem gazowym) oraz mikroskopową ocenę HPF jaj glistnicy/kapilariozy z powtórzeniem kuracji po 14 dniach. Integracja UI w `src/components/VeterinaryLabModal.tsx`. Pokrycie testami 100% (5/5 w `tests/ypdsTriage.test.ts`, 9/9 w `tests/coproscopyLab.test.ts`).
* **DEC-60 (Moduł Transmisji Przylotów na Żywo Supabase Realtime — Z-049, DEC-35): Opcja 1 (17.10.2026 — Zatwierdzona przez Łukasza)**
  * *Rozstrzygnięcie:* Implementacja `src/services/liveBroadcastService.ts` zarządzającego subskrypcją kanałów WebSocket (`race-live-[CODE]`), emisją zdarzeń przylotów w czasie rzeczywistym, generowaniem kanonicznych linków kibica (`https://pigeonfly.app/live/...`), lokalnym powiadamianiem subskrybentów oraz buforem kolejki offline (`offlineQueue`). Integracja wskaźników statusu połączenia i automatycznej synchronizacji w `src/components/LiveDerbyModal.tsx` oraz podpięcie w `app/(tabs)/loty.tsx`. Pokrycie testami 100% (8/8 passing w `tests/liveBroadcast.test.ts`, stan całkowity projektu: 40 zestawów, 299 testów 100% zaliczonych).
* **DEC-61 (Paszport Immunologiczny i Urzędowe Zaświadczenie Szczepień Stada — Z-307, BR-ZDR-009): Opcja 1 (17.10.2026 — Zatwierdzona przez Łukasza)**
  * *Rozstrzygnięcie:* Implementacja `src/domain/vaccination.ts` sprawdzającego ważność szczepień PMV-1 (paramyksowiroza — 365 dni), ospy gołębi i salmonellozy, 21-dniowe okno serokonwersji przed koszowaniem, automatyczną blokadę koszowania ptaków bez ważnego szczepienia oraz generatora urzędowego Zaświadczenia Szczepień Gołębi PDF (`generateVaccinationCertificateHtml` / `exportVaccinationCertificate`) zgodnego z wymogami PZHGP i Powiatowego Lekarza Weterynarii (PIW). Integracja akcji druku i udostępniania w `src/components/VeterinaryLabModal.tsx`. Pokrycie testami 100% (8/8 passing w `tests/vaccination.test.ts`).
* **DEC-62 (Komercyjny Moduł Wyceny Wartości Rynkowej Gołębia — Z-048, DEC-07): Opcja 2 (17.10.2026 — Zatwierdzona przez Łukasza)**
  * *Rozstrzygnięcie:* Implementacja silnika wyceny `calculateMarketValuation` w `src/domain/valuation.ts` w walutach PLN i EUR (kurs 4.30) opartego na dorobku konkursowym (baza 20%), konkursach w szpicy (Top 100), 1. nagrodach, coeficientach FCI (<10 super as, <25 czołówka okręgu), tytułach sportowych, liniach rodowodowych (mnożniki do 2.2x), inbredzie Wrighta F (optymalny 3.125-12.5% vs ciasny >25%), ocenie budowy Standard FCI (90-95 pkt) oraz potomstwie. Integracja z `src/components/AppraisalModal.tsx` w postaci zakładki z medianą cenową, widełkami, kategoryzacją oraz rekomendacją aukcyjną. Pokrycie testami 100% (5/5 passing w `tests/valuation.test.ts`, łącznie 42 zestawy testowe i 312 testów).

---

## 3. Bezwzględne Inwarianty i Zasady Bezpieczeństwa

* **KRYTYCZNA ZASADA BEZPIECZEŃSTWA (INWARIANT BEZWZGLĘDNY):**
  Repozytoria [`lkarwowski494/trening`](https://github.com/lkarwowski494/trening) oraz [`lkarwowski494/Oczko`](https://github.com/lkarwowski494/Oczko) są **ŚCIŚLE READ-ONLY**. Absolutny zakaz jakichkolwiek modyfikacji.
* **ZASADA JAKOŚCI ZAS-QA-PF-01:**
  Każda nowa funkcja bezwzględnie musi posiadać pełne pokrycie testami automatycznymi w standardzie repozytoriów `organizer` i `Oczko` (100% pokrycia linii logiki domenowej, PBT, a11y, testy RLS w SQL `pgTAP`, resilience, budżety wydajnościowe).
