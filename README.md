# Pigeon-Fly 🕊️⏱️

> **„Cyfrowy notes mistrza — prosto, niezawodnie i w 100% offline w każdych warunkach gołębnika.”**

Aplikacja mobilna na system iOS dedykowana pasjonatom i zawodowym hodowcom gołębi pocztowych, stworzona w architekturze **100% Offline-First** jako nowoczesny, cyfrowy odpowiednik tradycyjnego zeszytu w kratkę. Łączy polową niezawodność w trudnych warunkach gołębnika (kurz, pióra, brak zasięgu) z precyzyjnym kalkulatorem prędkości lotu w $m/\text{min}$, drzewem genealogicznym, skanerem QR na obrączkach, rejestrem lęgów i suplementacji oraz synchronizacją chmurową Supabase.

**Status projektu:** Wersja deweloperska gotowa do testów TestFlight (16.10.2026).  
**Stos technologiczny:** Expo SDK 57, React Native, TypeScript, SQLite (`expo-sqlite`, czysty SQL, transakcje WAL), Supabase.

---

## 🌟 Główne Zasady Produktowe & Architektura

- **100% Offline-First (SQLite + pending_sync):** Wszystkie ekrany i operacje w gołębniku czytają i piszą wyłącznie do lokalnej bazy SQLite (`/Library/SQLite/pigeon_fly.db`). Brak zasięgu komórkowego w gołębniku nie blokuje żadnej akcji — rejestracja przylotu ptaka, parowanie w celi czy wpis szczepienia zapisują się natychmiastowo w lokalnej transakcji bazodanowej.
- **Ergofizyka i Tryb Polowy (Field Mode):** Interfejs zaprojektowany do obsługi jedną ręką w warunkach polowych. Duże, kontrastowe elementy dotykowe (min. 56 pt dla głównych akcji, komponent `FieldButton`), zredukowana do minimum liczba kliknięć, natychmiastowa odpowiedź haptyczna (`expo-haptics`) oraz zapobieganie wygaszaniu ekranu (`isIdleTimerDisabled` / `expo-keep-awake`) podczas oczekiwania na przylot stada.
- **Precyzja Sportowa i Standardy FCI / PZHGP ($m/\text{min}$):** Precyzyjny silnik obliczeniowy prędkości lotu w metrach na minutę ($m/\text{min}$) oraz jardach na minutę ($\text{ypm}$) bazujący na geodezyjnej odległości gołębnika, z uwzględnieniem sekundowego timestampingu, neutralizacji nocy w lotach dalekodystansowych i maratonach oraz korekty stref czasowych.
- **Cyfrowe Drzewo Genealogiczne i Anty-fałszerstwo (QR):** Algorytm rekurencyjnej rekonstrukcji 4-pokoleniowego rodowodu z kalkulacją współczynnika inbredu Wrighta ($F$). Generator profesjonalnych dokumentów A4 PDF (`expo-print`, `expo-sharing`) z unikalnym kryptograficznym kodem QR umożliwiającym natychmiastową weryfikację autentyczności ptaka w bazie Supabase.
- **Pełny 12-Miesięczny Cykl Biologiczny Stada:** Kompleksowe wsparcie hodowcy przez cały rok: wirtualna matryca cel i cykl lęgowy (owoskopia Dnia 5, okno obrączkowania Doba 6–8), 4-fazowe żywienie i tygodniowa rotacja wdowieństwa, monitor pierzenia 10 lotek (Wskaźnik ARI), kalendarz szczepień PMV-1 oraz urzędowa E-Księga Leczenia Zwierząt PIW z automatyczną kontrolą okresów karencji leków.
- **Pojedyncze Źródło Prawdy & Spójność Apps4Brew Studio:** Zgodność ze standardem portfolio: 10-plikowa rotacyjna kopia zapasowa JSON z sumą kontrolną tabel (`backupService.ts`), podwójny system metryczno-imperialny (`units.ts`), kalkulator ekonomiki i budżetu karmy (`costCalculator.ts`), dyskretne wsparcie Apple Watch (`appleWatchService.ts`) oraz model monetyzacji Freemium/Pro z paywallem Apple HIG.

---

## 📱 Moduły i Ekrany

1. **🕊️ Cyfrowy Notes Gołębnika (Stado & Karta Ptaka — `app/(tabs)/index.tsx`):**
   - Ewidencja stada z błyskawicznym wyszukiwaniem po numerze obrączki, roczniku, maści i statusie (lotowy, rozpłód, wycofany).
   - Generowanie i bezpośredni wydruk 4-pokoleniowych rodowodów A4 PDF z poziomu karty ptaka.
   - Wbudowana ochrona limitu darmowego stada (Free Tier: do 10 ptaków) zintegrowana z Paywall Modalem.
2. **🥚 Rozpłód, Cele & Kalkulator Inbredu Wrighta (`app/(tabs)/rozplod.tsx`):**
   - Wirtualna matryca cel gniazdowych z rejestrem skojarzonych par (`PairingModal.tsx`).
   - Obliczanie współczynnika inbredu Sewalla Wrighta ($F$) dla planowanego potomstwa w głąb rodowodu.
   - Automatyczny harmonogram biologiczny lęgu: data owoskopii (Dzień 5), okno zakładania obrączek rodowych (Doba 6–8) i termin odsadzenia młodych.
3. **⏱️ Loty, Treningi & Tablica Przylotów Live (`app/(tabs)/loty.tsx`):**
   - Panel aktywnego lotu konkursowego lub treningu z podglądem współrzędnych i dystansu.
   - Dynamiczny ranking przylotów stada na żywo z prędkościami w $m/\text{min}$ sortowanymi w czasie rzeczywistym.
   - Generowanie i wydruk Oficjalnej Listy Wkładaniowej do Kosza (FCI/PZHGP) z oznaczaniem serii typowanych ptaków (T).
4. **📷 Błyskawiczny Skaner Kodów QR w Lufce (`app/modal/scan.tsx`):**
   - Błyskawiczne rejestrowanie wlotu ptaka za pomocą kamery urządzenia (`expo-camera`).
   - Odczyt mikronaklejek QR z obrączek pomocniczych z rejestracją znacznika czasu (dokładność ms) i automatycznym przeliczeniem prędkości.
5. **💉 Zdrowie, E-Księga PIW & Kontrola Pierzenia (`app/(tabs)/zdrowie.tsx`):**
   - Interaktywny wskaźnik skrzydła (`FeatherGauge.tsx`) monitorujący zrzucanie 10 lotek pierwszego rzędu i wyliczający Wskaźnik Regeneracji Skrzydła (ARI).
   - Status szczepienia przeciwko paramyksowirozie (PMV-1) i roczny kalendarz profilaktyki stada.
   - Generowanie urzędowej E-Książki Leczenia Zwierząt PIW (PDF A4) z kontrolą okresów karencji i numerów partii leków.
6. **🥣 Żywienie, Rotacja Wdowców & Bilans Karmy (`app/(tabs)/zywienie.tsx`):**
   - Tygodniowy harmonogram żywienia dla 4 faz rocznych (loty wdowieństwo, lęgi, wielkie pierzenie, zimowanie).
   - Podział na karmnik poranny/wieczorny, profil makroskładników (białko, tłuszcz, węglowodany, włókno) oraz dodatki do poidła.
   - Interaktywny kalkulator bilansu ziarna i budżetu karmy (`calculateLoftCosts`) przeliczający zużycie dzienne, miesięczne i roczne w workach 25 kg.
7. **🧮 Precyzyjny Kalkulator Prędkości ($m/\text{min}$) (`app/(tabs)/kalkulator.tsx`):**
   - Samodzielne narzędzie kalkulacji prędkości dla dowolnego dystansu i czasu wypuszczenia/przylotu.
   - Automatyczne przeliczanie pomiędzy systemem metrycznym ($m/\text{min}$, $\text{km/h}$) a imperialnym ($\text{ypm}$, $\text{mph}$).
8. **⌚ Wsparcie Apple Watch & 1-Tap Odbicia (`appleWatchService.ts`):**
   - Rejestracja przylotu jednym dotknięciem na nadgarstku w gołębniku („Spadł ptak!”).
   - Kolejka synchronizacji offline i bezproblemowe parowanie przylotów z numerami obrączek po wejściu do domu.
9. **⚙️ Ustawienia, Bezpieczny Backup & Pigeon-Fly Pro (`app/(tabs)/ustawienia.tsx`):**
   - Monitor statusu subskrypcji Pro Pass (Miesięczny, Roczny, Dożywotni) z natychmiastowym przywracaniem zakupów.
   - 10-plikowa rotacyjna kopia zapasowa SQLite/JSON do prywatnych Plików / iCloud Drive z weryfikacją sum kontrolnych.
   - Przełącznik jednostek metrycznych/imperialnych oraz status synchronizacji Supabase.

---

## 🧪 9 Warstw Weryfikacji Jakości (Testing Rigor)

Projekt realizowany jest zgodnie z rygorystyczną definicją ukończenia (DoD):
- **100% Pokrycia Logiki Domenowej:** Bezwzględny wymóg pełnego pokrycia testami dla logiki biznesowej (`src/domain`, `src/services`, `src/db`).
- **Testy Własnościowe (Property-Based):** Weryfikacja niezmienników matematycznych (formuła prędkości lotu, czas trwania, współczynnik inbredu Wrighta $F \in [0, 1]$) z użyciem biblioteki `fast-check`.
- **Precyzja Matematyczna i Geodezyjna:** Rygorystyczne testy neutralizacji nocnej w maratonach, konwersji jednostek metryczno-imperialnych oraz kalkulatora zapotrzebowania na ziarno.
- **Bezpieczeństwo i Integralność Bazy SQLite:** Testy atomiczności transakcji (`withTransactionAsync`), izolacji ścieżki pliku bazy w katalogu `/Library/SQLite` (SEC-09) oraz walidacji nagłówka i sum kontrolnych kopii zapasowych.
- **Walidacja Zgodności i18n:** Automatyczny skrypt CI (`scripts/check-i18n.mjs`) weryfikujący stuprocentową zgodność kluczy pomiędzy kodem aplikacji a słownikami językowymi (PL / EN).
- **Testy Usług Druku i Generowania PDF:** Walidacja szablonów HTML/CSS rodowodu 4-pokoleniowego, listy wkładaniowej FCI oraz e-książki PIW z mockami `expo-print` i `expo-sharing`.

---

## 🛠️ Uruchomienie i Weryfikacja

Wymagane środowisko: Node.js 20+ oraz npm.

```bash
# Instalacja zależności
npm install

# Pełna weryfikacja projektu (typecheck + check-i18n + testy Jest)
npm run verify

# Uruchomienie wszystkich testów jednostkowych i integracyjnych Jest
npm test

# Uruchomienie testów z generowaniem raportu pokrycia kodu
npm run test:coverage

# Sprawdzenie poprawności typów TypeScript (zero tolerancji dla błędów)
npm run typecheck

# Sprawdzenie kompletności tłumaczeń językowych i18n
npm run check:i18n

# Uruchomienie serwera deweloperskiego Expo
npm run start
```

---

## 📂 Architektura Kodu

```text
pigeon-fly/
├── app/                        # Expo Router (Ekrany i nawigacja w standardzie Field Mode)
│   ├── (tabs)/                 # Główne zakładki dolnego paska nawigacji
│   │   ├── index.tsx           # Stado: cyfrowy notes mistrza i karty ptaków
│   │   ├── rozplod.tsx         # Rozpłód: wirtualne cele, kojarzenia, inbred i druk kart cel PDF A4 (Z-270)
│   │   ├── loty.tsx            # Loty: tablica przylotów na żywo i lista wkładaniowa
│   │   ├── zdrowie.tsx         # Zdrowie: wskaźnik 10 lotek (ARI) i e-księga PIW
│   │   ├── zywienie.tsx        # Żywienie: rotacja 4-fazowa i bilans karmy
│   │   ├── kalkulator.tsx      # Szybki kalkulator prędkości w m/min, wektor wiatru 3D i predyktor Coeff FCI
│   │   └── ustawienia.tsx      # Ustawienia, tandem, kopie zapasowe, jednostki i Pro Pass
│   ├── modal/                  # Formularze modalne
│   │   ├── new-pigeon.tsx      # Dodawanie nowego ptaka z walidacją limitu stada
│   │   └── scan.tsx            # Błyskawiczny skaner kodów QR aparatem (Vision)
│   └── _layout.tsx             # Główny kontener nawigacyjny aplikacji
├── src/
│   ├── domain/                 # Czysta logika biznesowa i reguły hodowlane (zero UI)
│   │   ├── access.ts           # Silnik uprawnień Freemium / Pro / Lifetime
│   │   ├── antidoping.ts       # Tarcza antydopingowa FCI/PZHGP, baza substancji zabronionych, karencje i detoks (Z-304, BR-ZDR-009)
│   │   ├── appraisal.ts        # Ocena fenotypowa, znak oka, widełki i Standard FCI
│   │   ├── basketing.ts        # Koszowanie, walidacja obrączek, blokada antydopingowa i seria typowana (T)
│   │   ├── breeding.ts         # Biologia lęgu i harmonogram jaj/obrączkowania
│   │   ├── compartments.ts     # Sektory i przedziały gołębnika (Wdowce, Wdówki, Młode, Rozpłód, Izolatka) i normy FCI (BR-STADO-005)
│   │   ├── concourse.ts        # Baza konkursowa (20%), FCI Coeff i punkty GMP Asów
│   │   ├── costCalculator.ts   # Kalkulator budżetu stada, ziarna i weterynarii
│   │   ├── derby.ts            # Mini-Derby Sekcji, wielogołębnikowe live standings i feed
│   │   ├── drinkerLab.ts       # Laboratorium poidła, buforowanie pH przeciw rzęsistkowi (RD-17), izotonik (RD-18) i Carbo-Lipid Shift (RD-15/16)
│   │   ├── feedCompounder.ts   # Laboratorium paszowe 20 ziaren, bilans makro i energia MJ/kg
│   │   ├── genetics.ts         # Matematyczny algorytm inbredu Wrighta (F)
│   │   ├── health.ts           # Profilaktyka, szczepienia PMV-1, karencje, triage YPDS/Adeno-Coli (RD-27) i koproskopia (BR-ZDR-008/010)
│   │   ├── lostAndFound.ts     # Rejestr zagubionych ptaków (SOS), geodezyjny drift i ochrona prywatności
│   │   ├── moult.ts            # Regeneracja 10 lotek skrzydła i fotoperiod
│   │   ├── nestBoxMatrix.ts    # Wirtualna siatka cel lęgowych, jajka gipsowe i alarmy 6-8 dni
│   │   ├── nutrition.ts        # 4-fazowe protokoły żywieniowe i bilans makro
│   │   ├── pdfExport.ts        # Generatory HTML A4: rodowody, kosz, naklejki QR, PIW i karty cel gniazdowych (Z-270)
│   │   ├── performance.ts      # Silnik formy sportowej, dynamika prędkości m/min i taktyka
│   │   ├── photoperiod.ts      # Chronobiologia stada, systemy Verdunkelung / Belichtung (RD-13/14) i alerty rolet
│   │   ├── qr.ts               # Bezpieczne identyfikatory i weryfikacja rodowodów
│   │   ├── racing.ts           # Fizyka lotu, m/min, ypm i neutralizacja nocy
│   │   ├── squads.ts           # Taktyczne zarządzanie składami i drużynami lotowymi (Drużyna A GMP, B Średni, C Maraton, Młode) (BR-STADO-006, Z-018)
│   │   ├── tandem.ts           # Silnik współdzielenia gołębnika (Tandem), role RBAC, zaproszenia i audyt (BR-STADO-009, Z-057)
│   │   ├── telemetry.ts        # Moduł 5: IoT/GPS tracking, krzywizna i efektywność trasy
│   │   ├── types.ts            # Wspólne interfejsy domenowe TypeScript
│   │   ├── units.ts            # Konwerter jednostek metrycznych i imperialnych
│   │   └── weather.ts          # Wektory wiatru, korytarze lotu, punkty ETA i kąt znoszenia (Crab Angle) (BR-LOT-005, Z-047)
│   ├── db/                     # Baza lokalna SQLite (expo-sqlite, czysty SQL)
│   │   ├── database.ts         # Połączenie z bazą, transakcje i migracje schematu
│   │   ├── dbPath.ts           # Ścieżka bazodanowa chroniona standardem SEC-09
│   │   ├── schema.ts           # Schemat tabel DDL i indeksy relacyjne
│   │   ├── pigeonRepository.ts # CRUD stada i zapytań rodowodowych
│   │   ├── breedingRepository.ts # Zapytania cel gniazdowych i kojarzeń
│   │   ├── raceRepository.ts   # Zapytania lotów i rankingu przylotów
│   │   ├── healthRepository.ts # E-Księga PIW, szczepienia PMV-1 i wskaźnik ARI
│   │   └── feedingRepository.ts# Rejestr dawek ziaren, faz i poidła
│   ├── services/               # Usługi systemowe i integracje
│   │   ├── appleWatchService.ts # Komunikacja i odbijanie przylotów na Apple Watch
│   │   ├── backupService.ts    # 10-plikowa rotacyjna kopia zapasowa JSON/SQLite
│   │   └── pdfService.ts       # Natywny wydruk (expo-print) i udostępnianie (expo-sharing)
│   ├── components/             # Ergonomiczne komponenty interfejsu (Field Mode)
│   │   ├── AddFeedingLogModal.tsx # Formularz dziennika karmy i suplementacji
│   │   ├── AddTreatmentModal.tsx  # Formularz szczepień PMV-1 i leczenia PIW
│   │   ├── AntidopingModal.tsx # Tarcza antydopingowa FCI, wykaz substancji i kalkulator karencji (Z-304)
│   │   ├── AppraisalModal.tsx     # Ocena fenotypowa, znaku oka i skrzydeł (FCI)
│   │   ├── ArrivalCard.tsx     # Karta przylotu z wyróżnieniem prędkości
│   │   ├── BasketingSessionModal.tsx # Sesja koszowania, typowania serii (T) i bramka antydopingowa
│   │   ├── ClockArrivalModal.tsx  # Odbicie przylotu z live kalkulacją m/min
│   │   ├── ClutchCard.tsx      # Karta lęgu z kamieniami milowymi
│   │   ├── ClutchLifecycleModal.tsx # Cykl lęgowy: jaja, owoskopia, obrączkowanie
│   │   ├── CompartmentsModal.tsx # Zarządzanie fizycznymi przedziałami gołębnika i normami FCI (BR-STADO-005)
│   │   ├── ConcourseSheetModal.tsx # Oficjalna lista konkursowa FCI, baza 20%/25%/33%, GMP 5 z 50 i kategorie olimpijskie
│   │   ├── DrinkerLabModal.tsx # Laboratorium poidła, buforowanie pH, izotonik i ładowanie tłuszczowe (RD-15..18)
│   │   ├── FeatherGauge.tsx    # Wizualny wskaźnik 10 lotek skrzydła
│   │   ├── FeedCalculatorModal.tsx # Laboratorium paszowe 20 ziaren i ocena biologiczna
│   │   ├── FieldButton.tsx     # Przycisk dotykowy >=56pt z wibracją haptyczną
│   │   ├── LiveDerbyModal.tsx  # Klubowe Mini-Derby i live feed przylotów sekcji
│   │   ├── LostPigeonReportModal.tsx # Portal ratunkowy SOS dla odnalezionych ptaków (BR-SKAN-008)
│   │   ├── NestBoxMatrixModal.tsx # Wirtualna siatka cel lęgowych (2D Matrix)
│   │   ├── NewRaceModal.tsx    # Konfiguracja nowego lotu i treningu
│   │   ├── PairingModal.tsx    # Zarządzanie parowaniem w celkach z inbredem
│   │   ├── PaywallModal.tsx    # Cennik i zakup Pigeon-Fly Pro (Apple HIG)
│   │   ├── PedigreeTreeModal.tsx  # Interaktywne drzewo rodowodowe 3-4 pokoleń
│   │   ├── PerformanceChartModal.tsx # Wykres wektorowy SVG dynamiki prędkości i formy
│   │   ├── PhotoperiodModal.tsx # Zarządzanie dobowym cyklem światła, ciemnią i powiadomieniami rolet
│   │   ├── PigeonCard.tsx      # Karta ptaka z oznaczeniem płci, rocznika i znaczników
│   │   ├── PigeonDetailModal.tsx # Karta ptaka, mikronaklejka QR i rodowód PDF
│   │   ├── PigeonPhotoGalleryModal.tsx # 3-kątowa galeria makro (Sylwetka/Oko/Skrzydło)
│   │   ├── QrCodeSvg.tsx       # Czysty wektorowy kod QR SVG do naklejek
│   │   ├── RaceWeatherModal.tsx# Prognoza prędkości, korytarze lotu i kąt znoszenia wiatru
│   │   ├── SquadsModal.tsx     # Menedżer drużyn i składów lotowych (GMP, Średni, Maraton, Młode) (BR-STADO-006)
│   │   ├── TandemModal.tsx     # Zarządzanie tandemem hodowców, zaproszenia z tokenami i dziennik audytu (Z-057)
│   │   ├── TelemetryTrackModal.tsx # Analiza krzywizny trasy GPS/IoT z obrączek
│   │   └── VeterinaryLabModal.tsx  # Gabinet weterynaryjny, triage YPDS (Adeno-Coli) i koproskopia (Z-305/306)
│   ├── sync/                   # Klient synchronizacji chmurowej Supabase
│   │   └── syncEngine.ts       # Dwukierunkowa replikacja delta i obsługa offline
│   └── lib/                    # Współdzielone moduły pomocnicze
│       └── i18n.ts             # Wielojęzyczność (PL/EN) i żargon hodowlany
├── supabase/                   # Chmura Supabase: schemat PostgreSQL 16 i polityki RLS
├── tests/                      # 34 zestawy testowe (250 testów jednostkowych i fast-check)
├── scripts/                    # Narzędzia CI: weryfikator tłumaczeń i18n
└── docs/                       # Dokumentacja biznesowa, BRD i specyfikacje zgodności
    └── brd/                    # Kompletna dokumentacja wymagań biznesowych (18 rozdziałów)
```

---

## 📖 Dokumentacja i Rejestr Decyzji

- **Kompletna Dokumentacja BRD:** [`docs/brd/00_START_streszczenie_wykonawcze_i_spis_tresci.md`](docs/brd/00_START_streszczenie_wykonawcze_i_spis_tresci.md)
- **Rejestr 55 Decyzji Projektowych (DEC):** [`docs/brd/00b_Jedna_lista_decyzji_projektowych_DEC.md`](docs/brd/00b_Jedna_lista_decyzji_projektowych_DEC.md)
- **50 Ścisłych Reguł Dziedzinowych (RD-01 do RD-50):** [`docs/brd/C1_rozdz_8_Reguly_Dziedzinowe_i_Fizyka_Lotu.md`](docs/brd/C1_rozdz_8_Reguly_Dziedzinowe_i_Fizyka_Lotu.md)
- **Tabela Zakresu Funkcjonalnego (Z-001 do Z-315):** [`docs/brd/A3_rozdz_6_2_Tabela_Zakresu_Z_i_Etapy.md`](docs/brd/A3_rozdz_6_2_Tabela_Zakresu_Z_i_Etapy.md)
- **Architektura Bazy Danych i Schemat DDL:** [`docs/brd/D2_rozdz_11_12_Architektura_Systemu_Model_SQLite_i_Kopie.md`](docs/brd/D2_rozdz_11_12_Architektura_Systemu_Model_SQLite_i_Kopie.md)

---

## 📄 Status & Dystrybucja

- **Model Biznesowy (Freemium):**
  - **Darmowy Rdzeń (Free Tier):** Zarządzanie do 10 ptakami w stadzie, podstawowy notes, ręczne wpisywanie przylotów.
  - **Subskrypcja Miesięczna:** 1,99 EUR / 8,99 PLN (dla hodowców aktywnych sezonowo).
  - **Subskrypcja Roczna:** 6,99 EUR / 29,99 PLN z 3-dniowym darmowym okresem próbnym (rekomendowana na pełny 12-miesięczny sezon).
  - **Zakup Dożywotni (Lifetime):** 19,99 EUR / 89,99 PLN jednorazowo (preferowany przez tradycyjnych mistrzów).
- **Zasady Interfejsu & Dostępność:** Zgodność z Apple Human Interface Guidelines, wysoki kontrast WCAG AA/AAA, wsparcie dynamicznego tekstu oraz dotykowy standard Field Mode przystosowany do brudnych dłoni i pracy w pyle gołębnika.
